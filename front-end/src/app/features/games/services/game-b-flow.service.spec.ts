import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { GameBFlowService } from './game-b-flow.service';

describe('GameBFlowService', () => {
  let service: GameBFlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameBFlowService);
  });

  it('triggers hint, auto reveal and auto next with countdown in order', fakeAsync(() => {
    const events: string[] = [];
    const countdown: number[] = [];

    service.startQuestionFlow({
      hintDelayMs: 2000,
      revealDelayMs: 6000,
      autoNextMode: '5s',
      onHint: () => events.push('hint'),
      onAutoReveal: () => events.push('reveal'),
      onAutoNext: () => events.push('next'),
      onCountdownTick: (value) => {
        if (value !== null) countdown.push(value);
      },
    });

    tick(2000);
    expect(events).toEqual(['hint']);

    tick(4000);
    expect(events).toEqual(['hint', 'reveal']);

    tick(1000);
    expect(countdown).toContain(5);

    tick(4000);
    expect(events).toEqual(['hint', 'reveal', 'next']);
  }));

  it('pauses and resumes pending timers', fakeAsync(() => {
    const events: string[] = [];

    service.startQuestionFlow({
      hintDelayMs: 2000,
      revealDelayMs: 6000,
      autoNextMode: 'manual',
      onHint: () => events.push('hint'),
      onAutoReveal: () => events.push('reveal'),
      onAutoNext: () => events.push('next'),
      onCountdownTick: () => {},
    });

    tick(1000);
    service.pause();
    tick(3000);
    expect(events).toEqual([]);

    service.resume();
    tick(1000);
    expect(events).toEqual(['hint']);

    tick(4000);
    expect(events).toEqual(['hint', 'reveal']);
  }));

  it('does not schedule auto-next in manual resolution mode', fakeAsync(() => {
    const events: string[] = [];
    const ticks: Array<number | null> = [];

    service.startResolutionFlow({
      autoNextMode: 'manual',
      onAutoNext: () => events.push('next'),
      onCountdownTick: (value) => ticks.push(value),
    });

    tick(10000);
    expect(events).toEqual([]);
    expect(ticks).toContain(null);
  }));

  it('runs auto-next with countdown in 8s resolution mode', fakeAsync(() => {
    const events: string[] = [];
    const ticks: number[] = [];

    service.startResolutionFlow({
      autoNextMode: '8s',
      onAutoNext: () => events.push('next'),
      onCountdownTick: (value) => {
        if (value !== null) ticks.push(value);
      },
    });

    tick(500);
    expect(ticks[0]).toBe(8);

    tick(7500);
    expect(events).toEqual(['next']);
  }));

  it('clears pending timers at session end', fakeAsync(() => {
    const events: string[] = [];

    service.startQuestionFlow({
      hintDelayMs: 1000,
      revealDelayMs: 4000,
      autoNextMode: '5s',
      onHint: () => events.push('hint'),
      onAutoReveal: () => events.push('reveal'),
      onAutoNext: () => events.push('next'),
      onCountdownTick: () => {},
    });

    tick(900);
    service.clear();
    tick(10000);
    expect(events).toEqual([]);
  }));
});
