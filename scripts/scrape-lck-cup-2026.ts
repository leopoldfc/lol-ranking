/**
 * Scrape les stats LCK Cup 2026 depuis gol.gg
 * Assigne les rôles via data/roster.json
 * Écrit le résultat dans data/exports/lck-cup-2026.json
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeAllRatings } from '../src/rating/engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── 1. Charger le roster ──────────────────────────────────────────────────

const roster = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/roster.json'), 'utf-8'));

// Construit un Map normalisé : "showmaker" → { role: "MID", team: "Dplus Kia" }
const roleMap = new Map<string, { role: string; team: string }>();

for (const equipe of roster.équipes) {
  for (const [role, pseudo] of Object.entries(equipe.membres as Record<string, string>)) {
    // Normalise BOT2, SUP2... → BOT, SUP
    const normalizedRole = role.replace(/\d+$/, '');
    roleMap.set(pseudo.toLowerCase(), { role: normalizedRole, team: equipe.nom });
  }
}

console.log(`Roster chargé : ${roleMap.size} joueurs`);

// ─── 2. Scraper gol.gg ────────────────────────────────────────────────────

const URL = 'https://gol.gg/players/list/season-S16/split-ALL/tournament-LCK%20Cup%202026/';

console.log(`\nGET ${URL}`);
const res = await fetch(URL, {
  headers: {
    'User-Agent': 'lol-esports-scraper/1.0 (stats research bot)',
    'Accept': 'text/html',
  },
});

if (!res.ok) throw new Error(`HTTP ${res.status}`);
const html = await res.text();
console.log(`Réponse : ${res.status}, ${html.length} caractères`);

// ─── 3. Parser le tableau HTML ────────────────────────────────────────────

const $ = cheerio.load(html);
const players: any[] = [];

// Structure réelle du tableau gol.gg (vérifié) :
// td[0]  = nom joueur (lien avec golggId dans href)
// td[1]  = pays (img alt)
// td[2]  = games
// td[3]  = win rate %
// td[4]  = kda
// td[5]  = avg kills
// td[6]  = avg deaths
// td[7]  = avg assists
// td[8]  = csm
// td[9]  = gpm
// td[10] = kp %
// td[11] = dmg %
// td[12] = gold %
// td[13] = vs %
// td[14] = dpm
// td[15] = vspm
// td[16] = avg wpm
// td[17] = avg wcpm
// td[18] = avg vwpm
// td[19] = gd15
// td[20] = csd15
// td[21] = xpd15
// td[22] = fb %
// td[23] = fb victim %
// td[24] = penta kills
// td[25] = solo kills

$('table.table_list tbody tr').each((_, row) => {
  const cells = $(row).find('td');
  if (cells.length < 10) return;

  // td[0] : lien joueur
  const playerCell = $(cells[0]);
  const link = playerCell.find('a').first();
  const href = link.attr('href') ?? '';
  const idMatch = href.match(/player-stats\/(\d+)/);
  const golggId = idMatch ? parseInt(idMatch[1]) : 0;
  const name = link.text().trim();
  if (!name || !golggId) return;

  // td[1] : pays
  const country = $(cells[1]).find('img').first().attr('alt')?.trim() ?? '';

  // Rôle et équipe depuis le roster
  const rosterEntry = roleMap.get(name.toLowerCase());
  const role = rosterEntry?.role ?? null;
  const team = rosterEntry?.team ?? '';

  if (!role) console.warn(`  Rôle inconnu : ${name}`);

  const n = (i: number) => {
    const v = parseFloat($(cells[i]).text().replace('%', '').replace(',', '.').trim());
    return isNaN(v) ? 0 : v;
  };

  players.push({
    golggId, name, country, team, role,
    games:      n(2),
    winRate:    n(3),
    kda:        n(4),
    avgKills:   n(5),
    avgDeaths:  n(6),
    avgAssists: n(7),
    csm:        n(8),
    gpm:        n(9),
    kp:         n(10),
    dmgPct:     n(11),
    goldPct:    n(12),
    vsPct:      n(13),
    dpm:        n(14),
    vspm:       n(15),
    avgWpm:     n(16),
    avgWcpm:    n(17),
    avgVwpm:    n(18),
    gd15:       n(19),
    csd15:      n(20),
    xpd15:      n(21),
    fbPct:      n(22),
    fbVictim:   n(23),
    pentaKills: n(24),
    soloKills:  n(25),
  });
});

console.log(`\n${players.length} joueurs scrapés`);

// ─── 4b. Calculer LIR ────────────────────────────────────────────────────────

const validRoles = ['TOP', 'JGL', 'MID', 'BOT', 'SUP'];
const lirInputs = players.map(p => ({
  role: (validRoles.includes(p.role) ? p.role : 'MID') as any,
  games: p.games, winRate: p.winRate, kda: p.kda,
  avgAssists: p.avgAssists, kp: p.kp, dpm: p.dpm,
  dmgPct: p.dmgPct, gpm: p.gpm, goldPct: p.goldPct,
  gd15: p.gd15, csd15: p.csd15, xpd15: p.xpd15,
}));

const lirResults = computeAllRatings(lirInputs);

// Attach ratings to players
players.forEach((p, i) => {
  if (lirResults[i]) {
    p.rating = lirResults[i].rating;
    p.confidence = lirResults[i].confidence;
    p.subscores = lirResults[i].subscores;
  }
});

// ─── 4. Résumé par rôle ───────────────────────────────────────────────────

const byRole: Record<string, string[]> = { TOP: [], JGL: [], MID: [], BOT: [], SUP: [], UNKNOWN: [] };
for (const p of players) {
  const key = p.role ?? 'UNKNOWN';
  (byRole[key] ?? (byRole['UNKNOWN'] ??= [])).push(p.name);
}

console.log('\nDispatch par rôle :');
for (const [role, names] of Object.entries(byRole)) {
  if (names.length) console.log(`  ${role.padEnd(8)} (${names.length}) : ${names.join(', ')}`);
}

// ─── 4c. Résumé global LIR ───────────────────────────────────────────────

console.log('\n=== LIR Rankings (sur 100) ===');
const sortedByRating = [...players]
  .filter(p => p.rating !== undefined)
  .sort((a, b) => b.rating - a.rating);

sortedByRating.forEach((p, i) => {
  const rank  = String(i + 1).padStart(2);
  const name  = p.name.padEnd(14);
  const role  = (p.role ?? '???').padEnd(3);
  const team  = (p.team ?? '').padEnd(18);
  const score = p.rating.toFixed(1).padStart(5);
  const s     = p.subscores;
  const sub   = `[L:${s.laning >= 0 ? '+' : ''}${s.laning.toFixed(2)} D:${s.damage >= 0 ? '+' : ''}${s.damage.toFixed(2)} P:${s.presence >= 0 ? '+' : ''}${s.presence.toFixed(2)} E:${s.efficiency >= 0 ? '+' : ''}${s.efficiency.toFixed(2)}]`;
  console.log(`#${rank}  ${name} (${role}, ${team})  ${score}  ${sub}`);
});

// ─── 5. Export JSON (format frontend) ────────────────────────────────────

const exportData = {
  metadata: {
    exportedAt: new Date().toISOString(),
    tournaments: [{
      name: 'LCK Cup 2026',
      league: 'LCK',
      year: 2026,
      split: 'Cup',
      scrapedAt: new Date().toISOString(),
    }],
  },
  players: players.map(p => ({
    id: p.golggId,
    name: p.name,
    country: p.country,
    team: p.team,
    role: p.role ?? 'UNK',
    rating: p.rating,
    confidence: p.confidence,
    subscores: p.subscores,
    tournaments: {
      'LCK Cup 2026': {
        games: p.games, winRate: p.winRate, kda: p.kda,
        avgKills: p.avgKills, avgDeaths: p.avgDeaths, avgAssists: p.avgAssists,
        csm: p.csm, gpm: p.gpm, kp: p.kp,
        dmgPct: p.dmgPct, goldPct: p.goldPct, vsPct: p.vsPct,
        dpm: p.dpm, vspm: p.vspm,
        avgWpm: p.avgWpm, avgWcpm: p.avgWcpm, avgVwpm: p.avgVwpm,
        gd15: p.gd15, csd15: p.csd15, xpd15: p.xpd15,
        fbPct: p.fbPct, fbVictim: p.fbVictim,
        pentaKills: p.pentaKills, soloKills: p.soloKills,
      },
    },
    aggregated: {
      totalGames: p.games,
      avgWinRate: p.winRate,
      avgKda: p.kda,
    },
  })),
};

const outPath = path.join(ROOT, 'data/exports/lck-cup-2026.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2));
console.log(`\n✓ Export : ${outPath}`);
console.log(`  ${exportData.players.length} joueurs · ${Object.values(byRole).flat().length - (byRole.UNKNOWN?.length ?? 0)} avec rôle`);
