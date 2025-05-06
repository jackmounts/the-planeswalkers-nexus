"use client";

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, LoaderCircle, RefreshCcw } from "lucide-react";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import * as CookieConsent from "vanilla-cookieconsent";
import { cookieConsentConfig } from "../../cookieconsent-config";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import useProfileStore from "@/store/profile.store";
import axios from "axios";
import { generateName } from "@models/shared";

export default function Home() {
  const [roomCode, setRoomCode] = useState<string>("");
  const [roomInput, setRoomInput] = useState<string>("");
  const router = useRouter();
  const { name, setName, pronouns, setPronouns } = useProfileStore();

  useEffect(() => {
    CookieConsent.run({
      ...cookieConsentConfig,
    });
  }, []);

  const generateRoomCode = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/gen-code");
      setRoomCode(response.data.roomId);
    } catch (error) {
      toast.error("Failed to generate room code. Please try again.");
    }
  };

  const createRoom = async () => {
    try {
      const response = await axios.post("http://localhost:8080/api/rooms", {
        id: roomCode,
      });
      if (response.status === 201) {
        toast.success("Room created successfully!");
        router.push(`/room/${roomCode}`);
      } else {
        toast.error(response.data.error);
      }
    } catch (error) {
      toast.error("Failed to create room. Please try again.");
    }
  };

  const checkRoomCode = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/rooms/" + roomInput + "/exists"
      );
      if (response.status === 200) {
        router.push(`/room/${roomInput}`);
      }
    } catch (error) {
      toast.error("Room not found");
    }
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center">
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
            <div className="flex flex-row w-full items-center space-x-2 mb-4">
              <Input
                id="name"
                type="name"
                placeholder="Liliana of the Veil"
                maxLength={24}
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
            <Collapsible>
              <CollapsibleTrigger className="flex flex-row items-center hover:underline hover:cursor-pointer">
                Advanced <ChevronDown />
              </CollapsibleTrigger>
              <CollapsibleContent className="w-full space-y-2 mt-4 pl-4">
                <Label htmlFor="pronouns">Pronouns</Label>
                <Input
                  id="pronouns"
                  type="name"
                  placeholder="she/her"
                  maxLength={10}
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                />
              </CollapsibleContent>
            </Collapsible>
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
                <Button className="w-full cursor-pointer h-12" disabled={!name}>
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
                    onClick={() => createRoom()}
                    disabled={!roomCode}
                  >
                    Create
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="text-gray-800/60 font-semibold">or</div>
            <Dialog onOpenChange={() => setRoomInput("")}>
              <DialogTrigger asChild>
                <Button
                  className="w-full cursor-pointer h-12"
                  variant="outline"
                  disabled={!name}
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
          <Dialog>
            <DialogTrigger>
              <p className="text-gray-800/60 font-semibold text-sm cursor-pointer hover:underline">
                Need some help?
              </p>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>What is the Planeswalker Nexus?</DialogTitle>
                <DialogDescription asChild>
                  <div>
                    A cool app to play Magic: The Gathering with your friends
                    using a webcam and your real cards. You can create a room
                    and share the code with your friends to play together. You
                    can also join a room by entering the code provided by your
                    friends. The app is designed to be easy to use and to
                    provide a great experience for all players.
                    <p>FAQs</p>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>Is it accessible?</AccordionTrigger>
                        <AccordionContent>
                          Yes. It adheres to the WAI-ARIA design pattern.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>Is it styled?</AccordionTrigger>
                        <AccordionContent>
                          Yes. It comes with default styles that matches the
                          other components&apos; aesthetic.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger>Is it animated?</AccordionTrigger>
                        <AccordionContent>
                          Yes. It's animated by default, but you can disable it
                          if you prefer.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
