import React from 'react';
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
  const quote = playerWon
    ? CHARACTER_PROFILES[hud.playerId].victoryQuote
    : CHARACTER_PROFILES[hud.enemyId].victoryQuote;

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={playerWon ? 'Victory Screen' : 'Defeat Screen'}
    >
      <div className="pixel-panel w-full max-w-md p-6 text-center text-slate-100">
        <h2
          className={`font-pixel-display text-xl sm:text-2xl mb-2 ${
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
        <p className="text-xs text-slate-300 italic mb-5">"{quote}"</p>

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
