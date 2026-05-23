import cv2
import numpy as np
import base64
import json
from fastapi import FastAPI, WebSocket
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
            results = model.predict(frame, conf=0.4, verbose=False)

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