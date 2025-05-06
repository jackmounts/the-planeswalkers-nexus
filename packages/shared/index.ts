export interface PlayerInfo {
  id: string;
  name: string;
  pronouns?: string;
}

export interface Player extends PlayerInfo {
  socket_id: string;
  life_points: number;
  poison_counters: number;
  rad_counters: number;
  experience_counters: number;
  energy_counters: number;
  storm_counters: number;
  turnOrder: number;
  is_active?: boolean;
  color?: string;
}

export interface Room {
  id: string;
  players: Player[];
  turn: number;
  turn_player: number;
  turn_phase: "BEGIN" | "M1" | "COMBAT" | "M2" | "END";
  has_started: boolean;
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
