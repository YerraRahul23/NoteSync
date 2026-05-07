import { useEffect, useState, useRef, useCallback } from 'react';

function Whiteboard({ roomId, currentUserId, socket, initialDrawings = [] }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  // Persistent state in refs
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const drawingsRef = useRef([]);
  const hasLoadedInitialRef = useRef(false);

  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(3);

  console.log('[WHITEBOARD] Render, socket:', socket?.id, 'initialDrawings:', initialDrawings.length);

  // ============================================================
  // Setup socket listeners
  // ============================================================
  useEffect(() => {
    if (!socket) return;

    const handleDrawingAdd = (data) => {
      console.log('[WHITEBOARD] Received drawing-add from:', data.userId);
      if (data.userId !== socket.id) {
        drawingsRef.current.push(data.drawing);
        redrawAll();
      }
    };

    const handleCanvasCleared = () => {
      console.log('[WHITEBOARD] Received canvas-cleared');
      drawingsRef.current = [];
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Redraw background after clear
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // If ctx not ready, schedule redraw
        scheduleRedraw();
      }
    };

    const handleRoomDrawings = (drawings) => {
      console.log('[WHITEBOARD] Received room-drawings:', drawings.length);
      if (drawings && drawings.length > 0) {
        drawingsRef.current = drawings;
        redrawAll();
      }
    };

    socket.on('drawing-add', handleDrawingAdd);
    socket.on('canvas-cleared', handleCanvasCleared);
    socket.on('room-drawings', handleRoomDrawings);

    return () => {
      socket.off('drawing-add', handleDrawingAdd);
      socket.off('canvas-cleared', handleCanvasCleared);
      socket.off('room-drawings', handleRoomDrawings);
    };
  }, [socket]);

  // ============================================================
  // Load initial drawings for late joiners
  // ============================================================
  useEffect(() => {
    if (hasLoadedInitialRef.current) return;
    if (!initialDrawings || initialDrawings.length === 0) return;

    console.log('[WHITEBOARD] Loading initial drawings:', initialDrawings.length);
    hasLoadedInitialRef.current = true;
    drawingsRef.current = [...initialDrawings];

    // Schedule redraw — retries until context is ready
    const retryRedraw = () => {
      const ctx = ctxRef.current;
      if (ctx) {
        redrawAll();

      } else {
        setTimeout(retryRedraw, 50);
      }
    };
    retryRedraw();
  }, [initialDrawings]);

  // ============================================================
  // Initialize canvas — ResizeObserver handles layout changes
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctxRef.current = canvas.getContext('2d');

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      if (ctxRef.current) {
        ctxRef.current.lineCap = 'round';
        ctxRef.current.lineJoin = 'round';
      }
      redrawAll();
    };

    resize();

    // Observe parent container for any layout changes (sidebar toggle, notes toggle, window resize)
    const container = canvas.parentElement;
    const observer = new ResizeObserver(() => resize());
    if (container) observer.observe(container);

    return () => {
      if (container) observer.disconnect();
    };
  }, []);

  // Redraw from ref when component remounts (e.g. tab switch)
  useEffect(() => {
    const ctx = ctxRef.current;
    if (ctx && drawingsRef.current.length > 0) {
      console.log('[WHITEBOARD] Remount redraw from ref:', drawingsRef.current.length);
      redrawAll();
    }
  });

  // ============================================================
  // Schedule a safe redraw
  // ============================================================
  const scheduleRedraw = useCallback(() => {
    const ctx = ctxRef.current;
    if (ctx) {
      redrawAll();
    } else {
      setTimeout(scheduleRedraw, 50);
    }
  }, []);

  // ============================================================
  // Redraw ALL from ref
  // ============================================================
  const redrawAll = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) {
      console.log('[WHITEBOARD] Redraw skipped — canvas/ctx not ready');
      return;
    }

    console.log('[WHITEBOARD] Redrawing all:', drawingsRef.current.length);

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of drawingsRef.current) {
      drawStroke(stroke);
    }

    if (currentStrokeRef.current) {
      drawStroke(currentStrokeRef.current);
    }
  }, []);

  // ============================================================
  // Draw single stroke
  // ============================================================
  const drawStroke = (stroke) => {
    const ctx = ctxRef.current;
    if (!ctx || !stroke) return;

    const { points, color: strokeColor, width } = stroke;
    if (!points || points.length < 1) return;

    ctx.strokeStyle = strokeColor || '#ffffff';
    ctx.lineWidth = width || 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, (width || 3) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    }
  };

  // ============================================================
  // Get mouse position
  // ============================================================
  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // ============================================================
  // MOUSE DOWN
  // ============================================================
  const handleMouseDown = (e) => {
    e.preventDefault();
    console.log('[WHITEBOARD] Stroke START');

    const point = getCanvasPoint(e);
    isDrawingRef.current = true;

    currentStrokeRef.current = {
      id: Date.now().toString(),
      points: [point],
      color,
      width: brushSize,
      ownerId: currentUserId
    };
  };

  // ============================================================
  // MOUSE MOVE
  // ============================================================
  const handleMouseMove = (e) => {
    if (!isDrawingRef.current) return;

    const point = getCanvasPoint(e);
    const ctx = ctxRef.current;

    if (currentStrokeRef.current && currentStrokeRef.current.points) {
      currentStrokeRef.current.points.push(point);
    }

    if (ctx && currentStrokeRef.current) {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const points = currentStrokeRef.current.points;
      if (points && points.length >= 2) {
        const lastPoint = points[points.length - 2];
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
    }
  };

  // ============================================================
  // MOUSE UP
  // ============================================================
  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;

    console.log('[WHITEBOARD] Stroke END');
    isDrawingRef.current = false;

    if (currentStrokeRef.current && currentStrokeRef.current.points) {
      const points = currentStrokeRef.current.points;
      if (points.length < 2) {
        points.push(points[0]);
      }

      // PUSH to ref (not replace)
      drawingsRef.current.push(currentStrokeRef.current);

      // Emit via shared socket
      socket?.emit('drawing-add', {
        roomId,
        drawing: currentStrokeRef.current
      });
    }

    currentStrokeRef.current = null;
    redrawAll();
  };

  // ============================================================
  // CLEAR — optimistic local clear + server broadcast
  // ============================================================
  const handleClear = useCallback(() => {
    console.log('[WHITEBOARD] CLEAR — clearing locally and emitting');
    // Optimistic local clear
    drawingsRef.current = [];
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Broadcast to server
    socket?.emit('clear-canvas', roomId);
  }, [socket, roomId]);

  const handleColorChange = (newColor) => setColor(newColor);
  const handleBrushSizeChange = (size) => setBrushSize(size);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-1">
          {['#ffffff', '#ef4444', '#22c55e', '#3b82f6', '#eab308'].map((c) => (
            <button
              key={c}
              onClick={() => handleColorChange(c)}
              className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-indigo-500 scale-110' : 'border-transparent'
                }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="h-6 w-px bg-gray-700" />

        <div className="flex items-center gap-1">
          {[2, 4, 8, 12].map((size) => (
            <button
              key={size}
              onClick={() => handleBrushSizeChange(size)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg ${brushSize === size
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              <span className="rounded-full bg-white" style={{ width: size, height: size }} />
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg"
        >
          Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            pointerEvents: 'auto',
            cursor: 'crosshair',
            backgroundColor: '#1f2937'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}

export default Whiteboard;