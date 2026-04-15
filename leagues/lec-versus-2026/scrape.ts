/**
 * Scrape LEC Versus 2026 depuis gol.gg
 * Deux tournois à fusionner :
 *   - LEC 2026 Versus Season
 *   - LEC 2026 Versus Playoffs
 * Rosters + stats + LIR → leagues/lec-versus-2026/export.json
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeAllRatings } from '../../src/rating/engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TOURNAMENTS = [
  { name: 'LEC 2026 Versus Season',   season: 'ALL' },
  { name: 'LEC 2026 Versus Playoffs', season: 'ALL' },
];
const DISPLAY_NAME = 'LEC Versus 2026';
const BASE         = 'https://gol.gg';
const HEADERS      = { 'User-Agent': 'lol-esports-scraper/1.0 (stats research bot)', 'Accept': 'text/html' };
const VALID_ROLES  = ['TOP', 'JGL', 'MID', 'BOT', 'SUP'];
const ROLE_MAP: Record<string, string> = { TOP: 'TOP', JUNGLE: 'JGL', MID: 'MID', BOT: 'BOT', SUPPORT: 'SUP' };

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const enc   = (s: string)  => encodeURIComponent(s);

// ─── 1. Rosters — union des deux tournois ─────────────────────────────────

const roleMap = new Map<string, { role: string; team: string }>();

for (const t of TOURNAMENTS) {
  const teamsHtml = await fetch(`${BASE}/teams/list/season-${t.season}/split-ALL/tournament-${enc(t.name)}/`, { headers: HEADERS }).then(r => r.text());
  const $t = cheerio.load(teamsHtml);
  const teams: { id: string; name: string }[] = [];

  $t('table.table_list tbody tr').each((_, row) => {
    const link  = $t(row).find('a').first();
    const match = (link.attr('href') ?? '').match(/team-stats\/(\d+)\//);
    if (match && link.text().trim()) teams.push({ id: match[1], name: link.text().trim() });
  });

  process.stdout.write(`[roster] ${t.name} — 0/${teams.length} équipes`);

  for (const [i, team] of teams.entries()) {
    await sleep(600);
    const html = await fetch(`${BASE}/teams/team-stats/${team.id}/split-ALL/tournament-${enc(t.name)}/`, { headers: HEADERS }).then(r => r.text());
    const $  = cheerio.load(html);
    const roleCount: Record<string, number> = {};

    $('table.table_list tbody tr').each((_, row) => {
      const cells    = $(row).find('td');
      if (cells.length < 2) return;
      const roleName = ROLE_MAP[$(cells[0]).text().trim().toUpperCase()];
      if (!roleName) return;
      const name = ($(cells[1]).find('a').first().text() || $(cells[1]).text()).trim();
      if (!name) return;
      roleCount[roleName] = (roleCount[roleName] ?? 0) + 1;
      roleMap.set(name.toLowerCase(), { role: roleName, team: team.name });
    });

    process.stdout.write(`\r[roster] ${t.name} — ${i + 1}/${teams.length} équipes`);
  }

  console.log(`\r✓ roster     ${t.name} (${roleMap.size} joueurs cumulés)`);
}

console.log(`  → ${roleMap.size} joueurs uniques dans le roleMap`);

// ─── 2. Stats — scrape des deux tournois ──────────────────────────────────

// Accumule les stats brutes par joueur (golggId → données par tournoi)
const rawByPlayer = new Map<number, { name: string; country: string; team: string; role: string | null; rows: any[] }>();

for (const t of TOURNAMENTS) {
  const statsHtml = await fetch(`${BASE}/players/list/season-${t.season}/split-ALL/tournament-${enc(t.name)}/`, { headers: HEADERS }).then(r => r.text());
  const $s        = cheerio.load(statsHtml);
  let   count     = 0;

  $s('table.table_list tbody tr').each((_, row) => {
    const cells = $s(row).find('td');
    if (cells.length < 10) return;

    const link    = $s(cells[0]).find('a').first();
    const href    = link.attr('href') ?? '';
    const idMatch = href.match(/player-stats\/(\d+)/);
    const golggId = idMatch ? parseInt(idMatch[1]) : 0;
    const name    = link.text().trim();
    if (!name || !golggId) return;

    const country     = $s(cells[1]).find('img').first().attr('alt')?.trim() ?? '';
    const rosterEntry = roleMap.get(name.toLowerCase());
    const role        = rosterEntry?.role ?? null;
    const team        = rosterEntry?.team ?? '';

    const n = (i: number) => {
      const v = parseFloat($s(cells[i]).text().replace('%', '').replace(',', '.').trim());
      return isNaN(v) ? 0 : v;
    };

    const row_data = {
      games: n(2), winRate: n(3), kda: n(4),
      avgKills: n(5), avgDeaths: n(6), avgAssists: n(7),
      csm: n(8), gpm: n(9), kp: n(10),
      dmgPct: n(11), goldPct: n(12), vsPct: n(13),
      dpm: n(14), vspm: n(15),
      avgWpm: n(16), avgWcpm: n(17), avgVwpm: n(18),
      gd15: n(19), csd15: n(20), xpd15: n(21),
      fbPct: n(22), fbVictim: n(23), pentaKills: n(24), soloKills: n(25),
    };

    if (!rawByPlayer.has(golggId)) {
      rawByPlayer.set(golggId, { name, country, team, role, rows: [] });
    }
    rawByPlayer.get(golggId)!.rows.push(row_data);
    count++;
  });

  console.log(`✓ stats      ${t.name} (${count} joueurs)`);
}

// ─── 3. Fusion — moyenne pondérée par games ───────────────────────────────

// Stats additives (somme)
const SUM_STATS   = ['games', 'pentaKills', 'soloKills'] as const;
// Stats moyennées pondérées par games
const AVG_STATS   = [
  'winRate', 'kda', 'avgKills', 'avgDeaths', 'avgAssists',
  'csm', 'gpm', 'kp', 'dmgPct', 'goldPct', 'vsPct',
  'dpm', 'vspm', 'avgWpm', 'avgWcpm', 'avgVwpm',
  'gd15', 'csd15', 'xpd15', 'fbPct', 'fbVictim',
] as const;

const players: any[] = [];

for (const [golggId, { name, country, team, role, rows }] of rawByPlayer) {
  if (rows.length === 0) continue;

  const totalGames = rows.reduce((s, r) => s + r.games, 0);
  const merged: any = { golggId, name, country, team, role };

  // Somme
  for (const stat of SUM_STATS) {
    merged[stat] = rows.reduce((s, r) => s + r[stat], 0);
  }

  // Moyenne pondérée
  for (const stat of AVG_STATS) {
    merged[stat] = totalGames > 0
      ? rows.reduce((s, r) => s + r[stat] * r.games, 0) / totalGames
      : 0;
  }

  players.push(merged);
}

console.log(`  → ${players.length} joueurs fusionnés`);

// ─── 4. Calcul LIR ───────────────────────────────────────────────────────

const lirResults = computeAllRatings(players.map(p => ({
  role: (VALID_ROLES.includes(p.role) ? p.role : 'MID') as any,
  games: p.games, winRate: p.winRate, kda: p.kda,
  avgAssists: p.avgAssists, avgDeaths: p.avgDeaths, csm: p.csm,
  kp: p.kp, dpm: p.dpm, dmgPct: p.dmgPct,
  gpm: p.gpm, goldPct: p.goldPct,
  gd15: p.gd15, csd15: p.csd15, xpd15: p.xpd15,
})));

players.forEach((p, i) => {
  if (lirResults[i]) {
    p.rating     = lirResults[i].rating;
    p.confidence = lirResults[i].confidence;
    p.subscores  = lirResults[i].subscores;
  }
});

// ─── 5. Export ────────────────────────────────────────────────────────────

const exportData = {
  metadata: {
    exportedAt: new Date().toISOString(),
    tournaments: [{ name: DISPLAY_NAME, league: 'LEC', year: 2026, split: 'Versus', scrapedAt: new Date().toISOString() }],
  },
  players: players.map(p => ({
    id: p.golggId, name: p.name, country: p.country, team: p.team,
    role: p.role ?? 'UNK', rating: p.rating, confidence: p.confidence, subscores: p.subscores,
    tournaments: {
      [DISPLAY_NAME]: {
        games: p.games, winRate: p.winRate, kda: p.kda,
        avgKills: p.avgKills, avgDeaths: p.avgDeaths, avgAssists: p.avgAssists,
        csm: p.csm, gpm: p.gpm, kp: p.kp,
        dmgPct: p.dmgPct, goldPct: p.goldPct, vsPct: p.vsPct,
        dpm: p.dpm, vspm: p.vspm,
        avgWpm: p.avgWpm, avgWcpm: p.avgWcpm, avgVwpm: p.avgVwpm,
        gd15: p.gd15, csd15: p.csd15, xpd15: p.xpd15,
        fbPct: p.fbPct, fbVictim: p.fbVictim, pentaKills: p.pentaKills, soloKills: p.soloKills,
      },
    },
    aggregated: { totalGames: p.games, avgWinRate: p.winRate, avgKda: p.kda },
  })),
};

const withRole = players.filter(p => p.role).length;
const outPath  = path.join(__dirname, 'export.json');
fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2));
console.log(`✓ export     ${DISPLAY_NAME} (${players.length} joueurs, ${withRole} avec rôle)`);
