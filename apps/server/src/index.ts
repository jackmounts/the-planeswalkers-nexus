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
const io = new Server(server);

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
  socket.on("joinRoom", (roomId: string, playerInfo: PlayerInfo) => {
    if (!activeRoomsData.has(roomId)) {
      socket.emit("error", "Room not found");
      return;
    }

    const room = activeRoomsData.get(roomId);
    const player: Player = {
      ...playerInfo,
      life_points: 40,
      poison_counters: 0,
      rad_counters: 0,
      experience_counters: 0,
      energy_counters: 0,
      storm_counters: 0,
    };

    room!.players.push(player);

    socket.join(roomId);
    socket.emit("joinedRoom", roomId, sanitizePlayer(player));

    socket.to(roomId).emit("playerJoined", playerInfo.id);
    const otherPlayerIds = room!.players
      .filter((p) => p.id !== playerInfo.id)
      .map((p) => p.id);
    socket.emit("otherPlayers", otherPlayerIds);

    // Store playerId and roomId on the socket for disconnect cleanup
    (socket.data as any).playerId = playerInfo.id;
    (socket.data as any).roomId = roomId;
  });

  socket.on("signal", ({ roomId, to, data }) => {
    socket.to(roomId).emit("signal", { from: socket.id, to, data });
  });

  socket.on("disconnecting", () => {
    const playerId = (socket.data as any).playerId;
    const roomId = (socket.data as any).roomId;
    if (roomId && playerId) {
      const room = activeRoomsData.get(roomId);
      if (room) {
        room.players = room.players.filter((p) => p.id !== playerId);
        if (room.players.length === 0) {
          activeRoomsData.delete(roomId);
        }
      }
    }
  });
});

// -------------------- START SERVER --------------------
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
