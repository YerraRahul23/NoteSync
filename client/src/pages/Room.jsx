import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import Whiteboard from '../components/Whiteboard';
import Notes from '../components/Notes';

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, currentRoom, roomName, creatorId, currentUser, users } = useSocket();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(true);
  const [notes, setNotes] = useState([]);

  console.log('[ROOM] Render - roomId:', roomId, 'socket:', socket?.id);

  // Redirect if not in room
  useEffect(() => {
    if (!currentRoom || currentRoom !== roomId) {
      navigate('/');
    }
  }, [currentRoom, roomId, navigate]);

  // Notes listeners
  useEffect(() => {
    if (!socket || !currentRoom) return;

    socket.on('note-add', (data) => {
      setNotes(prev => [...prev, data.note]);
    });

    socket.on('note-delete', (data) => {
      setNotes(prev => prev.filter(n => n.id !== data.noteId));
    });

    return () => {
      socket.off('note-add');
      socket.off('note-delete');
    };
  }, [socket, currentRoom]);

  const emitNoteAdd = (text) => {
    if (currentUser && socket) {
      socket.emit('note-add', {
        roomId,
        text,
        author: currentUser.username,
        authorId: currentUser.id
      });
    }
  };

  const emitNoteDelete = (noteId) => {
    if (currentUser && socket) {
      socket.emit('note-delete', { roomId, noteId, authorId: currentUser.id });
      setNotes(prev => prev.filter(n => n.id !== noteId));
    }
  };

  if (!currentRoom || currentRoom !== roomId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-400">Loading room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex overflow-hidden">
      {/* Left sidebar — users */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        users={users}
        currentUserId={currentUser?.id}
        creatorId={creatorId}
      />

      {/* Center — whiteboard always mounted */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-400 hover:text-white"
            >
              ☰
            </button>
            <h1 className="text-white font-semibold truncate max-w-xs">
              💡 {roomName || roomId}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              {users.length} online
            </span>
            <button
              onClick={() => setNotesOpen(!notesOpen)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${notesOpen
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white border border-gray-700'
                }`}
            >
              📝 Notes
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg"
            >
              Leave
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <Whiteboard
            roomId={roomId}
            currentUserId={currentUser?.id}
            socket={socket}
            initialDrawings={[]}
          />
        </main>
      </div>

      {/* Right sidebar — notes */}
      {notesOpen && (
        <div className="w-80 border-l border-gray-800 bg-gray-900/95 backdrop-blur-sm">
          <Notes
            roomId={roomId}
            initialNotes={notes}
            currentUserId={currentUser?.id}
            onAdd={emitNoteAdd}
            onDelete={emitNoteDelete}
          />
        </div>
      )}
    </div>
  );
}

export default Room;