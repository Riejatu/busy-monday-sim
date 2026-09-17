// Evaluates triggers and applies events.
//
// Tracks two clocks, because triggers legitimately need both:
//
//   simulated minutes - for anything inside the fiction ("mid-morning")
//   real milliseconds - for anything about the person at the keyboard ("5 seconds
//                       after sign-in, then every 30 seconds until they act")
//
// Nothing here knows what any particular event does; it looks the event up in the
// registry and calls its `apply`. Both clock sources are injectable so the whole
// matrix is testable without waiting.

import { record } from "../eventLogger";
import type {
  DesktopBridge,
  LearnerAction,
  SimStateFlag,
  SimEventContext,
  SimEventDefinition,
  TriggerDefinition,
  TriggerSettings
} from "./types";

import type { ScenarioContext } from "../scenario";
import { isEventAvailable } from "./registry";
import type { SimulationSettings } from "../config/settings";

export interface EventEngineOptions {
  events: SimEventDefinition[];
  triggers: TriggerDefinition[];
  /** Per-event enable flags, resolved through the config cascade. */
  eventSettings: Record<string, boolean>;
  /** Per-trigger enable flags and parameter overrides. */
  triggerSettings: Record<string, TriggerSettings>;
  scenario: ScenarioContext;
  settings: SimulationSettings;
  desktop: DesktopBridge;
  /** Injectable real-time source for tests. */
  now?: () => number;
}

export interface EventEngine {
  /** Marks the moment the learner reached the desktop. */
  start: () => void;
  /** Evaluates everything now due. Safe to call as often as you like. */
  tick: (simMinutes: number) => void;
  handleLearnerAction: (action: LearnerAction, target?: string) => void;
  /**
   * Publishes an ongoing state of the desktop. Triggers that declare `pauseWhile` for
   * this flag stop counting down, and any notification they raised is withdrawn.
   */
  setStateFlag: (flag: SimStateFlag, active: boolean) => void;
  /**
   * Freezes every trigger's clock at once - used when the simulation itself is paused,
   * for instance while the learner is answering a choice. Paused time is deducted, so
   * nothing fires in a burst on resume.
   */
  setPaused: (paused: boolean) => void;
  getAppliedEvents: () => string[];
}

interface PendingEvent {
  eventId: string;
  dueAtSimMinutes: number;
  triggerId?: string;
}

/** Repeat state for one trigger. */
interface RepeatState {
  occurrences: number;
  nextAtRealMs: number;
  stopped: boolean;
}

/** Paused time for one trigger, so a pause defers rather than resets its countdown. */
interface PauseState {
  accumulatedMs: number;
  /**
   * Engine-elapsed reading when the current pause began, or null if running. Measured
   * on the engine's clock rather than the wall clock so it composes with a global pause.
   */
  since: number | null;
}

export function createEventEngine(options: EventEngineOptions): EventEngine {
  const {
    events,
    triggers,
    eventSettings,
    triggerSettings,
    scenario,
    settings,
    desktop,
    now = () => Date.now()
  } = options;

  const eventsById = new Map(events.map((event) => [event.id, event]));

  const firedTriggers = new Set<string>();
  const repeatStates = new Map<string, RepeatState>();
  const appliedEvents: string[] = [];
  const pending: PendingEvent[] = [];

  const enabledTriggers = new Map<string, boolean>(
    triggers.map((trigger) => [
      trigger.id,
      triggerSettings[trigger.id]?.enabled ?? trigger.defaultEnabled
    ])
  );

  const pauseStates = new Map<string, PauseState>();
  const activeFlags = new Set<SimStateFlag>();

  let startedAtRealMs: number | null = null;
  let currentSimMinutes = 0;
  let globalPausedMs = 0;
  let globalPausedSince: number | null = null;

  /**
   * Real time the engine has actually been running, with globally paused stretches
   * removed. Everything else measures against this rather than against the wall clock,
   * which is what lets a pause compose with the per-trigger pauses below.
   */
  function realElapsedMs(): number {
    if (startedAtRealMs === null) {
      return 0;
    }

    const pausedNow = globalPausedSince === null ? 0 : now() - globalPausedSince;

    return now() - startedAtRealMs - globalPausedMs - pausedNow;
  }

  function setPaused(paused: boolean): void {
    if (paused && globalPausedSince === null) {
      globalPausedSince = now();
      return;
    }

    if (!paused && globalPausedSince !== null) {
      globalPausedMs += now() - globalPausedSince;
      globalPausedSince = null;
    }
  }

  /**
   * Elapsed real time as this trigger sees it, with any paused stretches deducted.
   * Per trigger rather than global: pausing one nag must not freeze the whole day.
   */
  function triggerElapsedMs(trigger: TriggerDefinition): number {
    const pause = pauseStates.get(trigger.id);

    if (!pause) {
      return realElapsedMs();
    }

    // `since` is an engine-elapsed reading, not a wall-clock one: while the engine is
    // globally paused this difference stays flat instead of double-counting the pause.
    const elapsed = realElapsedMs();
    const currentPause = pause.since === null ? 0 : elapsed - pause.since;

    return elapsed - pause.accumulatedMs - currentPause;
  }

  /** The states this trigger pauses for, normalised to a list. */
  function pauseFlagsOf(trigger: TriggerDefinition): SimStateFlag[] {
    if (!trigger.pauseWhile) {
      return [];
    }

    return Array.isArray(trigger.pauseWhile) ? trigger.pauseWhile : [trigger.pauseWhile];
  }

  function isPaused(trigger: TriggerDefinition): boolean {
    return pauseStates.get(trigger.id)?.since !== null &&
      pauseStates.get(trigger.id) !== undefined;
  }

  function setStateFlag(flag: SimStateFlag, active: boolean): void {
    if (activeFlags.has(flag) === active) {
      return;
    }

    if (active) {
      activeFlags.add(flag);
    } else {
      activeFlags.delete(flag);
    }

    record("stateChanged", `${flag}:${active ? "on" : "off"}`, currentSimMinutes);

    // Arm or disarm the triggers that watch this state.
    triggers
      .filter(
        (trigger) => trigger.condition.type === "whileState" && trigger.condition.flag === flag
      )
      .forEach((trigger) => {
        if (active) {
          // A fresh occurrence of the state starts a fresh countdown, so a connection
          // that drops again later prompts again.
          // The interval governs the first appearance as well as the repeats, so a
          // state that clears quickly never produces a prompt at all. A trigger with
          // no repeat interval falls back to firing once, straight away.
          repeatStates.set(trigger.id, {
            occurrences: 0,
            nextAtRealMs:
              triggerElapsedMs(trigger) + repeatIntervalSeconds(trigger) * 1000,
            stopped: false
          });
          return;
        }

        const state = repeatStates.get(trigger.id);

        if (state) {
          state.stopped = true;
        }

        // The state is over, so nothing about it should still be on screen.
        desktop.withdrawNotifications(trigger.eventId);
      });

    triggers
      .filter((trigger) => pauseFlagsOf(trigger).includes(flag))
      .forEach((trigger) => {
        const pause = pauseStates.get(trigger.id) ?? { accumulatedMs: 0, since: null };

        // Derived from every flag it watches, not just the one that changed.
        const shouldPause = pauseFlagsOf(trigger).some((watched) => activeFlags.has(watched));

        if (shouldPause && pause.since === null) {
          pause.since = realElapsedMs();

          // Nothing should still be on screen nagging about what they are now doing.
          desktop.withdrawNotifications(trigger.eventId);
        }

        if (!shouldPause && pause.since !== null) {
          pause.accumulatedMs += realElapsedMs() - pause.since;
          pause.since = null;
        }

        pauseStates.set(trigger.id, pause);
      });
  }

  function isEventEnabled(eventId: string): boolean {
    const definition = eventsById.get(eventId);

    if (!definition) {
      console.warn(`Unknown event "${eventId}" - ignoring.`);
      return false;
    }

    // One shared rule, so the engine and the messenger day planner cannot disagree about
    // what is live. `eventSettings` is the resolved events map from the same settings.
    return isEventAvailable(definition, { ...settings, events: eventSettings });
  }

  /* ---------------- effective, operator-overridable parameters ---------------- */

  function simTimeOf(trigger: TriggerDefinition): number {
    if (trigger.condition.type !== "atSimTime") {
      return 0;
    }

    return (
      triggerSettings[trigger.id]?.minutesFromDayStart ??
      trigger.condition.minutesFromDayStart
    );
  }

  function loginDelaySeconds(trigger: TriggerDefinition): number {
    if (trigger.condition.type !== "afterLogin") {
      return 0;
    }

    return triggerSettings[trigger.id]?.delaySeconds ?? trigger.condition.delaySeconds;
  }

  function followUpDelay(trigger: TriggerDefinition): number {
    if (trigger.condition.type !== "afterEvent") {
      return 0;
    }

    return triggerSettings[trigger.id]?.delayMinutes ?? trigger.condition.delayMinutes;
  }

  function repeatIntervalSeconds(trigger: TriggerDefinition): number {
    return triggerSettings[trigger.id]?.repeatEverySeconds ?? trigger.repeat?.everySeconds ?? 0;
  }

  /* ---------------------------------- firing --------------------------------- */

  function isRepeating(trigger: TriggerDefinition): boolean {
    return Boolean(trigger.repeat);
  }

  function canFire(trigger: TriggerDefinition): boolean {
    if (!enabledTriggers.get(trigger.id) || !isEventEnabled(trigger.eventId)) {
      return false;
    }

    if (trigger.condition.type === "whileState" && !activeFlags.has(trigger.condition.flag)) {
      return false;
    }

    if (isRepeating(trigger)) {
      const state = repeatStates.get(trigger.id);
      const ceiling = trigger.repeat?.maxOccurrences;

      if (state?.stopped) {
        return false;
      }

      if (ceiling !== undefined && (state?.occurrences ?? 0) >= ceiling) {
        return false;
      }

      return true;
    }

    return !((trigger.once ?? true) && firedTriggers.has(trigger.id));
  }

  function fireTrigger(trigger: TriggerDefinition, atSimMinutes: number): void {
    firedTriggers.add(trigger.id);

    if (isRepeating(trigger)) {
      const state = repeatStates.get(trigger.id) ?? {
        occurrences: 0,
        nextAtRealMs: 0,
        stopped: false
      };

      state.occurrences += 1;

      // Measured from now rather than from the previous due time, which coalesces a
      // backlog: a tab throttled in the background for minutes produces one prompt on
      // return, not a burst of stacked ones.
      state.nextAtRealMs = triggerElapsedMs(trigger) + repeatIntervalSeconds(trigger) * 1000;
      repeatStates.set(trigger.id, state);
    }

    record("triggerFired", trigger.id, atSimMinutes, {
      eventId: trigger.eventId,
      ...(isRepeating(trigger)
        ? { occurrence: repeatStates.get(trigger.id)?.occurrences }
        : {})
    });

    // A trigger may reshape the rest of the day before its own event lands.
    trigger.enables?.forEach((id) => enabledTriggers.set(id, true));
    trigger.disables?.forEach((id) => enabledTriggers.set(id, false));

    applyEvent(trigger.eventId, atSimMinutes, trigger.id);
  }

  function applyEvent(eventId: string, atSimMinutes: number, triggerId?: string): void {
    const definition = eventsById.get(eventId);

    if (!definition || !isEventEnabled(eventId)) {
      return;
    }

    appliedEvents.push(eventId);
    record("eventApplied", eventId, atSimMinutes, triggerId ? { triggerId } : undefined);

    // Scoped bridge: notifications carry their source so withdrawal can target them.
    const scopedDesktop: DesktopBridge = {
      ...desktop,
      notify: (notification) => desktop.notify({ ...notification, sourceEventId: eventId })
    };

    const context: SimEventContext = {
      atMinutes: atSimMinutes,
      scenario,
      settings,
      desktop: scopedDesktop,
      schedule: (nextEventId, delayMinutes = 0) => {
        pending.push({
          eventId: nextEventId,
          dueAtSimMinutes: atSimMinutes + delayMinutes
        });
      },
      setTriggerEnabled: (id, enabled) => enabledTriggers.set(id, enabled)
    };

    try {
      // Not awaited: an event that asks the learner something can sit open for as long
      // as they need, and the rest of the day must keep running around it.
      const result = definition.apply(context);

      if (result instanceof Promise) {
        result.catch((error) => {
          console.error(`Event "${eventId}" failed while running:`, error);
        });
      }
    } catch (error) {
      // One misbehaving event must not take the rest of the day down.
      console.error(`Event "${eventId}" failed to apply:`, error);
    }

    queueFollowUps(eventId, atSimMinutes);
  }

  /** Schedules afterEvent triggers waiting on the event just applied. */
  function queueFollowUps(eventId: string, atSimMinutes: number): void {
    triggers
      .filter(
        (trigger) =>
          trigger.condition.type === "afterEvent" &&
          trigger.condition.eventId === eventId &&
          canFire(trigger)
      )
      .forEach((trigger) => {
        pending.push({
          eventId: trigger.eventId,
          dueAtSimMinutes: atSimMinutes + followUpDelay(trigger),
          triggerId: trigger.id
        });

        // Claimed now so a repeat of the source event cannot double-queue it.
        firedTriggers.add(trigger.id);
      });
  }

  /* ---------------------------------- driving -------------------------------- */

  function dueRealTimeTriggers(): TriggerDefinition[] {
    if (startedAtRealMs === null) {
      return [];
    }

    return triggers.filter((trigger) => {
      const usesRealTime =
        trigger.condition.type === "afterLogin" || trigger.condition.type === "whileState";

      if (!usesRealTime || !canFire(trigger)) {
        return false;
      }

      if (isPaused(trigger)) {
        return false;
      }

      const state = repeatStates.get(trigger.id);

      // A whileState trigger is armed the moment its state begins, so its scheduled
      // time is authoritative from the very first firing - including the wait before
      // the first prompt.
      if (trigger.condition.type === "whileState") {
        return state ? triggerElapsedMs(trigger) >= state.nextAtRealMs : false;
      }

      // afterLogin: the first run waits out the login delay, later runs the interval.
      const dueAt =
        state && state.occurrences > 0
          ? state.nextAtRealMs
          : loginDelaySeconds(trigger) * 1000;

      return triggerElapsedMs(trigger) >= dueAt;
    });
  }

  function tick(simMinutes: number): void {
    // The clock is monotonic, but a caller may re-send an older value.
    currentSimMinutes = Math.max(currentSimMinutes, simMinutes);

    // Fast-forwarding can cross several triggers at once, so drain in due order and
    // re-check after each pass: an event may schedule something already due.
    let guard = 0;

    for (;;) {
      const dueSim = triggers
        .filter(
          (trigger) =>
            trigger.condition.type === "atSimTime" &&
            canFire(trigger) &&
            simTimeOf(trigger) <= currentSimMinutes
        )
        .sort((a, b) => simTimeOf(a) - simTimeOf(b));

      const duePendingItems = pending
        .filter((item) => item.dueAtSimMinutes <= currentSimMinutes)
        .sort((a, b) => a.dueAtSimMinutes - b.dueAtSimMinutes);

      const dueReal = dueRealTimeTriggers();

      if (dueSim.length === 0 && duePendingItems.length === 0 && dueReal.length === 0) {
        return;
      }

      if (dueSim.length > 0) {
        fireTrigger(dueSim[0], simTimeOf(dueSim[0]));
      } else if (duePendingItems.length > 0) {
        const item = duePendingItems[0];
        pending.splice(pending.indexOf(item), 1);
        applyEvent(item.eventId, item.dueAtSimMinutes, item.triggerId);
      } else {
        fireTrigger(dueReal[0], currentSimMinutes);
      }

      guard += 1;

      if (guard > 500) {
        console.error("Event engine made no progress; stopping to avoid a loop.");
        return;
      }
    }
  }

  function handleLearnerAction(action: LearnerAction, target?: string): void {
    record("learnerAction", action, currentSimMinutes, target ? { target } : undefined);

    // Satisfying a nag's stop condition ends it, whatever drove the repetition.
    triggers.forEach((trigger) => {
      const repeat = trigger.repeat;

      if (!repeat?.untilAction || repeat.untilAction !== action) {
        return;
      }

      if (repeat.untilTarget !== undefined && repeat.untilTarget !== target) {
        return;
      }

      const state = repeatStates.get(trigger.id) ?? {
        occurrences: 0,
        nextAtRealMs: 0,
        stopped: false
      };

      state.stopped = true;
      repeatStates.set(trigger.id, state);

      record("triggerFired", `${trigger.id}:stopped`, currentSimMinutes, {
        reason: action
      });
    });

    triggers
      .filter((trigger) => {
        if (trigger.condition.type !== "onLearnerAction" || !canFire(trigger)) {
          return false;
        }

        const matchesAction = trigger.condition.action === action;
        const matchesTarget =
          trigger.condition.target === undefined || trigger.condition.target === target;

        return matchesAction && matchesTarget;
      })
      .forEach((trigger) => fireTrigger(trigger, currentSimMinutes));
  }

  return {
    start: () => {
      startedAtRealMs = now();
    },
    tick,
    handleLearnerAction,
    setStateFlag,
    setPaused,
    getAppliedEvents: () => [...appliedEvents]
  };
}
