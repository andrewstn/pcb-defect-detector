import React, { useState, useEffect } from 'react';

// Vite automatically scans the src/demo folder and imports all images
const imageModules = import.meta.glob('../demo/*.{jpg,jpeg,png}', { eager: true, import: 'default' });

// Map the imported files into our application's data structure
const DEMO_IMAGES = Object.entries(imageModules).map(([path, url], index) => {
  const filename = path.split('/').pop(); // Extracts 'board1.jpg' from the path
  return {
    id: index,
    src: url,
    title: filename
  };
});

export default function DemoViewer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [resultImage, setResultImage] = useState(null);
  const [detections, setDetections] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // 3. The Randomized Slideshow Timer Loop
  useEffect(() => {
    let interval;
    if (isPlaying && !isProcessing && !resultImage && DEMO_IMAGES.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          // If there's only 1 image, don't change anything
          if (DEMO_IMAGES.length <= 1) return 0;
          
          // Pick a random image, ensuring it doesn't pick the exact same one twice in a row
          let nextIndex;
          do {
            nextIndex = Math.floor(Math.random() * DEMO_IMAGES.length);
          } while (nextIndex === prevIndex);
          
          return nextIndex;
        });
      }, 3500); 
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, isProcessing, resultImage]);

  const runDemoInference = async () => {
    setIsPlaying(false);
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
      setIsPlaying(true); 
    } finally {
      setIsProcessing(false);
    }
  };

  const resetViewer = () => {
    setResultImage(null);
    setDetections([]);
    setIsPlaying(true);
  };

  // Fallback UI if the folder is empty
  if (DEMO_IMAGES.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 text-gray-400">
        <p className="text-xl font-bold mb-2">No Images Found</p>
        <p>Please add .jpg or .png files to your <code>src/demo/</code> folder.</p>
      </div>
    );
  }

  const activeDemo = DEMO_IMAGES[currentIndex];

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Automated Batch Simulation</h2>
        <p className="text-gray-400">Watch the simulated feed or click "Analyze" to run the YOLO engine on the current frame.</p>
      </div>

      <div className="w-full max-w-2xl bg-gray-900 p-4 rounded-xl border border-gray-700 shadow-2xl">
        <div className="relative rounded-lg overflow-hidden border-2 border-gray-700 shadow-inner bg-black flex justify-center h-100">
          
          <img 
            src={resultImage || activeDemo.src} 
            alt={activeDemo.title} 
            className={`w-full h-full object-contain transition-opacity duration-300 ${isProcessing ? 'opacity-30' : 'opacity-100'}`}
          />
          
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-blue-400 font-bold tracking-widest">ANALYZING...</span>
              </div>
            </div>
          )}

          {!resultImage && !isProcessing && (
            <div className="absolute top-4 left-4 bg-black/70 px-4 py-1 rounded text-sm font-mono text-gray-300 shadow">
              TARGET: {activeDemo.title}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          {!resultImage ? (
            <>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition flex items-center space-x-2"
              >
                <span>{isPlaying ? '⏸ Pause Feed' : '▶️ Resume Feed'}</span>
              </button>
              
              <button 
                onClick={runDemoInference}
                disabled={isProcessing}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg transition disabled:opacity-50"
              >
                Analyze Current Frame
              </button>
            </>
          ) : (
            <button 
              onClick={resetViewer}
              className="w-full px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded shadow-lg transition"
            >
              Return to Live Feed
            </button>
          )}
        </div>
      </div>

      {resultImage && (
        <div className="w-full max-w-2xl bg-gray-800 p-4 mt-6 rounded-lg border border-gray-600 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-200 mb-3 border-b border-gray-600 pb-2">Inspection Report</h3>
          {detections.length === 0 ? (
            <p className="text-green-400 font-medium">PASS: No defects detected on {activeDemo.title}.</p>
          ) : (
            <ul className="space-y-2">
              {detections.map((det, idx) => (
                <li key={idx} className="flex justify-between items-center text-gray-300 bg-gray-900 px-3 py-2 rounded">
                  <span className="capitalize text-red-400 font-medium font-mono">⚠️ {det.label.replace('_', ' ')}</span>
                  <span>Confidence: <strong className="text-white">{Math.round(det.confidence * 100)}%</strong></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}