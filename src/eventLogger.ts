// Behaviour log: the ordered record of what happened during a session.
//
// "Log behaviour, not just outcomes" - this is the substrate scoring and the future
// admin reporting are built on, so it records learner actions and applied events
// alike, in the order they occurred.
//
// In memory only. The personalization screen promises nothing is saved or
// transmitted, so nothing here is persisted; a production build would post batches
// to the backend event pipeline instead of holding them.

export type LoggedEntryKind =
  | "learnerAction"
  | "eventApplied"
  | "triggerFired"
  | "stateChanged"
  | "session";

export interface LoggedEntry {
  /** Monotonic, starting at 1 - gives a stable order even within the same minute. */
  sequence: number;
  kind: LoggedEntryKind;
  /** What happened: a learner action name, an event id, a trigger id. */
  type: string;
  /** Simulated minutes from the start of the workday. */
  simMinutes: number;
  /** Real milliseconds since logging began - the basis for time-to-decision. */
  realElapsedMs: number;
  detail?: Record<string, unknown>;
}

type Listener = (entry: LoggedEntry) => void;

let entries: LoggedEntry[] = [];
let sequence = 0;
let startedAtMs: number | null = null;
const listeners = new Set<Listener>();

/** Clears the log and restarts the clock used for elapsed timings. */
export function startSession(detail?: Record<string, unknown>): void {
  entries = [];
  sequence = 0;
  startedAtMs = Date.now();

  record("session", "session_started", 0, detail);
}

export function record(
  kind: LoggedEntryKind,
  type: string,
  simMinutes: number,
  detail?: Record<string, unknown>
): LoggedEntry {
  if (startedAtMs === null) {
    startedAtMs = Date.now();
  }

  sequence += 1;

  const entry: LoggedEntry = {
    sequence,
    kind,
    type,
    simMinutes,
    realElapsedMs: Date.now() - startedAtMs,
    ...(detail ? { detail } : {})
  };

  entries.push(entry);
  listeners.forEach((listener) => listener(entry));

  return entry;
}

export function getEntries(): LoggedEntry[] {
  return [...entries];
}

/** Entries of one type, oldest first. Useful for scoring rules. */
export function getEntriesOfType(type: string): LoggedEntry[] {
  return entries.filter((entry) => entry.type === type);
}

export function findFirst(type: string): LoggedEntry | undefined {
  return entries.find((entry) => entry.type === type);
}

/** Subscribe to new entries. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

/** The whole session as JSON - the shape a backend endpoint would receive. */
export function exportSession(): string {
  return JSON.stringify({ entries }, null, 2);
}
