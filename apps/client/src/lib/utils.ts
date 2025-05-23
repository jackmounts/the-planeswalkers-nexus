import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateName() {
  const adjectives = [
    "Swift",
    "Mighty",
    "Cunning",
    "Brave",
    "Wise",
    "Fierce",
    "Noble",
    "Clever",
    "Bold",
    "Fearless",
    "Arcane",
    "Ethereal",
    "Vengeful",
    "Ancient",
    "Mystic",
    "Savage",
    "Relentless",
    "Shadowy",
    "Divine",
    "Infernal",
    "Celestial",
    "Spectral",
    "Phantom",
    "Eldritch",
    "Titanic",
    "Titan",
    "Cosmic",
    "Astral",
    "Temporal",
    "Void",
  ];
  const nouns = [
    "Dragon",
    "Phoenix",
    "Griffin",
    "Unicorn",
    "Hydra",
    "Basilisk",
    "Chimera",
    "Kraken",
    "Cerberus",
    "Leviathan",
    "Planeswalker",
    "Eldrazi",
    "Sliver",
    "Elemental",
    "Sphinx",
    "Avatar",
    "Demon",
    "Angel",
    "Zombie",
    "Goblin",
    "Merfolk",
    "Vampire",
    "Werewolf",
    "Golem",
    "Spirit",
    "Djinn",
    "Nymph",
    "Dryad",
    "Sprite",
    "Faerie",
    "Giant",
    "Troll",
    "Ogre",
    "Cyclops",
    "Minotaur",
    "Banshee",
    "Elf",
    "Dwarf",
    "Orc",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${randomAdjective} ${randomNoun}`;
}
