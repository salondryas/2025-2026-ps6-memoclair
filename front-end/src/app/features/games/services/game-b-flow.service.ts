import { Injectable } from '@angular/core';

export type GameBAutoNextMode = 'manual' | '5s' | '8s';

interface ManagedTimeout {
  key: string;
  callback: () => void;
  remainingMs: number;
  dueAt: number;
  timeoutId: number | null;
}

interface CountdownState {
  onTick: (seconds: number | null) => void;
  remainingMs: number;
  dueAt: number;
  intervalId: number | null;
  lastSecond: number | null;
}

export interface GameBQuestionFlowConfig {
  hintDelayMs: number;
  revealDelayMs: number;
  autoNextMode: GameBAutoNextMode;
  onHint: () => void;
  onAutoReveal: () => void;
  onAutoNext: () => void;
  onCountdownTick: (seconds: number | null) => void;
}

export interface GameBResolutionFlowConfig {
  autoNextMode: GameBAutoNextMode;
  onAutoNext: () => void;
  onCountdownTick: (seconds: number | null) => void;
}

@Injectable({ providedIn: 'root' })
export class GameBFlowService {
  private paused = false;
  private readonly timeouts = new Map<string, ManagedTimeout>();
  private countdown: CountdownState | null = null;

  startQuestionFlow(config: GameBQuestionFlowConfig): void {
    this.clear();

    this.scheduleTimeout('hint', config.hintDelayMs, config.onHint);
    this.scheduleTimeout('reveal', config.revealDelayMs, config.onAutoReveal);

    const autoNextDelay = this.resolveAutoNextDelay(config.autoNextMode);
    if (autoNextDelay === null) {
      config.onCountdownTick(null);
      return;
    }

    this.scheduleTimeout(`countdown-start`, config.revealDelayMs, () => {
      this.startCountdown(autoNextDelay, config.onCountdownTick);
    });

    this.scheduleTimeout('auto-next', config.revealDelayMs + autoNextDelay, () => {
      config.onCountdownTick(null);
      config.onAutoNext();
    });
  }

  startResolutionFlow(config: GameBResolutionFlowConfig): void {
    this.clear();

    const autoNextDelay = this.resolveAutoNextDelay(config.autoNextMode);
    if (autoNextDelay === null) {
      config.onCountdownTick(null);
      return;
    }

    this.startCountdown(autoNextDelay, config.onCountdownTick);
    this.scheduleTimeout('auto-next', autoNextDelay, () => {
      config.onCountdownTick(null);
      config.onAutoNext();
    });
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    const now = Date.now();

    for (const timeout of this.timeouts.values()) {
      if (timeout.timeoutId !== null) window.clearTimeout(timeout.timeoutId);
      timeout.timeoutId = null;
      timeout.remainingMs = Math.max(0, timeout.dueAt - now);
    }

    if (!this.countdown) return;
    if (this.countdown.intervalId !== null) {
      window.clearInterval(this.countdown.intervalId);
    }
    this.countdown.intervalId = null;
    this.countdown.remainingMs = Math.max(0, this.countdown.dueAt - now);
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;

    for (const timeout of this.timeouts.values()) {
      this.scheduleExistingTimeout(timeout);
    }

    if (!this.countdown || this.countdown.remainingMs <= 0) return;
    this.resumeCountdown(this.countdown);
  }

  clear(): void {
    for (const timeout of this.timeouts.values()) {
      if (timeout.timeoutId !== null) window.clearTimeout(timeout.timeoutId);
    }
    this.timeouts.clear();
    this.clearCountdown(false);
    this.paused = false;
  }

  private resolveAutoNextDelay(mode: GameBAutoNextMode): number | null {
    if (mode === 'manual') return null;
    return mode === '8s' ? 8000 : 5000;
  }

  private scheduleTimeout(key: string, delayMs: number, callback: () => void): void {
    const timeout: ManagedTimeout = {
      key,
      callback,
      remainingMs: Math.max(0, delayMs),
      dueAt: Date.now() + Math.max(0, delayMs),
      timeoutId: null,
    };

    this.timeouts.set(key, timeout);
    if (this.paused) return;
    this.scheduleExistingTimeout(timeout);
  }

  private scheduleExistingTimeout(timeout: ManagedTimeout): void {
    timeout.dueAt = Date.now() + timeout.remainingMs;
    timeout.timeoutId = window.setTimeout(() => {
      this.timeouts.delete(timeout.key);
      timeout.callback();
    }, timeout.remainingMs);
  }

  private startCountdown(durationMs: number, onTick: (seconds: number | null) => void): void {
    this.clearCountdown(false);
    const remainingMs = Math.max(0, durationMs);
    const countdown: CountdownState = {
      onTick,
      remainingMs,
      dueAt: Date.now() + remainingMs,
      intervalId: null,
      lastSecond: null,
    };

    this.countdown = countdown;
    if (this.paused) return;
    this.resumeCountdown(countdown);
  }

  private resumeCountdown(countdown: CountdownState): void {
    countdown.dueAt = Date.now() + countdown.remainingMs;
    this.emitCountdownTick(countdown);
    countdown.intervalId = window.setInterval(() => {
      const remaining = Math.max(0, countdown.dueAt - Date.now());
      countdown.remainingMs = remaining;
      this.emitCountdownTick(countdown);
      if (remaining <= 0) this.clearCountdown(false);
    }, 200);
  }

  private emitCountdownTick(countdown: CountdownState): void {
    const seconds = Math.ceil(countdown.remainingMs / 1000);
    if (seconds === countdown.lastSecond) return;
    countdown.lastSecond = seconds;
    countdown.onTick(seconds > 0 ? seconds : null);
  }

  private clearCountdown(emitReset: boolean): void {
    if (!this.countdown) return;
    if (this.countdown.intervalId !== null) window.clearInterval(this.countdown.intervalId);
    if (emitReset) this.countdown.onTick(null);
    this.countdown = null;
  }
}
