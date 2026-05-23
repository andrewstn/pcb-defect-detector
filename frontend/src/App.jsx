import React, { useState } from 'react';
import Navbar from './components/Navbar';
import DemoViewer from './components/DemoViewer';
import WebcamStream from './components/WebcamStream';
import ImageUpload from './components/ImageUpload';

export default function App() {
  // Set 'demo' as the default landing page
  const [activeTab, setActiveTab] = useState('demo');
  // Render the content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'demo':
        return <DemoViewer />;
      case 'webcam':
        return <WebcamStream />;
      case 'upload':
        return <ImageUpload />;
      default:
        return <DemoViewer />;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white font-sans pt-12">
      <h1 className="text-4xl font-bold mb-6 tracking-wide text-transparent bg-clip-text bg-white/80">
        PCB Defect Detector
      </h1>
      
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* The Active Feature Container */}
      <div className="w-full max-w-4xl bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6 min-h-125 flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
}