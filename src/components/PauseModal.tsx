import React from 'react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onTitle,
}) => {
  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Match Paused"
    >
      <div className="pixel-panel w-full max-w-sm p-6 text-center text-slate-100">
        <h2 className="font-pixel-display text-lg text-amber-300 mb-5">PAUSED</h2>
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="pixel-btn bg-[#1d4ed8] hover:bg-[#2563eb] text-white font-bold text-xs py-2.5 cursor-pointer"
          >
            RESUME MATCH
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="pixel-btn bg-[#18152b] hover:bg-[#231f3d] text-slate-100 text-xs py-2.5 cursor-pointer"
          >
            SETTINGS & MOVE LIST
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="pixel-btn bg-[#18152b] hover:bg-[#231f3d] text-slate-100 text-xs py-2.5 cursor-pointer"
          >
            RESTART MATCH
          </button>
          <button
            type="button"
            onClick={onTitle}
            className="pixel-btn bg-[#131120] hover:bg-[#2a1622] text-slate-300 text-xs py-2.5 cursor-pointer"
          >
            RETURN TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
};
