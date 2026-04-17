/**
 * Fetch team logos from the Lolesports API and save them locally.
 * Updates all export.json files in frontend/public/leagues/.
 *
 * Usage: npx tsx scripts/fetch-logos.ts
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const LOGOS_DIR = path.join(ROOT, 'frontend/public/logos');
const API_KEY   = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z';

fs.mkdirSync(LOGOS_DIR, { recursive: true });

// ─── 1. Fetch all teams from Lolesports ───────────────────────────────────────

const res   = await fetch('https://esports-api.lolesports.com/persisted/gw/getTeams?hl=en-US', {
  headers: { 'x-api-key': API_KEY },
});
const json  = await res.json() as any;
const teams: { name: string; code: string; image: string }[] = json?.data?.teams ?? [];
console.log(`✓ Lolesports  ${teams.length} équipes récupérées`);

// ─── 2. Build lookup: normalized name → image URL ─────────────────────────────

function normalize(s: string) {
  return s.toLowerCase()
    .replace(/\bkia\b|\balienware\b|\bhonda\b/g, '')  // drop sponsor suffixes
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

const byNorm = new Map<string, string>();
for (const t of teams) {
  if (!t.image || !t.name) continue;
  byNorm.set(normalize(t.name), t.image);
  // also index by code (uppercased)
  if (t.code) byNorm.set(t.code.toLowerCase(), t.image);
}

// Manual aliases for teams whose gol.gg name doesn't match the Lolesports API name
const ALIASES: Record<string, string> = {
  'jdgaming':          'jdg',   // "JD Gaming" → "Beijing JDG Esports" (code: JDG)
  'okbrion':           'bro',   // "OK BRION" → "HANJIN BRION" (code: BRO)
  'dnfreecs':          'kdf',   // "DN Freecs" → "Kwangdong Freecs Academy" (code: KDF)
  // Note: "Rogue" in LEC 2025 winter/spring is the old Rogue org (RGE), matched naturally via partial match
};
for (const [alias, code] of Object.entries(ALIASES)) {
  const url = byNorm.get(code);
  if (url) byNorm.set(alias, url);
}

function findLogoUrl(teamName: string): string | null {
  const key = normalize(teamName);
  if (byNorm.has(key)) return byNorm.get(key)!;

  // partial match: find entry whose key contains our key or vice-versa
  // require minimum length to avoid false positives
  for (const [k, v] of byNorm) {
    if (k.length >= 4 && key.length >= 4 && (k.includes(key) || key.includes(k))) return v;
  }
  return null;
}

// ─── 3. Download helper ───────────────────────────────────────────────────────

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { 'User-Agent': 'lol-logos-fetcher/1.0' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function safeName(team: string): string {
  return team.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

async function downloadLogo(teamName: string, url: string): Promise<string | null> {
  const ext   = (url.split('.').pop() ?? 'png').split('?')[0];
  const fname = `${safeName(teamName)}.${ext}`;
  const dest  = path.join(LOGOS_DIR, fname);

  try {
    const buf = await downloadBuffer(url);
    if (buf.length < 2000) return null;  // transparent placeholder
    fs.writeFileSync(dest, buf);
    return `/logos/${fname}`;
  } catch {
    return null;
  }
}

// ─── 4. Process all league export.json files ─────────────────────────────────

const leagueDir = path.join(ROOT, 'frontend/public/leagues');

function findExportFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) results.push(...findExportFiles(full));
    else if (entry === 'export.json') results.push(full);
  }
  return results;
}

const exportFiles = findExportFiles(leagueDir).sort();

let totalUpdated = 0;
let totalMissed  = 0;

for (const exportFile of exportFiles) {
  if (!fs.existsSync(exportFile)) continue;

  const data = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
  if (!data.teamLogos) data.teamLogos = {};

  // Collect all team names from players
  const teamNames: string[] = [...new Set<string>(
    (data.players ?? []).map((p: any) => p.team).filter(Boolean)
  )];

  let updated = 0;
  let missed  = 0;

  for (const teamName of teamNames) {
    // Always try to get a Lolesports logo (higher quality than gol.gg)

    const remoteUrl = findLogoUrl(teamName);
    if (!remoteUrl) {
      if (!data.teamLogos[teamName]) { missed++; process.stdout.write(`  ✗ ${teamName}\n`); }
      continue;
    }

    const localPath = await downloadLogo(teamName, remoteUrl);
    if (localPath) {
      data.teamLogos[teamName] = localPath;
      updated++;
    } else {
      missed++;
    }
  }

  if (updated > 0) {
    fs.writeFileSync(exportFile, JSON.stringify(data, null, 2));
  }

  const total = teamNames.length;
  const ok    = total - missed;
  const label = path.relative(leagueDir, path.dirname(exportFile));
  console.log(`  ${label.padEnd(22)} ${ok}/${total} logos`);
  totalUpdated += updated;
  totalMissed  += missed;
}

console.log(`\n✓ Terminé     ${totalUpdated} logos mis à jour, ${totalMissed} introuvables`);
