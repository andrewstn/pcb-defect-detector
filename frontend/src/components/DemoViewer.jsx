import React, { useState } from 'react';

// 1. Vite automatically scans the src/demo folder and imports all images
const imageModules = import.meta.glob('../demo/*.{jpg,jpeg,png}', { eager: true, import: 'default' });

const DEMO_IMAGES = Object.entries(imageModules).map(([path, url], index) => {
  const filename = path.split('/').pop(); 
  return {
    id: index,
    src: url,
    title: filename
  };
});

export default function DemoViewer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resultImage, setResultImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Carousel Navigation Logic ---
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % DEMO_IMAGES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? DEMO_IMAGES.length - 1 : prevIndex - 1));
  };

  // --- API Logic ---
  const runDemoInference = async () => {
    setResultImage(null);
    setDetections([]);
    setIsProcessing(true);

    const activeDemo = DEMO_IMAGES[currentIndex];

    try {
      const imageResponse = await fetch(activeDemo.src);
      const blob = await imageResponse.blob();
      const file = new File([blob], activeDemo.title, { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('file', file);

      const apiResponse = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        body: formData,
      });

      if (!apiResponse.ok) throw new Error('API processing failed');

      const data = await apiResponse.json();
      setResultImage(data.image);
      setDetections(data.detections);
      
    } catch (error) {
      console.error("Error processing demo image:", error);
      alert("Failed to connect to the AI engine.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetViewer = () => {
    setResultImage(null);
    setDetections([]);
  };

  // Fallback UI
  if (DEMO_IMAGES.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 text-gray-400">
        <p className="text-xl font-bold mb-2">No Images Found</p>
        <p>Please add .jpg or .png files to your <code className="bg-gray-800 px-2 py-1 rounded">src/demo/</code> folder.</p>
      </div>
    );
  }

  const activeDemo = DEMO_IMAGES[currentIndex];

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Defect Gallery</h2>
        <p className="text-gray-400">Cycle through the sample boards below and click Analyze to run the YOLO engine.</p>
      </div>

      {/* Two-Column Layout Container - Set items-stretch to align them perfectly */}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 items-stretch justify-center">
        
        {/* LEFT COLUMN: Main Display Monitor (Locked height on large screens) */}
        <div className="flex-1 bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-2xl flex flex-col lg:h-130">
          
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-700 shadow-inner bg-black flex justify-center h-100 shrink-0 group">
            <img 
              src={resultImage || activeDemo.src} 
              alt={activeDemo.title} 
              className={`w-full h-full object-contain transition-opacity duration-300 ${isProcessing ? 'opacity-30' : 'opacity-100'}`}
            />
            
            {/* Loading Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-blue-400 font-bold tracking-widest">ANALYZING...</span>
                </div>
              </div>
            )}

            {/* Left Arrow */}
            {!resultImage && !isProcessing && DEMO_IMAGES.length > 1 && (
              <button 
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
            )}

            {/* Right Arrow */}
            {!resultImage && !isProcessing && DEMO_IMAGES.length > 1 && (
              <button 
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            )}
          </div>

          {/* Action Controls - Locked right under the image using mt-auto */}
          <div className="flex justify-center items-center mt-auto pt-4">
            {!resultImage ? (
              <button 
                onClick={runDemoInference}
                disabled={isProcessing}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <span>Analyze Frame</span>
              </button>
            ) : (
              <button 
                onClick={resetViewer}
                className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg shadow-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"></path></svg>
                <span>Return to Gallery</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Analytics Report (Locked height to match left column) */}
        <div className="w-full lg:w-96 flex flex-col lg:h-130">
          {resultImage ? (
            <div className="h-full bg-gray-800 p-6 rounded-xl border border-gray-600 shadow-xl animate-fade-in flex flex-col min-h-0">
              <h3 className="text-xl font-bold text-gray-200 mb-2 border-b border-gray-600 pb-2 shrink-0">Inspection Report</h3>
              
              {/* Added 'truncate' to elegantly cut off long file names with ... */}
              <p className="text-sm text-gray-400 mb-4 font-mono truncate shrink-0" title={activeDemo.title}>Target: {activeDemo.title}</p>
              
              {/* Added internal scrolling to the list */}
              <div className="flex-1 overflow-y-auto pr-2">
                {detections.length === 0 ? (
                  <p className="text-green-400 font-medium">PASS: No defects detected.</p>
                ) : (
                  <ul className="space-y-3">
                    {detections.map((det, idx) => (
                      <li key={idx} className="flex justify-between items-center text-gray-300 bg-gray-900 px-4 py-3 rounded-lg border border-gray-700 shadow-sm">
                        <span className="capitalize text-red-400 font-medium font-mono">⚠️ {det.label.replace('_', ' ')}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-500 uppercase">Confidence</span>
                          <strong className="text-white">{Math.round(det.confidence * 100)}%</strong>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            /* Placeholder Panel to maintain layout stability */
            <div className="h-full bg-gray-800/30 p-6 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-center text-gray-500">
              <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <p className="font-medium text-gray-400 mb-1">Awaiting Analysis</p>
              <p className="text-sm">Click "Analyze Frame" to generate the inspection report.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
