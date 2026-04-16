/**
 * Scrape la liste des tournois actifs depuis gol.gg
 * Affiche les tournois trouvés pour aider à mettre à jour leagues.ts
 *
 * Usage : tsx scrape-leagues.ts
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const BASE    = 'https://gol.gg';
const HEADERS = { 'User-Agent': 'lol-esports-scraper/1.0 (stats research bot)', 'Accept': 'text/html' };

interface Tournament {
  name: string;
  url: string;
  slug: string;
}

async function fetchTournaments(season = 'S16'): Promise<Tournament[]> {
  const body = new URLSearchParams({ season, league: '' });
  const res  = await fetch(`${BASE}/tournament/ajax.trlist.php`, {
    method:  'POST',
    headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data: any[] = await res.json();

  if (process.argv.includes('--debug')) {
    console.log('Sample entry:', JSON.stringify(data[0], null, 2));
    process.exit(0);
  }

  return data.map(t => {
    const name = (t.trname ?? '').trim();
    return {
      name,
      url:  `${BASE}/tournament/tournament-stats/${encodeURIComponent(name)}/page-summary/`,
      slug: name,
    };
  }).filter(t => t.name);
}

async function main() {
  console.log('Fetching tournaments from gol.gg...\n');

  const tournaments = await fetchTournaments();

  if (tournaments.length === 0) {
    console.log('No tournaments found. The page structure may have changed.');
    return;
  }

  console.log(`Found ${tournaments.length} tournament(s):\n`);

  for (const t of tournaments) {
    console.log(`  Name : ${t.name}`);
    console.log(`  Slug : ${t.slug}`);
    console.log(`  URL  : ${t.url}`);
    console.log();
  }

  console.log('--- Suggestion leagues.ts entry ---\n');

  for (const t of tournaments) {
    const id    = t.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const label = t.name;
    const file  = `${id}/export.json`;
    console.log(`  {`);
    console.log(`    id:        '${id}',`);
    console.log(`    label:     '${label}',`);
    console.log(`    title:     '${label}',`);
    console.log(`    file:      '${file}',`);
    console.log(`    available: false,`);
    console.log(`  },`);
    console.log();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
