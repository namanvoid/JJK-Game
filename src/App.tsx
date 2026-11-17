import { useCallback, useEffect, useRef, useState } from 'react';
import { CombatHud } from './components/CombatHud';
import { MatchResultModal } from './components/MatchResultModal';
import { PauseModal } from './components/PauseModal';
import { PracticeModal } from './components/PracticeModal';
import { SettingsModal } from './components/SettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { audioEngine } from './game/audio';
import { renderGameFrame } from './game/canvasRenderer';
import { CursedClashEngine } from './game/engine';
import { PLAYABLE_LIST } from './game/roster';
import {
  ArenaId,
  FighterId,
  GameSettings,
  HudSnapshot,
  InputState,
  PlayableFighterId,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './game/types';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<CursedClashEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new CursedClashEngine();
  }

  const [selectedHero, setSelectedHero] = useState<PlayableFighterId>('gojo');
  const [hud, setHud] = useState<HudSnapshot>(() => engineRef.current!.getHudSnapshot());
  const [settings, setSettings] = useState<GameSettings>(() => ({
    ...engineRef.current!.settings,
  }));
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exitNotice, setExitNotice] = useState(false);
  const [muted, setMuted] = useState(false);

  const selectedHeroRef = useRef<PlayableFighterId>('gojo');
  selectedHeroRef.current = selectedHero;

  const keysHeldRef = useRef<Set<string>>(new Set());
  const queuedEdgesRef = useRef<Set<string>>(new Set());
  const modalOpenRef = useRef(false);
  modalOpenRef.current = practiceOpen || settingsOpen;

  const syncHudNow = useCallback(() => {
    if (!engineRef.current) return;
    setHud(engineRef.current.getHudSnapshot());
  }, []);

  const handleSelectHero = useCallback((hero: PlayableFighterId) => {
    audioEngine.unlock();
    audioEngine.playSfx('ui_click');
    setSelectedHero(hero);
    selectedHeroRef.current = hero;
    engineRef.current?.setTitleHero(hero);
  }, []);

  const handleStartStory = useCallback(() => {
    audioEngine.unlock();
    audioEngine.playSfx('ui_click');
    setExitNotice(false);
    setPracticeOpen(false);
    setSettingsOpen(false);
    keysHeldRef.current.clear();
    queuedEdgesRef.current.clear();
    engineRef.current?.startStoryMode(0, selectedHeroRef.current);
    syncHudNow();
  }, [syncHudNow]);

  const handleStartPractice = useCallback(
    (hero: PlayableFighterId, opponent: FighterId, arena: ArenaId) => {
      audioEngine.unlock();
      audioEngine.playSfx('ui_click');
      setSelectedHero(hero);
      selectedHeroRef.current = hero;
      setExitNotice(false);
      setPracticeOpen(false);
      keysHeldRef.current.clear();
      queuedEdgesRef.current.clear();
      engineRef.current?.startPracticeMode(hero, opponent, arena);
      syncHudNow();
    },
    [syncHudNow]
  );

  const handleTogglePause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.screenState === 'playing') {
      engine.setPaused(true);
      keysHeldRef.current.clear();
      queuedEdgesRef.current.clear();
      syncHudNow();
    } else if (engine.screenState === 'paused') {
      setSettingsOpen(false);
      engine.setPaused(false);
      keysHeldRef.current.clear();
      queuedEdgesRef.current.clear();
      syncHudNow();
    }
  }, [syncHudNow]);

  const handleToggleMute = useCallback(() => {
    audioEngine.unlock();
    const next = !audioEngine.isMuted();
    audioEngine.setMuted(next);
    setMuted(next);
  }, []);

  const handleUpdateSettings = useCallback((next: GameSettings) => {
    setSettings(next);
    if (engineRef.current) {
      engineRef.current.settings = { ...next };
    }
    audioEngine.setVolumes(next.musicVolume, next.sfxVolume);
  }, []);

  const handleReturnTitle = useCallback(() => {
    audioEngine.playSfx('ui_click');
    audioEngine.stopMusic();
    setSettingsOpen(false);
    setPracticeOpen(false);
    keysHeldRef.current.clear();
    queuedEdgesRef.current.clear();
    engineRef.current?.startTitleBackdrop(selectedHeroRef.current);
    syncHudNow();
  }, [syncHudNow]);

  const handleTriggerAbility = useCallback(
    (
      ability:
        | 'skill_1'
        | 'skill_2'
        | 'skill_3'
        | 'skill_4'
        | 'skill_5_domain'
        | 'parry'
    ) => {
      audioEngine.unlock();
      const map = {
        skill_1: 'KeyU',
        skill_2: 'KeyI',
        skill_3: 'KeyO',
        skill_4: 'KeyH',
        skill_5_domain: 'KeyY',
        parry: 'KeyQ',
      };
      queuedEdgesRef.current.add(map[ability]);
    },
    []
  );

  // Keyboard Listeners + Autostart Check
  useEffect(() => {
    const engine = engineRef.current!;
    const params = new URLSearchParams(window.location.search);
    const heroParam = params.get('hero') as PlayableFighterId | null;
    if (heroParam && PLAYABLE_LIST.includes(heroParam)) {
      setSelectedHero(heroParam);
      selectedHeroRef.current = heroParam;
    }

    if (params.get('autostart') === '1') {
      engine.startStoryMode(0, selectedHeroRef.current);
      setHud(engine.getHudSnapshot());
    } else {
      engine.startTitleBackdrop(selectedHeroRef.current);
      setHud(engine.getHudSnapshot());
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      audioEngine.unlock();

      if (e.code === 'KeyM') {
        handleToggleMute();
        return;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (modalOpenRef.current) {
          setPracticeOpen(false);
          setSettingsOpen(false);
          return;
        }
        if (engine.screenState === 'playing' || engine.screenState === 'paused') {
          e.preventDefault();
          handleTogglePause();
          return;
        }
      }

      if (engine.screenState === 'title' && !modalOpenRef.current) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartStory();
          return;
        }
      }

      if (engine.screenState === 'playing') {
        if (
          e.code === 'Space' ||
          e.code === 'ArrowUp' ||
          e.code === 'ArrowDown' ||
          e.code === 'ArrowLeft' ||
          e.code === 'ArrowRight'
        ) {
          e.preventDefault();
        }
        keysHeldRef.current.add(e.code);
        queuedEdgesRef.current.add(e.code);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.code);
    };

    const clearHeld = () => {
      keysHeldRef.current.clear();
      queuedEdgesRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearHeld);
    document.addEventListener('visibilitychange', clearHeld);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearHeld);
      document.removeEventListener('visibilitychange', clearHeld);
      audioEngine.stopMusic();
    };
  }, [handleStartStory, handleToggleMute, handleTogglePause]);

  // Isolated 60FPS Simulation & Canvas Render Loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();
    let lastHudSignature = '';
    let hudTickAccum = 0;

    const frame = (now: number) => {
      const dt = (now - lastTs) / 1000;
      lastTs = now;

      const engine = engineRef.current!;
      const held = keysHeldRef.current;
      const edges = queuedEdgesRef.current;

      const input: InputState = {
        left: held.has('KeyA') || held.has('ArrowLeft'),
        right: held.has('KeyD') || held.has('ArrowRight'),
        up: held.has('KeyW') || held.has('ArrowUp'),
        down: held.has('KeyS') || held.has('ArrowDown'),
        block: held.has('KeyL') || held.has('ShiftLeft') || held.has('ShiftRight'),
        justUp: edges.has('KeyW') || edges.has('ArrowUp'),
        justDown: edges.has('KeyS') || edges.has('ArrowDown') || edges.has('KeyC'),
        justDash: edges.has('Space'),
        justLight: edges.has('KeyJ') || edges.has('KeyZ'),
        justHeavy: edges.has('KeyK') || edges.has('KeyX'),
        justBlock: edges.has('KeyL') || edges.has('ShiftLeft') || edges.has('ShiftRight'),
        justParry: edges.has('KeyQ') || edges.has('KeyF'),
        justSkill1: edges.has('KeyU') || edges.has('Digit1'),
        justSkill2: edges.has('KeyI') || edges.has('Digit2'),
        justSkill3: edges.has('KeyO') || edges.has('Digit3'),
        justSkill4: edges.has('KeyH') || edges.has('Digit4'),
        justSkill5: edges.has('KeyY') || edges.has('Digit5'),
      };
      edges.clear();

      engine.step(dt, input);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderGameFrame(ctx, engine.getRenderState());
        }
      }

      // Throttled discrete HUD state sync
      hudTickAccum += dt;
      if (hudTickAccum >= 0.065) {
        hudTickAccum = 0;
        const snap = engine.getHudSnapshot();
        const sig = `${snap.screenState}|${snap.roundPhase}|${snap.roundTimer}|${snap.playerId}|${snap.playerHp}|${snap.playerGhostHp}|${snap.playerCe}|${snap.playerInfinity}|${snap.playerBuffTimer}|${snap.playerRounds}|${snap.playerCombo}|${snap.playerComboMultiplier}|${snap.enemyHp}|${snap.enemyGhostHp}|${snap.enemyRounds}|${snap.enemyBossPhase}|${snap.score}|${snap.bannerText}|${snap.domainActive}|${snap.stageIndex}`;
        if (sig !== lastHudSignature) {
          lastHudSignature = sig;
          setHud(snap);
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <main className="relative w-screen h-screen bg-[#08070e] flex items-center justify-center overflow-hidden">
      {/* Crisp Pixel-Art Game Viewport */}
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        width={WORLD_WIDTH}
        height={WORLD_HEIGHT}
        className="w-full h-full object-contain pixel-canvas"
      />

      {/* Screen Overlays */}
      {hud.screenState === 'title' && (
        <TitleScreen
          selectedHero={selectedHero}
          onSelectHero={handleSelectHero}
          onStartStory={handleStartStory}
          onOpenPractice={() => {
            audioEngine.unlock();
            audioEngine.playSfx('ui_click');
            setPracticeOpen(true);
          }}
          onOpenSettings={() => {
            audioEngine.unlock();
            audioEngine.playSfx('ui_click');
            setSettingsOpen(true);
          }}
          onExit={() => {
            audioEngine.playSfx('ui_click');
            audioEngine.stopMusic();
            setExitNotice(true);
          }}
          exitNotice={exitNotice}
          muted={muted}
          onToggleMute={handleToggleMute}
        />
      )}

      {(hud.screenState === 'playing' || hud.screenState === 'paused') && (
        <CombatHud
          hud={hud}
          muted={muted}
          onToggleMute={handleToggleMute}
          onPause={handleTogglePause}
          onTriggerAbility={handleTriggerAbility}
        />
      )}

      {/* Mobile Touch Controls during active combat */}
      {hud.screenState === 'playing' && (
        <div className="md:hidden fixed bottom-3 inset-x-3 z-15 flex justify-between pointer-events-none">
          <div className="flex gap-1.5 pointer-events-auto">
            <button
              type="button"
              onPointerDown={() => keysHeldRef.current.add('KeyA')}
              onPointerUp={() => keysHeldRef.current.delete('KeyA')}
              onPointerLeave={() => keysHeldRef.current.delete('KeyA')}
              className="pixel-btn bg-[#131122]/90 w-10 h-10 text-xs font-bold"
              aria-label="Move Left"
            >
              ◀
            </button>
            <button
              type="button"
              onPointerDown={() => {
                keysHeldRef.current.add('KeyW');
                queuedEdgesRef.current.add('KeyW');
              }}
              onPointerUp={() => keysHeldRef.current.delete('KeyW')}
              className="pixel-btn bg-[#131122]/90 w-10 h-10 text-xs font-bold"
              aria-label="Jump"
            >
              ▲
            </button>
            <button
              type="button"
              onPointerDown={() => keysHeldRef.current.add('KeyD')}
              onPointerUp={() => keysHeldRef.current.delete('KeyD')}
              onPointerLeave={() => keysHeldRef.current.delete('KeyD')}
              className="pixel-btn bg-[#131122]/90 w-10 h-10 text-xs font-bold"
              aria-label="Move Right"
            >
              ▶
            </button>
          </div>
          <div className="flex gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => queuedEdgesRef.current.add('KeyQ')}
              className="pixel-btn bg-[#78350f]/90 px-2.5 h-10 text-xs font-bold text-amber-200"
            >
              PRY
            </button>
            <button
              type="button"
              onPointerDown={() => {
                keysHeldRef.current.add('KeyL');
                queuedEdgesRef.current.add('KeyL');
              }}
              onPointerUp={() => keysHeldRef.current.delete('KeyL')}
              onPointerLeave={() => keysHeldRef.current.delete('KeyL')}
              className="pixel-btn bg-[#1e293b]/90 px-2.5 h-10 text-xs font-bold"
            >
              BLK
            </button>
            <button
              type="button"
              onClick={() => queuedEdgesRef.current.add('KeyJ')}
              className="pixel-btn bg-[#1d4ed8]/90 px-2.5 h-10 text-xs font-bold"
            >
              ATK
            </button>
            <button
              type="button"
              onClick={() => queuedEdgesRef.current.add('KeyK')}
              className="pixel-btn bg-[#b91c1c]/90 px-2.5 h-10 text-xs font-bold"
            >
              HVY
            </button>
          </div>
        </div>
      )}

      {hud.screenState === 'paused' && !settingsOpen && (
        <PauseModal
          onResume={handleTogglePause}
          onRestart={() => {
            audioEngine.playSfx('ui_click');
            engineRef.current?.retryMatch();
            syncHudNow();
          }}
          onOpenSettings={() => {
            audioEngine.playSfx('ui_click');
            setSettingsOpen(true);
          }}
          onTitle={handleReturnTitle}
        />
      )}

      {hud.screenState === 'gameover' && (
        <MatchResultModal
          hud={hud}
          onContinueStory={() => {
            audioEngine.playSfx('ui_click');
            engineRef.current?.advanceStoryStage();
            syncHudNow();
          }}
          onRetry={() => {
            audioEngine.playSfx('ui_click');
            engineRef.current?.retryMatch();
            syncHudNow();
          }}
          onTitle={handleReturnTitle}
        />
      )}

      {practiceOpen && (
        <PracticeModal
          initialHero={selectedHero}
          autoCe={settings.practiceAutoCe}
          aiActive={settings.practiceAiActive}
          onToggleAutoCe={(val) => handleUpdateSettings({ ...settings, practiceAutoCe: val })}
          onToggleAiActive={(val) => handleUpdateSettings({ ...settings, practiceAiActive: val })}
          onStart={handleStartPractice}
          onClose={() => setPracticeOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          playerId={selectedHero}
          settings={settings}
          onUpdate={handleUpdateSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </main>
  );
}
