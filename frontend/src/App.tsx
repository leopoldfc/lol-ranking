import { useEffect, useState } from 'react';
import type { ExportData, Player } from './types';
import { enrichPlayers } from './utils';
import RankingTable from './components/RankingTable';
import RosterPage from './components/RosterPage';
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

/* ── Styles boutons nav ──────────────────────── */
const navBtn = (active: boolean): React.CSSProperties => ({
  padding: '5px 14px',
  borderRadius: 'var(--r-sm)',
  border: `1px solid ${active ? 'var(--accent-border)' : 'var(--line)'}`,
  background: active ? 'var(--accent-dim)' : 'transparent',
  color: active ? 'var(--accent)' : 'var(--text-3)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  transition: 'all var(--t-fast)',
});

const leagueBtn = (active: boolean, available: boolean): React.CSSProperties => ({
  padding: '5px 13px',
  borderRadius: 'var(--r-sm)',
  border: `1px solid ${active ? 'var(--accent-border)' : 'var(--line)'}`,
  background: active ? 'var(--accent-dim)' : 'transparent',
  color: active ? 'var(--accent)' : available ? 'var(--text-3)' : 'var(--text-4)',
  fontFamily: 'var(--font-display)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  cursor: available ? 'pointer' : 'default',
  opacity: available ? 1 : 0.4,
  transition: 'all var(--t-fast)',
});

const splitBtn = (active: boolean): React.CSSProperties => ({
  padding: '3px 11px',
  borderRadius: 'var(--r-xs)',
  border: `1px solid ${active ? 'rgba(212,245,60,0.25)' : 'var(--line)'}`,
  background: active ? 'var(--accent-faint)' : 'transparent',
  color: active ? 'var(--accent)' : 'var(--text-3)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  transition: 'all var(--t-fast)',
});

export default function App() {
  const [leagueId, setLeagueId] = useState(LEAGUES[0].id);
  const [page, setPage]         = useState<Page>('rankings');
  const [splitId, setSplitId]   = useState<string | null>(null);

  const league = LEAGUES.find(l => l.id === leagueId) ?? LEAGUES[0];
  const { data, error } = useExportData(league);

  const handleSetLeague = (id: string) => { setLeagueId(id); setSplitId(null); };

  const mainTournament   = data?.metadata.tournaments[0];
  const activeSplit      = league.splits?.find(s => s.id === splitId) ?? league.splits?.[0] ?? null;
  const activeTournament = activeSplit?.tournament ?? mainTournament?.name;

  const rawPlayers: Player[] = data?.players ?? [];
  const players = enrichPlayers(rawPlayers, activeTournament);

  return (
    <div>
      <header className="header">
        <div className="header__content container">

          {/* Ligne 1 : titre + page */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <h1 className="header__title">{league.title}</h1>
              <span className="header__subtitle">
                {page === 'rankings' ? 'Rankings' : 'Rosters'}
              </span>
            </div>

            {/* Pages */}
            <div style={{ display: 'flex', gap: 3 }}>
              {(['rankings', 'rosters'] as Page[]).map(p => (
                <button key={p} onClick={() => setPage(p)} style={navBtn(page === p)}>
                  {p === 'rankings' ? 'Rankings' : 'Rosters'}
                </button>
              ))}
            </div>
          </div>

          {/* Ligne 2 : leagues + splits */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

            {/* Leagues */}
            <div style={{ display: 'flex', gap: 3 }}>
              {LEAGUES.map(l => (
                <button key={l.id} onClick={() => l.available && handleSetLeague(l.id)}
                  style={leagueBtn(leagueId === l.id, l.available)}>
                  {l.label}
                </button>
              ))}
            </div>

            {/* Splits */}
            {league.splits && league.splits.length > 0 && (
              <>
                <span style={{ width: 1, height: 14, background: 'var(--line)', display: 'block' }} />
                <div style={{ display: 'flex', gap: 3 }}>
                  {league.splits.map(s => {
                    const active = (splitId ?? league.splits![0].id) === s.id;
                    return (
                      <button key={s.id} onClick={() => setSplitId(s.id)} style={splitBtn(active)}>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {error && (
              <span style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'var(--font-mono)', marginLeft: 8 }}>
                data unavailable
              </span>
            )}
          </div>

        </div>
      </header>

      <main className="page container">
        {!league.available ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
              color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10,
            }}>
              {league.label}
            </div>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
              Coming soon
            </div>
          </div>
        ) : (
          <>
            {page === 'rankings' && (
              <RankingTable
                players={players}
                tournament={activeTournament}
                tournamentName={activeSplit?.label ?? mainTournament?.name}
              />
            )}
            {page === 'rosters' && (
              <RosterPage players={players} tournament={activeTournament} />
            )}
          </>
        )}

        <footer className="footer">
          <p>Data · <strong>gol.gg</strong> · LIR percentile rating by role</p>
        </footer>
      </main>
    </div>
  );
}
