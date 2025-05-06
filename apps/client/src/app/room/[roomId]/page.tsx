"use client";

import React, { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import {
  LayoutGrid,
  LogOut,
  Menu,
  MessagesSquare,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import type { Player } from "@models/shared";
import { io, Socket } from "socket.io-client";
import useProfileStore from "@/store/profile.store";
import { computeGridClass, decodeHtmlEntities } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const STUN_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const RoomPage: React.FC = () => {
  const { roomId } = useParams();
  const router = useRouter();
  const { name, setName, pronouns, id, hasHydrated } = useProfileStore();
  const socketRef = useRef<Socket>(null);

  const [mySocketId, setMySocketId] = React.useState<string | null>(null);
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [stream, setStream] = React.useState<MediaStream | null>(null);

  const [showDock, setShowDock] = React.useState(false);
  const [hoveringDock, setHoveringDock] = React.useState(false);

  const [muted, setMuted] = React.useState(false);
  const [videoOff, setVideoOff] = React.useState(false);

  const peerConnections = React.useRef<Map<string, RTCPeerConnection>>(
    new Map()
  );
  const [remoteStreams, setRemoteStreams] = React.useState<
    Record<string, MediaStream>
  >({});

  useEffect(() => {
    getUserMedia();
  }, []);

  useEffect(() => {
    // if (!hasHydrated || !id || !stream) return;
    if (!hasHydrated || !id) return;

    socketRef.current = io("http://localhost:8080", {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      socket.emit("join_room", roomId, {
        id: id,
        name: name,
        pronouns: pronouns,
      });
    });

    socket.on("you_are", (socketId) => {
      setMySocketId(socketId);
    });

    socket.on("name_update", (name: string) => {
      setName(name);
    });

    socket.on("players_update", (players: Player[]) => {
      const sorted = players.sort((a, b) => a.turnOrder - b.turnOrder);
      setPlayers(sorted);
      sorted.forEach((p) => {
        if (
          p.socket_id !== socket.id &&
          !peerConnections.current.has(p.socket_id)
        ) {
          createOffer(p.socket_id);
        }
      });
    });

    socket.on(
      "signal",
      async (msg: {
        from: string;
        signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
      }) => {
        const { from, signal } = msg;
        let pc = peerConnections.current.get(from);
        if (!pc) {
          pc = createPeerConnection(from);
          peerConnections.current.set(from, pc);
        }

        if ((signal as RTCSessionDescriptionInit).type) {
          const desc = signal as RTCSessionDescriptionInit;
          await pc.setRemoteDescription(new RTCSessionDescription(desc));
          if (desc.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("signal", {
              roomId: roomId,
              target: from,
              from: socket.id,
              signal: answer,
            });
          }
        } else {
          await pc.addIceCandidate(
            new RTCIceCandidate(signal as RTCIceCandidateInit)
          );
        }
      }
    );

    socket.on("peer_media_toggle", ({ from, type, enabled }) => {
      setPlayers((prev) =>
        prev.map((p) =>
          p.socket_id === from
            ? {
                ...p,
                isAudioEnabled: type === "audio" ? enabled : p.is_muted,
                isVideoEnabled: type === "video" ? enabled : p.is_video_off,
              }
            : p
        )
      );
    });

    return () => {
      socket.disconnect();
      peerConnections.current.forEach((pc) => pc.close());
      setRemoteStreams({});
    };
  }, [hasHydrated, id, stream]);

  useEffect(() => {
    checkRoomCode();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const windowHeight = window.innerHeight;
      const mouseY = e.clientY;

      const nearBottom = mouseY > windowHeight - 100;

      if (nearBottom || hoveringDock) {
        setShowDock(true);
      } else {
        setShowDock(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [hoveringDock]);

  const checkRoomCode = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/rooms/" + roomId + "/exists"
      );
    } catch (error) {
      toast.error("Room not found");
      router.push("/");
    }
  };

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(stream);
    } catch (error) {
      toast.error(
        "Failed to access video and audio. Please check permissions."
      );
    }
  };

  function createPeerConnection(peerId: string) {
    const socket = socketRef.current!;
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

    if (stream) {
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        socket.emit("signal", {
          target: peerId,
          from: socket.id,
          signal: ev.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (ev) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [peerId]: ev.streams[0],
      }));
    };

    return pc;
  }

  async function createOffer(peerId: string) {
    const socket = socketRef.current!;
    const pc = createPeerConnection(peerId);
    peerConnections.current.set(peerId, pc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("signal", {
      target: peerId,
      from: socket.id,
      signal: offer,
    });
  }

  const toggleAudio = () => {
    const socket = socketRef.current!;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    socket.emit("media_toggle", {
      type: "audio",
      enabled: audioTrack.enabled,
    });
    setMuted(!audioTrack.enabled);
  };

  const toggleVideo = () => {
    const socket = socketRef.current!;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    socket.emit("media_toggle", {
      type: "video",
      enabled: videoTrack.enabled,
    });
    setVideoOff(!videoTrack.enabled);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-neutral-800">
      <div className="hexagon fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-100 bg-neutral-800 text-white flex items-center justify-center text-xl font-bold">
        <div>Turn</div>
      </div>
      <div
        className={`grid size-full gap-2 p-2 ${computeGridClass(
          players.length
        )}`}
      >
        {players.map((player) => (
          <div
            key={player.id}
            className="relative flex flex-col items-center justify-center bg-white size-full p-2"
          >
            {player.socket_id === mySocketId && stream ? (
              <video
                autoPlay
                muted
                className="size-fit object-cover"
                ref={(video) => {
                  if (video) video.srcObject = stream;
                }}
              />
            ) : remoteStreams[player.socket_id] ? (
              <video
                autoPlay
                className="size-fit object-cover"
                ref={(video) => {
                  if (video) video.srcObject = remoteStreams[player.socket_id];
                }}
              />
            ) : (
              <div>{player.id}</div>
            )}
            <div className="absolute bottom-0 right-0 w-fit px-4 py-1 bg-zinc-500/30 flex flex-row items-center gap-1">
              <div>{player.name}</div>
              <div className="text-zinc-600/50">
                {player.pronouns && `(${decodeHtmlEntities(player.pronouns)})`}
              </div>
              <div className="text-zinc-600/50">
                {player.id === id && "(You)"}
              </div>
              <div>
                {player.is_muted && (
                  <MicOff className="text-red-500" size={16} />
                )}
                {player.is_video_off && (
                  <VideoOff className="text-red-500" size={16} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 transition-all duration-300 ${
          showDock
            ? "opacity-100 scale-100"
            : "opacity-0 scale-90 pointer-events-none"
        }`}
        onMouseEnter={() => setHoveringDock(true)}
        onMouseLeave={() => setHoveringDock(false)}
      >
        <AnimatePresence>
          {showDock && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-zinc-900/80 backdrop-blur-md rounded-xl px-6 py-3 flex items-center justify-between space-x-6 shadow-xl min-w-[200]"
              onMouseLeave={() => setShowDock(false)}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <LogOut className="text-white hover:scale-110 transition-transform cursor-pointer" />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to leave?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You are about to leave the room. Make sure to save the
                      room code if you want to come back later (or ask your
                      friends if you forget).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.push("/")}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Separator orientation="vertical" />
              {muted ? (
                <MicOff
                  className="text-red-500 hover:scale-110 transition-transform cursor-pointer"
                  onClick={toggleAudio}
                />
              ) : (
                <Mic
                  className="text-white hover:scale-110 transition-transform cursor-pointer"
                  onClick={toggleAudio}
                />
              )}
              {videoOff ? (
                <VideoOff
                  className="text-red-500 hover:scale-110 transition-transform cursor-pointer"
                  onClick={toggleVideo}
                />
              ) : (
                <Video
                  className="text-white hover:scale-110 transition-transform cursor-pointer"
                  onClick={toggleVideo}
                />
              )}
              <Separator orientation="vertical" />
              <MessagesSquare className="text-white hover:scale-110 transition-transform cursor-pointer" />
              <LayoutGrid className="text-white hover:scale-110 transition-transform cursor-pointer" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RoomPage;
