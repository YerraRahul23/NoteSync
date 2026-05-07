import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

function Home() {
  const navigate = useNavigate();
  const { createRoom, joinRoom, error, isConnected, currentRoom, currentUser, roomLoading } = useSocket();
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [mode, setMode] = useState('create');

  console.log('[HOME] Render - currentRoom:', currentRoom, 'currentUser:', currentUser);

  // Navigate when room is joined/created
  useEffect(() => {
    console.log('[HOME] Effect - currentRoom:', currentRoom, 'currentUser:', currentUser);

    if (currentRoom && currentUser) {
      console.log('[HOME] Navigating to room:', currentRoom);
      navigate(`/room/${currentRoom}`);
    }
  }, [currentRoom, currentUser, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username.trim() || !roomId.trim()) return;

    const room = roomId.trim().toLowerCase();
    const user = username.trim();

    console.log('[HOME] Submit - mode:', mode, 'room:', room, 'user:', user);

    if (mode === 'create') {
      createRoom(room, roomName.trim() || room, user);
    } else {
      joinRoom(room, user);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">NoteSync</h1>
          <p className="text-gray-400">Real-time collaborative workspace</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${mode === 'create' ? 'bg-indigo-600 text-white' : 'text-gray-400'
                }`}
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 rounded-md text-sm font-medium ${mode === 'join' ? 'bg-indigo-600 text-white' : 'text-gray-400'
                }`}
            >
              Join Room
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            {mode === 'create' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Room Name (optional)
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. System Design Meeting"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Room ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toLowerCase())}
                  placeholder={mode === 'create' ? 'room-name' : 'Enter room ID'}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  required
                />
                {mode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setRoomId(Math.random().toString(36).substring(2, 8))}
                    className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white"
                  >
                    🎲
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isConnected || roomLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white font-medium rounded-lg"
            >
              {roomLoading ? 'Connecting...' : mode === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          {!isConnected ? 'Connecting to server...' : 'Connected to server'}
        </p>
      </div>
    </div>
  );
}

export default Home;