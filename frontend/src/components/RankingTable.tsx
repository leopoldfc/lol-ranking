import { useState } from 'react';
import type { Player, Role, TournamentStats } from '../types';
import { fmt, fmtSign, getPlayerStats } from '../utils';
import RoleTag from './RoleTag';
import PlayerModal from './PlayerModal';

type SortKey = 'rating' | keyof TournamentStats | 'name';

const ROLES: Role[] = ['TOP', 'JGL', 'MID', 'BOT', 'SUP'];
const ROLE_LABEL: Record<Role, string> = { TOP: 'Top', JGL: 'Jungle', MID: 'Mid', BOT: 'Bot', SUP: 'Support' };

const TEAM_COLOR: Record<string, string> = {
  'Gen.G': '#b8960a', 'T1': '#c0001f', 'Dplus KIA': '#0a3a8a',
  'BNK FearX': '#d43050', 'Kiwoom DRX': '#005fa3',
  'OKSavingsBank BRO': '#008040', 'DN SOOPers': '#4a3a8a',
  'KT Rolster': '#cc0000', 'HLE': '#d45c00', 'NS RedForce': '#aa0020',
};

function kdaClass(kda: number) {
  if (kda >= 5) return 'val--kda-high';
  if (kda >= 3) return 'val--kda-mid';
  return 'val--kda-low';
}

function winClass(wr: number) {
  if (wr >= 60) return 'val--win-high';
  if (wr >= 45) return 'val--win-mid';
  return 'val--win-low';
}

function diffClass(val: number) {
  if (val > 50) return 'val--positive';
  if (val < -50) return 'val--negative';
  return 'val--muted';
}

function rankClass(i: number) {
  if (i < 3) return 'rank-num rank-num--top3';
  if (i < 10) return 'rank-num rank-num--top10';
  return 'rank-num rank-num--rest';
}

// Rating helpers — scale 0-100, center 50, top range 70+
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

interface Props {
  players: Player[];
  tournament?: string;
  tournamentName?: string;
}

export default function RankingTable({ players, tournament, tournamentName }: Props) {
  const [role, setRole] = useState<Role | 'ALL'>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('rating');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<Player | null>(null);
  const [search, setSearch] = useState('');

  const filtered = players
    .filter(p => role === 'ALL' || p.role === role)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase()))
    .map(p => ({ p, stats: getPlayerStats(p, tournament) }))
    .sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0;
      if (sortKey === 'rating')    { va = a.p.rating ?? 0; vb = b.p.rating ?? 0; }
      else if (sortKey === 'name') { va = a.p.name; vb = b.p.name; }
      else {
        va = (a.stats?.[sortKey as keyof TournamentStats] as number) ?? -999;
        vb = (b.stats?.[sortKey as keyof TournamentStats] as number) ?? -999;
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const th = (key: SortKey, label: string, cls = '') => (
    <th
      className={`th--sortable ${sortKey === key ? 'th--active' : ''} ${cls}`}
      onClick={() => toggleSort(key)}
    >
      {label}
      <span className="sort-icon">{sortKey === key ? (sortDir === 'desc' ? '▼' : '▲') : '▼'}</span>
    </th>
  );

  const CARD_STATS = (p: Player, stats: ReturnType<typeof getPlayerStats>) => [
    { label: 'Rating',   value: p.rating?.toFixed(1) ?? '—', cls: 'stat__value--gold'  },
    { label: 'KDA',      value: fmt(stats?.kda),              cls: 'stat__value--green' },
    { label: 'Win Rate', value: `${fmt(stats?.winRate)}%`,    cls: ''                   },
    { label: 'DPM',      value: fmt(stats?.dpm, 0),           cls: ''                   },
  ];

  const renderCard = (p: Player, rank = 1) => {
    const stats = getPlayerStats(p, tournament);
    return (
      <div key={p.id} className="role-top-card" onClick={() => setSelected(p)} style={{ cursor: 'pointer' }}>
        <div className="role-top-card__watermark">#{rank}</div>
        <div className="role-top-card__rank-badge">{rank}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div className="role-top-card__name">{p.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <RoleTag role={p.role} />
              <span className="text-muted" style={{ fontSize: 11 }}>{p.team}</span>
            </div>
          </div>
          <div className="role-top-card__stats" style={{ marginTop: 0 }}>
            {CARD_STATS(p, stats).map(s => (
              <div key={s.label} className="stat">
                <div className="stat__label">{s.label}</div>
                <div className={`stat__value ${s.cls}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const top = filtered[0]?.p;

  return (
    <>
      {/* Carte #1 du classement actuel */}
      {top && !search && (
        <div className="role-tops role-tops--single animate-fade">
          {renderCard(top)}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div className="filters" style={{ marginBottom: 0 }}>
          <button
            className={`filter-btn ${role === 'ALL' ? 'filter-btn--active' : ''}`}
            onClick={() => setRole('ALL')}
          >All</button>
          {ROLES.map(r => (
            <button
              key={r}
              className={`filter-btn filter-btn--${r.toLowerCase()} ${role === r ? 'filter-btn--active' : ''}`}
              onClick={() => setRole(r)}
            >{ROLE_LABEL[r]}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input
            className="search-input"
            placeholder="Joueur ou équipe..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <span className="text-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            {filtered.length} joueurs{tournamentName ? ` · ${tournamentName}` : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="ranking-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th className="th--left" style={{ minWidth: 160 }}>Joueur</th>
              {th('rating', 'Rating')}
              {th('games',   'G',    'col--games')}
              {th('winRate', 'W%')}
              {th('kda',     'KDA')}
              {th('avgKills',   'K')}
              {th('avgDeaths',  'D')}
              {th('avgAssists', 'A')}
              {th('kp',    'KP%',  'col--kp')}
              {th('dpm',   'DPM',  'col--dpm')}
              {th('csm',   'CSM',  'col--csm')}
              {th('gpm',   'GPM')}
              {th('gd15',  'GD15', 'col--gd15')}
              {th('csd15', 'CSD15')}
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ p, stats }, i) => {
              const teamColor = TEAM_COLOR[p.team] ?? '#555';
              return (
                <tr
                  key={p.id}
                  className={selected?.id === p.id ? 'tr--selected' : ''}
                  onClick={() => setSelected(p)}
                >
                  <td><span className={rankClass(i)}>{i + 1}</span></td>

                  <td>
                    <div className="player-cell">
                      <div>
                        <div className={`player-cell__name ${i < 3 ? 'player-cell__name--top3' : ''}`}>
                          {p.name}
                        </div>
                        <div className="player-cell__team" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: 1, background: teamColor }} />
                          {p.team}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className={ratingClass(p.rating ?? 0)} style={{ position: 'relative', display: 'inline-block' }}>
                      {p.rating?.toFixed(1) ?? '—'}
                      <div className={ratingBarClass(p.rating ?? 0)} style={{ width: `${p.rating ?? 0}%` }} />
                    </div>
                  </td>

                  <td className="col--games val--muted">{stats?.games ?? '—'}</td>
                  <td><span className={winClass(stats?.winRate ?? 0)}>{stats ? `${fmt(stats.winRate)}%` : '—'}</span></td>
                  <td><span className={kdaClass(stats?.kda ?? 0)}>{stats ? fmt(stats.kda) : '—'}</span></td>
                  <td>{stats ? fmt(stats.avgKills) : '—'}</td>
                  <td>{stats ? fmt(stats.avgDeaths) : '—'}</td>
                  <td>{stats ? fmt(stats.avgAssists) : '—'}</td>
                  <td className="col--kp"><span className={stats && stats.kp >= 70 ? 'val--kp-high' : ''}>{stats ? `${fmt(stats.kp)}%` : '—'}</span></td>
                  <td className="col--dpm"><span className={stats && stats.dpm >= 700 ? 'val--dpm-high' : ''}>{stats ? fmt(stats.dpm, 0) : '—'}</span></td>
                  <td className="col--csm"><span className={stats && stats.csm >= 9.5 ? 'val--csm-high' : ''}>{stats ? fmt(stats.csm) : '—'}</span></td>
                  <td>{stats ? fmt(stats.gpm, 0) : '—'}</td>
                  <td className="col--gd15"><span className={diffClass(stats?.gd15 ?? 0)}>{stats ? fmtSign(stats.gd15) : '—'}</span></td>
                  <td><span className={diffClass(stats?.csd15 ?? 0)}>{stats ? fmtSign(stats.csd15) : '—'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <PlayerModal player={selected} onClose={() => setSelected(null)} tournament={tournament} />
      )}
    </>
  );
}
