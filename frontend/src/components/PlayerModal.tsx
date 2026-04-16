import type { Player, Role, LIRSubscores } from '../types';
import { fmt, fmtSign, getPlayerStats } from '../utils';
import RoleTag from './RoleTag';

const ROLE_COLOR: Record<Role, string> = {
  TOP: 'var(--role-top)', JGL: 'var(--role-jgl)', MID: 'var(--role-mid)',
  BOT: 'var(--role-bot)', SUP: 'var(--role-sup)',
};

function StatRow({ label, value, barPct, color = 'var(--accent)' }: {
  label: string; value: string; barPct?: number; color?: string;
}) {
  return (
    <div className="modal__stat-row">
      <span className="modal__stat-label">{label}</span>
      <div>
        {barPct !== undefined && (
          <div className="modal__bar-track">
            <div className="modal__bar-fill" style={{ width: `${barPct}%`, background: color }} />
          </div>
        )}
      </div>
      <span className="modal__stat-value">{value}</span>
    </div>
  );
}

function pct(val: number, min: number, max: number) {
  return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
}

interface Props { player: Player; onClose: () => void; tournament?: string; }

export default function PlayerModal({ player, onClose, tournament }: Props) {
  const stats = getPlayerStats(player, tournament);
  if (!stats) return null;

  const tournamentEntry  = tournament ? player.tournaments[tournament] : undefined;
  const displayRating    = tournamentEntry?.rating    ?? player.rating;
  const displaySubscores = tournamentEntry?.subscores ?? player.subscores;
  const roleColor        = ROLE_COLOR[player.role];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-backdrop" />
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ─────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
              <span className="player-detail__name">{player.name}</span>
              <RoleTag role={player.role} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-body)' }}>
                {player.team}{player.country ? ` · ${player.country}` : ''}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            {displayRating !== undefined && (
              <div style={{ textAlign: 'right' }}>
                <div className="player-detail__big-rating">{displayRating.toFixed(1)}</div>
                <div className="stat__label" style={{ textAlign: 'right' }}>LIR</div>
              </div>
            )}
            <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* ── LIR Subscores ──────────────────── */}
        {displaySubscores && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 22 }}>
            {([
              { key: 'laning',     label: 'Laning',     color: 'var(--blue)'   },
              { key: 'damage',     label: 'Damage',     color: 'var(--red)'    },
              { key: 'presence',   label: 'Presence',   color: 'var(--green)'  },
              { key: 'efficiency', label: 'Efficiency', color: 'var(--accent)' },
            ] as { key: keyof LIRSubscores; label: string; color: string }[]).map(({ key, label, color }) => {
              const val = displaySubscores[key];
              return (
                <div key={key} style={{
                  background: 'var(--bg-1)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r-sm)',
                  padding: '10px 8px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 15,
                    fontWeight: 600,
                    color,
                    letterSpacing: '-0.02em',
                  }}>
                    {val.toFixed(1)}
                  </div>
                  <div className="stat__label" style={{ marginTop: 3 }}>{label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Hero 4-stat grid ───────────────── */}
        <div className="modal__hero" style={{ marginBottom: 22 }}>
          {[
            { label: 'Games',   value: String(stats.games) },
            { label: 'Win%',    value: `${fmt(stats.winRate)}%` },
            { label: 'KDA',     value: fmt(stats.kda) },
            { label: 'KP%',     value: `${fmt(stats.kp)}%` },
          ].map(s => (
            <div key={s.label} className="modal__hero-stat">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>{s.value}</div>
              <div className="stat__label" style={{ marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Combat ─────────────────────────── */}
        <div style={{ marginBottom: 18 }}>
          <div className="modal__section-title">Combat</div>
          <StatRow label="Kills avg"   value={fmt(stats.avgKills)}       barPct={pct(stats.avgKills, 0, 8)}     color={roleColor} />
          <StatRow label="Deaths avg"  value={fmt(stats.avgDeaths)}      barPct={pct(stats.avgDeaths, 1, 6)}    color="var(--red)" />
          <StatRow label="Assists avg" value={fmt(stats.avgAssists)}     barPct={pct(stats.avgAssists, 2, 16)}  color={roleColor} />
          <StatRow label="DPM"         value={fmt(stats.dpm, 0)}         barPct={pct(stats.dpm, 150, 920)}      color={roleColor} />
          <StatRow label="DMG %"       value={`${fmt(stats.dmgPct)}%`}   barPct={pct(stats.dmgPct, 5, 31)}      color={roleColor} />
        </div>

        {/* ── Economy ────────────────────────── */}
        <div style={{ marginBottom: 18 }}>
          <div className="modal__section-title">Economy</div>
          <StatRow label="GPM"      value={fmt(stats.gpm, 0)}         barPct={pct(stats.gpm, 240, 560)}      color="var(--accent)" />
          <StatRow label="Gold %"   value={`${fmt(stats.goldPct)}%`}  barPct={pct(stats.goldPct, 12, 27)}    color="var(--accent)" />
          <StatRow label="CSM"      value={fmt(stats.csm)}            barPct={pct(stats.csm, 0.8, 11)}       color="var(--accent)" />
        </div>

        {/* ── Early game ─────────────────────── */}
        <div>
          <div className="modal__section-title">Early game @15</div>
          <StatRow label="GD@15"  value={fmtSign(stats.gd15)}  barPct={pct(stats.gd15, -500, 500)}  color={stats.gd15  >= 0 ? 'var(--green)' : 'var(--red)'} />
          <StatRow label="CSD@15" value={fmtSign(stats.csd15)} barPct={pct(stats.csd15, -15, 15)}   color={stats.csd15 >= 0 ? 'var(--green)' : 'var(--red)'} />
          <StatRow label="XPD@15" value={fmtSign(stats.xpd15)} barPct={pct(stats.xpd15, -400, 400)} color={stats.xpd15 >= 0 ? 'var(--green)' : 'var(--red)'} />
        </div>

      </div>
    </div>
  );
}
