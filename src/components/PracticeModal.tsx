import React, { useMemo, useState } from 'react';
import {
  ARENA_LIST,
  ARENA_PROFILES,
  CHARACTER_PROFILES,
  PLAYABLE_LIST,
  PLAYABLE_SKILLS,
} from '../game/roster';
import { getCharacterPortraitDataUrl } from '../game/pixelSprites';
import { ArenaId, FighterId, PlayableFighterId } from '../game/types';

interface PracticeModalProps {
  initialHero: PlayableFighterId;
  autoCe: boolean;
  aiActive: boolean;
  onToggleAutoCe: (val: boolean) => void;
  onToggleAiActive: (val: boolean) => void;
  onStart: (hero: PlayableFighterId, opponent: FighterId, arena: ArenaId) => void;
  onClose: () => void;
}

export const PracticeModal: React.FC<PracticeModalProps> = ({
  initialHero,
  autoCe,
  aiActive,
  onToggleAutoCe,
  onToggleAiActive,
  onStart,
  onClose,
}) => {
  const [selectedHero, setSelectedHero] = useState<PlayableFighterId>(initialHero);
  const [selectedOpponent, setSelectedOpponent] = useState<FighterId>(
    initialHero === 'sukuna' ? 'gojo' : 'jogo'
  );
  const [selectedArena, setSelectedArena] = useState<ArenaId>('jujutsu_high');

  const portraits = useMemo(() => {
    const map: Record<string, string> = {};
    for (const id of PLAYABLE_LIST) {
      map[id] = getCharacterPortraitDataUrl(id);
    }
    return map;
  }, []);

  const hero = CHARACTER_PROFILES[selectedHero];
  const heroSkills = PLAYABLE_SKILLS[selectedHero];
  const opponent = CHARACTER_PROFILES[selectedOpponent];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Practice Mode Setup"
    >
      <div className="pixel-panel w-full max-w-5xl p-5 sm:p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#2b2744] pb-3 mb-4">
          <div>
            <h2 className="font-pixel-display text-base sm:text-lg text-sky-400">PRACTICE ARENA</h2>
            <p className="text-xs text-slate-400 mt-1">
              Choose any of 14 Fighters, Opponent &amp; Battleground
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn bg-[#1d1a30] px-3 py-1.5 text-xs text-slate-200 cursor-pointer"
          >
            BACK
          </button>
        </div>

        {/* Playable Fighter Selection (All 14) */}
        <div className="mb-4">
          <div className="text-xs text-slate-300 mb-2 font-bold">
            SELECT FIGHTER ({PLAYABLE_LIST.length} PLAYABLE)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
            {PLAYABLE_LIST.map((id) => {
              const p = CHARACTER_PROFILES[id];
              const active = selectedHero === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedHero(id)}
                  className={`pixel-btn p-1.5 flex items-center gap-2 text-left cursor-pointer ${
                    active ? 'bg-[#1e2a4a]' : 'bg-[#131122]'
                  }`}
                  style={{ borderColor: active ? p.accentColor : '#2c2748' }}
                >
                  <img
                    src={portraits[id]}
                    alt={p.name}
                    className="w-8 h-8 pixel-canvas border border-[#2f2b4a] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-slate-100 leading-tight">
                      {p.name}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">HP {p.maxHp}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 p-2 bg-[#0e0c1a] border border-[#24203b] text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong className="text-sky-300">{hero.name}:</strong>{' '}
              {heroSkills.map((s) => s.shortName).join(' · ')}
            </span>
          </div>
        </div>

        {/* Opponent Selection (All 14 Fighters) */}
        <div className="mb-4">
          <div className="text-xs text-slate-300 mb-2 font-bold">
            SELECT OPPONENT ({PLAYABLE_LIST.length} FIGHTERS)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
            {PLAYABLE_LIST.map((id) => {
              const p = CHARACTER_PROFILES[id];
              const active = selectedOpponent === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedOpponent(id)}
                  className={`pixel-btn p-1.5 flex items-center gap-2 text-left cursor-pointer ${
                    active ? 'bg-[#2a1d3d]' : 'bg-[#131122]'
                  }`}
                  style={{ borderColor: active ? p.accentColor : '#2c2748' }}
                >
                  <img
                    src={portraits[id]}
                    alt={p.name}
                    className="w-8 h-8 pixel-canvas border border-[#2f2b4a] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-slate-100 leading-tight">
                      {p.name}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">HP {p.maxHp}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 p-2.5 bg-[#0e0c1a] border border-[#24203b] text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-bold text-amber-300">
                {opponent.name} — {opponent.title}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Skills: {opponent.signatureMoves.join(' · ')}
              </div>
            </div>
            <span className="text-sky-300 font-mono-data shrink-0">HP {opponent.maxHp}</span>
          </div>
        </div>

        {/* Arena Selection */}
        <div className="mb-4">
          <div className="text-xs text-slate-300 mb-2 font-bold">SELECT ARENA</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ARENA_LIST.map((aid) => {
              const arena = ARENA_PROFILES[aid];
              const active = selectedArena === aid;
              return (
                <button
                  key={aid}
                  type="button"
                  onClick={() => setSelectedArena(aid)}
                  className={`pixel-btn p-2 text-left cursor-pointer ${
                    active ? 'bg-[#1e2a4a] border-sky-400' : 'bg-[#131122]'
                  }`}
                >
                  <div
                    className="h-1.5 w-full mb-1.5"
                    style={{
                      background: `linear-gradient(90deg, ${arena.skyTop}, ${arena.accentColor})`,
                    }}
                  />
                  <div className="text-[11px] font-bold text-slate-100 leading-tight">
                    {arena.name}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {arena.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Practice Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#2b2744] pt-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCe}
                onChange={(e) => onToggleAutoCe(e.target.checked)}
                className="accent-sky-400 w-4 h-4"
              />
              <span>Fast Cursed Energy Regen</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aiActive}
                onChange={(e) => onToggleAiActive(e.target.checked)}
                className="accent-sky-400 w-4 h-4"
              />
              <span>Active Opponent AI</span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => onStart(selectedHero, selectedOpponent, selectedArena)}
            className="pixel-btn bg-[#1d4ed8] hover:bg-[#2563eb] text-white font-bold text-xs px-5 py-2.5 cursor-pointer"
          >
            ENTER ARENA
          </button>
        </div>
      </div>
    </div>
  );
};
