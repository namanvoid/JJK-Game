import React, { useMemo } from 'react';
import { Pause, Shield, Volume2, VolumeX } from 'lucide-react';
import { getCharacterPortraitDataUrl } from '../game/pixelSprites';
import { HudSnapshot } from '../game/types';

interface CombatHudProps {
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onTriggerAbility: (
    ability: 'skill_1' | 'skill_2' | 'skill_3' | 'skill_4' | 'skill_5_domain' | 'parry'
  ) => void;
}

export const CombatHud: React.FC<CombatHudProps> = ({
  hud,
  muted,
  onToggleMute,
  onPause,
  onTriggerAbility,
}) => {
  const playerPortrait = useMemo(() => getCharacterPortraitDataUrl(hud.playerId), [hud.playerId]);
  const enemyPortrait = useMemo(() => getCharacterPortraitDataUrl(hud.enemyId), [hud.enemyId]);

  const playerHpPct = Math.max(0, Math.min(100, (hud.playerHp / hud.playerMaxHp) * 100));
  const playerGhostPct = Math.max(0, Math.min(100, (hud.playerGhostHp / hud.playerMaxHp) * 100));
  const enemyHpPct = Math.max(0, Math.min(100, (hud.enemyHp / hud.enemyMaxHp) * 100));
  const enemyGhostPct = Math.max(0, Math.min(100, (hud.enemyGhostHp / hud.enemyMaxHp) * 100));

  const isLowHp = playerHpPct <= 25;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Subtle critical low HP peripheral vignette */}
      {isLowHp && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 90px rgba(220, 38, 38, 0.35)',
          }}
        />
      )}

      {/* TOP FIGHTING BAR */}
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          {/* PLAYER HEALTH & ROUNDS */}
          <div className="flex-1 flex items-center gap-2.5 min-w-0">
            <img
              src={playerPortrait}
              alt={hud.playerName}
              className="w-11 h-11 sm:w-13 sm:h-13 pixel-canvas border-2 border-sky-400 bg-[#0d0c18] shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-end sm:justify-between mb-1">
                <span className="hidden sm:inline font-pixel-ui text-xs sm:text-sm font-bold text-slate-50 pixel-text-shadow truncate">
                  {hud.playerName.toUpperCase()}
                </span>
                <span className="font-mono-data text-[10px] sm:text-[11px] text-sky-300 pixel-text-shadow">
                  {hud.playerHp}/{hud.playerMaxHp}
                </span>
              </div>
              <div className="relative h-4 sm:h-5 bg-[#0e0c18] border-2 border-[#3b355c] overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-rose-400/75"
                  style={{ width: `${playerGhostPct}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 bg-sky-400"
                  style={{ width: `${playerHpPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1.5">
                  {[0, 1].map((idx) => (
                    <span
                      key={idx}
                      className={`w-3 h-3 border border-sky-300 inline-block ${
                        hud.playerRounds > idx ? 'bg-sky-400' : 'bg-[#121020]'
                      }`}
                      aria-label={hud.playerRounds > idx ? 'Round won' : 'Round pending'}
                    />
                  ))}
                  {hud.playerInfinity > 0 && (
                    <span className="hidden sm:inline ml-2 text-[10px] font-bold text-cyan-300 pixel-text-shadow">
                      INFINITY {hud.playerInfinity.toFixed(1)}s
                    </span>
                  )}
                  {hud.playerBuffTimer > 0 && (
                    <span className="hidden sm:inline ml-2 text-[10px] font-bold text-lime-300 pixel-text-shadow">
                      {hud.playerId === 'hanami'
                        ? 'BARK ARMOR'
                        : hud.playerId === 'choso'
                        ? 'RED SCALE'
                        : hud.playerId === 'kashimo'
                        ? 'AMBER BEAST'
                        : hud.playerId === 'kenjaku'
                        ? 'OPEN BARRIER'
                        : 'CORE GUARD'}{' '}
                      {hud.playerBuffTimer.toFixed(1)}s
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-[10px] text-slate-300 font-mono-data pixel-text-shadow">
                  SCORE {hud.score}
                </span>
              </div>
            </div>
          </div>

          {/* CENTER ROUND TIMER */}
          <div className="flex flex-col items-center shrink-0 px-1 sm:px-2">
            <div className="pixel-panel px-2.5 sm:px-3 py-1 sm:py-1.5 text-center min-w-[52px] sm:min-w-[66px]">
              <div className="font-pixel-display text-base sm:text-2xl text-amber-300 font-mono-data leading-none">
                {hud.mode === 'practice' ? '∞' : String(hud.roundTimer).padStart(2, '0')}
              </div>
            </div>
            <div className="hidden sm:block mt-1 text-[10px] text-slate-300 pixel-text-shadow whitespace-nowrap">
              {hud.mode === 'practice'
                ? 'PRACTICE'
                : `S${hud.stageIndex + 1}/${hud.totalStages} · R${hud.roundNumber} · ${hud.arenaName.toUpperCase()}`}
            </div>
          </div>

          {/* OPPONENT HEALTH & BOSS PHASE */}
          <div className="flex-1 flex items-center gap-2 sm:gap-2.5 min-w-0 flex-row-reverse">
            <img
              src={enemyPortrait}
              alt={hud.enemyName}
              className={`w-10 h-10 sm:w-13 sm:h-13 pixel-canvas border-2 bg-[#0d0c18] shrink-0 ${
                hud.enemyId === 'sukuna' ? 'border-rose-500' : 'border-amber-500'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between mb-1 flex-row-reverse">
                <span className="hidden sm:inline font-pixel-ui text-xs sm:text-sm font-bold text-slate-50 pixel-text-shadow truncate">
                  {hud.enemyName.toUpperCase()}
                </span>
                <span className="font-mono-data text-[10px] sm:text-[11px] text-rose-300 pixel-text-shadow">
                  {hud.enemyHp}/{hud.enemyMaxHp}
                </span>
              </div>
              <div className="relative h-4 sm:h-5 bg-[#0e0c18] border-2 border-[#3b355c] overflow-hidden">
                <div
                  className="absolute inset-y-0 right-0 bg-amber-300/75"
                  style={{ width: `${enemyGhostPct}%` }}
                />
                <div
                  className={`absolute inset-y-0 right-0 ${
                    hud.enemyId === 'sukuna' ? 'bg-rose-600' : 'bg-orange-500'
                  }`}
                  style={{ width: `${enemyHpPct}%` }}
                />
                {hud.enemyId === 'sukuna' && (
                  <>
                    <div className="absolute inset-y-0 left-[33%] w-0.5 bg-black/80" />
                    <div className="absolute inset-y-0 left-[66%] w-0.5 bg-black/80" />
                  </>
                )}
              </div>
              <div className="flex items-center justify-between mt-1 flex-row-reverse">
                <div className="flex items-center gap-1.5">
                  {[0, 1].map((idx) => (
                    <span
                      key={idx}
                      className={`w-3 h-3 border border-rose-400 inline-block ${
                        hud.enemyRounds > idx ? 'bg-rose-500' : 'bg-[#121020]'
                      }`}
                    />
                  ))}
                </div>
                {hud.enemyId === 'sukuna' ? (
                  <span className="text-[10px] font-bold text-rose-400 pixel-text-shadow whitespace-nowrap">
                    P{hud.enemyBossPhase}/3
                  </span>
                ) : (
                  <span className="hidden sm:inline text-[10px] text-slate-400 pixel-text-shadow truncate">
                    {hud.enemyTitle}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* COMPACT TOP-RIGHT UTILITY BUTTONS */}
          <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              className="pixel-btn bg-[#131122] w-8 h-8 flex items-center justify-center text-slate-200 cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-sky-400" />
              )}
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              aria-label="Pause match"
              className="pixel-btn bg-[#131122] w-8 h-8 flex items-center justify-center text-slate-200 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DOMAIN EXPANSION SUB-BANNER */}
        {hud.domainBanner && (
          <div className="mx-auto mt-1 bg-[#090812]/90 border border-sky-400/70 px-4 py-1 text-[11px] font-pixel-display text-sky-200 tracking-wider">
            {hud.domainBanner}
          </div>
        )}
      </div>

      {/* CENTER INTRO / KO / PHASE BANNER */}
      {(hud.bannerText || hud.bannerSubtext) && (
        <div className="my-auto text-center pointer-events-none">
          {hud.bannerText && (
            <div className="font-pixel-display text-2xl sm:text-4xl text-amber-300 pixel-text-shadow tracking-wide">
              {hud.bannerText}
            </div>
          )}
          {hud.bannerSubtext && (
            <div className="mt-2 font-pixel-ui text-xs sm:text-sm text-slate-100 pixel-text-shadow">
              {hud.bannerSubtext}
            </div>
          )}
        </div>
      )}

      {/* BOTTOM CURSED ENERGY, PARRY, TOP 5 SKILLS & COMBO MULTIPLIER */}
      <div className="w-full max-w-6xl mx-auto flex items-end justify-between gap-4 mb-16 md:mb-0">
        {/* Cursed Energy & Dynamic Top 5 Technique Slots */}
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-sky-300 pixel-text-shadow">CURSED ENERGY</span>
            <span className="font-mono-data text-xs text-slate-100 pixel-text-shadow">{hud.playerCe}/100</span>
          </div>
          <div className="w-56 sm:w-64 h-3 bg-[#0d0b17] border-2 border-[#332e54] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-indigo-400 to-purple-500 transition-[width] duration-75"
              style={{ width: `${hud.playerCe}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {hud.playerSkills.map((ab) => {
              const ready = hud.playerCe >= ab.cost;
              return (
                <button
                  key={ab.action}
                  type="button"
                  tabIndex={-1}
                  disabled={!ready}
                  title={`${ab.name}: ${ab.description}`}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onTriggerAbility(ab.action);
                  }}
                  className={`pixel-btn px-2 py-1 text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                    ready
                      ? ab.action === 'skill_5_domain'
                        ? 'bg-[#281b3d] text-amber-100 ring-1 ring-amber-300'
                        : 'bg-[#17152b] text-slate-100'
                      : 'bg-[#0c0b14] text-slate-500 opacity-60 cursor-not-allowed'
                  }`}
                  style={{ borderColor: ready ? ab.color : '#26233d' }}
                >
                  <span className="font-mono-data text-amber-300">[{ab.keyLabel}]</span>
                  <span>{ab.shortName}</span>
                  <span className="font-mono-data opacity-75">{ab.cost}</span>
                </button>
              );
            })}
            <button
              type="button"
              tabIndex={-1}
              title="Cursed Parry Stance (Negates attack, stuns attacker & +22 CE)"
              onClick={(e) => {
                e.currentTarget.blur();
                onTriggerAbility('parry');
              }}
              className="pixel-btn px-2 py-1 text-[10px] font-bold flex items-center gap-1 bg-[#1e1b33] text-amber-200 border-amber-400 cursor-pointer"
            >
              <Shield className="w-3 h-3 text-amber-300" />
              <span className="font-mono-data text-amber-300">[Q]</span>
              <span>PARRY</span>
            </button>
          </div>
        </div>

        {/* Dynamic Combo Counter & Damage Multiplier */}
        <div className="text-right">
          {hud.playerCombo >= 2 && (
            <div className="pixel-panel px-3 py-1.5 border-sky-400" data-testid="combo-hud">
              <div className="font-pixel-display text-lg sm:text-xl text-sky-300 font-mono-data leading-none">
                {hud.playerCombo} HIT
              </div>
              <div className="text-[10px] text-amber-300 font-mono-data mt-0.5 font-bold">
                {hud.playerComboMultiplier.toFixed(2)}x DMG · COMBO
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
