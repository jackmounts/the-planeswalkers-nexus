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
import { io } from "socket.io-client";
import useProfileStore from "@/store/profile.store";

const RoomPage: React.FC = () => {
  const [mySocketId, setMySocketId] = React.useState<string | null>(null);
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [gridClass, setGridClass] = React.useState<string>(
    "grid-rows-1 grid-cols-1"
  );
  const { roomId } = useParams();
  const router = useRouter();
  const { name, pronouns, id } = useProfileStore();

  useEffect(() => {
    checkRoomCode();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const socket = io("http://localhost:8080");
    socket.emit("join_room", roomId, {
      id: id,
      name: name,
      pronouns: pronouns,
    });

    socket.on("your_player_id", (socketId) => {
      setMySocketId(socketId);
    });

    socket.on("players_update", (players: Player[]) => {
      const sorted = players.sort((a, b) => a.turnOrder - b.turnOrder);
      setPlayers(sorted);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    getUserMedia();
  }, []);

  useEffect(() => {
    if (players.length <= 1) setGridClass("grid-rows-1 grid-cols-1");
    else if (players.length === 2) setGridClass("grid-rows-2 grid-cols-1");
    else if (players.length === 3) setGridClass("grid-rows-2 grid-cols-2");
    else if (players.length === 4) setGridClass("grid-rows-2 grid-cols-2");
    else if (players.length === 5) setGridClass("grid-rows-2 grid-cols-3");
    else if (players.length === 6) setGridClass("grid-rows-2 grid-cols-3");
    else setGridClass("grid-rows-3 grid-cols-3");
  }, [players]);

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

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-800">
      <div className="flex flex-row w-full h-16 items-center justify-between px-8 pt-2 text-white text-2xl">
        <div className="flex w-full flex-row items-center space-x-4">
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
      <div className={`grid size-full gap-2 p-2 ${gridClass}`}>
        {players.map((player) => (
          <div
            key={player.id}
            className="flex flex-col items-center justify-center bg-white size-full"
          >
            {player.socket_id === mySocketId && stream ? (
              <video
                autoPlay
                muted
                className="w-full h-full object-cover"
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
