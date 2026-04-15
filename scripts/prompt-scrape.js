#!/usr/bin/env node
/**
 * Demande si on veut lancer les scrapers avant le dev server.
 * Appelé par "predev".
 */

import { createInterface } from 'readline';
import { spawnSync }       from 'child_process';

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question('Lancer les scrapers ? [y/N] ', answer => {
  rl.close();

  if (!answer.match(/^[yYoO]/)) {
    console.log('→ Scrapers ignorés.');
    process.exit(0);
  }

  const scrapers = [
    'leagues/lck-cup-2026/scrape.ts',
    'leagues/lec-versus-2026/scrape.ts',
  ];

  for (const script of scrapers) {
    console.log(`\n▶ ${script}`);
    const result = spawnSync('npx', ['tsx', script], { stdio: 'inherit', shell: true });
    if (result.status !== 0) {
      console.error(`✗ Échec : ${script}`);
      process.exit(result.status ?? 1);
    }
  }
});
