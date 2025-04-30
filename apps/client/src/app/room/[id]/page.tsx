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
import { Home, Mic, ScreenShare, Video, X } from "lucide-react";

interface Player {
  id: string;
  name: string;
  color: string;
  turnOrder: number;
}

const RoomPage: React.FC = () => {
  const [players, setPlayers] = React.useState<Player[]>([]);
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    // Simulate fetching players from a server
    setPlayers([
      { id: "1", name: "Player 1", color: "red", turnOrder: 1 },
      { id: "2", name: "Player 2", color: "blue", turnOrder: 2 },
      { id: "3", name: "Player 3", color: "green", turnOrder: 3 },
      { id: "4", name: "Player 4", color: "yellow", turnOrder: 4 },
    ]);
  }, []);

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
          onClick={() => navigator.clipboard.writeText(String(id))}
        >
          {id}
        </div>
        <div className="flex w-full flex-row items-center space-x-4 justify-end-safe">
          <Mic className="cursor-pointer hover:scale-110" />
          <Video className="cursor-pointer hover:scale-110" />
          <ScreenShare className="cursor-pointer hover:scale-110" />
        </div>
      </div>
      <div className="grid grid-cols-2 size-full gap-2 p-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex flex-col items-center justify-center bg-white size-full"
          >
            {player.id}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomPage;
