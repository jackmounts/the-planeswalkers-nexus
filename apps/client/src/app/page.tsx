"use client";

import { useEffect, useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle, RefreshCcw } from "lucide-react";
import { generateName } from "@/lib/utils";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import { cookieConsentConfig } from "../../cookieconsent-config";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useProfileStore from "@/store/profile.store";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [roomCode, setRoomCode] = useState<string>("");
  const [roomInput, setRoomInput] = useState<string>("");
  const router = useRouter();
  const { name, setName, id, setId } = useProfileStore();

  useEffect(() => {
    CookieConsent.run({
      ...cookieConsentConfig,
    });
  }, []);

  useEffect(() => {
    const uuid = uuidv4();
    setId(uuid);
  }, []);

  const generateRoomCode = () => {
    setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase());
  };

  const gotoRoom = () => {
    router.push(`/room/${roomCode}`);
  };

  const checkRoomCode = () => {
    // Check if room code exist in the server
    // If it does, redirect to the room
    // If it doesn't, show an error message

    // This actions are mocked
    router.push(`/room/${roomInput}`);
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center">
      {/* <Galaxy2DBackground /> */}
      <Card className="relative z-10 min-w-[380px] lg:w-[540px] xl:w-[620px] m-4">
        <CardHeader className="w-full justify-center items-center">
          <CardTitle className="text-2xl lg:text-4xl xl:text-5xl font-semibold">
            The Planeswalkers Nexus
          </CardTitle>
          <CardDescription className="text-center">
            A safe place to play with fellow Wizards.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="w-full space-y-2">
            <Label htmlFor="name">Wizard name</Label>
            <div className="flex flex-row w-full items-center space-x-2">
              <Input
                id="name"
                type="name"
                placeholder="Liliana of the Veil"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                className="cursor-pointer"
                variant="outline"
                size="icon"
                onClick={() => {
                  setName(generateName());
                }}
              >
                <RefreshCcw />
              </Button>
            </div>
          </div>
          <div className="w-full flex flex-col items-center space-y-2">
            <AlertDialog
              onOpenChange={(isOpen) => {
                if (isOpen) {
                  generateRoomCode();
                }
              }}
            >
              <AlertDialogTrigger asChild>
                <Button className="w-full cursor-pointer h-12">
                  Create a Room
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    You are going to create a room!
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="flex flex-col space-y-4">
                      <div>
                        In a few seconds the room code will be generated and you
                        will be able to share it with your friends. Have fun!
                      </div>
                      <Button
                        variant="outline"
                        className={
                          roomCode
                            ? "h-20 cursor-pointer text-black"
                            : "h-20 cursor-not-allowed"
                        }
                        onClick={() => {
                          if (roomCode) {
                            navigator.clipboard.writeText(roomCode);
                            toast("Room code copied to clipboard", {
                              description: "Share it with your friends!",
                            });
                          }
                        }}
                      >
                        {roomCode ? (
                          roomCode
                        ) : (
                          <LoaderCircle className="animate-spin scale-200" />
                        )}
                      </Button>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => gotoRoom()}
                    disabled={!roomCode}
                  >
                    Create
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="text-gray-800/60 font-semibold">or</div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="w-full cursor-pointer h-12"
                  variant="outline"
                >
                  Join a Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Insert the room code to enter the gaming session!
                  </DialogTitle>
                  <DialogDescription asChild>
                    <div className="flex flex-col space-y-4">
                      <div>
                        Tell your friends or opponents to share the room code
                        with you then press enter to join the game.
                      </div>
                      <Input
                        type="text"
                        className="text-black h-12"
                        onChange={(e) => setRoomInput(e.target.value)}
                      />
                      <Button
                        disabled={roomInput.length < 5}
                        className="cursor-pointer"
                        onClick={() => checkRoomCode()}
                      >
                        Join room
                      </Button>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
        <CardFooter className="flex flex-row w-full items-center justify-end-safe">
          <p className="text-gray-800/60 font-semibold text-sm">
            copyright ©. all right reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
