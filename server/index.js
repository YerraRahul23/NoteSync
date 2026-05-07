import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST"]
    }
});

// ============================================================
// GLOBAL ROOMS MAP - CREATED ONCE AT SERVER START
// ============================================================
const rooms = new Map();
const roomDrawings = {};
console.log('[SERVER] Rooms map created:', rooms);

io.on('connection', (socket) => {
    console.log('[SERVER] ========== USER CONNECTED ==========', socket.id);
    console.log('[SERVER] Current rooms:', [...rooms.keys()]);

    // Track which room this socket belongs to
    let socketRoomId = null;

    // ============================================================
    // CREATE ROOM
    // ============================================================
    socket.on('create-room', ({ roomId, roomName, username }) => {
        console.log('[SERVER] ========== CREATE ROOM ==========');
        console.log('[SERVER] socket.id:', socket.id);
        console.log('[SERVER] roomId:', roomId, 'username:', username);

        if (!roomId || !username) {
            socket.emit('room-error', 'Room ID and username required');
            return;
        }

        const normalizedRoomId = roomId.trim().toLowerCase();

        console.log('[SERVER] Normalized roomId:', normalizedRoomId);
        console.log('[SERVER] Rooms before create:', [...rooms.keys()]);

        // Create room if doesn't exist
        if (!rooms.has(normalizedRoomId)) {
            const newRoom = {
                id: normalizedRoomId,
                roomName: roomName || normalizedRoomId,
                users: new Map(),
                notes: [],
                createdAt: Date.now(),
                creatorId: socket.id
            };
            rooms.set(normalizedRoomId, newRoom);
            roomDrawings[normalizedRoomId] = [];
            console.log('[SERVER] Room SAVED to map:', normalizedRoomId);
        }

        // Get room
        const room = rooms.get(normalizedRoomId);
        if (!room) {
            console.log('[SERVER] ERROR: Room still not in map after create!');
            socket.emit('room-error', 'Failed to create room');
            return;
        }

        console.log('[SERVER] Rooms after create:', [...rooms.keys()]);
        console.log('[SERVER] Room users size:', room.users.size);

        // Add user to room
        room.users.set(socket.id, {
            socketId: socket.id,
            username: username.trim(),
            joinedAt: Date.now()
        });

        // Track which room this socket is in
        socketRoomId = normalizedRoomId;

        // Join socket.io room
        socket.join(normalizedRoomId);
        console.log('[SERVER] User', socket.id, 'joined room:', normalizedRoomId);

        // Send response
        socket.emit('room-created', {
            roomId: normalizedRoomId,
            roomName: room.roomName,
            creatorId: room.creatorId,
            users: Array.from(room.users.values()),
            currentUser: { id: socket.id, username: username.trim() }
        });

        // Broadcast to room
        io.to(normalizedRoomId).emit('users-update', {
            users: Array.from(room.users.values()),
            creatorId: room.creatorId
        });

        console.log('[SERVER] Room created successfully!');
    });

    // ============================================================
    // JOIN ROOM
    // ============================================================
    socket.on('join-room', ({ roomId, username }) => {
        console.log('[SERVER] ========== JOIN ROOM ==========');
        console.log('[SERVER] socket.id:', socket.id);
        console.log('[SERVER] roomId:', roomId, 'username:', username);

        if (!roomId || !username) {
            socket.emit('room-error', 'Room ID and username required');
            return;
        }

        const normalizedRoomId = roomId.trim().toLowerCase();

        console.log('[SERVER] Looking for room:', normalizedRoomId);
        console.log('[SERVER] Available rooms:', [...rooms.keys()]);

        const room = rooms.get(normalizedRoomId);

        if (!room) {
            console.log('[SERVER] ========== ROOM NOT FOUND ==========');
            console.log('[SERVER] Room does NOT exist in map!');
            socket.emit('room-error', 'Room not found');
            return;
        }

        console.log('[SERVER] Room FOUND:', room.id);

        // Check for duplicate username
        const existingUser = Array.from(room.users.values())
            .find(u => u.username === username.trim());

        if (existingUser) {
            socket.emit('room-error', 'Username already taken in this room');
            return;
        }

        // Add user to room
        room.users.set(socket.id, {
            socketId: socket.id,
            username: username.trim(),
            joinedAt: Date.now()
        });

        // Track which room this socket is in
        socketRoomId = normalizedRoomId;

        // Join socket.io room
        socket.join(normalizedRoomId);
        console.log('[SERVER] User', socket.id, 'joined room:', normalizedRoomId);
        console.log('[SERVER] Total users in room:', room.users.size);

        // Send drawings directly to joining socket
        socket.emit('room-drawings', roomDrawings[normalizedRoomId] || []);

        // Send response
        socket.emit('room-joined', {
            roomId: normalizedRoomId,
            roomName: room.roomName,
            creatorId: room.creatorId,
            users: Array.from(room.users.values()),
            currentUser: { id: socket.id, username: username.trim() },
            notes: room.notes,
            drawings: roomDrawings[normalizedRoomId] || []
        });

        // Broadcast to room
        io.to(normalizedRoomId).emit('users-update', {
            users: Array.from(room.users.values()),
            creatorId: room.creatorId
        });

        console.log('[SERVER] User joined successfully!');
    });

    // ============================================================
    // DRAWING EVENTS
    // ============================================================
    socket.on('drawing-add', ({ roomId, drawing }) => {
        console.log('[SERVER] Drawing received from:', socket.id, 'room:', roomId);
        if (!roomDrawings[roomId]) roomDrawings[roomId] = [];
        roomDrawings[roomId].push(drawing);
        console.log('[SERVER] Broadcasting drawing to room, total:', roomDrawings[roomId].length);
        io.to(roomId).emit('drawing-add', { drawing, userId: socket.id });
    });

    socket.on('clear-canvas', (roomId) => {
        console.log('[SERVER] Clear canvas for room:', roomId);
        roomDrawings[roomId] = [];
        io.to(roomId).emit('canvas-cleared');
    });

    // ============================================================
    // NOTE EVENTS
    // ============================================================
    socket.on('note-add', ({ roomId, text, author, authorId }) => {
        const room = rooms.get(roomId);
        if (room) {
            const note = {
                id: Date.now().toString(),
                text,
                author,
                authorId
            };
            room.notes.push(note);
            io.to(roomId).emit('note-add', { note });
        }
    });

    socket.on('note-delete', ({ roomId, noteId, authorId }) => {
        const room = rooms.get(roomId);
        if (room && authorId === socket.id) {
            room.notes = room.notes.filter(n => n.id !== noteId);
            io.to(roomId).emit('note-delete', { noteId });
        }
    });

    // ============================================================
    // DISCONNECT - FIXED WITH SAFE CLEANUP
    // ============================================================
    socket.on('disconnect', (reason) => {
        console.log('[SERVER] ========== USER DISCONNECTED ==========', socket.id);
        console.log('[SERVER] Disconnect reason:', reason);
        console.log('[SERVER] socketRoomId:', socketRoomId);
        console.log('[SERVER] Rooms before cleanup:', [...rooms.keys()]);

        // Only cleanup the room this socket was in (if we tracked it)
        if (socketRoomId) {
            const room = rooms.get(socketRoomId);
            if (room && room.users.has(socket.id)) {
                room.users.delete(socket.id);
                console.log('[SERVER] User removed from room:', socketRoomId);

                // Only delete if absolutely no users
                if (room.users.size === 0) {
                    // Delayed deletion - check again after delay
                    setTimeout(() => {
                        const currentRoom = rooms.get(socketRoomId);
                        if (currentRoom && currentRoom.users.size === 0) {
                            rooms.delete(socketRoomId);
                            console.log('[SERVER] Room deleted (empty):', socketRoomId);
                        }
                    }, 60000); // 60 SECOND DELAY
                } else {
                    // Broadcast remaining users
                    io.to(socketRoomId).emit('users-update', {
                        users: Array.from(room.users.values()),
                        creatorId: room.creatorId
                    });
                }
            }
        }

        console.log('[SERVER] Rooms after disconnect:', [...rooms.keys()]);
    });

    // ============================================================
    // LEAVE ROOM
    // ============================================================
    socket.on('leave-room', ({ roomId }) => {
        console.log('[SERVER] User leaving room:', roomId);

        const room = rooms.get(roomId);

        if (room && room.users.has(socket.id)) {
            room.users.delete(socket.id);
            socket.leave(roomId);
            socketRoomId = null;

            if (room.users.size === 0) {
                setTimeout(() => {
                    const currentRoom = rooms.get(roomId);
                    if (currentRoom && currentRoom.users.size === 0) {
                        rooms.delete(roomId);
                    }
                }, 60000);
            } else {
                io.to(roomId).emit('users-update', {
                    users: Array.from(room.users.values()),
                    creatorId: room.creatorId
                });
            }
        }
    });
});

// ============================================================
// API ENDPOINT
// ============================================================
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        rooms: rooms.size,
        roomIds: [...rooms.keys()]
    });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log('========================================');
    console.log('[SERVER] Server running on port:', PORT);
    console.log('[SERVER] Rooms map initialized');
    console.log('========================================');
});