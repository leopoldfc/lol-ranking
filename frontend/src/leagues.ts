export interface SplitConfig {
  id: string;
  label: string;
  tournament: string;   // clé dans player.tournaments
  children?: SplitConfig[]; // sous-sélecteur dropdown
}

export interface LeagueConfig {
  id: string;
  label: string;       // affiché dans le sélecteur
  title: string;       // titre header (ex: "LCK 2026")
  file: string;        // chemin du JSON sous /leagues/
  available: boolean;  // false = "coming soon"
  splits?: SplitConfig[];
}

export interface YearConfig {
  year: number;
  leagues: LeagueConfig[];
}

export const YEARS: YearConfig[] = [
  {
    year: 2025,
    leagues: [
      {
        id:        'lck-2025',
        label:     'LCK',
        title:     'LCK 2025',
        file:      'lck-2025/export.json',
        available: true,
        splits: [
          { id: 'combined',  label: 'Combined',         tournament: 'LCK 2025'                  },
          { id: 'cup',       label: 'Cup',              tournament: 'LCK Cup 2025'              },
          { id: 'rounds12',  label: 'Rounds 1-2',       tournament: 'LCK 2025 Rounds 1-2'       },
          { id: 'roadtomsi', label: 'Road to MSI',      tournament: 'LCK 2025 Road to MSI'      },
          { id: 'rounds35',  label: 'Rounds 3-5',       tournament: 'LCK 2025 Rounds 3-5'       },
          { id: 'playin',    label: 'Play-In',          tournament: 'LCK 2025 Season Play-In'   },
          { id: 'playoffs',  label: 'Playoffs',         tournament: 'LCK 2025 Season Playoffs'  },
        ],
      },
      {
        id:        'lpl-2025',
        label:     'LPL',
        title:     'LPL 2025',
        file:      'lpl-2025/export.json',
        available: true,
        splits: [
          { id: 'combined', label: 'Combined', tournament: 'LPL 2025' },
          { id: 'split1comb', label: 'Split 1', tournament: 'LPL 2025 Split 1 Combined', children: [
            { id: 'split1comb', label: 'Combined', tournament: 'LPL 2025 Split 1 Combined' },
            { id: 'split1',     label: 'Season',   tournament: 'LPL 2025 Split 1'          },
            { id: 'split1po',   label: 'Playoffs', tournament: 'LPL 2025 Split 1 Playoffs' },
          ]},
          { id: 'split2comb', label: 'Split 2', tournament: 'LPL 2025 Split 2 Combined', children: [
            { id: 'split2comb',  label: 'Combined',    tournament: 'LPL 2025 Split 2 Combined'    },
            { id: 'split2',      label: 'Season',      tournament: 'LPL 2025 Split 2'             },
            { id: 'split2po',    label: 'Playoffs',    tournament: 'LPL 2025 Split 2 Playoffs'    },
            { id: 'split2place', label: 'Placements',  tournament: 'LPL 2025 Split 2 Placements'  },
          ]},
          { id: 'split3comb', label: 'Split 3', tournament: 'LPL 2025 Split 3 Combined', children: [
            { id: 'split3comb',   label: 'Combined',        tournament: 'LPL 2025 Split 3 Combined' },
            { id: 'split3',       label: 'Season',          tournament: 'LPL 2025 Split 3'          },
            { id: 'regionals',    label: 'Regional Finals', tournament: 'LPL 2025 Regional Finals'  },
            { id: 'grandfinals',  label: 'Grand Finals',    tournament: 'LPL 2025 Grand Finals'     },
          ]},
        ],
      },
      {
        id:        'lec-2025',
        label:     'LEC',
        title:     'LEC 2025',
        file:      'lec-2025/export.json',
        available: true,
        splits: [
          { id: 'combined', label: 'Combined', tournament: 'LEC 2025' },
          { id: 'winter', label: 'Winter', tournament: 'LEC 2025 Winter', children: [
            { id: 'winter',   label: 'Combined', tournament: 'LEC 2025 Winter'          },
            { id: 'winterS',  label: 'Season',   tournament: 'LEC Winter 2025'          },
            { id: 'winterPO', label: 'Playoffs', tournament: 'LEC 2025 Winter Playoffs' },
          ]},
          { id: 'spring', label: 'Spring', tournament: 'LEC 2025 Spring', children: [
            { id: 'spring',   label: 'Combined', tournament: 'LEC 2025 Spring'          },
            { id: 'springS',  label: 'Season',   tournament: 'LEC 2025 Spring Season'   },
            { id: 'springPO', label: 'Playoffs', tournament: 'LEC 2025 Spring Playoffs' },
          ]},
          { id: 'summer', label: 'Summer', tournament: 'LEC 2025 Summer', children: [
            { id: 'summer',   label: 'Combined', tournament: 'LEC 2025 Summer'          },
            { id: 'summerS',  label: 'Season',   tournament: 'LEC 2025 Summer Season'   },
            { id: 'summerPO', label: 'Playoffs', tournament: 'LEC 2025 Summer Playoffs' },
          ]},
        ],
      },
      {
        id:        'first-stand-2025',
        label:     'First Stand',
        title:     'First Stand 2025',
        file:      'first-stand-2025/export.json',
        available: true,
      },
      {
        id:        'msi-2025',
        label:     'MSI',
        title:     'MSI 2025',
        file:      'msi-2025/export.json',
        available: true,
      },
      {
        id:        'worlds-2025',
        label:     'Worlds',
        title:     'Worlds 2025',
        file:      'worlds-2025/export.json',
        available: true,
        splits: [
          { id: 'combined', label: 'Combined',   tournament: 'Worlds 2025'            },
          { id: 'playin',   label: 'Play-In',    tournament: 'Worlds 2025 Play-In'    },
          { id: 'main',     label: 'Main Event', tournament: 'Worlds 2025 Main Event' },
        ],
      },
    ],
  },
  {
    year: 2026,
    leagues: [
      {
        id:        'lck-2026',
        label:     'LCK',
        title:     'LCK 2026',
        file:      'lck-2026/export.json',
        available: true,
        splits: [
          { id: 'combined', label: 'Combined',   tournament: 'LCK 2026'              },
          { id: 'cup',      label: 'Cup',        tournament: 'LCK Cup 2026'          },
          { id: 'rounds',   label: 'Rounds 1-2', tournament: 'LCK 2026 Rounds 1-2'  },
        ],
      },
      {
        id:        'lpl-2026',
        label:     'LPL',
        title:     'LPL 2026',
        file:      'lpl-2026/export.json',
        available: true,
        splits: [
          { id: 'combined', label: 'Combined', tournament: 'LPL 2026' },
          { id: 'split1comb', label: 'Split 1', tournament: 'LPL 2026 Split 1 Combined', children: [
            { id: 'split1comb', label: 'Combined', tournament: 'LPL 2026 Split 1 Combined' },
            { id: 'split1',     label: 'Season',   tournament: 'LPL 2026 Split 1'          },
            { id: 'split1po',   label: 'Playoffs', tournament: 'LPL 2026 Split 1 Playoffs' },
          ]},
          { id: 'split2', label: 'Split 2', tournament: 'LPL 2026 Split 2' },
        ],
      },
      {
        id:        'lec-2026',
        label:     'LEC',
        title:     'LEC 2026',
        file:      'lec-2026/export.json',
        available: true,
        splits: [
          { id: 'combined', label: 'Combined',      tournament: 'LEC Versus 2026' },
          { id: 'versus',   label: 'Versus',        tournament: 'LEC 2026 Versus', children: [
            { id: 'versus',       label: 'Combined',  tournament: 'LEC 2026 Versus'          },
            { id: 'versusSeason', label: 'Season',    tournament: 'LEC 2026 Versus Season'   },
            { id: 'playoffs',     label: 'Playoffs',  tournament: 'LEC 2026 Versus Playoffs' },
          ]},
          { id: 'spring', label: 'Spring Season', tournament: 'LEC 2026 Spring Season' },
        ],
      },
      {
        id:        'lcs-2026',
        label:     'LCS',
        title:     'LCS 2026',
        file:      'lcs-2026/export.json',
        available: true,
        splits: [
          { id: 'combined', label: 'Combined', tournament: 'LCS 2026'         },
          { id: 'lockin',   label: 'Lock-In',  tournament: 'LCS 2026 Lock-In' },
          { id: 'spring',   label: 'Spring',   tournament: 'LCS 2026 Spring'  },
        ],
      },
      {
        id:        'first-stand-2026',
        label:     'First Stand',
        title:     'First Stand 2026',
        file:      'first-stand-2026/export.json',
        available: true,
      },
    ],
  },
];

// Rétrocompatibilité : LEAGUES pointe sur la première année
export const LEAGUES = YEARS[0].leagues;
