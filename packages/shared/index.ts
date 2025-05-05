export interface PlayerInfo {
  id: string;
  name: string;
  pronouns: string;
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
