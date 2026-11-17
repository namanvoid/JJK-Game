import React, { useMemo } from 'react';
import { getCharacterPortraitDataUrl } from '../game/pixelSprites';
import { CHARACTER_PROFILES, STORY_STAGES } from '../game/roster';
import { HudSnapshot } from '../game/types';

interface MatchResultModalProps {
  hud: HudSnapshot;
  onContinueStory: () => void;
  onRetry: () => void;
  onTitle: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  hud,
  onContinueStory,
  onRetry,
  onTitle,
}) => {
  const playerWon = hud.winner === 'player';
  const hasNextStage =
    hud.mode === 'story' && playerWon && hud.stageIndex < STORY_STAGES.length - 1;
  const winnerId = playerWon ? hud.playerId : hud.enemyId;
  const winnerProfile = CHARACTER_PROFILES[winnerId];
  const winnerPortrait = useMemo(() => getCharacterPortraitDataUrl(winnerId), [winnerId]);
  const quote = hud.victoryQuote || winnerProfile.victoryQuote;
  const quoteTag = hud.victoryQuoteTag || 'VICTORY QUOTE';

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={playerWon ? 'Victory Screen' : 'Defeat Screen'}
    >
      <div className="pixel-panel w-full max-w-md p-6 text-center text-slate-100">
        <h2
          className={`font-pixel-display text-xl sm:text-2xl mb-3 ${
            hud.storyComplete
              ? 'text-amber-300'
              : playerWon
              ? 'text-sky-400'
              : 'text-rose-500'
          }`}
        >
          {hud.storyComplete
            ? hud.playerId === 'gojo'
              ? 'THE HONORED ONE'
              : hud.playerId === 'sukuna'
              ? 'THE KING OF CURSES'
              : hud.playerId === 'toji'
              ? 'THE SORCERER KILLER'
              : 'SPECIAL GRADE CHAMPION'
            : playerWon
            ? 'VICTORY'
            : 'DEFEAT'}
        </h2>

        {/* Character-Specific Victory Quote Card */}
        <div
          data-testid="victory-quote-card"
          className="mb-4 p-3 bg-[#0c0a18] border-2 text-left flex items-start gap-3"
          style={{ borderColor: winnerProfile.accentColor }}
        >
          <img
            src={winnerPortrait}
            alt={winnerProfile.name}
            className="w-12 h-12 pixel-canvas border border-[#2f2b4a] shrink-0 bg-[#121022]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
              <span
                className="text-[11px] font-bold tracking-wide"
                style={{ color: winnerProfile.accentColor }}
              >
                {winnerProfile.name.toUpperCase()}
              </span>
              <span className="text-[9px] font-mono-data px-1.5 py-0.5 bg-[#19162e] border border-[#342f58] text-amber-300">
                {quoteTag}
              </span>
            </div>
            <p className="text-xs text-slate-100 italic leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>
            <div className="text-[10px] text-slate-400 mt-1 truncate">
              {winnerProfile.title}
            </div>
          </div>
        </div>

        {/* Tabular Stats */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 text-left">
          <div className="bg-[#0e0c1a] border border-[#24203b] p-2.5">
            <div className="text-[10px] text-slate-400">SCORE</div>
            <div className="font-mono-data text-base font-bold text-amber-300">{hud.score}</div>
          </div>
          <div className="bg-[#0e0c1a] border border-[#24203b] p-2.5">
            <div className="text-[10px] text-slate-400">MAX COMBO</div>
            <div className="font-mono-data text-base font-bold text-sky-300">{hud.maxCombo} HITS</div>
          </div>
          <div className="bg-[#0e0c1a] border border-[#24203b] p-2.5">
            <div className="text-[10px] text-slate-400">DAMAGE DEALT</div>
            <div className="font-mono-data text-base font-bold text-slate-100">{hud.damageDealt}</div>
          </div>
          <div className="bg-[#0e0c1a] border border-[#24203b] p-2.5">
            <div className="text-[10px] text-slate-400">
              {playerWon ? 'CLEAR TIME' : 'OPPONENT HP'}
            </div>
            <div className="font-mono-data text-base font-bold text-slate-100">
              {playerWon ? `${hud.matchTime}s` : `${hud.enemyHp}/${hud.enemyMaxHp}`}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          {hasNextStage ? (
            <button
              type="button"
              data-start="true"
              onClick={onContinueStory}
              className="pixel-btn bg-[#1d4ed8] hover:bg-[#2563eb] text-white font-bold text-xs py-2.5 cursor-pointer"
            >
              CONTINUE TO STAGE {hud.stageIndex + 2}
            </button>
          ) : (
            <button
              type="button"
              data-start="true"
              onClick={onRetry}
              className="pixel-btn bg-[#1d4ed8] hover:bg-[#2563eb] text-white font-bold text-xs py-2.5 cursor-pointer"
            >
              {hud.storyComplete ? 'PLAY STORY AGAIN' : 'RETRY MATCH'}
            </button>
          )}
          <button
            type="button"
            onClick={onTitle}
            className="pixel-btn bg-[#131120] hover:bg-[#231f3d] text-slate-300 text-xs py-2.5 cursor-pointer"
          >
            RETURN TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
};
