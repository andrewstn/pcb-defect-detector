export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'demo', label: 'Demo Gallery' },
    { id: 'webcam', label: 'Webcam Detection' },
    { id: 'upload', label: 'Upload Image' }
  ];

  return (
    <div className="flex space-x-4 mb-8 bg-gray-800 p-2 rounded-lg shadow-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-2 rounded-md font-medium transition-colors duration-200 ${
            activeTab === tab.id
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
