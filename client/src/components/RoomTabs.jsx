function RoomTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'whiteboard', label: 'Whiteboard', icon: '🎨' },
    { id: 'notes', label: 'Notes', icon: '📝' },
  ];

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-gray-900 border-b border-gray-800">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
            activeTab === tab.id
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default RoomTabs;