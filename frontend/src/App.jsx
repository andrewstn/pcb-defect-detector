import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';

export default function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the FastAPI WebSocket
    socketRef.current = new WebSocket('ws://localhost:8000/ws');
    
    socketRef.current.onopen = () => setIsConnected(true);
    
    socketRef.current.onmessage = (event) => {
      const detections = JSON.parse(event.data);
      drawBoundingBoxes(detections);
    };

    return () => socketRef.current?.close();
  }, []);

  // Transmission Loop: Send a frame every 100ms
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(imageSrc);
        }
      }
    }, 100); 

    return () => clearInterval(interval);
  }, [isConnected]);

  // Drawing Function
  const drawBoundingBoxes = (detections) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach(det => {
      const [x1, y1, x2, y2] = det.box;
      const width = x2 - x1;
      const height = y2 - y1;

      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);

      ctx.fillStyle = '#00FF00';
      ctx.font = '18px Arial';
      ctx.fillText(`${det.label} ${det.confidence}`, x1, y1 - 5);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8 tracking-wide">PCB Defect Detector</h1>
      
      {/* Container holding both the Video and the Canvas */}
      <div className="relative w-[640px] h-[480px] shadow-2xl rounded-lg overflow-hidden border-2 border-gray-700">
        
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute top-0 left-0 w-full h-full z-10"
        />
        
      </div>
    </div>
  );
}