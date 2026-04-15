/**
 * LoL Impact Rating (LIR) engine
 * Formula: LIR = 1.00 + 0.15 * (wL*laning + wD*damage + wP*presence + wE*efficiency)
 * Z-score normalization per role group, confidence factor = min(1, games/medianGames)
 */

export type Role = 'TOP' | 'JGL' | 'MID' | 'BOT' | 'SUP';

export interface PlayerStats {
  role: Role;
  games: number;
  winRate: number;
  kda: number;
  avgAssists: number;
  kp: number;
  dpm: number;
  dmgPct: number;
  gpm: number;
  goldPct: number;
  gd15: number;
  csd15: number;
  xpd15: number;
}

export interface LIRResult {
  rating: number;
  confidence: number;
  subscores: {
    laning: number;
    damage: number;
    presence: number;
    efficiency: number;
  };
}

const ROLE_WEIGHTS: Record<Role, { laning: number; damage: number; presence: number; efficiency: number }> = {
  TOP: { laning: 0.35, damage: 0.30, presence: 0.10, efficiency: 0.25 },
  JGL: { laning: 0.15, damage: 0.20, presence: 0.35, efficiency: 0.30 },
  MID: { laning: 0.25, damage: 0.30, presence: 0.20, efficiency: 0.25 },
  BOT: { laning: 0.25, damage: 0.35, presence: 0.15, efficiency: 0.25 },
  SUP: { laning: 0.15, damage: 0.10, presence: 0.40, efficiency: 0.35 },
};

const SCALING = 22;

// Stat sub-weights within each component (sum to 1.0 each)
const COMPONENT_STATS: Record<string, [keyof PlayerStats, number][]> = {
  laning:     [['gd15', 0.50], ['csd15', 0.30], ['xpd15', 0.20]],
  damage:     [['dpm',  0.50], ['dmgPct', 0.50]],
  presence:   [['kp',   0.40], ['winRate', 0.40], ['avgAssists', 0.20]],
  efficiency: [['kda',  0.40], ['gpm', 0.40], ['goldPct', 0.20]],
};

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr: number[], m: number): number {
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance) || 1; // avoid division by zero
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function computeAllRatings(players: PlayerStats[]): LIRResult[] {
  const ROLES: Role[] = ['TOP', 'JGL', 'MID', 'BOT', 'SUP'];

  const results: LIRResult[] = new Array(players.length).fill(null);

  for (const role of ROLES) {
    const group: { idx: number; p: PlayerStats }[] = [];
    players.forEach((p, idx) => { if (p.role === role) group.push({ idx, p }); });
    if (!group.length) continue;

    const ps = group.map(g => g.p);

    // Compute z-score parameters (mean + stddev) for each stat
    const allStats = [...new Set(Object.values(COMPONENT_STATS).flat().map(([s]) => s))];
    const zParams = new Map<keyof PlayerStats, { m: number; sd: number }>();
    for (const stat of allStats) {
      const vals = ps.map(p => p[stat] as number);
      const m = mean(vals);
      const sd = stddev(vals, m);
      zParams.set(stat, { m, sd });
    }

    const medGames = median(ps.map(p => p.games));

    for (const { idx, p } of group) {
      const confidence = Math.min(1, p.games / medGames);

      const z = (stat: keyof PlayerStats): number => {
        const params = zParams.get(stat)!;
        return ((p[stat] as number) - params.m) / params.sd;
      };

      const componentScore = (stats: [keyof PlayerStats, number][]): number =>
        stats.reduce((s, [stat, w]) => s + w * z(stat), 0);

      const laning    = componentScore(COMPONENT_STATS.laning    as [keyof PlayerStats, number][]);
      const damage    = componentScore(COMPONENT_STATS.damage    as [keyof PlayerStats, number][]);
      const presence  = componentScore(COMPONENT_STATS.presence  as [keyof PlayerStats, number][]);
      const efficiency = componentScore(COMPONENT_STATS.efficiency as [keyof PlayerStats, number][]);

      const w = ROLE_WEIGHTS[role];
      const composite = w.laning * laning + w.damage * damage + w.presence * presence + w.efficiency * efficiency;
      const rawRating = 50 + SCALING * composite;
      const clampedRating = Math.max(0, Math.min(100, rawRating));
      const baseRating = Math.round(clampedRating * 10) / 10;
      const rating = Math.round((50 + (baseRating - 50) * confidence) * 10) / 10;

      results[idx] = {
        rating,
        confidence: +confidence.toFixed(2),
        subscores: {
          laning:    +laning.toFixed(2),
          damage:    +damage.toFixed(2),
          presence:  +presence.toFixed(2),
          efficiency: +efficiency.toFixed(2),
        },
      };
    }
  }

  return results;
}
