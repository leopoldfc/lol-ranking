export interface LeagueConfig {
  id: string;
  label: string;       // affiché dans le sélecteur
  title: string;       // titre header (ex: "LCK 2026")
  file: string;        // chemin du JSON sous /data/exports/
  available: boolean;  // false = "coming soon"
}

export const LEAGUES: LeagueConfig[] = [
  {
    id:        'lck-cup-2026',
    label:     'LCK Cup 2026',
    title:     'LCK 2026',
    file:      'lck-cup-2026/export.json',
    available: true,
  },
  {
    id:        'lec-versus-2026',
    label:     'LEC Versus 2026',
    title:     'LEC 2026',
    file:      'lec-versus-2026/export.json',
    available: true,
  },
];
