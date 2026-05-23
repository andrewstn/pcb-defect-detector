import React, { useState } from 'react';
import Navbar from './components/Navbar';
import DemoViewer from './components/DemoViewer';
import WebcamStream from './components/WebcamStream';
import ImageUpload from './components/ImageUpload';

export default function App() {
  const [activeTab, setActiveTab] = useState('demo');

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
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white font-sans pt-6">
      
      {/* Compacted Title */}
      <h1 className="text-3xl font-bold mb-4 tracking-wide text-white">
        PCB Defect Detector
      </h1>
      
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Container */}
      <div className="w-full max-w-6xl bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-4 flex items-center justify-center">
        {renderContent()}
      </div>
      
    </div>
  );
}
