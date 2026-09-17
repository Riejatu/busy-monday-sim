// Drives the simulated workday: 8:00 to 17:00, an hour of in-fiction time every
// two real minutes, with the taskbar reading in 15-minute steps.
//
// Framework-free and DOM-free on purpose - it reports elapsed simulated minutes and
// lets the caller decide what to draw. `now` is injectable so the behaviour is
// testable without waiting on a real clock.

export interface SimClockOptions {
  /** Total simulated minutes in the day, e.g. 540 for 08:00-17:00. */
  totalMinutes: number;
  /** Real minutes that one simulated hour should take. */
  realMinutesPerSimHour: number;
  /** Granularity of the visible time, e.g. 15 for quarter-hour steps. */
  displayStepMinutes: number;
  /** Fires when the displayed (stepped) time changes, and once on start. */
  onTick: (simMinutesFromStart: number) => void;
  /**
   * Fires on every poll with the unstepped elapsed minutes. The event engine needs
   * this: triggers are evaluated continuously, not only when the visible clock rolls
   * over to the next quarter hour.
   */
  onAdvance?: (rawSimMinutes: number) => void;
  /** Fires once, when the day reaches its end. */
  onDayEnd?: () => void;
  /** Injectable clock source for tests. */
  now?: () => number;
}

export interface SimClock {
  start: () => void;
  stop: () => void;
  /**
   * Freezes the simulated day. Paused stretches are deducted, so resuming continues
   * from where it stopped rather than jumping forward.
   */
  pause: () => void;
  resume: () => void;
  isPaused: () => boolean;
  /**
   * Skips ahead by simulated minutes. No effect once the day has ended.
   *
   * The amount is the caller's decision, not the clock's: how far one keypress should jump
   * is an interaction question, and it lives beside the key binding in main.ts.
   */
  fastForward: (minutes: number) => void;
  /** Elapsed simulated minutes, stepped to the display granularity. */
  getDisplayedMinutes: () => number;
  isFinished: () => boolean;
}

const POLL_INTERVAL_MS = 1000;

export function createSimClock(options: SimClockOptions): SimClock {
  const {
    totalMinutes,
    realMinutesPerSimHour,
    displayStepMinutes,
    onTick,
    onAdvance,
    onDayEnd,
    now = () => Date.now()
  } = options;

  // 1 simulated hour per `realMinutesPerSimHour` real minutes.
  const simMinutesPerRealMs = 60 / (realMinutesPerSimHour * 60_000);

  let startedAt: number | null = null;
  let intervalId: number | null = null;
  let fastForwardMinutes = 0;
  let pausedAccumulatedMs = 0;
  let pausedSince: number | null = null;
  let lastDisplayed: number | null = null;
  let highWaterMinutes = 0;
  let finished = false;

  /**
   * Derived from elapsed wall-clock time rather than accumulated per tick, so a
   * throttled background tab catches up instead of falling behind.
   */
  function rawMinutes(): number {
    if (startedAt === null) {
      return 0;
    }

    const pausedNow = pausedSince === null ? 0 : now() - pausedSince;
    const runningMs = now() - startedAt - pausedAccumulatedMs - pausedNow;
    const elapsed = runningMs * simMinutesPerRealMs + fastForwardMinutes;

    return Math.min(Math.max(elapsed, 0), totalMinutes);
  }

  /**
   * Monotonic: a workday clock must never run backwards. Date.now() can jump back
   * (an NTP correction, a user changing the system clock), so the stepped value is
   * latched at its high-water mark, and pinned to the end once the day is over.
   */
  function displayedMinutes(): number {
    if (finished) {
      return totalMinutes;
    }

    const stepped = Math.floor(rawMinutes() / displayStepMinutes) * displayStepMinutes;
    highWaterMinutes = Math.max(highWaterMinutes, stepped);

    return highWaterMinutes;
  }

  function tick(): void {
    onAdvance?.(rawMinutes());

    const displayed = displayedMinutes();

    if (displayed !== lastDisplayed) {
      lastDisplayed = displayed;
      onTick(displayed);
    }

    if (!finished && rawMinutes() >= totalMinutes) {
      finished = true;
      stop();
      onDayEnd?.();
    }
  }

  function start(): void {
    if (startedAt !== null) {
      // Already running; re-emit so a freshly rendered taskbar shows the time.
      onTick(lastDisplayed ?? 0);
      return;
    }

    startedAt = now();
    tick();

    intervalId = setInterval(tick, POLL_INTERVAL_MS);
  }

  function stop(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function fastForward(minutes: number): void {
    // Refused while paused: the day is deliberately stopped, and banking a skip now would
    // make it lurch forward the moment it resumes.
    if (finished || startedAt === null || pausedSince !== null) {
      return;
    }

    fastForwardMinutes += minutes;
    tick();
  }

  function pause(): void {
    if (startedAt === null || finished || pausedSince !== null) {
      return;
    }

    pausedSince = now();
  }

  function resume(): void {
    if (pausedSince === null) {
      return;
    }

    pausedAccumulatedMs += now() - pausedSince;
    pausedSince = null;
  }

  return {
    start,
    stop,
    pause,
    resume,
    isPaused: () => pausedSince !== null,
    fastForward,
    getDisplayedMinutes: displayedMinutes,
    isFinished: () => finished
  };
}
