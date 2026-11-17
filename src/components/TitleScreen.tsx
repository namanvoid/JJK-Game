import React, { useMemo } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getCharacterPortraitDataUrl } from '../game/pixelSprites';
import { CHARACTER_PROFILES, PLAYABLE_LIST } from '../game/roster';
import { PlayableFighterId } from '../game/types';

interface TitleScreenProps {
  selectedHero: PlayableFighterId;
  onSelectHero: (hero: PlayableFighterId) => void;
  onStartStory: () => void;
  onOpenPractice: () => void;
  onOpenSettings: () => void;
  onExit: () => void;
  exitNotice: boolean;
  muted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedHero,
  onSelectHero,
  onStartStory,
  onOpenPractice,
  onOpenSettings,
  onExit,
  exitNotice,
  muted,
  onToggleMute,
}) => {
  const heroPortraits = useMemo(() => {
    const map: Record<string, string> = {};
    for (const id of PLAYABLE_LIST) {
      map[id] = getCharacterPortraitDataUrl(id);
    }
    return map;
  }, []);

  const heroProfile = CHARACTER_PROFILES[selectedHero];

  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-between p-5 md:p-8 pointer-events-none">
      {/* Top-right sound toggle */}
      <div className="flex justify-end pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.currentTarget.blur();
            onToggleMute();
          }}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
          className="pixel-btn bg-[#131122] px-3 py-2 text-xs text-slate-200 flex items-center gap-2 cursor-pointer"
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-sky-400" />
          )}
          <span>{muted ? 'MUTED' : 'AUDIO ON'}</span>
        </button>
      </div>

      {/* Upper-Center Title Lockup & Fighter Select over dark atmospheric scrim */}
      <div className="flex flex-col items-center text-center my-auto pb-44 sm:pb-52">
        <div className="px-5 sm:px-6 py-3 flex flex-col items-center border border-[#2b2744]/85 bg-[#080712]/85 shadow-[0_8px_0_rgba(4,3,8,0.85)] max-w-2xl w-full">
          <h1 className="font-pixel-display text-2xl sm:text-3xl text-slate-50 tracking-tight pixel-text-shadow leading-tight">
            JUJUTSU KAISEN
          </h1>
          <p className="mt-0.5 font-pixel-display text-xs sm:text-sm text-sky-400 tracking-widest pixel-text-shadow">
            CURSED CLASH
          </p>

          {/* All 14 Playable Fighters Picker */}
          <div className="mt-2 w-full pointer-events-auto">
            <div className="text-[10px] text-slate-400 tracking-wider mb-1 font-bold truncate">
              CHOOSE FIGHTER (14 PLAYABLE) — {heroProfile.name.toUpperCase()} ({heroProfile.domainName})
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {PLAYABLE_LIST.map((id) => {
                const p = CHARACTER_PROFILES[id];
                const active = selectedHero === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onSelectHero(id);
                    }}
                    className={`pixel-btn p-1 flex flex-col items-center gap-0.5 cursor-pointer ${
                      active ? 'bg-[#1b2744]' : 'bg-[#110f1f] opacity-80 hover:opacity-100'
                    }`}
                    style={{ borderColor: active ? p.accentColor : '#2c2748' }}
                  >
                    <img
                      src={heroPortraits[id]}
                      alt={p.name}
                      className="w-7 h-7 pixel-canvas border border-[#2a2645]"
                    />
                    <span className="text-[9px] font-bold text-slate-100 truncate w-full text-center">
                      {id.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Menu Stack */}
          <div className="mt-3 flex flex-col gap-1.5 w-64 pointer-events-auto">
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartStory();
              }}
              className="pixel-btn bg-[#1d4ed8] hover:bg-[#2563eb] text-white font-pixel-ui font-bold text-sm py-2.5 px-5 tracking-wider cursor-pointer whitespace-nowrap"
            >
              START STORY MODE
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenPractice();
              }}
              className="pixel-btn bg-[#18152b] hover:bg-[#231f3d] text-slate-100 font-pixel-ui text-sm py-2 px-5 tracking-wider cursor-pointer whitespace-nowrap"
            >
              PRACTICE MODE
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onOpenSettings();
                }}
                className="pixel-btn bg-[#18152b] hover:bg-[#231f3d] text-slate-100 font-pixel-ui text-xs py-2 px-3 tracking-wider cursor-pointer whitespace-nowrap"
              >
                SETTINGS
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onExit();
                }}
                className="pixel-btn bg-[#131120] hover:bg-[#2a1622] text-slate-300 font-pixel-ui text-xs py-2 px-3 tracking-wider cursor-pointer whitespace-nowrap"
              >
                EXIT
              </button>
            </div>
          </div>
        </div>

        {exitNotice && (
          <p className="mt-3 text-xs text-amber-300 bg-[#0b0a14]/90 px-3 py-1.5 border border-amber-500/40 pointer-events-auto">
            Session ended cleanly. Press Enter or click Start Story Mode anytime to play again.
          </p>
        )}
      </div>

      {/* Bottom single-line flat control hints */}
      <div className="text-center text-[11px] sm:text-xs text-slate-300 pixel-text-shadow tracking-wide">
        A/D Move · W Jump (Air Move) · S Sidestep · Space Dash · J/K Attack · L Block · Q/F Parry · U/I/O/H/Y Skills &amp; Domain
      </div>
    </div>
  );
};
