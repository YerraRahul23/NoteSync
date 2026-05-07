function Sidebar({ isOpen, onToggle, users, currentUserId, creatorId }) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onToggle} />
      )}

      <aside
        className={`
          max-lg:fixed lg:relative z-50 h-full bg-gray-900 border-r border-gray-800 transition-all shrink-0
          ${isOpen ? 'w-64' : 'w-16'}
        `}
      >
        <div className="h-full flex flex-col w-64">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <span className="text-gray-400 text-sm font-medium">Users ({users.length})</span>
            <button onClick={onToggle} className="text-gray-400 hover:text-white">←</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {users.map((user) => {
                const isCreator = user.socketId === creatorId;
                const isMe = user.socketId === currentUserId || user.id === currentUserId;
                return (
                  <li
                    key={user.socketId || user.id}
                    className={`group relative overflow-hidden ${isMe
                      ? 'bg-white/[0.06] border border-indigo-500/30'
                      : 'bg-white/[0.04] border border-white/[0.06]'
                      } backdrop-blur-[10px] rounded-[16px] transition-all duration-200 ease hover:translate-x-[4px] hover:bg-white/[0.07]`}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Chess pawn icon instead of green dot */}
                      <span className="text-white/60 text-base flex-shrink-0">♟</span>

                      <span className="text-gray-200 text-sm truncate flex-1">
                        {user.username}
                        {isMe && <span className="text-gray-500 text-xs ml-1">(You)</span>}
                      </span>

                      {/* Crown for room creator */}
                      {isCreator && (
                        <span className="text-yellow-400 text-base flex-shrink-0 ml-auto" title="Room Creator">
                          👑
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {users.length === 0 && <p className="text-gray-500 text-sm">No users online</p>}
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;