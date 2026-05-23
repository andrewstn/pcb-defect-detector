import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';

export default function WebcamStream() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket Connection Hook
  useEffect(() => {
    socketRef.current = new WebSocket('ws://localhost:8000/ws');
    
    socketRef.current.onopen = () => setIsConnected(true);
    
    socketRef.current.onmessage = (event) => {
      const detections = JSON.parse(event.data);
      drawBoundingBoxes(detections);
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  // Video Frame Transmission Loop (10 FPS)
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

  // Canvas Drawing Engine
  const drawBoundingBoxes = (detections) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear the previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach(det => {
      const [x1, y1, x2, y2] = det.box;
      const width = x2 - x1;
      const height = y2 - y1;

      // Draw bounding box
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);

      // Draw label background for better visibility
      ctx.fillStyle = '#00FF00';
      const text = `${det.label.replace('_', ' ')} ${Math.round(det.confidence * 100)}%`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillRect(x1, y1 - 20, textWidth + 10, 20);

      // Draw text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(text, x1 + 5, y1 - 5);
    });
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      
      {/* Status Indicator */}
      <div className="mb-6 flex items-center space-x-3 bg-gray-900 px-4 py-2 rounded-full border border-gray-700">
        <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-gray-300 font-medium text-sm tracking-wide">
          {isConnected ? 'Inference Engine: ACTIVE' : 'Connecting to Engine...'}
        </span>
      </div>

      {/* Video & Canvas Container */}
      <div className="relative w-160 h-120 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700">
        
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{ width: 640, height: 480 }}
          className="absolute top-0 left-0 w-full h-full object-cover"
        />
        
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
        />
        
      </div>
      
      <p className="mt-6 text-gray-400 text-sm">
        Hold a printed circuit board up to the camera to begin real-time inspection.
      </p>
    </div>
  );
}
