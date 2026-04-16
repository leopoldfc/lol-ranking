/**
 * Détecte les nouveaux tournois gol.gg non encore configurés
 * Compare les tournois filtrés avec les scrape.ts existants
 * Affiche URLs + suggestions LeagueConfig pour les nouveaux
 *
 * Usage : npx tsx leagues/detect.ts
 *         npx tsx leagues/detect.ts --season S15
 *         npx tsx leagues/detect.ts --all     (sans filtre de league)
 *         npx tsx leagues/detect.ts --debug   (inspecte le JSON brut)
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE    = 'https://gol.gg';
const HEADERS = { 'User-Agent': 'lol-esports-scraper/1.0 (stats research bot)', 'Accept': 'text/html' };

const LEAGUE_FILTERS = ['LCK ', 'LPL ', 'LEC ', 'LCS ', 'LTA ', 'FIRST STAND', '2026 FIRST', 'MSI', 'WORLDS', 'MID-SEASON', '2025 MID-SEASON', '2026 MID-SEASON'];
const LEAGUE_EXCLUDE = ['LCK CL'];

function isTargetLeague(name: string): boolean {
  const upper = name.toUpperCase();
  if (LEAGUE_EXCLUDE.some(e => upper.startsWith(e.toUpperCase()))) return false;
  return LEAGUE_FILTERS.some(f => upper.startsWith(f) || upper === f.trim());
}

// ─── Récupère les tournois gol.gg ─────────────────────────────────────────────

const seasonArg = process.argv.find(a => a.startsWith('--season='))?.split('=')[1]
  ?? (process.argv.includes('--season') ? process.argv[process.argv.indexOf('--season') + 1] : null)
  ?? 'S16';

const showAll  = process.argv.includes('--all');
const debug    = process.argv.includes('--debug');

console.log(`Fetching tournaments from gol.gg (season ${seasonArg})...\n`);

const body = new URLSearchParams({ season: seasonArg, league: '' });
const res  = await fetch(`${BASE}/tournament/ajax.trlist.php`, {
  method: 'POST',
  headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: body.toString(),
});
if (!res.ok) throw new Error(`HTTP ${res.status}`);

const raw = await res.json() as any[];

if (debug) {
  console.log('Sample entry:', JSON.stringify(raw[0], null, 2));
  process.exit(0);
}

const allTournaments = raw.map(t => (t.trname ?? '').trim()).filter(Boolean);
const tournaments    = showAll ? allTournaments : allTournaments.filter(isTargetLeague);

// ─── Lit les scrape.ts existants pour extraire les tournois configurés ────────

const yearDirs = fs.readdirSync(__dirname)
  .filter(d => /^\d{4}$/.test(d) && fs.statSync(path.join(__dirname, d)).isDirectory());

const configuredTournaments = new Set<string>();
const scrapersByTournament  = new Map<string, string>(); // tournament → scraper path

for (const year of yearDirs) {
  const yearDir = path.join(__dirname, year);
  const leagueDirs = fs.readdirSync(yearDir)
    .filter(d => fs.statSync(path.join(yearDir, d)).isDirectory());

  for (const league of leagueDirs) {
    const scrapePath = path.join(yearDir, league, 'scrape.ts');
    if (!fs.existsSync(scrapePath)) continue;

    const content = fs.readFileSync(scrapePath, 'utf8');

    const singleMatch = content.match(/const TOURNAMENT\s*=\s*'([^']+)'/);
    if (singleMatch) {
      configuredTournaments.add(singleMatch[1]);
      scrapersByTournament.set(singleMatch[1], `leagues/${year}/${league}/scrape.ts`);
    }

    const splitsMatches = [...content.matchAll(/name:\s*'([^']+)'/g)];
    for (const m of splitsMatches) {
      configuredTournaments.add(m[1]);
      scrapersByTournament.set(m[1], `leagues/${year}/${league}/scrape.ts`);
    }
  }
}

// ─── Compare ──────────────────────────────────────────────────────────────────

const newTournaments     = tournaments.filter(t => !configuredTournaments.has(t));
const configuredInFilter = tournaments.filter(t => configuredTournaments.has(t));

console.log(`── Configurés (${configuredInFilter.length}) ──────────────────────────`);
for (const t of configuredInFilter) {
  console.log(`  ✓  ${t.padEnd(45)} ← ${scrapersByTournament.get(t)}`);
}

console.log();
if (newTournaments.length === 0) {
  console.log('── Nouveaux : aucun ✓ tout est à jour ──────────────────');
} else {
  console.log(`── Nouveaux non configurés (${newTournaments.length}) ──────────────────`);
  for (const t of newTournaments) {
    const url = `${BASE}/tournament/tournament-stats/${encodeURIComponent(t)}/page-summary/`;
    console.log(`  ⚠  ${t}`);
    console.log(`     ${url}`);
  }

  console.log('\n── Suggestion scraper (SPLITS) ──────────────────────────\n');
  for (const t of newTournaments) {
    const key = t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    console.log(`  // ${t}`);
    console.log(`  { key: '${key}', name: '${t}', season: 'ALL' },`);
    console.log();
  }

  console.log('── Suggestion leagues.ts (LeagueConfig) ─────────────────\n');
  for (const t of newTournaments) {
    const id   = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const file = `${id}/export.json`;
    console.log(`  {`);
    console.log(`    id:        '${id}',`);
    console.log(`    label:     '${t}',`);
    console.log(`    title:     '${t}',`);
    console.log(`    file:      '${file}',`);
    console.log(`    available: false,`);
    console.log(`  },`);
    console.log();
  }
}
