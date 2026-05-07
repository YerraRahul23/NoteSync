import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

let socketInstance = null;
let listenersAttached = false;

function getSocket() {
  if (!socketInstance) {
    console.log('[SOCKET] Creating new socket instance');
    socketInstance = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('[SOCKET] Connected, id:', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[SOCKET] Disconnected:', reason);
    });

    socketInstance.on('connect_error', (error) => {
      console.log('[SOCKET] Connect error:', error.message);
    });
  }
  return socketInstance;
}

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [creatorId, setCreatorId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [roomLoading, setRoomLoading] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[SOCKET] Connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[SOCKET] Disconnected');
      setIsConnected(false);
    });

    if (!listenersAttached) {
      console.log('[SOCKET] Attaching event listeners');

      socket.on('room-created', (data) => {
        console.log('[SOCKET] Received room-created:', data);
        setCurrentRoom(data.roomId);
        setRoomName(data.roomName || data.roomId);
        setCreatorId(data.creatorId);
        setCurrentUser(data.currentUser);
        setUsers(data.users);
        setError(null);
        setRoomLoading(false);
      });

      socket.on('room-joined', (data) => {
        console.log('[SOCKET] Received room-joined:', data);
        setCurrentRoom(data.roomId);
        setRoomName(data.roomName || data.roomId);
        setCreatorId(data.creatorId);
        setCurrentUser(data.currentUser);
        setUsers(data.users);
        setError(null);
        setRoomLoading(false);
      });

      socket.on('room-error', (msg) => {
        console.log('[SOCKET] Received room-error:', msg);
        setError(msg);
        setRoomLoading(false);
      });

      socket.on('users-update', (data) => {
        console.log('[SOCKET] Received users-update:', data.users?.length);
        setUsers(data.users || []);
        if (data.creatorId) setCreatorId(data.creatorId);
      });

      listenersAttached = true;
    }

    return () => {
      // Don't disconnect on unmount - keep socket alive
    };
  }, []);

  const createRoom = (roomId, roomName, username) => {
    console.log('[SOCKET] Emitting create-room:', { roomId, roomName, username });
    setError(null);
    setRoomLoading(true);
    socketRef.current?.emit('create-room', { roomId, roomName, username });
  };

  const joinRoom = (roomId, username) => {
    console.log('[SOCKET] Emitting join-room:', { roomId, username });
    setError(null);
    setRoomLoading(true);
    socketRef.current?.emit('join-room', { roomId, username });
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    currentRoom,
    roomName,
    creatorId,
    currentUser,
    users,
    error,
    roomLoading,
    createRoom,
    joinRoom,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}