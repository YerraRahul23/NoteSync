# NoteSync

> Real-time collaborative whiteboard and notes application built with React, Socket.IO, and Express.

NoteSync allows multiple users to collaborate in real-time within shared rooms. Draw together on a shared whiteboard, take collaborative notes, and see live updates as your teammates work.

---

## Features

- **Realtime Whiteboard** — Draw, color, resize brushes. Changes sync instantly to all users in the room.
- **Collaborative Notes** — Add, edit, and delete notes. Everyone sees updates in real time.
- **Room-Based Collaboration** — Create or join rooms with a unique room code. Room name support for better organization.
- **Live User Sync** — See who's online. Room creator gets a crown icon.
- **Responsive UI** — Sidebar, whiteboard, and notes panel adapt to screen size. Collapsible panels.
- **Dark Theme** — Modern glassmorphism design with smooth transitions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Socket.IO Client |
| **Backend** | Node.js, Express, Socket.IO |
| **Realtime** | WebSockets via Socket.IO |
| **Deployment** | Vercel (frontend), Render (backend) |

---

## Project Structure

```
NoteSync/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Whiteboard, Notes, Sidebar
│   │   ├── context/           # Socket context provider
│   │   ├── pages/             # Home, Room pages
│   │   └── styles/            # Global CSS
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                    # Node.js + Express backend
│   ├── index.js               # Server entry, socket handlers
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Installation

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/notesync.git
cd notesync

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

---

## Run Locally

### 1. Start the backend server

```bash
cd server
npm run dev
```

Server runs on `http://localhost:3001`.

### 2. Start the frontend client

```bash
cd client
npm run dev
```

Client runs on `http://localhost:5173`.

Open two browser tabs, create a room in one, join with the same room code in the other, and see real-time sync in action.

---

## Environment Variables

No environment variables are required for local development. The client proxies Socket.IO requests to `localhost:3001` via the Vite config.

For production, the backend expects:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |

The frontend connects to the server URL defined in `client/src/context/SocketContext.jsx`. Update this for production deployment.

---

## Deployment

### Frontend (Vercel)

```bash
cd client
npm run build
```

Deploy the `client` directory to Vercel. Set the Vercel project root to `client/`.

Update the Socket.IO server URL in `client/src/context/SocketContext.jsx` to point to your Render backend URL.

### Backend (Render)

1. Push the `server/` directory to a new repository (or deploy the monorepo root).
2. On Render, create a new **Web Service**.
3. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `server`
4. Deploy.

---

## Future Improvements

- Undo / redo for whiteboard strokes
- Text tool on whiteboard
- User avatars with initials
- Drawing layers (background, foreground)
- Persistent room history across sessions
- Audio / video calls within rooms
- Mobile touch-optimized drawing

---

## Screenshots

*(Add screenshots here)*

---

## Author

Built by [Your Name](https://github.com/your-username)

---

## License

MIT