"use client";

import React, { useEffect } from "react";
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
import { Home, Mic, Video } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import type { Player } from "@models/shared";
import { io, Socket } from "socket.io-client";
import useProfileStore from "@/store/profile.store";
import { computeGridClass } from "@/lib/utils";

const STUN_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const RoomPage: React.FC = () => {
  const { roomId } = useParams();
  const router = useRouter();
  const { name, setName, pronouns, id, hasHydrated } = useProfileStore();

  const [mySocketId, setMySocketId] = React.useState<string | null>(null);
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [stream, setStream] = React.useState<MediaStream | null>(null);

  const socket = React.useRef<Socket>(null);
  const peerConnections = React.useRef<Map<string, RTCPeerConnection>>(
    new Map()
  );
  const [remoteStreams, setRemoteStreams] = React.useState<
    Record<string, MediaStream>
  >({});

  useEffect(() => {
    if (!hasHydrated || !id || id === "") return;

    const socket = io("http://localhost:8080");

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

    return () => {
      socket.disconnect();
      peerConnections.current.forEach((pc) => pc.close());
    };
  }, [hasHydrated, id]);

  useEffect(() => {
    checkRoomCode();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    getUserMedia();
  }, []);

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
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });

    if (stream) {
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        socket.current!.emit("signal", {
          target: peerId,
          from: socket.current!.id,
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
    const pc = createPeerConnection(peerId);
    peerConnections.current.set(peerId, pc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.current!.emit("signal", {
      target: peerId,
      from: socket.current!.id,
      signal: offer,
    });
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-800">
      <div className="flex flex-row w-full h-16 items-center justify-between px-8 pt-2 text-white text-2xl">
        <div className="flex w-full flex-row items-center justify-start space-x-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Home className="cursor-pointer hover:scale-110" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to leave?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to leave the room. Make sure to save the room
                  code if you want to come back later (or ask your friends if
                  you forget).
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
        </div>
        <div
          className="flex w-full justify-center cursor-pointer hover:underline"
          onClick={() => navigator.clipboard.writeText(String(roomId))}
        >
          {roomId}
        </div>
        <div className="flex w-full flex-row items-center space-x-4 justify-end-safe">
          <Mic className="cursor-pointer hover:scale-110" />
          <Video className="cursor-pointer hover:scale-110" />
        </div>
      </div>
      <div
        className={`grid size-full gap-2 p-2 ${computeGridClass(
          players.length
        )}`}
      >
        {players.map((player) => (
          <div
            key={player.id}
            className="flex flex-col items-center justify-center bg-white size-full p-2"
          >
            {player.socket_id === mySocketId && stream ? (
              <video
                autoPlay
                muted
                className="size-fit object-cover"
                ref={(video) => {
                  if (video) {
                    video.srcObject = stream;
                  }
                }}
              />
            ) : (
              <div>{player.id}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomPage;
