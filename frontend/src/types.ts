export type Role = 'TOP' | 'JGL' | 'MID' | 'BOT' | 'SUP';

export interface TournamentStats {
  games: number;
  winRate: number;
  kda: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  csm: number;
  gpm: number;
  kp: number;
  dmgPct: number;
  goldPct: number;
  vsPct: number;
  dpm: number;
  vspm: number;
  avgWpm: number;
  avgWcpm: number;
  avgVwpm: number;
  gd15: number;
  csd15: number;
  xpd15: number;
  fbPct: number;
  fbVictim: number;
  pentaKills: number;
  soloKills: number;
}

export interface LIRSubscores {
  laning: number;
  damage: number;
  presence: number;
  efficiency: number;
}

export interface Player {
  id: number;
  name: string;
  country: string;
  team: string;
  role: Role;
  tournaments: Record<string, TournamentStats>;
  aggregated: {
    totalGames: number;
    avgWinRate: number;
    avgKda: number;
  };
  rating?: number;
  confidence?: number;
  subscores?: LIRSubscores;
}

export interface ExportData {
  metadata: {
    exportedAt: string;
    tournaments: {
      name: string;
      league: string;
      year: number;
      split?: string;
      totalGames?: number;
      scrapedAt?: string;
    }[];
  };
  players: Player[];
}
