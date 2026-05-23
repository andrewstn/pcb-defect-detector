import React, { useState, useRef } from 'react';

export default function ImageUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState([]);
  
  const fileInputRef = useRef(null);

  // Handle File Selection
  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultImage(null); // Clear previous runs
      setDetections([]);
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files[0]);
  };

  // Send to FastAPI
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('API processing failed');

      const data = await response.json();
      setResultImage(data.image);
      setDetections(data.detections);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to connect to the AI engine.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Dropzone */}
      {!previewUrl && !resultImage && (
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className="w-full max-w-xl h-64 border-2 border-dashed border-gray-500 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-800 transition-all duration-300"
        >
          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          <p className="text-gray-300 font-medium">Click or Drag & Drop an image here</p>
          <p className="text-gray-500 text-sm mt-1">Supports JPG, PNG</p>
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
        </div>
      )}

      {/* Image Preview & Results */}
      {(previewUrl || resultImage) && (
        <div className="w-full max-w-2xl flex flex-col items-center">
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-700 shadow-xl mb-6">
            <img 
              src={resultImage || previewUrl} 
              alt="PCB Preview" 
              className="max-h-100 object-contain"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-blue-400 font-bold animate-pulse text-lg">Inspecting...</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex space-x-4 mb-6">
            <button 
              onClick={() => { setPreviewUrl(null); setResultImage(null); setSelectedFile(null); }}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition"
            >
              Upload Different Image
            </button>
            {!resultImage && (
              <button 
                onClick={handleUpload}
                disabled={isProcessing}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-500 transition disabled:opacity-50"
              >
                Run Inspection
              </button>
            )}
          </div>

          {/* The Analytics Report */}
          {resultImage && (
            <div className="w-full bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-bold text-gray-200 mb-3 border-b border-gray-600 pb-2">Inspection Report</h3>
              {detections.length === 0 ? (
                <p className="text-green-400 font-medium">PASS: No defects detected.</p>
              ) : (
                <ul className="space-y-2">
                  {detections.map((det, idx) => (
                    <li key={idx} className="flex justify-between items-center text-gray-300">
                      <span className="capitalize text-red-400 font-medium font-mono">⚠️ {det.label.replace('_', ' ')}</span>
                      <span>Confidence: <strong className="text-white">{Math.round(det.confidence * 100)}%</strong></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
