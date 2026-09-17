// Three-layer configuration cascade.
//
//   backend  - the app's own defaults. Rarely touched.
//   admin    - an organization's overrides, plus which options learners may change.
//   user     - a learner's own choices, honoured only where admin granted permission.
//
// Effective value = user (if permitted) -> admin -> backend.
//
// Persisted in localStorage for the demo; in production the backend and admin layers
// belong on the server, keyed by tenant and campaign. No personal data is stored
// here - only settings - so the personalization screen's privacy promise still holds.

import { getAvailableLocales, isSupportedLocale } from "../localization/i18n";
import type { LocaleCode } from "../localization/i18n";
import type { TriggerSettings } from "../events/types";
import { getDefaultEventToggles, getDefaultTriggerToggles } from "../events/registry";
import {
  getDefaultPhishingToggles,
  isPhishingClassificationId,
  isPhishingCovered
} from "../phishingTaxonomy";
import type { PhishingClassificationId } from "../phishingTaxonomy";
import { isConsequenceStyleId } from "../consequences";
import type { ConsequenceStyleId } from "../consequences";
import {
  MAX_MESSENGER_CONVERSATIONS,
  MIN_MESSENGER_CONVERSATIONS
} from "../events/messengerPlan";

/** Intl unit identifiers, so no mapping layer is needed when formatting. */
export type TemperatureUnit = "fahrenheit" | "celsius";

export interface SimulationSettings {
  /** Real minutes that one simulated hour takes. Whole number. */
  realMinutesPerSimHour: number;
  /** Simulated minutes between visible clock changes. */
  clockStepMinutes: number;
  workdayStartHour: number;
  workdayEndHour: number;
  /** Language used until a profile or a learner choice says otherwise. */
  defaultLocale: LocaleCode;
  /** Desktop weather reading, expressed in `temperatureUnit`. */
  temperatureValue: number;
  temperatureUnit: TemperatureUnit;
  /**
   * When true, the reading is converted to whichever scale the learner's locale
   * conventionally uses, so a configured 72 F shows as 22 C in Germany. The stored
   * pair above stays exactly as authored either way.
   */
  localizeTemperatureUnit: boolean;
  /**
   * Per-event and per-trigger configuration, keyed by id. Merged key-by-key across
   * layers rather than replaced wholesale, so an admin can disable one event without
   * pinning every other one at its current value.
   */
  events: Record<string, boolean>;
  triggers: Record<string, TriggerSettings>;
  /**
   * Which phishing classifications a campaign covers, keyed by classification id. All on
   * by default. Switching one off silences every piece of content that declares it,
   * whether that content is an event or part of the standing inbox - so an operator can
   * say "no attachments this quarter" without hunting through the catalogue.
   */
  phishing: Record<string, boolean>;
  /**
   * How many messenger conversations a day holds, the attack included. Capped at
   * MAX_MESSENGER_CONVERSATIONS and floored at MIN - below two there is no room for both
   * the benign opener and the attack, and dropping either changes what the day teaches.
   */
  messengerConversations: number;
  /** Simulated minutes between one messenger conversation arriving and the next. */
  messengerGapMinutes: number;
  /**
   * Whether a wrong answer draws a negative consequence. On or off for the whole
   * simulation - there is no per-event version, because it is a process rather than content.
   */
  consequencesEnabled: boolean;
  /**
   * Which consequence style is in use. Exactly one at a time, so a day never mixes two
   * visual languages for the same idea.
   */
  consequenceStyle: ConsequenceStyleId;
}

/** Which settings the admin lets learners change. Language is always available. */
export interface AdminPermissions {
  timeLapse: boolean;
  temperature: boolean;
}

/** Settings a learner is ever allowed to set, when permitted. */
export type UserSettings = Pick<
  SimulationSettings,
  | "realMinutesPerSimHour"
  | "temperatureValue"
  | "temperatureUnit"
  | "localizeTemperatureUnit"
>;

export const BACKEND_DEFAULTS: SimulationSettings = {
  realMinutesPerSimHour: 2,
  clockStepMinutes: 15,
  workdayStartHour: 8,
  workdayEndHour: 17,
  defaultLocale: "en-US",
  temperatureValue: 72,
  temperatureUnit: "fahrenheit",
  localizeTemperatureUnit: true,
  // Populated from the registry and the taxonomy at resolve time so they stay in step.
  events: {},
  triggers: {},
  phishing: {},
  messengerConversations: MAX_MESSENGER_CONVERSATIONS,
  messengerGapMinutes: 45,
  consequencesEnabled: true,
  consequenceStyle: "pageRip"
};

export const DEFAULT_PERMISSIONS: AdminPermissions = {
  timeLapse: false,
  temperature: false
};

/** Bounds for operator input. A rate of 0 would divide by zero in the clock. */
export const LIMITS = {
  realMinutesPerSimHour: { min: 1, max: 120 },
  workdayHour: { min: 0, max: 23 },
  messengerConversations: {
    min: MIN_MESSENGER_CONVERSATIONS,
    max: MAX_MESSENGER_CONVERSATIONS
  },
  messengerGapMinutes: { min: 5, max: 240 },
  /** Per-unit bounds, so a Celsius field cannot be set to 140. */
  temperature: {
    fahrenheit: { min: -60, max: 140 },
    celsius: { min: -51, max: 60 }
  }
} as const;

/**
 * Every numeric trigger parameter, with its upper bound. Adding a timing field to
 * TriggerSettings means adding it here too, which is what keeps the sanitizer honest.
 *
 * Minute fields are bounded to a day; second fields to an hour.
 */
export const TRIGGER_NUMBER_PARAMS = [
  { key: "minutesFromDayStart", max: 24 * 60 },
  { key: "delayMinutes", max: 24 * 60 },
  { key: "delaySeconds", max: 3600 },
  { key: "repeatEverySeconds", max: 3600 }
] as const satisfies ReadonlyArray<{ key: keyof TriggerSettings; max: number }>;

/** Steps that divide an hour cleanly, so the clock never shows an odd offset. */
export const CLOCK_STEP_CHOICES = [1, 5, 10, 15, 20, 30, 60] as const;

export interface ResolvedConfig {
  /** What the app should actually use. */
  effective: SimulationSettings;
  /** Backend defaults, with any saved backend edits applied. */
  backend: SimulationSettings;
  /** Admin overrides only - absent keys inherit from backend. */
  admin: Partial<SimulationSettings>;
  permissions: AdminPermissions;
  /** Learner choices only, before permission filtering. */
  user: Partial<UserSettings>;
}

const STORAGE_KEYS = {
  backend: "busyMonday.config.backend",
  admin: "busyMonday.config.admin",
  permissions: "busyMonday.config.permissions",
  user: "busyMonday.config.user"
} as const;

type ConfigLayer = keyof typeof STORAGE_KEYS;

/* ------------------------------------------------------------------ *
 * Read / write
 * ------------------------------------------------------------------ */

function readLayer(layer: ConfigLayer): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[layer]);
    const parsed = raw ? JSON.parse(raw) : null;

    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    // Corrupt or unavailable storage must not take the app down.
    return {};
  }
}

function writeLayer(layer: ConfigLayer, value: unknown): void {
  try {
    localStorage.setItem(STORAGE_KEYS[layer], JSON.stringify(value));
  } catch {
    console.warn(`Could not persist ${layer} configuration.`);
  }
}

export function saveBackendSettings(settings: Partial<SimulationSettings>): void {
  writeLayer("backend", sanitizeSettings(settings));
}

export function saveAdminSettings(overrides: Partial<SimulationSettings>): void {
  writeLayer("admin", sanitizeSettings(overrides));
}

export function saveAdminPermissions(permissions: AdminPermissions): void {
  writeLayer("permissions", {
    timeLapse: Boolean(permissions.timeLapse),
    temperature: Boolean(permissions.temperature)
  });
}

export function saveUserSettings(settings: Partial<UserSettings>): void {
  writeLayer("user", sanitizeSettings(settings));
}

export function clearLayer(layer: ConfigLayer): void {
  try {
    localStorage.removeItem(STORAGE_KEYS[layer]);
  } catch {
    console.warn(`Could not clear ${layer} configuration.`);
  }
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

function toWholeNumberInRange(
  value: unknown,
  min: number,
  max: number
): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.min(Math.max(Math.round(parsed), min), max);
}

/**
 * Keeps only recognised keys with usable values, so a hand-edited or stale
 * localStorage entry can never feed a bad rate into the clock.
 */
export function sanitizeSettings(input: Partial<SimulationSettings>): Partial<SimulationSettings> {
  const output: Partial<SimulationSettings> = {};

  const rate = toWholeNumberInRange(
    input.realMinutesPerSimHour,
    LIMITS.realMinutesPerSimHour.min,
    LIMITS.realMinutesPerSimHour.max
  );

  if (input.realMinutesPerSimHour !== undefined && rate !== undefined) {
    output.realMinutesPerSimHour = rate;
  }

  if (input.clockStepMinutes !== undefined) {
    const step = Number(input.clockStepMinutes);

    if ((CLOCK_STEP_CHOICES as readonly number[]).includes(step)) {
      output.clockStepMinutes = step;
    }
  }

  const start = toWholeNumberInRange(
    input.workdayStartHour,
    LIMITS.workdayHour.min,
    LIMITS.workdayHour.max
  );

  if (input.workdayStartHour !== undefined && start !== undefined) {
    output.workdayStartHour = start;
  }

  const end = toWholeNumberInRange(input.workdayEndHour, LIMITS.workdayHour.min + 1, 24);

  if (input.workdayEndHour !== undefined && end !== undefined) {
    output.workdayEndHour = end;
  }

  const conversations = toWholeNumberInRange(
    input.messengerConversations,
    LIMITS.messengerConversations.min,
    LIMITS.messengerConversations.max
  );

  if (input.messengerConversations !== undefined && conversations !== undefined) {
    output.messengerConversations = conversations;
  }

  const messengerGap = toWholeNumberInRange(
    input.messengerGapMinutes,
    LIMITS.messengerGapMinutes.min,
    LIMITS.messengerGapMinutes.max
  );

  if (input.messengerGapMinutes !== undefined && messengerGap !== undefined) {
    output.messengerGapMinutes = messengerGap;
  }

  if (typeof input.consequencesEnabled === "boolean") {
    output.consequencesEnabled = input.consequencesEnabled;
  }

  if (
    typeof input.consequenceStyle === "string" &&
    isConsequenceStyleId(input.consequenceStyle)
  ) {
    output.consequenceStyle = input.consequenceStyle;
  }

  if (typeof input.defaultLocale === "string" && isSupportedLocale(input.defaultLocale)) {
    output.defaultLocale = input.defaultLocale;
  }

  if (input.temperatureUnit === "fahrenheit" || input.temperatureUnit === "celsius") {
    output.temperatureUnit = input.temperatureUnit;
  }

  if (typeof input.localizeTemperatureUnit === "boolean") {
    output.localizeTemperatureUnit = input.localizeTemperatureUnit;
  }

  if (input.events && typeof input.events === "object") {
    const events: Record<string, boolean> = {};

    for (const [id, enabled] of Object.entries(input.events)) {
      if (typeof enabled === "boolean") {
        events[id] = enabled;
      }
    }

    output.events = events;
  }

  if (input.phishing && typeof input.phishing === "object") {
    const phishing: Record<string, boolean> = {};

    for (const [id, enabled] of Object.entries(input.phishing)) {
      // Unlike event ids, these come from a closed union, so a stale key is droppable.
      if (typeof enabled === "boolean" && isPhishingClassificationId(id)) {
        phishing[id] = enabled;
      }
    }

    output.phishing = phishing;
  }

  if (input.triggers && typeof input.triggers === "object") {
    const triggers: Record<string, TriggerSettings> = {};

    for (const [id, raw] of Object.entries(input.triggers)) {
      if (!raw || typeof raw !== "object") {
        continue;
      }

      const entry: TriggerSettings = {};
      const candidate = raw as TriggerSettings;

      if (typeof candidate.enabled === "boolean") {
        entry.enabled = candidate.enabled;
      }

      // Driven off one table so a new timing parameter cannot be added to the type and
      // the operator form while silently never being persisted here.
      for (const { key, max } of TRIGGER_NUMBER_PARAMS) {
        const supplied = candidate[key];

        if (supplied === undefined) {
          continue;
        }

        const value = toWholeNumberInRange(supplied, 0, max);

        if (value !== undefined) {
          entry[key] = value;
        }
      }

      if (Object.keys(entry).length > 0) {
        triggers[id] = entry;
      }
    }

    output.triggers = triggers;
  }

  if (input.temperatureValue !== undefined) {
    // Bounds depend on the unit travelling with this same object; fall back to the
    // wider Fahrenheit range when only the value is being written.
    const unit = output.temperatureUnit ?? "fahrenheit";
    const bounds = LIMITS.temperature[unit];
    const degrees = toWholeNumberInRange(input.temperatureValue, bounds.min, bounds.max);

    if (degrees !== undefined) {
      output.temperatureValue = degrees;
    }
  }

  return output;
}

/**
 * Converts between the two scales, rounded to whole degrees the way a weather
 * widget reports them. Used when an operator flips the unit, so the physical
 * temperature is preserved instead of 72 degrees silently becoming 72 Celsius.
 */
export function convertTemperature(
  value: number,
  from: TemperatureUnit,
  to: TemperatureUnit
): number {
  if (from === to) {
    return Math.round(value);
  }

  return to === "celsius"
    ? Math.round(((value - 32) * 5) / 9)
    : Math.round((value * 9) / 5 + 32);
}

/** A workday must have positive length; fall back to the defaults if it does not. */
function ensureUsableWorkday(settings: SimulationSettings): SimulationSettings {
  if (settings.workdayEndHour > settings.workdayStartHour) {
    return settings;
  }

  return {
    ...settings,
    workdayStartHour: BACKEND_DEFAULTS.workdayStartHour,
    workdayEndHour: BACKEND_DEFAULTS.workdayEndHour
  };
}

/* ------------------------------------------------------------------ *
 * Resolution
 * ------------------------------------------------------------------ */

/**
 * The event and trigger maps merge per key instead of being replaced, so an admin who
 * disables one event does not freeze every other one at whatever it was that day.
 */
function mergeCatalogueLayers(
  base: SimulationSettings,
  ...overlays: Partial<SimulationSettings>[]
): SimulationSettings {
  const merged: SimulationSettings = { ...base, ...Object.assign({}, ...overlays) };

  merged.events = { ...base.events };
  merged.triggers = { ...base.triggers };
  merged.phishing = { ...base.phishing };

  for (const overlay of overlays) {
    Object.assign(merged.events, overlay.events ?? {});
    Object.assign(merged.phishing, overlay.phishing ?? {});

    for (const [id, entry] of Object.entries(overlay.triggers ?? {})) {
      merged.triggers[id] = { ...merged.triggers[id], ...entry };
    }
  }

  return merged;
}

export function resolveConfig(): ResolvedConfig {
  const backendStored = sanitizeSettings(readLayer("backend") as Partial<SimulationSettings>);

  const backend = ensureUsableWorkday(
    mergeCatalogueLayers(
      {
        ...BACKEND_DEFAULTS,
        events: getDefaultEventToggles(),
        phishing: getDefaultPhishingToggles(),
        triggers: Object.fromEntries(
          Object.entries(getDefaultTriggerToggles()).map(([id, enabled]) => [id, { enabled }])
        )
      },
      backendStored
    )
  );

  const admin = sanitizeSettings(readLayer("admin") as Partial<SimulationSettings>);

  const storedPermissions = readLayer("permissions");

  const permissions: AdminPermissions = {
    timeLapse:
      typeof storedPermissions.timeLapse === "boolean"
        ? storedPermissions.timeLapse
        : DEFAULT_PERMISSIONS.timeLapse,
    temperature:
      typeof storedPermissions.temperature === "boolean"
        ? storedPermissions.temperature
        : DEFAULT_PERMISSIONS.temperature
  };

  const user = sanitizeSettings(readLayer("user") as Partial<SimulationSettings>) as Partial<UserSettings>;

  // A learner's value only counts where the admin granted permission; revoking a
  // permission therefore takes effect immediately without deleting their choice.
  const permittedUser: Partial<SimulationSettings> = {};

  if (permissions.timeLapse && user.realMinutesPerSimHour !== undefined) {
    permittedUser.realMinutesPerSimHour = user.realMinutesPerSimHour;
  }

  if (permissions.temperature) {
    // Value and unit move together: a value without its unit would be misread.
    if (user.temperatureUnit !== undefined) {
      permittedUser.temperatureUnit = user.temperatureUnit;
    }

    if (user.temperatureValue !== undefined) {
      permittedUser.temperatureValue = user.temperatureValue;
    }

    if (user.localizeTemperatureUnit !== undefined) {
      permittedUser.localizeTemperatureUnit = user.localizeTemperatureUnit;
    }
  }

  const effective = ensureUsableWorkday(mergeCatalogueLayers(backend, admin, permittedUser));

  return { effective, backend, admin, permissions, user };
}

/**
 * Whether a campaign covers this classification. Absent means on: a classification added
 * to the taxonomy later is live everywhere immediately, rather than being silently off
 * for every operator who saved their settings before it existed.
 */
export function isPhishingClassificationEnabled(
  settings: SimulationSettings,
  id: PhishingClassificationId
): boolean {
  // Optional access despite the non-optional type: this is called from the engine's
  // trigger loop with whatever settings object the caller resolved, and a missing map
  // must degrade to "covered" rather than throw on every tick.
  return isPhishingCovered(settings.phishing, id);
}

/** Locales the config pages can offer. */
export function getSelectableLocales(): LocaleCode[] {
  return getAvailableLocales();
}
