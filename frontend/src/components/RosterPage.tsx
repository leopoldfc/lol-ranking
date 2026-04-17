import { useState } from 'react';
import type { Player, Role } from '../types';
import { ROLE_COLOR, getPlayerStats, fmt } from '../utils';
import PlayerModal from './PlayerModal';

const ROLE_ORDER: Role[]               = ['TOP', 'JGL', 'MID', 'BOT', 'SUP'];
const ROLE_LABEL: Record<Role, string> = { TOP: 'Top', JGL: 'Jgl', MID: 'Mid', BOT: 'Bot', SUP: 'Sup' };

interface Props { players: Player[]; tournament?: string; teamLogos?: Record<string, string>; }

export default function RosterPage({ players, tournament, teamLogos = {} }: Props) {
  const [selected, setSelected] = useState<Player | null>(null);

  // Collect all teams a player played for in the active tournament context
  const getTeams = (p: Player): string[] => {
    const tournamentTeam = tournament && (p.tournaments[tournament] as any)?.team;
    if (tournamentTeam) return [tournamentTeam];
    // No direct team on combined: collect unique teams across all sub-tournament entries
    const teams = [...new Set(
      Object.values(p.tournaments)
        .map((t: any) => t.team)
        .filter(Boolean)
    )] as string[];
    return teams.length > 0 ? teams : (p.team ? [p.team] : []);
  };

  const teamMap = new Map<string, Player[]>();
  for (const p of players) {
    if (tournament && !getPlayerStats(p, tournament)) continue;
    for (const team of getTeams(p)) {
      if (!teamMap.has(team)) teamMap.set(team, []);
      if (!teamMap.get(team)!.includes(p)) teamMap.get(team)!.push(p);
    }
  }

  const teams = Array.from(teamMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 10 }}>
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
            <div key={teamName} className="team-card">
              <div className="team-card__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
                  {teamLogos[teamName] && (
                    <img
                      src={teamLogos[teamName]}
                      alt={teamName}
                      style={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }}
                    />
                  )}
                  <span className="team-card__name">{teamName}</span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 6 }}>
                  <div className="team-card__wr" style={{ color: wrColor }}>{fmt(teamWr)}%</div>
                  <div className="team-card__wr-label">Win Rate</div>
                </div>
              </div>

              <div>
                {sorted.map(p => {
                  const stats     = getPlayerStats(p, tournament);
                  const roleColor = ROLE_COLOR[p.role as Role] ?? 'var(--text-3)';
                  const isStarter = ROLE_ORDER.includes(p.role as Role);

                  return (
                    <div
                      key={p.id}
                      className="team-player-row"
                      onClick={() => setSelected(p)}
                      style={{ opacity: isStarter ? 1 : 0.4 }}
                    >
                      <span
                        className="team-player-row__role"
                        style={{ color: isStarter ? roleColor : 'var(--text-4)' }}
                      >
                        {p.role ? ROLE_LABEL[p.role as Role] ?? p.role : '—'}
                      </span>

                      <span
                        className="team-player-row__name"
                        style={{ fontWeight: isStarter ? 600 : 400, color: isStarter ? 'var(--text-1)' : 'var(--text-3)' }}
                      >
                        {p.name}
                      </span>

                      {stats && isStarter ? (
                        <div className="team-player-row__stats">
                          {[
                            { l: 'KDA', v: fmt(stats.kda) },
                            { l: 'DPM', v: fmt(stats.dpm, 0) },
                          ].map(s => (
                            <div key={s.l} className="quick-stat">
                              <div className="quick-stat__val">{s.v}</div>
                              <div className="quick-stat__label">{s.l}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-4)' }}>
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
        <PlayerModal player={selected} onClose={() => setSelected(null)} tournament={tournament} teamLogos={teamLogos} />
      )}
    </>
  );
}
