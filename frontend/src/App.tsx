import { useEffect, useState } from 'react';
import type { ExportData, Player } from './types';
import { enrichPlayers } from './utils';
import RankingTable from './components/RankingTable';
import RosterPage from './components/RosterPage';
import FALLBACK_PLAYERS from './fallback-data';
import { LEAGUES, type LeagueConfig } from './leagues';

type Page = 'rankings' | 'rosters';

function useExportData(league: LeagueConfig) {
  const [data, setData]   = useState<ExportData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!league.available) { setData(null); setError(false); return; }
    setData(null); setError(false);
    fetch(`/leagues/${league.file}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: ExportData) => setData(d))
      .catch(() => setError(true));
  }, [league.id]);

  return { data, error };
}

export default function App() {
  const [leagueId, setLeagueId] = useState(LEAGUES[0].id);
  const [page, setPage]         = useState<Page>('rankings');

  const league     = LEAGUES.find(l => l.id === leagueId) ?? LEAGUES[0];
  const { data, error } = useExportData(league);

  const rawPlayers: Player[] = data?.players ?? (league.available ? FALLBACK_PLAYERS : []);
  const tournament = data?.metadata.tournaments[0];
  const players    = enrichPlayers(rawPlayers, tournament?.name);

  return (
    <div>
      <header className="header">
        <div className="header__content">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
            <h1 className="header__title">{league.title}</h1>
            <span className="header__subtitle">
              {page === 'rankings' ? 'Player Rankings' : 'Team Rosters'}
            </span>
          </div>

          {/* Barre de navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>

            {/* Pages */}
            <div style={{ display: 'flex', gap: 4 }}>
              {([
                { key: 'rankings', label: 'Rankings' },
                { key: 'rosters',  label: 'Rosters'  },
              ] as { key: Page; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPage(key)}
                  style={{
                    padding: '5px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${page === key ? 'var(--gold-border)' : 'var(--border-light)'}`,
                    background: page === key ? 'var(--gold-ghost)' : 'transparent',
                    color: page === key ? 'var(--gold)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sélecteur de league */}
            <div style={{ display: 'flex', gap: 4 }}>
              {LEAGUES.map(l => (
                <button
                  key={l.id}
                  onClick={() => l.available && setLeagueId(l.id)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${leagueId === l.id ? 'var(--gold-border)' : 'var(--border-light)'}`,
                    background: leagueId === l.id ? 'var(--gold-ghost)' : 'transparent',
                    color: leagueId === l.id ? 'var(--gold)' : l.available ? 'var(--text-muted)' : 'var(--text-dim)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: l.available ? 'pointer' : 'default',
                    opacity: l.available ? 1 : 0.45,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="header__meta" style={{ marginTop: 8 }}>
              <span style={{ color: 'var(--red)' }}>JSON non trouvé</span>
            </p>
          )}
        </div>
      </header>

      <main className="page container">
        {!league.available ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-dim)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text-muted)', letterSpacing: 2, marginBottom: 12 }}>
              {league.label}
            </div>
            <div style={{ fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Coming soon
            </div>
          </div>
        ) : (
          <>
            {page === 'rankings' && (
              <RankingTable
                players={players}
                tournament={tournament?.name}
                tournamentName={tournament?.name}
              />
            )}
            {page === 'rosters' && (
              <RosterPage
                players={players}
                tournament={tournament?.name}
              />
            )}
          </>
        )}

        <footer className="footer">
          <p>
            Données : <strong>gol.gg</strong> ·
            Scraper : <strong>lol-esports-scraper</strong> ·
            Rating composite pondéré par rôle
          </p>
        </footer>
      </main>
    </div>
  );
}
