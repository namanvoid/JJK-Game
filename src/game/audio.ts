import { ArenaProfile } from './roster';

export type SoundEffect =
  | 'light_hit'
  | 'heavy_hit'
  | 'block'
  | 'parry'
  | 'dash'
  | 'jump'
  | 'blue'
  | 'red'
  | 'purple'
  | 'infinity'
  | 'void'
  | 'katana'
  | 'heal'
  | 'ice'
  | 'lightning'
  | 'drum'
  | 'fire'
  | 'blood'
  | 'blade'
  | 'roots'
  | 'slash'
  | 'shrine'
  | 'domain'
  | 'round_start'
  | 'ko'
  | 'victory'
  | 'defeat'
  | 'ui_click';

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  private musicVolume = 0.45;
  private sfxVolume = 0.7;
  private muted = false;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private currentTheme: ArenaProfile['musicTheme'] | 'title' | null = null;

  private ensureContext(allowCreate = false): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      if (!allowCreate && !this.unlocked) return null;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended' && this.unlocked) {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.unlocked = true;
    this.ensureContext(true);
  }

  public setVolumes(music: number, sfx: number): void {
    this.musicVolume = Math.max(0, Math.min(1, music));
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private getEffectiveSfxGain(): number {
    return this.muted ? 0 : this.sfxVolume;
  }

  private getEffectiveMusicGain(): number {
    return this.muted ? 0 : this.musicVolume;
  }

  public playSfx(effect: SoundEffect): void {
    const vol = this.getEffectiveSfxGain();
    if (vol <= 0.01) return;
    const ctx = this.ensureContext(false);
    if (!ctx) return;

    const now = ctx.currentTime;
    const pitchJitter = 0.92 + Math.random() * 0.16;

    switch (effect) {
      case 'ui_click': {
        this.tone(ctx, 'square', 540, 780, 0.055, 0.11 * vol, now);
        break;
      }
      case 'dash': {
        this.noiseBurst(ctx, 0.11, 1400, 350, 0.18 * vol, now);
        this.tone(ctx, 'triangle', 260 * pitchJitter, 140, 0.09, 0.12 * vol, now);
        break;
      }
      case 'jump': {
        this.tone(ctx, 'triangle', 190 * pitchJitter, 420, 0.11, 0.14 * vol, now);
        break;
      }
      case 'light_hit': {
        this.noiseBurst(ctx, 0.07, 1900, 520, 0.28 * vol, now);
        this.tone(ctx, 'square', 235 * pitchJitter, 90, 0.08, 0.22 * vol, now);
        break;
      }
      case 'heavy_hit': {
        this.noiseBurst(ctx, 0.16, 1200, 120, 0.42 * vol, now);
        this.tone(ctx, 'sawtooth', 180 * pitchJitter, 48, 0.19, 0.35 * vol, now);
        break;
      }
      case 'block': {
        this.tone(ctx, 'square', 440 * pitchJitter, 210, 0.08, 0.2 * vol, now);
        this.tone(ctx, 'triangle', 760, 480, 0.07, 0.14 * vol, now);
        break;
      }
      case 'parry': {
        this.tone(ctx, 'sine', 1046, 1568, 0.16, 0.28 * vol, now);
        this.tone(ctx, 'triangle', 1396, 2093, 0.22, 0.24 * vol, now + 0.025);
        this.noiseBurst(ctx, 0.08, 3200, 1800, 0.18 * vol, now);
        break;
      }
      case 'blue': {
        this.tone(ctx, 'sine', 160, 460, 0.32, 0.25 * vol, now);
        this.tone(ctx, 'triangle', 320, 210, 0.35, 0.18 * vol, now + 0.05);
        break;
      }
      case 'red': {
        this.tone(ctx, 'sawtooth', 540, 88, 0.28, 0.32 * vol, now);
        this.noiseBurst(ctx, 0.24, 1600, 220, 0.34 * vol, now + 0.04);
        break;
      }
      case 'purple': {
        this.tone(ctx, 'sawtooth', 120, 580, 0.25, 0.28 * vol, now);
        this.tone(ctx, 'square', 380, 72, 0.52, 0.34 * vol, now + 0.15);
        this.noiseBurst(ctx, 0.45, 2200, 180, 0.38 * vol, now + 0.16);
        break;
      }
      case 'infinity': {
        this.tone(ctx, 'sine', 520, 880, 0.25, 0.2 * vol, now);
        this.tone(ctx, 'sine', 780, 1180, 0.28, 0.15 * vol, now + 0.06);
        break;
      }
      case 'katana': {
        this.tone(ctx, 'sawtooth', 1250 * pitchJitter, 420, 0.11, 0.24 * vol, now);
        this.noiseBurst(ctx, 0.09, 4200, 1400, 0.2 * vol, now);
        break;
      }
      case 'heal': {
        [523, 659, 784, 1046].forEach((f, idx) => {
          this.tone(ctx, 'sine', f, f * 1.03, 0.14, 0.18 * vol, now + idx * 0.055);
        });
        break;
      }
      case 'ice': {
        this.tone(ctx, 'triangle', 1480, 880, 0.18, 0.24 * vol, now);
        this.noiseBurst(ctx, 0.16, 4800, 2200, 0.24 * vol, now);
        break;
      }
      case 'lightning': {
        this.noiseBurst(ctx, 0.22, 3600, 480, 0.34 * vol, now);
        this.tone(ctx, 'sawtooth', 980, 140, 0.18, 0.28 * vol, now);
        break;
      }
      case 'drum': {
        this.tone(ctx, 'sine', 165, 48, 0.22, 0.38 * vol, now);
        this.noiseBurst(ctx, 0.12, 900, 180, 0.28 * vol, now);
        break;
      }
      case 'void':
      case 'domain': {
        this.tone(ctx, 'sine', 880, 110, 0.65, 0.32 * vol, now);
        this.tone(ctx, 'triangle', 1320, 260, 0.7, 0.24 * vol, now + 0.08);
        this.noiseBurst(ctx, 0.4, 3000, 400, 0.22 * vol, now + 0.12);
        break;
      }
      case 'fire': {
        this.noiseBurst(ctx, 0.26, 950, 180, 0.3 * vol, now);
        this.tone(ctx, 'sawtooth', 190, 85, 0.22, 0.2 * vol, now);
        break;
      }
      case 'blood': {
        this.noiseBurst(ctx, 0.16, 2600, 650, 0.26 * vol, now);
        this.tone(ctx, 'sawtooth', 620, 280, 0.14, 0.22 * vol, now);
        break;
      }
      case 'blade': {
        this.tone(ctx, 'triangle', 920 * pitchJitter, 340, 0.12, 0.26 * vol, now);
        this.noiseBurst(ctx, 0.08, 3200, 1100, 0.2 * vol, now);
        break;
      }
      case 'roots': {
        this.tone(ctx, 'sawtooth', 110, 58, 0.28, 0.28 * vol, now);
        this.noiseBurst(ctx, 0.22, 650, 120, 0.26 * vol, now);
        break;
      }
      case 'slash': {
        this.tone(ctx, 'sawtooth', 1100 * pitchJitter, 240, 0.13, 0.28 * vol, now);
        this.noiseBurst(ctx, 0.1, 3400, 900, 0.24 * vol, now);
        break;
      }
      case 'shrine': {
        this.tone(ctx, 'sawtooth', 95, 55, 0.7, 0.34 * vol, now);
        this.tone(ctx, 'square', 220, 110, 0.55, 0.24 * vol, now + 0.05);
        this.noiseBurst(ctx, 0.45, 2400, 260, 0.32 * vol, now + 0.1);
        break;
      }
      case 'round_start': {
        this.tone(ctx, 'square', 330, 330, 0.1, 0.2 * vol, now);
        this.tone(ctx, 'square', 440, 660, 0.18, 0.24 * vol, now + 0.12);
        break;
      }
      case 'ko': {
        this.tone(ctx, 'sawtooth', 280, 62, 0.45, 0.35 * vol, now);
        this.noiseBurst(ctx, 0.35, 1200, 150, 0.35 * vol, now);
        break;
      }
      case 'victory': {
        [440, 554, 659, 880].forEach((f, idx) => {
          this.tone(ctx, 'triangle', f, f * 1.01, 0.22, 0.22 * vol, now + idx * 0.11);
        });
        break;
      }
      case 'defeat': {
        [330, 293, 246, 196].forEach((f, idx) => {
          this.tone(ctx, 'sawtooth', f, f * 0.96, 0.24, 0.18 * vol, now + idx * 0.14);
        });
        break;
      }
    }
  }

  private tone(
    ctx: AudioContext,
    type: OscillatorType,
    freqStart: number,
    freqEnd: number,
    duration: number,
    gainVal: number,
    startTime: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(25, freqStart), startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25, freqEnd), startTime + duration);

    gain.gain.setValueAtTime(Math.max(0.001, gainVal), startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private noiseBurst(
    ctx: AudioContext,
    duration: number,
    filterStart: number,
    filterEnd: number,
    gainVal: number,
    startTime: number
  ): void {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterStart, startTime);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, filterEnd), startTime + duration);
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.max(0.001, gainVal), startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(startTime);
    noise.stop(startTime + duration + 0.01);
  }

  public startMusic(theme: ArenaProfile['musicTheme'] | 'title'): void {
    if (this.currentTheme === theme && this.bgmTimer !== null) return;
    this.stopMusic();
    this.currentTheme = theme;
    this.bgmStep = 0;

    const stepMs = theme === 'shrine' ? 132 : theme === 'shibuya' ? 148 : 168;
    this.bgmTimer = window.setInterval(() => {
      this.tickBgm(theme);
    }, stepMs);
  }

  public stopMusic(): void {
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.currentTheme = null;
  }

  private tickBgm(theme: ArenaProfile['musicTheme'] | 'title'): void {
    const vol = this.getEffectiveMusicGain();
    if (vol <= 0.01) return;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;
    const step = this.bgmStep++ % 16;

    const patterns: Record<string, { bass: number[]; lead: number[]; arp: number[] }> = {
      title: {
        bass: [110, 0, 110, 0, 130.8, 0, 146.8, 0, 98, 0, 98, 0, 123.5, 0, 130.8, 0],
        lead: [440, 0, 523.3, 0, 659.3, 0, 587.3, 0, 493.9, 0, 440, 0, 392, 0, 440, 0],
        arp: [220, 261.6, 329.6, 261.6, 220, 261.6, 329.6, 392, 196, 246.9, 293.7, 246.9, 220, 261.6, 329.6, 261.6],
      },
      jujutsu: {
        bass: [130.8, 130.8, 0, 146.8, 164.8, 0, 146.8, 130.8, 110, 110, 0, 123.5, 130.8, 0, 146.8, 0],
        lead: [523.3, 0, 659.3, 587.3, 523.3, 0, 392, 440, 493.9, 0, 523.3, 0, 587.3, 659.3, 523.3, 0],
        arp: [261.6, 329.6, 392, 329.6, 293.7, 349.2, 440, 349.2, 220, 261.6, 329.6, 261.6, 261.6, 329.6, 392, 440],
      },
      school: {
        bass: [98, 0, 116.5, 0, 98, 0, 130.8, 0, 92.5, 0, 110, 0, 98, 0, 87.3, 0],
        lead: [392, 0, 466.2, 0, 392, 440, 0, 349.2, 392, 0, 311.1, 0, 293.7, 0, 349.2, 0],
        arp: [196, 233.1, 293.7, 233.1, 196, 233.1, 311.1, 233.1, 185, 220, 293.7, 220, 196, 233.1, 293.7, 349.2],
      },
      forest: {
        bass: [110, 0, 110, 130.8, 146.8, 0, 110, 0, 98, 0, 98, 110, 123.5, 0, 98, 0],
        lead: [440, 523.3, 0, 659.3, 587.3, 0, 523.3, 0, 440, 392, 0, 440, 493.9, 0, 392, 0],
        arp: [220, 261.6, 329.6, 440, 293.7, 349.2, 440, 349.2, 196, 246.9, 293.7, 392, 220, 261.6, 329.6, 261.6],
      },
      shibuya: {
        bass: [123.5, 123.5, 0, 146.8, 164.8, 0, 185, 0, 146.8, 146.8, 0, 164.8, 138.6, 0, 123.5, 0],
        lead: [493.9, 0, 587.3, 659.3, 740, 0, 659.3, 587.3, 493.9, 0, 440, 493.9, 587.3, 0, 659.3, 0],
        arp: [246.9, 293.7, 369.9, 493.9, 293.7, 369.9, 440, 587.3, 246.9, 293.7, 369.9, 493.9, 220, 293.7, 369.9, 440],
      },
      shrine: {
        bass: [82.4, 82.4, 110, 82.4, 98, 82.4, 116.5, 82.4, 82.4, 82.4, 123.5, 110, 98, 92.5, 87.3, 82.4],
        lead: [329.6, 440, 0, 493.9, 466.2, 0, 440, 392, 329.6, 0, 523.3, 493.9, 440, 392, 349.2, 329.6],
        arp: [164.8, 220, 246.9, 329.6, 196, 246.9, 293.7, 392, 164.8, 220, 261.6, 329.6, 196, 233.1, 293.7, 349.2],
      },
    };

    const p = patterns[theme] || patterns.jujutsu;
    const bassFreq = p.bass[step];
    const leadFreq = p.lead[step];
    const arpFreq = p.arp[step];

    // Kick drum on 0, 4, 8, 12 (and syncopated 10 in intense fights)
    if (step % 4 === 0 || (theme === 'shrine' && step === 10)) {
      this.tone(ctx, 'sine', 120, 42, 0.08, 0.14 * vol, now);
    }
    // Snare/hat groove
    if (step % 4 === 2) {
      this.noiseBurst(ctx, 0.045, 2200, 900, 0.06 * vol, now);
    } else if (step % 2 === 1) {
      this.noiseBurst(ctx, 0.02, 5500, 3500, 0.025 * vol, now);
    }

    if (bassFreq > 0) {
      this.tone(ctx, theme === 'shrine' ? 'sawtooth' : 'triangle', bassFreq, bassFreq * 0.99, 0.13, 0.1 * vol, now);
    }
    if (arpFreq > 0) {
      this.tone(ctx, 'triangle', arpFreq, arpFreq, 0.08, 0.032 * vol, now);
    }
    if (leadFreq > 0 && step % 2 === 0) {
      this.tone(ctx, theme === 'shrine' ? 'square' : 'sine', leadFreq, leadFreq, 0.12, 0.055 * vol, now);
    }
  }
}

export const audioEngine = new GameAudioEngine();
