import cv2
import numpy as np
import base64
import json
from fastapi import FastAPI, WebSocket, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI()

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load custom YOLO26 brain
model = YOLO("best.pt") 

# WebSocket endpoint for real-time video stream processing
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to WebSocket!")
    try:
        while True:
            # Receive the Base64 image string from React
            data = await websocket.receive_text()
            
            # Strip the HTML header from the base64 string
            encoded_data = data.split(',')[1]
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Run the frame through the YOLO26 model
            # verbose=False stops it from spamming terminal
            results = model.predict(frame, conf=0.5, verbose=False)

            # Extract the coordinates and labels
            detections = []
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist() # Bounding box coords
                    conf = box.conf[0].item()             # Confidence score
                    cls = int(box.cls[0].item())          # Class ID
                    name = model.names[cls]               # Class Name (e.g., 'mouse_bite')
                    
                    detections.append({
                        "label": name,
                        "confidence": round(conf, 2),
                        "box": [x1, y1, x2, y2]
                    })

            # Instantly send the JSON data back to the frontend
            await websocket.send_text(json.dumps(detections))
            
    except Exception as e:
        print(f"Connection closed or error occurred: {e}")

    # Static image detection endpoint for testing with Postman or React file upload
    @app.post("/detect")
    async def detect_image(file: UploadFile = File(...)):
        try:
            # Read the uploaded image bytes
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Run YOLO26 Inference
            results = model.predict(frame, conf=0.5, verbose=False)
            
            detections = []
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    conf = round(box.conf[0].item(), 2)
                    cls = int(box.cls[0].item())
                    name = model.names[cls]
                    
                    detections.append({"label": name, "confidence": conf})

                    # Draw bounding boxes server-side for static images
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
                    cv2.putText(frame, f"{name} {conf}", (x1, y1 - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

            # Convert the annotated image back to Base64 to send to React
            _, buffer = cv2.imencode('.jpg', frame)
            encoded_image = base64.b64encode(buffer).decode('utf-8')

            return JSONResponse(content={
                "image": f"data:image/jpeg;base64,{encoded_image}",
                "detections": detections
            })

        except Exception as e:
            return JSONResponse(content={"error": str(e)}, status_code=500)