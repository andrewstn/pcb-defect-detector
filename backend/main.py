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

# Load trained YOLO model
model = YOLO("best.pt") 


# WebSocket Endpoint for Real-Time Detection
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to WebSocket!")
    try:
        while True:
            data = await websocket.receive_text()
            encoded_data = data.split(',')[1]
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            results = model.predict(frame, conf=0.6, verbose=False)

            detections = []
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = box.conf[0].item()
                    cls = int(box.cls[0].item())
                    name = model.names[cls]
                    
                    detections.append({
                        "label": name,
                        "confidence": round(conf, 2),
                        "box": [x1, y1, x2, y2]
                    })

            await websocket.send_text(json.dumps(detections))
            
    except Exception as e:
        print(f"Connection closed or error occurred: {e}")

# POST Endpoint for Image Upload Detection
@app.post("/detect")
async def detect_image(file: UploadFile = File(...)):
    try:
        # Read the uploaded image bytes
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Run YOLO Inference
        results = model.predict(frame, conf=0.6, verbose=False)
        
        detections = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                conf = round(box.conf[0].item(), 2)
                cls = int(box.cls[0].item())
                name = model.names[cls]
                
                detections.append({"label": name, "confidence": conf})

                # Draw bounding boxes server-side
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 3)
                cv2.putText(frame, f"{name} {conf}", (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        # Convert the annotated image back to Base64
        _, buffer = cv2.imencode('.jpg', frame)
        encoded_image = base64.b64encode(buffer).decode('utf-8')

        return JSONResponse(content={
            "image": f"data:image/jpeg;base64,{encoded_image}",
            "detections": detections
        })

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    