import type { Player, Role, LIRSubscores } from '../types';
import { fmt, fmtSign, getPlayerStats } from '../utils';
import RoleTag from './RoleTag';

const ROLE_CSS_VAR: Record<Role, string> = {
  TOP: 'var(--role-top)', JGL: 'var(--role-jgl)', MID: 'var(--role-mid)',
  BOT: 'var(--role-bot)', SUP: 'var(--role-sup)',
};

const TEAM_COLOR: Record<string, string> = {
  'Gen.G': '#b8960a', 'T1': '#c0001f', 'Dplus KIA': '#0a3a8a',
  'BNK FearX': '#d43050', 'Kiwoom DRX': '#005fa3',
  'OKSavingsBank BRO': '#008040', 'DN SOOPers': '#4a3a8a',
  'KT Rolster': '#cc0000', 'HLE': '#d45c00', 'NS RedForce': '#aa0020',
};

interface StatRowProps {
  label: string;
  value: string;
  barPct?: number;
  color?: string;
}

function StatRow({ label, value, barPct, color = 'var(--gold)' }: StatRowProps) {
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

  const roleColor = ROLE_CSS_VAR[player.role];
  const teamColor = TEAM_COLOR[player.team] ?? '#666';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-backdrop" />
      <div className="modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="player-detail__name">{player.name}</span>
              <RoleTag role={player.role} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: teamColor }} />
              <span className="text-muted" style={{ fontSize: 12 }}>{player.team}</span>
              {player.country && <span className="text-muted" style={{ fontSize: 12 }}>· {player.country}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            {player.rating !== undefined && (
              <div style={{ textAlign: 'center' }}>
                <div className="player-detail__big-rating">{player.rating.toFixed(1)}</div>
                <div className="stat__label">Rating</div>
              </div>
            )}
            <button className="modal__close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* LIR Subscores */}
        {player.subscores && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
            {([
              { key: 'laning',     label: 'Laning' },
              { key: 'damage',     label: 'Damage' },
              { key: 'presence',   label: 'Presence' },
              { key: 'efficiency', label: 'Efficiency' },
            ] as { key: keyof LIRSubscores; label: string }[]).map(({ key, label }) => {
              const val = player.subscores![key];
              const isPos = val >= 0;
              return (
                <div key={key} style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isPos ? 'var(--green)' : 'var(--red)' }}>
                    {isPos ? '+' : ''}{val.toFixed(2)}
                  </div>
                  <div className="stat__label" style={{ marginTop: 2 }}>{label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Hero stats */}
        <div className="modal__hero">
          {[
            { label: 'Games',    value: String(stats.games) },
            { label: 'Win Rate', value: `${fmt(stats.winRate)}%` },
            { label: 'KDA',      value: fmt(stats.kda) },
            { label: 'KP',       value: `${fmt(stats.kp)}%` },
          ].map(s => (
            <div key={s.label} className="modal__hero-stat">
              <div className="stat__value" style={{ fontSize: 20, color: '#fff' }}>{s.value}</div>
              <div className="stat__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Combat */}
        <div style={{ marginBottom: 20 }}>
          <div className="modal__section-title">Combat</div>
          <StatRow label="Kills avg"   value={fmt(stats.avgKills)}   barPct={pct(stats.avgKills, 0, 8)}    color={roleColor} />
          <StatRow label="Deaths avg"  value={fmt(stats.avgDeaths)}  barPct={pct(stats.avgDeaths, 1, 6)}   color="var(--red)" />
          <StatRow label="Assists avg" value={fmt(stats.avgAssists)} barPct={pct(stats.avgAssists, 2, 16)} color={roleColor} />
          <StatRow label="DPM"         value={fmt(stats.dpm, 0)}     barPct={pct(stats.dpm, 150, 920)}     color={roleColor} />
          <StatRow label="DMG %"       value={`${fmt(stats.dmgPct)}%`} barPct={pct(stats.dmgPct, 5, 31)}  color={roleColor} />
        </div>

        {/* Économie */}
        <div style={{ marginBottom: 20 }}>
          <div className="modal__section-title">Économie</div>
          <StatRow label="GPM"    value={fmt(stats.gpm, 0)}   barPct={pct(stats.gpm, 240, 560)}    color="var(--gold)" />
          <StatRow label="Gold %" value={`${fmt(stats.goldPct)}%`} barPct={pct(stats.goldPct, 12, 27)} color="var(--gold)" />
          <StatRow label="CSM"    value={fmt(stats.csm)}      barPct={pct(stats.csm, 0.8, 11)}     color="var(--gold)" />
        </div>

        {/* Early game */}
        <div>
          <div className="modal__section-title">Early game (@15)</div>
          <StatRow label="GD@15"  value={fmtSign(stats.gd15)}  barPct={pct(stats.gd15,  -500, 500)} color={stats.gd15  >= 0 ? 'var(--green)' : 'var(--red)'} />
          <StatRow label="CSD@15" value={fmtSign(stats.csd15)} barPct={pct(stats.csd15, -15,  15)}  color={stats.csd15 >= 0 ? 'var(--green)' : 'var(--red)'} />
          <StatRow label="XPD@15" value={fmtSign(stats.xpd15)} barPct={pct(stats.xpd15, -400, 400)} color={stats.xpd15 >= 0 ? 'var(--green)' : 'var(--red)'} />
        </div>

      </div>
    </div>
  );
}
