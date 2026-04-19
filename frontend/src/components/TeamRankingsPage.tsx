import { useState } from 'react';
import type { Player, Role } from '../types';
import { getPlayerStats, fmt } from '../utils';

const ROLE_ORDER: Role[] = ['TOP', 'JGL', 'MID', 'BOT', 'SUP'];

type SortKey = 'teamLIR' | 'winRate' | 'games' | 'top' | 'jgl' | 'mid' | 'bot' | 'sup';

interface TeamEntry {
  name: string;
  teamLIR: number;
  winRate: number;
  games: number;
  roleRatings: Partial<Record<Role, number>>;
  starters: Partial<Record<Role, Player>>;
}

interface Props {
  players: Player[];
  tournament?: string;
  teamLogos?: Record<string, string>;
  leagueTitle?: string;
}

function ratingClass(r: number) {
  if (r >= 70) return 'rating-cell rating-cell--high';
  if (r >= 55) return 'rating-cell rating-cell--mid';
  return 'rating-cell rating-cell--low';
}

function ratingBarClass(r: number) {
  if (r >= 70) return 'rating-bar rating-bar--high';
  if (r >= 55) return 'rating-bar rating-bar--mid';
  return 'rating-bar rating-bar--low';
}

function winClass(wr: number) {
  if (wr >= 60) return 'val--win-high';
  if (wr >= 45) return 'val--win-mid';
  return 'val--win-low';
}

function rankClass(i: number) {
  if (i < 3)  return 'rank-num rank-num--top3';
  if (i < 10) return 'rank-num rank-num--top10';
  return 'rank-num rank-num--rest';
}


const GRID = '44px 200px 90px 72px 72px 86px 86px 86px 86px 86px';
//            #    TEAM  LIR  G    W%   TOP  JGL  MID  BOT  SUP
const CELL_PAD = '0 8px';

export default function TeamRankingsPage({ players, tournament, teamLogos = {}, leagueTitle = '' }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('teamLIR');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Build team map
  const teamMap = new Map<string, Player[]>();
  for (const p of players) {
    if (tournament && !getPlayerStats(p, tournament)) continue;
    const team = (tournament && (p.tournaments[tournament] as any)?.team) || p.team;
    if (!team) continue;
    if (!teamMap.has(team)) teamMap.set(team, []);
    if (!teamMap.get(team)!.includes(p)) teamMap.get(team)!.push(p);
  }

  const entries: TeamEntry[] = Array.from(teamMap.entries()).map(([name, ps]) => {
    const sorted = [...ps]
      .filter(p => ROLE_ORDER.includes(p.role as Role))
      .sort((a, b) => {
        const ri = ROLE_ORDER.indexOf(a.role as Role) - ROLE_ORDER.indexOf(b.role as Role);
        if (ri !== 0) return ri;
        return ((getPlayerStats(b, tournament)?.rating ?? b.rating ?? 0) -
                (getPlayerStats(a, tournament)?.rating ?? a.rating ?? 0));
      });

    const seenRoles = new Set<Role>();
    const starters: Partial<Record<Role, Player>> = {};
    for (const p of sorted) {
      const role = p.role as Role;
      if (!seenRoles.has(role)) { seenRoles.add(role); starters[role] = p; }
    }

    const roleRatings: Partial<Record<Role, number>> = {};
    for (const role of ROLE_ORDER) {
      const p = starters[role];
      if (p) {
        const st = getPlayerStats(p, tournament);
        roleRatings[role] = st?.rating ?? p.rating ?? 0;
      }
    }

    const ratings = Object.values(roleRatings).filter(r => r !== undefined && r > 0) as number[];
    const teamLIR = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;

    const starterList = ROLE_ORDER.map(r => starters[r]).filter(Boolean) as Player[];
    const winRate = starterList.length
      ? starterList.reduce((s, p) => s + (getPlayerStats(p, tournament)?.winRate ?? 0), 0) / starterList.length
      : 0;
    const games = starters['TOP'] ? (getPlayerStats(starters['TOP']!, tournament)?.games ?? 0) : 0;

    return { name, teamLIR, winRate, games, roleRatings, starters };
  });

  const sorted = [...entries].sort((a, b) => {
    let va = 0, vb = 0;
    if (sortKey === 'teamLIR')  { va = a.teamLIR; vb = b.teamLIR; }
    else if (sortKey === 'winRate') { va = a.winRate; vb = b.winRate; }
    else if (sortKey === 'games')   { va = a.games;   vb = b.games; }
    else {
      const roleMap: Record<SortKey, Role | null> = { top: 'TOP', jgl: 'JGL', mid: 'MID', bot: 'BOT', sup: 'SUP', teamLIR: null, winRate: null, games: null };
      const role = roleMap[sortKey];
      if (role) { va = a.roleRatings[role] ?? 0; vb = b.roleRatings[role] ?? 0; }
    }
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const rowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: GRID, alignItems: 'center' };

  const numCell: React.CSSProperties = {
    padding: CELL_PAD, textAlign: 'right',
    fontFamily: 'var(--font-mono)', fontSize: 16,
  };

  const numHead = (key: SortKey): React.CSSProperties => ({
    padding: CELL_PAD, textAlign: 'right', cursor: 'pointer',
    fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 600,
    letterSpacing: '0.05em', textTransform: 'uppercase' as const,
    color: sortKey === key ? 'var(--accent)' : 'var(--text-3)',
    userSelect: 'none' as const, whiteSpace: 'nowrap' as const,
  });

  const sortIcon = (key: SortKey) => (
    <span style={{ fontSize: 8, marginLeft: 2, opacity: sortKey === key ? 0.9 : 0.2 }}>
      {sortKey === key ? (sortDir === 'desc' ? '▼' : '▲') : '▼'}
    </span>
  );

  const RoleRatingCell = ({ rating }: { rating: number | undefined }) => {
    if (!rating || rating === 0) return <div style={numCell} className="val--muted">—</div>;
    return (
      <div style={{ ...numCell, padding: CELL_PAD }}>
        <div className={ratingClass(rating)} style={{ position: 'relative', display: 'inline-block' }}>
          {rating.toFixed(1)}
          <div className={ratingBarClass(rating)} style={{ width: `${rating}%` }} />
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
          {sorted.length} teams{leagueTitle ? ` · ${leagueTitle}` : ''}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--font-body)' }}>
          Team LIR = avg of best player per role
        </span>
      </div>

      <div className="scroll-fade-wrap">
        <div style={{ overflowX: 'auto' }}>
          <div className="ranking-grid" style={{ minWidth: 800 }}>

            {/* Header */}
            <div className="ranking-grid__head" style={rowStyle}>
              <div style={{ padding: CELL_PAD, textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-body)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>#</div>
              <div style={{ padding: CELL_PAD, textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-body)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Team</div>
              <div style={numHead('teamLIR')} onClick={() => toggleSort('teamLIR')} title="Average LIR of the best-rated starter per role">RATING{sortIcon('teamLIR')}</div>
              <div style={numHead('games')} onClick={() => toggleSort('games')} title="Games played (from top laner)">G{sortIcon('games')}</div>
              <div style={numHead('winRate')} onClick={() => toggleSort('winRate')} title="Average win rate across starters">W%{sortIcon('winRate')}</div>
              <div style={numHead('top')} onClick={() => toggleSort('top')} title="Top laner LIR">TOP{sortIcon('top')}</div>
              <div style={numHead('jgl')} onClick={() => toggleSort('jgl')} title="Jungler LIR">JGL{sortIcon('jgl')}</div>
              <div style={numHead('mid')} onClick={() => toggleSort('mid')} title="Mid laner LIR">MID{sortIcon('mid')}</div>
              <div style={numHead('bot')} onClick={() => toggleSort('bot')} title="Bot laner LIR">BOT{sortIcon('bot')}</div>
              <div style={numHead('sup')} onClick={() => toggleSort('sup')} title="Support LIR">SUP{sortIcon('sup')}</div>
            </div>

            {/* Rows */}
            {sorted.map((team, i) => (
              <div key={team.name} className="ranking-grid__row" style={rowStyle}>
                {/* # */}
                <div style={{ padding: CELL_PAD, textAlign: 'left' }}>
                  <span className={rankClass(i)}>{i + 1}</span>
                </div>

                {/* Team */}
                <div style={{ padding: CELL_PAD, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {teamLogos[team.name] && (
                    <img src={teamLogos[team.name]} alt={team.name} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div className={`player-cell__name ${i < 3 ? 'player-cell__name--top3' : ''}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {team.name}
                    </div>
                  </div>
                </div>

                {/* Team LIR */}
                <div style={{ ...numCell, padding: CELL_PAD }}>
                  <div className={ratingClass(team.teamLIR)} style={{ position: 'relative', display: 'inline-block' }}>
                    {team.teamLIR > 0 ? team.teamLIR.toFixed(1) : '—'}
                    <div className={ratingBarClass(team.teamLIR)} style={{ width: `${team.teamLIR}%` }} />
                  </div>
                </div>

                {/* G */}
                <div style={numCell} className="val--muted">{team.games || '—'}</div>

                {/* W% */}
                <div style={numCell}>
                  <span className={winClass(team.winRate)}>
                    {team.winRate > 0 ? `${fmt(team.winRate)}%` : '—'}
                  </span>
                </div>

                {/* Per-role LIR */}
                {ROLE_ORDER.map(role => (
                  <RoleRatingCell key={role} rating={team.roleRatings[role]} />
                ))}
              </div>
            ))}

          </div>
        </div>
      </div>
    </>
  );
}
