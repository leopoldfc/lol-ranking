import { useEffect, useState } from 'react';
import type { ExportData, Player, Role } from '../types';
import { enrichPlayers, ROLE_COLOR } from '../utils';
import { type YearConfig } from '../leagues';
import RoleTag from './RoleTag';

const ROLES: Role[] = ['TOP', 'JGL', 'MID', 'BOT', 'SUP'];
const ROLE_LABEL: Record<Role, string> = { TOP: 'Top', JGL: 'Jungle', MID: 'Mid', BOT: 'Bot', SUP: 'Support' };

interface LeagueData {
  id: string;
  label: string;
  players: Player[];
  loading: boolean;
  error: boolean;
}

interface Props {
  yearConfig: YearConfig;
  onSelectLeague: (leagueId: string) => void;
}

function useAllLeaguesData(yearConfig: YearConfig) {
  const [leaguesData, setLeaguesData] = useState<LeagueData[]>(
    yearConfig.leagues.filter(l => l.available).map(l => ({
      id: l.id, label: l.label, players: [], loading: true, error: false,
    }))
  );

  useEffect(() => {
    setLeaguesData(
      yearConfig.leagues.filter(l => l.available).map(l => ({
        id: l.id, label: l.label, players: [], loading: true, error: false,
      }))
    );

    yearConfig.leagues.filter(l => l.available).forEach(league => {
      fetch(`/leagues/${league.file}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json(); })
        .then((d: ExportData) => {
          const combinedTournament = d.metadata.tournaments[0]?.name;
          const players = enrichPlayers(d.players, combinedTournament);
          setLeaguesData(prev => prev.map(ld =>
            ld.id === league.id ? { ...ld, players, loading: false } : ld
          ));
        })
        .catch(() => {
          setLeaguesData(prev => prev.map(ld =>
            ld.id === league.id ? { ...ld, loading: false, error: true } : ld
          ));
        });
    });
  }, [yearConfig.year]);

  return leaguesData;
}

function TopRoleCard({ player, rank }: { player: Player; rank: number }) {
  const rating = player.rating ?? 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px',
      borderRadius: 'var(--r-sm)',
      background: 'var(--bg-3)',
      border: '1px solid var(--line)',
      minWidth: 0,
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
        color: rank === 0 ? 'var(--accent)' : 'var(--text-4)',
        width: 14, flexShrink: 0, textAlign: 'center',
      }}>
        {rank + 1}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
          color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{player.name}</div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {player.team}
        </div>
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
        color: rating >= 70 ? 'var(--accent)' : rating >= 55 ? 'var(--text-1)' : 'var(--text-2)',
        flexShrink: 0,
      }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function LeagueCard({ ld, onSelect }: { ld: LeagueData; onSelect: () => void }) {
  const topByRole: Record<Role, Player[]> = { TOP: [], JGL: [], MID: [], BOT: [], SUP: [] };

  for (const role of ROLES) {
    topByRole[role] = [...ld.players]
      .filter(p => p.role === role && p.rating !== undefined)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 3);
  }

  const totalPlayers = ld.players.length;
  const topRated = [...ld.players].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];

  return (
    <div style={{
      background: 'var(--bg-1)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header de la carte */}
      <div style={{
        padding: '14px 18px 12px',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
            color: 'var(--text-1)', letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>{ld.label}</span>
          {!ld.loading && !ld.error && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)' }}>
              {totalPlayers} players
            </span>
          )}
        </div>
        <button
          onClick={onSelect}
          style={{
            padding: '3px 10px',
            borderRadius: 'var(--r-xs)',
            border: '1px solid var(--line)',
            background: 'transparent',
            color: 'var(--text-3)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'all var(--t-fast)',
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.color = 'var(--accent)';
            (e.target as HTMLButtonElement).style.borderColor = 'var(--accent-border)';
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.color = 'var(--text-3)';
            (e.target as HTMLButtonElement).style.borderColor = 'var(--line)';
          }}
        >
          Rankings →
        </button>
      </div>

      {/* Contenu */}
      {ld.loading ? (
        <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          Loading…
        </div>
      ) : ld.error ? (
        <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          Data unavailable
        </div>
      ) : (
        <div style={{ padding: '12px 18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Best player global */}
          {topRated && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              background: 'var(--accent-faint)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-sm)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, color: 'var(--accent)', fontFamily: 'var(--font-mono)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 2 }}>
                  Best Player
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RoleTag role={topRated.role} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>
                    {topRated.name}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{topRated.team}</span>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.03em' }}>
                {(topRated.rating ?? 0).toFixed(1)}
              </span>
            </div>
          )}

          {/* Top 3 par rôle */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {ROLES.map(role => (
              <div key={role}>
                <div style={{
                  fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600,
                  letterSpacing: '0.10em', textTransform: 'uppercase',
                  color: ROLE_COLOR[role],
                  marginBottom: 5,
                }}>
                  {ROLE_LABEL[role]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {topByRole[role].length > 0
                    ? topByRole[role].map((p, i) => <TopRoleCard key={p.id} player={p} rank={i} />)
                    : <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)', padding: '6px 0' }}>—</div>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function YearOverview({ yearConfig, onSelectLeague }: Props) {
  const leaguesData = useAllLeaguesData(yearConfig);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {leaguesData.map(ld => (
        <LeagueCard
          key={ld.id}
          ld={ld}
          onSelect={() => onSelectLeague(ld.id)}
        />
      ))}
    </div>
  );
}
