import { useEffect, useState, useRef } from 'react';

function Notes({ roomId, initialNotes, currentUserId, onAdd, onDelete }) {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setNotes(initialNotes || []);
  }, [initialNotes]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    onAdd?.(input.trim());
    setInput('');
  };

  const handleDelete = (noteId) => {
    onDelete?.(noteId);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex items-center justify-between p-2 border-b border-gray-800">
        <span className="text-sm text-gray-400">Notes</span>
        <span className="text-xs text-gray-500">{notes.length} notes</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.map((note) => (
          <div 
            key={note.id} 
            className={`p-3 rounded-lg ${
              note.authorId === currentUserId 
                ? 'bg-indigo-900/30 border border-indigo-700' 
                : 'bg-gray-800/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-indigo-400">
                {note.author}
                {note.authorId === currentUserId && ' (You)'}
              </span>
              {note.authorId === currentUserId && (
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="text-gray-200 text-sm">{note.text}</p>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No notes yet. Start the conversation!</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-2 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a note..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default Notes;