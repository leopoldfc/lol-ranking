import type { Player, Role, TournamentStats } from './types';

export const ROLE_LABEL: Record<Role, string> = {
  TOP: 'Top', JGL: 'Jungle', MID: 'Mid', BOT: 'Bot', SUP: 'Support',
};

export const ROLE_COLOR: Record<Role, string> = {
  TOP: '#e05252', JGL: '#52c97a', MID: '#a87fde', BOT: '#e08c3c', SUP: '#5294e0',
};

export const TEAM_COLOR: Record<string, string> = {
  'Gen.G': '#b8960a',
  'T1': '#c0001f',
  'Dplus KIA': '#0a3a8a',
  'BNK FearX': '#d43050',
  'Kiwoom DRX': '#005fa3',
  'OKSavingsBank BRO': '#008040',
  'DN SOOPers': '#4a3a8a',
  'KT Rolster': '#cc0000',
  'HLE': '#d45c00',
  'NS RedForce': '#aa0020',
};

const ROLE_WEIGHTS: Record<Role, Partial<Record<keyof TournamentStats, number>>> = {
  TOP: { kda: 0.12, winRate: 0.18, dpm: 0.15, csm: 0.08, gd15: 0.15, kp: 0.08, dmgPct: 0.14, gpm: 0.10 },
  JGL: { kda: 0.14, winRate: 0.18, dpm: 0.08, csm: 0.03, gd15: 0.12, kp: 0.18, dmgPct: 0.07, gpm: 0.10, xpd15: 0.10 },
  MID: { kda: 0.12, winRate: 0.18, dpm: 0.15, csm: 0.10, gd15: 0.15, kp: 0.08, dmgPct: 0.12, gpm: 0.10 },
  BOT: { kda: 0.10, winRate: 0.18, dpm: 0.18, csm: 0.10, gd15: 0.12, kp: 0.08, dmgPct: 0.14, gpm: 0.10 },
  SUP: { kda: 0.15, winRate: 0.20, dpm: 0.03, csm: 0.00, gd15: 0.05, kp: 0.25, dmgPct: 0.02, gpm: 0.05, xpd15: 0.05, avgAssists: 0.20 },
};

const NORMS: Partial<Record<keyof TournamentStats, { min: number; max: number }>> = {
  kda:        { min: 1.3,  max: 7.0  },
  winRate:    { min: 28,   max: 92   },
  dpm:        { min: 150,  max: 920  },
  csm:        { min: 0.8,  max: 11   },
  gd15:       { min: -460, max: 450  },
  kp:         { min: 42,   max: 78   },
  dmgPct:     { min: 5,    max: 30   },
  gpm:        { min: 240,  max: 560  },
  xpd15:      { min: -320, max: 400  },
  avgAssists: { min: 0.5,  max: 15   },
};

export function computeRating(stats: TournamentStats, role: Role): number {
  const weights = ROLE_WEIGHTS[role] ?? ROLE_WEIGHTS.MID;
  let score = 0;
  for (const [stat, weight] of Object.entries(weights) as [keyof TournamentStats, number][]) {
    const norm = NORMS[stat];
    if (!norm || stats[stat] === undefined) continue;
    const val = stats[stat] as number;
    const normalized = Math.max(0, Math.min(1, (val - norm.min) / (norm.max - norm.min)));
    score += normalized * weight;
  }
  return Math.round(score * 1000) / 10;
}

export function getPlayerStats(player: Player, tournament?: string): TournamentStats | null {
  if (tournament) return player.tournaments[tournament] ?? null;
  const entries = Object.values(player.tournaments);
  if (!entries.length) return null;
  if (entries.length === 1) return entries[0];
  // Weighted average across tournaments
  const total = entries.reduce((s, t) => s + t.games, 0);
  const avg = <K extends keyof TournamentStats>(key: K): number => {
    return entries.reduce((s, t) => s + (t[key] as number) * t.games, 0) / total;
  };
  return {
    games: total, winRate: avg('winRate'), kda: avg('kda'),
    avgKills: avg('avgKills'), avgDeaths: avg('avgDeaths'), avgAssists: avg('avgAssists'),
    csm: avg('csm'), gpm: avg('gpm'), kp: avg('kp'),
    dmgPct: avg('dmgPct'), goldPct: avg('goldPct'), vsPct: avg('vsPct'),
    dpm: avg('dpm'), vspm: avg('vspm'), avgWpm: avg('avgWpm'), avgWcpm: avg('avgWcpm'), avgVwpm: avg('avgVwpm'),
    gd15: avg('gd15'), csd15: avg('csd15'), xpd15: avg('xpd15'),
    fbPct: avg('fbPct'), fbVictim: avg('fbVictim'),
    pentaKills: avg('pentaKills'), soloKills: avg('soloKills'),
  };
}

export function enrichPlayers(players: Player[], tournament?: string): Player[] {
  return players.map(p => {
    // Use rating from scraper if available, otherwise compute from stats
    if (p.rating !== undefined) return p;
    const stats = getPlayerStats(p, tournament);
    if (!stats) return p;
    return { ...p, rating: computeRating(stats, p.role) };
  });
}

export function fmt(n: number | undefined, decimals = 1): string {
  if (n === undefined || n === null) return '—';
  return n.toFixed(decimals);
}

export function fmtSign(n: number | undefined): string {
  if (n === undefined || n === null) return '—';
  return (n >= 0 ? '+' : '') + Math.round(n);
}
