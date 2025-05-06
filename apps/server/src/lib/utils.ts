import { Player } from "@models/shared";
import validator from "validator";

export function generateRoomCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return code;
}

export function sanitizePlayer(player: Player): Player {
  return {
    ...player,
    name: validator.escape(player.name),
    pronouns: validator.escape(player.pronouns ?? ""),
  };
}
