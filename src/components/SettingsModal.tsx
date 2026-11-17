import React from 'react';
import { CHARACTER_PROFILES, PLAYABLE_SKILLS } from '../game/roster';
import { Difficulty, GameSettings, PlayableFighterId } from '../game/types';

interface SettingsModalProps {
  playerId: PlayableFighterId;
  settings: GameSettings;
  onUpdate: (next: GameSettings) => void;
  onClose: () => void;
}

const DIFFICULTIES: { id: Difficulty; label: string; desc: string }[] = [
  { id: 'grade1', label: 'GRADE 1', desc: 'Forgiving AI · 75% enemy damage' },
  { id: 'special', label: 'SPECIAL GRADE', desc: 'Balanced Tekken-style challenge' },
  { id: 'king', label: 'KING OF CURSES', desc: 'Relentless AI · +25% enemy damage' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  playerId,
  settings,
  onUpdate,
  onClose,
}) => {
  const hero = CHARACTER_PROFILES[playerId];
  const skills = PLAYABLE_SKILLS[playerId];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Game Settings and Move List"
    >
      <div className="pixel-panel w-full max-w-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#2b2744] pb-3 mb-5">
          <h2 className="font-pixel-display text-base text-sky-400">SETTINGS &amp; MOVE LIST</h2>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn bg-[#1d1a30] px-3 py-1.5 text-xs text-slate-200 cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        {/* Difficulty */}
        <div className="mb-5">
          <div className="text-xs text-slate-300 font-bold mb-2">DIFFICULTY</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {DIFFICULTIES.map((d) => {
              const active = settings.difficulty === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onUpdate({ ...settings, difficulty: d.id })}
                  className={`pixel-btn p-2.5 text-left cursor-pointer ${
                    active ? 'bg-[#1e2a4a] border-sky-400' : 'bg-[#131122]'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-100">{d.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{d.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio & Visual Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <label className="block bg-[#0e0c1a] border border-[#24203b] p-3">
            <div className="flex justify-between text-xs mb-2">
              <span>MUSIC VOLUME</span>
              <span className="font-mono-data text-sky-400">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.musicVolume}
              onChange={(e) => onUpdate({ ...settings, musicVolume: Number(e.target.value) })}
              className="w-full accent-sky-400"
            />
          </label>

          <label className="block bg-[#0e0c1a] border border-[#24203b] p-3">
            <div className="flex justify-between text-xs mb-2">
              <span>SFX VOLUME</span>
              <span className="font-mono-data text-sky-400">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              onChange={(e) => onUpdate({ ...settings, sfxVolume: Number(e.target.value) })}
              className="w-full accent-sky-400"
            />
          </label>
        </div>

        <label className="flex items-center gap-2.5 text-xs mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.screenShake}
            onChange={(e) => onUpdate({ ...settings, screenShake: e.target.checked })}
            className="accent-sky-400 w-4 h-4"
          />
          <span>Impact Camera Shake</span>
        </label>

        {/* Active Hero Move List */}
        <div className="border-t border-[#2b2744] pt-4">
          <div className="text-xs text-sky-400 font-bold mb-2">
            {hero.name.toUpperCase()} — COMMAND LIST
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between border-b border-[#1d1a30] py-1">
              <span>Move / Jump &amp; Air Steer / Sidestep</span>
              <span className="font-mono-data text-slate-100">A D / W / S</span>
            </div>
            <div className="flex justify-between border-b border-[#1d1a30] py-1">
              <span>Dash / Quick Evade</span>
              <span className="font-mono-data text-slate-100">SPACE</span>
            </div>
            <div className="flex justify-between border-b border-[#1d1a30] py-1">
              <span>3-Hit Combo &amp; Heavy Launcher</span>
              <span className="font-mono-data text-slate-100">J → J → J / K</span>
            </div>
            <div className="flex justify-between border-b border-[#1d1a30] py-1">
              <span>Guard / Dedicated Parry</span>
              <span className="font-mono-data text-amber-300">L (BLK) / Q or F (PARRY)</span>
            </div>
            {skills.map((s) => (
              <div key={s.action} className="flex justify-between border-b border-[#1d1a30] py-1">
                <span>
                  {s.name} ({s.cost} CE)
                </span>
                <span className="font-mono-data" style={{ color: s.color }}>
                  {s.keyLabel} or {s.slot}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
