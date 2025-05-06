import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { generateRoomCode, sanitizePlayer } from "./lib/utils";
import { generateName, Player, PlayerInfo, Room } from "@models/shared";

// -------------------- ROOM DATA --------------------
const activeRoomsData = new Map<string, Room>();
const pendingRemovals = new Map<string, NodeJS.Timeout>();

const CLEANUP_TIMER = 10 * 60 * 1000;
const PENDING_TIMER = 3 * 60 * 1000;

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
    // Yet to implement turn phase logic
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

    if (!playerInfo.name || playerInfo.name.trim() === "") {
      playerInfo.name = generateName();
      playerInfo.pronouns = "";
    }

    let player = room.players.find((p) => p.id === playerInfo.id);
    if (player) {
      player.socket_id = socket.id;
      const t = pendingRemovals.get(player.id);
      if (t) {
        clearTimeout(t);
        pendingRemovals.delete(player.id);
      }
    } else {
      const p: Player = {
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
      room.players.push(p);
    }

    socket.join(roomId);
    socket.emit("you_are", { socketId: socket.id, name: playerInfo.name });
    io.to(roomId).emit("players_update", room.players.map(sanitizePlayer));
  });

  socket.on(
    "signal",
    (msg: { roomId: string; target: string; from: string; signal: any }) => {
      const { roomId, target, from, signal } = msg;
      const socketInRoom = io.sockets.adapter.rooms.get(roomId)?.has(target);
      if (socketInRoom) {
        io.sockets.sockets.get(target)?.emit("signal", { from, signal });
      }
    }
  );

  socket.on("media_toggle", (msg: { type: string; enabled: boolean }) => {
    const roomId = socket.data.roomId;
    socket.to(roomId).emit("peer_media_toggle", {
      from: socket.id,
      type: msg.type,
      enabled: msg.enabled,
    });
  });

  socket.on("pass_turn", (roomId: string) => {
    const room = activeRoomsData.get(roomId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    room.turn_player = (room.turn_player + 1) % room.players.length;
    // Yet to implement turn phase logic
    room.turn_phase = "BEGIN";
    io.to(roomId).emit("turn_update", {
      turn: room.turn,
      turn_player: room.turn_player,
      turn_phase: room.turn_phase,
    });
  });

  socket.on("disconnect", () => {
    for (const [roomId, room] of activeRoomsData.entries()) {
      const player = room.players.find((p) => p.socket_id === socket.id);
      if (player) {
        const t = setTimeout(() => {
          const idx = room.players.findIndex((p) => p.id === player.id);
          if (idx !== -1) {
            room.players.splice(idx, 1);
            io.to(roomId).emit(
              "players_update",
              room.players.map(sanitizePlayer)
            );
          }
          pendingRemovals.delete(player.id);
        }, PENDING_TIMER);
        pendingRemovals.set(player.id, t);
        break;
      }
    }
  });
});

// -------------------- START SERVER --------------------
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
