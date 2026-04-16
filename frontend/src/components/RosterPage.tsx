import { useState } from 'react';
import type { Player, Role } from '../types';
import { ROLE_COLOR, getPlayerStats, fmt } from '../utils';
import PlayerModal from './PlayerModal';

const ROLE_ORDER: Role[]                = ['TOP', 'JGL', 'MID', 'BOT', 'SUP'];
const ROLE_LABEL: Record<Role, string>  = { TOP: 'Top', JGL: 'Jgl', MID: 'Mid', BOT: 'Bot', SUP: 'Sup' };

interface Props { players: Player[]; tournament?: string; }

export default function RosterPage({ players, tournament }: Props) {
  const [selected, setSelected] = useState<Player | null>(null);

  /* Group by team — filter out players with no stats for active tournament */
  const teamMap = new Map<string, Player[]>();
  for (const p of players) {
    if (!p.team) continue;
    if (tournament && !getPlayerStats(p, tournament)) continue;
    if (!teamMap.has(p.team)) teamMap.set(p.team, []);
    teamMap.get(p.team)!.push(p);
  }

  /* Sort teams by avg win rate */
  const teams = Array.from(teamMap.entries()).sort((a, b) => {
    const avg = (ps: Player[]) => {
      const vals = ps.map(p => getPlayerStats(p, tournament)?.winRate ?? 0);
      return vals.reduce((s, v) => s + v, 0) / vals.length;
    };
    return avg(b[1]) - avg(a[1]);
  });

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
        {teams.map(([teamName, teamPlayers]) => {
          const sorted = [...teamPlayers].sort((a, b) => {
            const ia = ROLE_ORDER.indexOf(a.role as Role);
            const ib = ROLE_ORDER.indexOf(b.role as Role);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
          });

          const starters = sorted.filter(p => ROLE_ORDER.includes(p.role as Role)).slice(0, 5);
          const teamWr   = starters.length
            ? starters.reduce((s, p) => s + (getPlayerStats(p, tournament)?.winRate ?? 0), 0) / starters.length
            : 0;

          const wrColor = teamWr >= 60 ? 'var(--green)' : teamWr >= 45 ? 'var(--text-2)' : 'var(--red)';

          return (
            <div key={teamName} style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
            }}>
              {/* Team header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-3)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--text-1)',
                }}>{teamName}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: wrColor, letterSpacing: '-0.02em' }}>
                    {fmt(teamWr)}%
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--text-4)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>Win Rate</div>
                </div>
              </div>

              {/* Players */}
              <div>
                {sorted.map(p => {
                  const stats     = getPlayerStats(p, tournament);
                  const roleColor = ROLE_COLOR[p.role as Role] ?? 'var(--text-3)';
                  const isStarter = ROLE_ORDER.includes(p.role as Role);

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelected(p)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '56px 1fr auto',
                        alignItems: 'center',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--line)',
                        opacity: isStarter ? 1 : 0.45,
                        transition: 'background var(--t-fast)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Role */}
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: isStarter ? roleColor : 'var(--text-4)',
                      }}>
                        {p.role ? ROLE_LABEL[p.role as Role] ?? p.role : '—'}
                      </span>

                      {/* Name */}
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        fontWeight: isStarter ? 600 : 400,
                        color: isStarter ? 'var(--text-1)' : 'var(--text-3)',
                      }}>{p.name}</span>

                      {/* Quick stats */}
                      {stats && isStarter ? (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          {[
                            { l: 'KDA', v: fmt(stats.kda) },
                            { l: 'DPM', v: fmt(stats.dpm, 0) },
                          ].map(s => (
                            <div key={s.l} style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-2)', letterSpacing: '-0.02em' }}>{s.v}</div>
                              <div style={{ fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-4)' }}>
                          {stats ? `${stats.games}G` : ''}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <PlayerModal player={selected} onClose={() => setSelected(null)} tournament={tournament} />
      )}
    </>
  );
}
