# lol-rating

Système de ranking de joueurs professionnels League of Legends, inspiré de HLTV pour CS:GO.

Démarre avec la **LCK Cup 2026** (52 joueurs, 10 équipes). Conçu pour supporter toutes les ligues majeures.

## Stack

- **Scraper** — Node.js + TypeScript, source : [gol.gg](https://gol.gg)
- **Base de données** — SQLite via better-sqlite3
- **Frontend** — React + Vite 5
- **Rating** — LIR (LoL Impact Rating) : note sur 100 basée sur 4 piliers pondérés par rôle

## Lancer l'application

```bash
npm run dev
```

Scrape les données fraîches depuis gol.gg puis lance le frontend sur http://localhost:5173.

## Commandes disponibles

```bash
npm run dev       # scrape + frontend (développement)
npm run scrape    # scraper uniquement
```

Avec Docker (nécessite Docker Desktop) :

```bash
make up           # démarre tout sur http://localhost:3001
make scrape       # relance le scraper
make logs         # voir les logs
make down         # arrêter
```

## Système de rating (LIR)

Chaque joueur reçoit une note calculée par z-score par rapport aux joueurs du même rôle, combinant 4 piliers :

| Pilier | Stats utilisées |
|---|---|
| Laning | GD@15, CSD@15, XPD@15 |
| Damage | DPM, DMG% |
| Presence | KP%, Win Rate, Assists |
| Efficiency | KDA, GPM, Gold% |

Les poids varient selon le rôle (ex : Laning pèse 35% pour un Top, 15% pour un Support).

Cible : top joueurs 80–95 · bons 65–80 · moyens 45–55 · faibles 25–45.

## Ajouter un tournoi

1. Ajouter le tournoi dans [src/config/tournaments.ts](src/config/tournaments.ts)
2. Ajouter le roster dans [data/roster.json](data/roster.json)
3. Créer un script dans `scripts/` (copier `scrape-lck-cup-2026.ts`)
4. Lancer `npm run scrape`
