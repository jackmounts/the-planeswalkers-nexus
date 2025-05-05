import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { generateRoomCode, sanitizePlayer } from "./lib/utils";
import type { Player, PlayerInfo, Room } from "@models/shared";

// -------------------- ROOM DATA --------------------
const activeRoomsData = new Map<string, Room>();

const CLEANUP_TIMER = 10 * 60 * 1000;
setInterval(() => {
  for (const [roomId, room] of activeRoomsData.entries()) {
    if (room.players.length === 0) {
      activeRoomsData.delete(roomId);
      console.log(`Deleted empty room: ${roomId}`);
    }
  }
}, CLEANUP_TIMER);

// -------------------- SETUP SERVER --------------------
const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// -------------------- API --------------------
app.use(cors());
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

app.get("/api/gen-code", (req: Request, res: Response) => {
  let roomId = generateRoomCode();
  while (activeRoomsData.has(roomId)) {
    roomId = generateRoomCode();
  }
  res.status(200).json({ roomId });
});

app.post("/api/rooms", (req: Request, res: Response) => {
  const { id } = req.body;

  if (!id) {
    res.status(400).json({ error: "Room ID required" });
    return;
  }

  if (activeRoomsData.has(id)) {
    res.status(409).json({ error: "Room already exists" });
    return;
  }

  const room: Room = {
    id,
    players: [],
    turn: 0,
    turn_player: 0,
    turn_phase: "BEGIN",
    has_started: false,
  };

  activeRoomsData.set(id, room);

  res.status(201).json({ message: "Room created", roomId: id });
});

app.put("/api/rooms/:id/start", (req: Request, res: Response) => {
  const { id } = req.params;

  if (!activeRoomsData.has(id)) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const room = activeRoomsData.get(id);
  if (room?.has_started) {
    res.status(409).json({ error: "Room already started" });
    return;
  }

  room!.has_started = true;
  res.status(200).json({ message: "Room started" });
});

app.get("/api/rooms", (req: Request, res: Response) => {
  const roomIds = Array.from(activeRoomsData.keys());
  res.json({ rooms: roomIds });
});

app.get("/api/rooms/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  if (!activeRoomsData.has(id)) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const room = activeRoomsData.get(id);
  const sanitizedRoom = {
    ...room,
    players: room!.players.map(sanitizePlayer),
  };
  res.json({ room: sanitizedRoom });
});

app.get("/api/rooms/:id/exists", (req: Request, res: Response) => {
  const { id } = req.params;

  if (!activeRoomsData.has(id)) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  res.status(200).json({ exists: true });
});

// -------------------- WEBSOCKET --------------------
io.on("connection", (socket) => {
  socket.on("join_room", (roomId: string, playerInfo: PlayerInfo) => {
    const room = activeRoomsData.get(roomId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }
    const player: Player = {
      ...playerInfo,
      socket_id: socket.id,
      life_points: 40,
      poison_counters: 0,
      rad_counters: 0,
      experience_counters: 0,
      energy_counters: 0,
      storm_counters: 0,
      turnOrder: room.players.length + 1,
    };

    const existingPlayerIndex = room.players.findIndex(
      (p) => p.id === playerInfo.id
    );
    if (existingPlayerIndex !== -1) {
      room.players[existingPlayerIndex] = player;
    } else {
      room.players.push(player);
    }

    socket.join(roomId);
    io.to(roomId).emit("players_update", room.players);
    socket.emit("your_player_id", socket.id);
  });

  socket.on("disconnect", () => {
    for (const [roomId, room] of activeRoomsData.entries()) {
      const index = room.players.findIndex((p) => p.socket_id === socket.id);
      if (index !== -1) {
        room.players.splice(index, 1);
        io.to(roomId).emit("players_update", room.players);
      }
    }
  });
});

// -------------------- START SERVER --------------------
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
