// Which messenger conversations a given learner gets, and in what order.
//
// A day holds several conversations and exactly one of them is the attack. That ratio is
// the point: a learner who only ever sees the messenger light up for a phish learns to
// distrust the icon, not to read the message. Surrounding the attack with ordinary work
// chatter is what makes noticing it a skill rather than a reflex.
//
// Selection is SEEDED from the company and the learner, so a profile always draws the same
// conversations. Reproducibility matters for the same reason it does in the roster
// generator: a screenshot or a bug report has to still describe the thing being looked at.

import { isEventAvailable } from "./registry";
import type { SimEventDefinition } from "./types";
import type { Employee } from "../data/roster";
import type { SimulationSettings } from "../config/settings";

/** The most conversations a day may hold, whatever the configuration asks for. */
export const MAX_MESSENGER_CONVERSATIONS = 4;

/**
 * The fewest. Below two there is no room for both the benign opener and the attack, and
 * dropping either would change what the day teaches rather than just shortening it.
 */
export const MIN_MESSENGER_CONVERSATIONS = 2;

/** mulberry32, the same generator the roster uses, so the two behave alike. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let drawn = Math.imul(state ^ (state >>> 15), 1 | state);

    drawn = (drawn + Math.imul(drawn ^ (drawn >>> 7), 61 | drawn)) ^ drawn;

    return ((drawn ^ (drawn >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

/** Fisher-Yates, so every ordering is equally likely rather than merely jumbled. */
function shuffle<T>(items: T[], random: () => number): T[] {
  const output = [...items];

  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(random() * (index + 1));

    [output[index], output[swapWith]] = [output[swapWith], output[index]];
  }

  return output;
}

/**
 * Whether a conversation is plausible for this learner. Every stated condition must hold;
 * an omitted one is not a constraint.
 *
 * This is what makes the variety mean something - a supervisor chasing last quarter's
 * report is not a message a new hire would get, and an onboarding check-in is not one a
 * ten-year veteran would.
 */
function audienceMatches(definition: SimEventDefinition, learner: Employee): boolean {
  const audience = definition.messenger?.audience;

  if (!audience) {
    return true;
  }

  if (audience.departments && !audience.departments.includes(learner.department)) {
    return false;
  }

  if (audience.tenures && !audience.tenures.includes(learner.tenure)) {
    return false;
  }

  if (
    audience.minSecurityRating !== undefined &&
    learner.securityRating < audience.minSecurityRating
  ) {
    return false;
  }

  if (
    audience.maxSecurityRating !== undefined &&
    learner.securityRating > audience.maxSecurityRating
  ) {
    return false;
  }

  return true;
}

export interface MessengerPlanInput {
  /** The whole catalogue; conversations are picked out of it by their `messenger` field. */
  events: SimEventDefinition[];
  settings: SimulationSettings;
  learner: Employee;
  /** Anything stable per learner. `companyId:employeeId` in the app. */
  seed: string;
}

export function clampConversationCount(requested: number): number {
  if (!Number.isFinite(requested)) {
    return MAX_MESSENGER_CONVERSATIONS;
  }

  return Math.min(
    Math.max(Math.round(requested), MIN_MESSENGER_CONVERSATIONS),
    MAX_MESSENGER_CONVERSATIONS
  );
}

/**
 * The event ids to run, in order.
 *
 * Two guarantees the caller can rely on:
 *
 *   - **The first conversation is always benign.** The learner meets the messenger doing
 *     something harmless, so the interface is familiar before it matters. Being asked to
 *     judge an attack in an interface you have never used is a test of the interface.
 *   - **Exactly one conversation is the attack**, and never the first one.
 *
 * Returns fewer than asked for when the catalogue cannot supply them - a disabled
 * conversation, or a phishing category the operator switched off, simply is not there.
 */
export function planMessengerDay(input: MessengerPlanInput): string[] {
  const { events, settings, learner, seed } = input;

  const candidates = events.filter(
    (definition) =>
      definition.messenger &&
      isEventAvailable(definition, settings) &&
      audienceMatches(definition, learner)
  );

  const random = createRandom(hashSeed(seed));

  // Shuffled before splitting, so which benign ones get used varies as well as their order.
  const benign = shuffle(
    candidates.filter((definition) => definition.messenger?.kind === "benign"),
    random
  );
  const malicious = shuffle(
    candidates.filter((definition) => definition.messenger?.kind === "malicious"),
    random
  );

  const opener = benign.shift();

  if (!opener) {
    // Nothing benign to open with. Rather than lead with the attack - which would teach
    // the opposite of the intended lesson - run nothing at all.
    return [];
  }

  const attack = malicious[0];
  const wanted = clampConversationCount(settings.messengerConversations);
  const remaining = attack ? wanted - 2 : wanted - 1;

  const rest = shuffle(
    [...(attack ? [attack] : []), ...benign.slice(0, Math.max(0, remaining))],
    random
  );

  return [opener.id, ...rest.map((definition) => definition.id)];
}
