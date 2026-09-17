// The /backend and /admin configuration pages.
//
// Operator tooling, deliberately English-only for now: these are internal screens,
// and keeping them out of the dictionaries means iterating on them does not churn
// five translations. The learner-facing preferences screen IS localized - it lives
// in main.ts alongside the other learner screens.

import {
  BACKEND_DEFAULTS,
  CLOCK_STEP_CHOICES,
  LIMITS,
  clearLayer,
  getSelectableLocales,
  resolveConfig,
  saveAdminPermissions,
  saveAdminSettings,
  saveBackendSettings
} from "./settings";

import { convertTemperature } from "./settings";
import type { SimulationSettings, TemperatureUnit } from "./settings";
import { languageAutonym, temperatureLabel } from "../localization/labels";
import { SIM_EVENTS, SIM_TRIGGERS } from "../events/registry";
import type { TriggerDefinition } from "../events/types";
import { PHISHING_CLASSIFICATIONS, phishingLabel } from "../phishingTaxonomy";
import { CONSEQUENCE_STYLES } from "../consequences";
import { isPhishingClassificationEnabled } from "./settings";
import type { PhishingClassificationId } from "../phishingTaxonomy";

/**
 * Only the scalar settings appear in the shared form. Events, triggers and phishing
 * coverage are keyed maps rather than single values, so they get their own sections.
 */
type SettingKey = Exclude<keyof SimulationSettings, "events" | "triggers" | "phishing">;

interface FieldDefinition {
  key: SettingKey;
  label: string;
  help: string;
  control:
    | "number"
    | "step"
    | "hour"
    | "locale"
    | "temperature"
    | "temperatureUnit"
    | "unitLocalization"
    | "messengerCount"
    | "messengerGap"
    | "consequenceToggle"
    | "consequenceStyle";
}

const TEMPERATURE_UNITS: TemperatureUnit[] = ["fahrenheit", "celsius"];

function unitOptionLabel(unit: TemperatureUnit): string {
  return unit === "celsius" ? "Celsius (°C)" : "Fahrenheit (°F)";
}

const FIELDS: FieldDefinition[] = [
  {
    key: "realMinutesPerSimHour",
    label: "Time lapse",
    help: `Real minutes per simulated hour. Whole numbers, ${LIMITS.realMinutesPerSimHour.min}-${LIMITS.realMinutesPerSimHour.max}.`,
    control: "number"
  },
  {
    key: "clockStepMinutes",
    label: "Clock step",
    help: "Simulated minutes between visible clock changes.",
    control: "step"
  },
  {
    key: "workdayStartHour",
    label: "Workday start",
    help: "Hour the simulated day opens.",
    control: "hour"
  },
  {
    key: "workdayEndHour",
    label: "Workday end",
    help: "Hour the simulated day closes.",
    control: "hour"
  },
  {
    key: "messengerConversations",
    label: "Messenger conversations",
    help:
      `How many conversations a day holds, the attack included. ` +
      `${LIMITS.messengerConversations.min}-${LIMITS.messengerConversations.max}. ` +
      `Exactly one is an attack and it is never the first, so below ` +
      `${LIMITS.messengerConversations.min} there would be no room for both.`,
    control: "messengerCount"
  },
  {
    key: "messengerGapMinutes",
    label: "Messenger spacing",
    help: "Simulated minutes between one conversation arriving and the next.",
    control: "messengerGap"
  },
  {
    key: "consequencesEnabled",
    label: "Negative consequences",
    help:
      "Whether a risky answer draws a consequence. On or off for the whole simulation.",
    control: "consequenceToggle"
  },
  {
    key: "consequenceStyle",
    label: "Consequence style",
    help:
      "Which one is used. Exactly one at a time, so a day never mixes two visual " +
      "languages for the same idea.",
    control: "consequenceStyle"
  },
  {
    key: "defaultLocale",
    label: "Default language",
    help: "Used until a profile or a learner choice overrides it.",
    control: "locale"
  },
  {
    key: "temperatureValue",
    label: "Desktop temperature",
    help: "Shown on the taskbar weather widget. Whole degrees, in the unit below.",
    control: "temperature"
  },
  {
    key: "temperatureUnit",
    label: "Temperature unit",
    help: "The scale the value above is written in. Switching converts it.",
    control: "temperatureUnit"
  },
  {
    key: "localizeTemperatureUnit",
    label: "Unit shown to learners",
    help:
      "Match learner locale converts the reading into the scale their region uses - " +
      "so a US learner sees Fahrenheit and everyone else sees Celsius.",
    control: "unitLocalization"
  }
];

/* ------------------------------------------------------------------ *
 * Shared rendering
 * ------------------------------------------------------------------ */

function renderControl(
  field: FieldDefinition,
  value: string | number | boolean,
  attributes = ""
): string {
  const id = `field-${field.key}`;

  if (field.control === "locale") {
    return `
      <select id="${id}" data-key="${field.key}" ${attributes}>
        ${getSelectableLocales()
          .map(
            (locale) =>
              `<option value="${locale}" ${locale === value ? "selected" : ""}>${escapeHtml(
                languageAutonym(locale)
              )}</option>`
          )
          .join("")}
      </select>
    `;
  }

  if (field.control === "unitLocalization") {
    const localize = value === true || value === "true";

    return `
      <select id="${id}" data-key="${field.key}" ${attributes}>
        <option value="true" ${localize ? "selected" : ""}>Match learner locale</option>
        <option value="false" ${localize ? "" : "selected"}>Always as configured</option>
      </select>
    `;
  }

  if (field.control === "consequenceToggle") {
    const on = value === true || value === "true";

    return `
      <select id="${id}" data-key="${field.key}" ${attributes}>
        <option value="true" ${on ? "selected" : ""}>On</option>
        <option value="false" ${on ? "" : "selected"}>Off</option>
      </select>
    `;
  }

  if (field.control === "consequenceStyle") {
    return `
      <select id="${id}" data-key="${field.key}" ${attributes}>
        ${CONSEQUENCE_STYLES.map(
          (style) =>
            `<option value="${style.id}" ${style.id === value ? "selected" : ""}>${escapeHtml(
              style.label
            )}</option>`
        ).join("")}
      </select>
    `;
  }

  if (field.control === "temperatureUnit") {
    return `
      <select id="${id}" data-key="${field.key}" ${attributes}>
        ${TEMPERATURE_UNITS.map(
          (unit) =>
            `<option value="${unit}" ${unit === value ? "selected" : ""}>${escapeHtml(
              unitOptionLabel(unit)
            )}</option>`
        ).join("")}
      </select>
    `;
  }

  if (field.control === "step") {
    return `
      <select id="${id}" data-key="${field.key}" ${attributes}>
        ${CLOCK_STEP_CHOICES.map(
          (step) =>
            `<option value="${step}" ${step === Number(value) ? "selected" : ""}>${step} min</option>`
        ).join("")}
      </select>
    `;
  }

  let bounds = `min="${LIMITS.realMinutesPerSimHour.min}" max="${LIMITS.realMinutesPerSimHour.max}"`;

  if (field.control === "messengerCount") {
    bounds = `min="${LIMITS.messengerConversations.min}" max="${LIMITS.messengerConversations.max}"`;
  }

  if (field.control === "messengerGap") {
    bounds = `min="${LIMITS.messengerGapMinutes.min}" max="${LIMITS.messengerGapMinutes.max}"`;
  }

  if (field.control === "hour") {
    bounds = `min="${LIMITS.workdayHour.min}" max="24"`;
  }

  if (field.control === "temperature") {
    // Re-stamped by wireTemperatureUnit() whenever the unit changes.
    const unit = currentUnitSelection() ?? "fahrenheit";
    bounds = `min="${LIMITS.temperature[unit].min}" max="${LIMITS.temperature[unit].max}"`;
  }

  return `
    <input
      id="${id}"
      type="number"
      step="1"
      ${bounds}
      data-key="${field.key}"
      value="${escapeHtml(String(value))}"
      ${attributes}
    />
  `;
}

function renderSummary(effective: SimulationSettings): string {
  const hours = effective.workdayEndHour - effective.workdayStartHour;
  const realMinutes = hours * effective.realMinutesPerSimHour;
  const secondsPerStep = Math.round(
    (effective.clockStepMinutes / 60) * effective.realMinutesPerSimHour * 60
  );

  return `
    <div class="config-summary">
      <h2>Effective settings</h2>
      <dl>
        <div><dt>Simulated workday</dt><dd>${String(effective.workdayStartHour).padStart(2, "0")}:00 &ndash; ${String(effective.workdayEndHour).padStart(2, "0")}:00 (${hours} h)</dd></div>
        <div><dt>Time lapse</dt><dd>${effective.realMinutesPerSimHour} real min per simulated hour</dd></div>
        <div><dt>Full day takes</dt><dd>${realMinutes} real minutes</dd></div>
        <div><dt>Clock advances</dt><dd>every ${effective.clockStepMinutes} simulated min (~${secondsPerStep}s real)</dd></div>
        <div><dt>Default language</dt><dd>${escapeHtml(languageAutonym(effective.defaultLocale))}</dd></div>
        <div><dt>Desktop temperature</dt><dd>${escapeHtml(describeTemperature(effective))}</dd></div>
        <div><dt>Phishing coverage</dt><dd>${escapeHtml(describePhishingCoverage(effective))}</dd></div>
        <div><dt>Messenger</dt><dd>${effective.messengerConversations} conversations, ${effective.messengerGapMinutes} simulated min apart</dd></div>
        <div><dt>Consequences</dt><dd>${escapeHtml(describeConsequences(effective))}</dd></div>
      </dl>
    </div>
  `;
}

function describeConsequences(effective: SimulationSettings): string {
  if (!effective.consequencesEnabled) {
    return "off";
  }

  const style = CONSEQUENCE_STYLES.find((entry) => entry.id === effective.consequenceStyle);

  return `${style?.label ?? effective.consequenceStyle}, on every risky answer`;
}

/** Names the categories that are off, rather than only counting them. */
function describePhishingCoverage(effective: SimulationSettings): string {
  const off = PHISHING_CLASSIFICATIONS.filter(
    (classification) => !isPhishingClassificationEnabled(effective, classification.id)
  );

  if (off.length === 0) {
    return `all ${PHISHING_CLASSIFICATIONS.length} categories`;
  }

  return `${PHISHING_CLASSIFICATIONS.length - off.length} of ${
    PHISHING_CLASSIFICATIONS.length
  } - off: ${off.map((classification) => classification.label).join(", ")}`;
}

/**
 * Spells out both outcomes when the unit follows the learner, so an operator can see
 * at a glance that one configured value produces two different readings.
 */
function describeTemperature(effective: SimulationSettings): string {
  const configured = temperatureLabel(effective.temperatureValue, effective.temperatureUnit);

  if (!effective.localizeTemperatureUnit) {
    return `${configured} for every learner`;
  }

  const asFahrenheit = convertTemperature(
    effective.temperatureValue,
    effective.temperatureUnit,
    "fahrenheit"
  );
  const asCelsius = convertTemperature(
    effective.temperatureValue,
    effective.temperatureUnit,
    "celsius"
  );

  return `${temperatureLabel(asFahrenheit, "fahrenheit")} in the US, ${temperatureLabel(
    asCelsius,
    "celsius"
  )} elsewhere`;
}

/* ------------------------------------------------------------------ *
 * Phishing coverage
 * ------------------------------------------------------------------ */

/** Events that stage this kind of phish, so a toggle names what it will silence. */
function eventsClassifiedAs(id: PhishingClassificationId): string[] {
  return SIM_EVENTS.filter((event) => event.phishing === id).map((event) => event.name);
}

function renderPhishingSection(effective: SimulationSettings): string {
  return `
    <section class="config-card">
      <h2>Phishing coverage</h2>
      <p class="config-note">
        The categories the security team files real reported mail under. Everything is on
        by default; switching one off silences every piece of simulated content of that
        kind, whichever event it belongs to. This outranks the event toggles below - an
        event of a switched-off category will not fire even while its own box is ticked.
      </p>

      ${PHISHING_CLASSIFICATIONS.map((classification) => {
        const enabled = isPhishingClassificationEnabled(effective, classification.id);
        const staged = eventsClassifiedAs(classification.id);

        return `
          <article class="phishing-class ${enabled ? "" : "is-disabled"}">
            <label class="phishing-class-head">
              <input
                type="checkbox"
                data-phishing="${classification.id}"
                ${enabled ? "checked" : ""}
              />
              <div>
                <strong>${escapeHtml(classification.label)}</strong>
                ${
                  classification.alsoKnownAs
                    ? `<span class="phishing-aka">${escapeHtml(classification.alsoKnownAs)}</span>`
                    : ""
                }
                <p class="config-help">${escapeHtml(classification.summary)}</p>
              </div>
            </label>

            <div class="phishing-class-detail">
              <p class="config-help"><strong>Objective:</strong> ${escapeHtml(classification.objective)}</p>
              <p class="config-help"><strong>Forms it takes</strong></p>
              <ul class="phishing-vectors">
                ${classification.vectors.map((vector) => `<li>${escapeHtml(vector)}</li>`).join("")}
              </ul>
              <p class="config-help phishing-staged">
                ${
                  staged.length === 0
                    ? "Nothing in the catalogue stages this yet."
                    : `In the simulation: ${staged.map((name) => escapeHtml(name)).join(", ")}`
                }
              </p>
            </div>
          </article>
        `;
      }).join("")}

      <div class="config-actions">
        <button type="button" class="config-primary" id="save-phishing">
          Save phishing coverage
        </button>
      </div>
    </section>
  `;
}

/** Reads the coverage card back into the settings shape. */
function readPhishingToggles(): Pick<SimulationSettings, "phishing"> {
  const phishing: Record<string, boolean> = {};

  document.querySelectorAll<HTMLInputElement>("[data-phishing]").forEach((box) => {
    phishing[box.dataset.phishing as string] = box.checked;
  });

  return { phishing };
}

/** Both pages wire the coverage card identically; only the target layer differs. */
function wirePhishing(save: () => void): void {
  document.querySelector<HTMLButtonElement>("#save-phishing")?.addEventListener("click", save);

  document.querySelectorAll<HTMLInputElement>("[data-phishing]").forEach((box) => {
    box.addEventListener("change", () => {
      box.closest(".phishing-class")?.classList.toggle("is-disabled", !box.checked);
    });
  });
}

/* ------------------------------------------------------------------ *
 * Events and triggers
 * ------------------------------------------------------------------ */

/** Plain-English summary of when a trigger fires, with any override applied. */
function describeTriggerTiming(
  trigger: TriggerDefinition,
  effective: SimulationSettings
): string {
  const override = effective.triggers[trigger.id] ?? {};

  if (trigger.condition.type === "atSimTime") {
    const minutes = override.minutesFromDayStart ?? trigger.condition.minutesFromDayStart;
    const hour = effective.workdayStartHour + Math.floor(minutes / 60);
    const minute = String(minutes % 60).padStart(2, "0");

    return `at ${String(hour).padStart(2, "0")}:${minute} simulated, ${minutes} min into the day`;
  }

  if (trigger.condition.type === "afterLogin") {
    const seconds = override.delaySeconds ?? trigger.condition.delaySeconds;
    const repeat = override.repeatEverySeconds ?? trigger.repeat?.everySeconds;

    return repeat
      ? `${seconds}s after sign-in, then every ${repeat}s`
      : `${seconds}s after sign-in`;
  }

  if (trigger.condition.type === "whileState") {
    const repeat = override.repeatEverySeconds ?? trigger.repeat?.everySeconds;

    return repeat
      ? `every ${repeat}s while ${trigger.condition.flag}, starting ${repeat}s in`
      : `as soon as ${trigger.condition.flag} begins`;
  }

  if (trigger.condition.type === "afterEvent") {
    const delay = override.delayMinutes ?? trigger.condition.delayMinutes;

    return `${delay} simulated min after the ${trigger.condition.eventId} event`;
  }

  const target = trigger.condition.target ? ` on ${trigger.condition.target}` : "";

  return `when the learner does ${trigger.condition.action}${target}`;
}

/**
 * Timing fields differ per condition type, so each trigger renders only the numbers
 * that actually apply to it.
 */
function renderTriggerParams(
  trigger: TriggerDefinition,
  effective: SimulationSettings
): string {
  const override = effective.triggers[trigger.id] ?? {};
  const fields: string[] = [];

  const numberField = (key: string, label: string, value: number, max: number) => `
    <label class="trigger-param">
      <span>${label}</span>
      <input
        type="number"
        step="1"
        min="0"
        max="${max}"
        data-trigger-param="${key}"
        data-trigger="${trigger.id}"
        value="${value}"
      />
    </label>
  `;

  if (trigger.condition.type === "atSimTime") {
    fields.push(
      numberField(
        "minutesFromDayStart",
        "Minutes into the day",
        override.minutesFromDayStart ?? trigger.condition.minutesFromDayStart,
        24 * 60
      )
    );
  }

  if (trigger.condition.type === "afterLogin") {
    fields.push(
      numberField(
        "delaySeconds",
        "Delay after sign-in (s)",
        override.delaySeconds ?? trigger.condition.delaySeconds,
        3600
      )
    );
  }

  if (trigger.condition.type === "afterEvent") {
    fields.push(
      numberField(
        "delayMinutes",
        "Delay after event (sim min)",
        override.delayMinutes ?? trigger.condition.delayMinutes,
        24 * 60
      )
    );
  }

  if (trigger.repeat) {
    fields.push(
      numberField(
        "repeatEverySeconds",
        "Repeat every (s)",
        override.repeatEverySeconds ?? trigger.repeat.everySeconds,
        3600
      )
    );
  }

  return fields.length > 0 ? `<div class="trigger-params">${fields.join("")}</div>` : "";
}

function renderCatalogueSection(effective: SimulationSettings): string {
  const grouped = new Map<string, typeof SIM_EVENTS>();

  SIM_EVENTS.forEach((event) => {
    grouped.set(event.category, [...(grouped.get(event.category) ?? []), event]);
  });

  return `
    <section class="config-card">
      <h2>Events and triggers</h2>
      <p class="config-note">
        An <strong>event</strong> is something that happens in the simulation. A
        <strong>trigger</strong> decides when it happens. Either can be switched off,
        and trigger timing can be retuned without touching code.
      </p>

      ${[...grouped.entries()]
        .map(
          ([category, categoryEvents]) => `
            <h3 class="catalogue-category">${escapeHtml(category)}</h3>
            ${categoryEvents
              .map((event) => {
                const ticked = effective.events[event.id] ?? event.defaultEnabled;
                const coveredByCampaign =
                  !event.phishing || isPhishingClassificationEnabled(effective, event.phishing);
                // Two different reasons to be dim, and an operator needs to be able to
                // tell them apart: their own box, or the whole category being off.
                const enabled = ticked && coveredByCampaign;
                const eventTriggers = SIM_TRIGGERS.filter((item) => item.eventId === event.id);

                return `
                  <article class="catalogue-event ${enabled ? "" : "is-disabled"}">
                    <label class="catalogue-event-head">
                      <input type="checkbox" data-event="${event.id}" ${ticked ? "checked" : ""} />
                      <div>
                        <strong>${escapeHtml(event.name)}</strong>
                        <code>${escapeHtml(event.id)}</code>
                        ${
                          event.phishing
                            ? `<span class="catalogue-phishing-tag">${escapeHtml(
                                phishingLabel(event.phishing)
                              )}</span>`
                            : ""
                        }
                        <p class="config-help">${escapeHtml(event.description)}</p>
                        ${
                          ticked && !coveredByCampaign
                            ? `<p class="config-help catalogue-silenced">
                                 Will not fire: ${escapeHtml(
                                   phishingLabel(event.phishing!)
                                 )} is switched off under Phishing coverage.
                               </p>`
                            : ""
                        }
                      </div>
                    </label>

                    ${
                      eventTriggers.length === 0
                        ? `<p class="config-help catalogue-no-trigger">
                             No trigger of its own - only another event can fire this.
                           </p>`
                        : eventTriggers
                            .map((trigger) => {
                              const triggerEnabled =
                                effective.triggers[trigger.id]?.enabled ?? trigger.defaultEnabled;

                              return `
                                <div class="catalogue-trigger">
                                  <label class="catalogue-trigger-head">
                                    <input
                                      type="checkbox"
                                      data-trigger-enabled="${trigger.id}"
                                      ${triggerEnabled ? "checked" : ""}
                                    />
                                    <div>
                                      <strong>${escapeHtml(trigger.name)}</strong>
                                      <span class="catalogue-timing">${escapeHtml(
                                        describeTriggerTiming(trigger, effective)
                                      )}</span>
                                      <p class="config-help">${escapeHtml(trigger.description)}</p>
                                    </div>
                                  </label>
                                  ${renderTriggerParams(trigger, effective)}
                                </div>
                              `;
                            })
                            .join("")
                    }
                  </article>
                `;
              })
              .join("")}
          `
        )
        .join("")}

      <div class="config-actions">
        <button type="button" class="config-primary" id="save-catalogue">
          Save events and triggers
        </button>
      </div>
    </section>
  `;
}

/** Reads the catalogue section back into the settings shape. */
function readCatalogue(): Pick<SimulationSettings, "events" | "triggers"> {
  const events: Record<string, boolean> = {};
  const triggers: SimulationSettings["triggers"] = {};

  document.querySelectorAll<HTMLInputElement>("[data-event]").forEach((box) => {
    events[box.dataset.event as string] = box.checked;
  });

  document.querySelectorAll<HTMLInputElement>("[data-trigger-enabled]").forEach((box) => {
    const id = box.dataset.triggerEnabled as string;
    triggers[id] = { ...triggers[id], enabled: box.checked };
  });

  document.querySelectorAll<HTMLInputElement>("[data-trigger-param]").forEach((input) => {
    const id = input.dataset.trigger as string;
    const key = input.dataset.triggerParam as string;
    triggers[id] = { ...triggers[id], [key]: Number(input.value) };
  });

  return { events, triggers };
}

function renderNav(current: "backend" | "admin"): string {
  return `
    <nav class="config-nav">
      <a href="/backend" class="${current === "backend" ? "current" : ""}">Backend</a>
      <a href="/admin" class="${current === "admin" ? "current" : ""}">Admin</a>
      <a href="/">Open simulation</a>
    </nav>
  `;
}

/** The unit currently chosen in the form, if the form is on screen. */
function currentUnitSelection(): TemperatureUnit | null {
  const select = document.querySelector<HTMLSelectElement>('[data-key="temperatureUnit"]');
  const value = select?.value;

  return value === "fahrenheit" || value === "celsius" ? value : null;
}

/**
 * Flipping the unit rewrites the value so the actual temperature is preserved:
 * 72 degrees Fahrenheit becomes 22 Celsius, not 72 Celsius.
 */
function wireTemperatureUnit(): void {
  const unitSelect = document.querySelector<HTMLSelectElement>('[data-key="temperatureUnit"]');
  const valueInput = document.querySelector<HTMLInputElement>('[data-key="temperatureValue"]');

  if (!unitSelect || !valueInput) {
    return;
  }

  let previousUnit = unitSelect.value as TemperatureUnit;

  unitSelect.addEventListener("change", () => {
    const nextUnit = unitSelect.value as TemperatureUnit;
    const bounds = LIMITS.temperature[nextUnit];

    valueInput.value = String(
      convertTemperature(Number(valueInput.value), previousUnit, nextUnit)
    );
    valueInput.min = String(bounds.min);
    valueInput.max = String(bounds.max);

    previousUnit = nextUnit;
  });
}

/**
 * Coerces one form control back to its settings type.
 *
 * Keyed off the control, not the field name, so the mapping is stated once. Everything
 * unlisted is a whole number - which is what all the numeric controls are.
 */
function coerceFieldValue(field: FieldDefinition, raw: string): unknown {
  if (
    field.control === "locale" ||
    field.control === "temperatureUnit" ||
    field.control === "consequenceStyle"
  ) {
    return raw;
  }

  if (field.control === "unitLocalization" || field.control === "consequenceToggle") {
    return raw === "true";
  }

  return Number(raw);
}

/**
 * Reads every scalar field on the form.
 *
 * Built from FIELDS rather than listed by hand. The hand-written version silently dropped
 * the two messenger settings the moment they were added to the form - the same failure the
 * TRIGGER_NUMBER_PARAMS table exists to prevent, so this is the same fix.
 */
function readAllFields(): Partial<SimulationSettings> {
  const output: Record<string, unknown> = {};

  FIELDS.forEach((field) => {
    output[field.key] = coerceFieldValue(field, readFieldValue(field.key));
  });

  return output as Partial<SimulationSettings>;
}

function readFieldValue(key: SettingKey): string {
  const element = document.querySelector<HTMLInputElement | HTMLSelectElement>(
    `[data-key="${key}"]`
  );

  return element?.value ?? "";
}

function flash(message: string): void {
  const banner = document.querySelector<HTMLElement>("#config-flash");

  if (!banner) {
    return;
  }

  banner.textContent = message;
  banner.classList.add("visible");

  window.setTimeout(() => banner.classList.remove("visible"), 2600);
}

/* ------------------------------------------------------------------ *
 * Backend page
 * ------------------------------------------------------------------ */

export function renderBackendPage(root: HTMLElement, onChange: () => void): void {
  const { backend, effective } = resolveConfig();

  root.innerHTML = `
    <main class="config-page">
      <header class="config-header">
        <div>
          <p class="config-eyebrow">Backend</p>
          <h1>Application defaults</h1>
          <p class="config-lede">
            The values the simulation falls back to everywhere. An organization can
            override any of these on the Admin page.
          </p>
        </div>
        ${renderNav("backend")}
      </header>

      <div class="config-flash" id="config-flash" role="status" aria-live="polite"></div>

      <section class="config-card">
        <form id="backend-form" class="config-form">
          ${FIELDS.map(
            (field) => `
              <div class="config-field">
                <label for="field-${field.key}">${field.label}</label>
                ${renderControl(field, backend[field.key])}
                <p class="config-help">${field.help}</p>
              </div>
            `
          ).join("")}

          <div class="config-actions">
            <button type="submit" class="config-primary">Save defaults</button>
            <button type="button" class="config-secondary" id="reset-backend">
              Restore factory defaults
            </button>
          </div>
        </form>
      </section>

      ${renderPhishingSection(effective)}

      ${renderCatalogueSection(effective)}

      ${renderSummary(effective)}
    </main>
  `;

  wirePhishing(() => {
    saveBackendSettings({ ...resolveConfig().backend, ...readPhishingToggles() });
    onChange();
    renderBackendPage(root, onChange);
    flash("Phishing coverage saved.");
  });

  wireCatalogue(() => {
    saveBackendSettings({ ...resolveConfig().backend, ...readCatalogue() });
    onChange();
    renderBackendPage(root, onChange);
    flash("Events and triggers saved.");
  });

  document.querySelector<HTMLFormElement>("#backend-form")!.addEventListener("submit", (event) => {
    event.preventDefault();

    saveBackendSettings(readAllFields());

    onChange();
    renderBackendPage(root, onChange);
    flash("Defaults saved.");
  });

  wireTemperatureUnit();

  document.querySelector<HTMLButtonElement>("#reset-backend")!.addEventListener("click", () => {
    clearLayer("backend");
    onChange();
    renderBackendPage(root, onChange);
    flash("Restored factory defaults.");
  });
}

/* ------------------------------------------------------------------ *
 * Admin page
 * ------------------------------------------------------------------ */

export function renderAdminPage(root: HTMLElement, onChange: () => void): void {
  const { backend, admin, permissions, effective } = resolveConfig();

  root.innerHTML = `
    <main class="config-page">
      <header class="config-header">
        <div>
          <p class="config-eyebrow">Admin</p>
          <h1>Organization settings</h1>
          <p class="config-lede">
            Override the application defaults for this organization, and choose what
            learners may change for themselves.
          </p>
        </div>
        ${renderNav("admin")}
      </header>

      <div class="config-flash" id="config-flash" role="status" aria-live="polite"></div>

      <section class="config-card">
        <h2>Overrides</h2>
        <p class="config-note">
          Unchecked fields inherit the backend default, shown beside each control.
        </p>

        <form id="admin-form" class="config-form">
          ${FIELDS.map((field) => {
            const isOverridden = admin[field.key] !== undefined;
            const value = admin[field.key] ?? backend[field.key];
            let inherited = String(backend[field.key]);

            if (field.control === "locale") {
              inherited = languageAutonym(backend.defaultLocale);
            }

            if (field.control === "unitLocalization") {
              inherited = backend.localizeTemperatureUnit
                ? "match learner locale"
                : "as configured";
            }

            if (field.control === "consequenceToggle") {
              inherited = backend.consequencesEnabled ? "on" : "off";
            }

            if (field.control === "consequenceStyle") {
              inherited =
                CONSEQUENCE_STYLES.find((style) => style.id === backend.consequenceStyle)
                  ?.label ?? backend.consequenceStyle;
            }

            return `
              <div class="config-field">
                <div class="config-override-row">
                  <label class="config-toggle">
                    <input
                      type="checkbox"
                      class="override-toggle"
                      data-for="${field.key}"
                      ${isOverridden ? "checked" : ""}
                    />
                    <span>${field.label}</span>
                  </label>
                  <span class="config-inherited">default: ${escapeHtml(inherited)}</span>
                </div>
                ${renderControl(field, value, isOverridden ? "" : "disabled")}
                <p class="config-help">${field.help}</p>
              </div>
            `;
          }).join("")}

          <div class="config-actions">
            <button type="submit" class="config-primary">Save organization settings</button>
            <button type="button" class="config-secondary" id="clear-admin">
              Clear all overrides
            </button>
          </div>
        </form>
      </section>

      <section class="config-card">
        <h2>Learner permissions</h2>
        <p class="config-note">
          Controls which options appear on the learner's own preferences screen.
        </p>

        <div class="config-permission locked">
          <div>
            <strong>Language</strong>
            <p class="config-help">Always available to learners.</p>
          </div>
          <span class="config-lock">Always on</span>
        </div>

        <label class="config-permission">
          <div>
            <strong>Time lapse</strong>
            <p class="config-help">
              Lets learners set their own real-minutes-per-simulated-hour.
            </p>
          </div>
          <input type="checkbox" id="permit-time-lapse" ${permissions.timeLapse ? "checked" : ""} />
        </label>

        <label class="config-permission">
          <div>
            <strong>Temperature</strong>
            <p class="config-help">
              Lets learners set the desktop temperature and choose &deg;F or &deg;C.
            </p>
          </div>
          <input type="checkbox" id="permit-temperature" ${permissions.temperature ? "checked" : ""} />
        </label>
      </section>

      ${renderPhishingSection(effective)}

      ${renderCatalogueSection(effective)}

      ${renderSummary(effective)}
    </main>
  `;

  wirePhishing(() => {
    const existing = resolveConfig().admin;

    saveAdminSettings({ ...existing, ...readPhishingToggles() });
    onChange();
    renderAdminPage(root, onChange);
    flash("Phishing coverage saved for this organization.");
  });

  // Admin stores only the catalogue keys it changes; everything else keeps inheriting.
  wireCatalogue(() => {
    const existing = resolveConfig().admin;

    saveAdminSettings({ ...existing, ...readCatalogue() });
    onChange();
    renderAdminPage(root, onChange);
    flash("Events and triggers saved for this organization.");
  });

  // Toggling an override enables its control and seeds it with the inherited value.
  document.querySelectorAll<HTMLInputElement>(".override-toggle").forEach((toggle) => {
    toggle.addEventListener("change", () => {
      const key = toggle.dataset.for as SettingKey;
      const control = document.querySelector<HTMLInputElement | HTMLSelectElement>(
        `[data-key="${key}"]`
      );

      if (!control) {
        return;
      }

      control.disabled = !toggle.checked;

      if (toggle.checked) {
        control.focus();
      }
    });
  });

  document.querySelector<HTMLFormElement>("#admin-form")!.addEventListener("submit", (event) => {
    event.preventDefault();

    const overrides: Partial<SimulationSettings> = {};

    document.querySelectorAll<HTMLInputElement>(".override-toggle").forEach((toggle) => {
      if (!toggle.checked) {
        return;
      }

      const key = toggle.dataset.for as SettingKey;
      const raw = readFieldValue(key);

      const field = FIELDS.find((candidate) => candidate.key === key);

      if (field) {
        overrides[key] = coerceFieldValue(field, raw) as never;
      }
    });

    saveAdminSettings(overrides);
    saveAdminPermissions(readPermissionToggles());

    onChange();
    renderAdminPage(root, onChange);
    flash("Organization settings saved.");
  });

  document.querySelector<HTMLButtonElement>("#clear-admin")!.addEventListener("click", () => {
    clearLayer("admin");
    onChange();
    renderAdminPage(root, onChange);
    flash("Overrides cleared; inheriting backend defaults.");
  });

  wireTemperatureUnit();

  // Re-render rather than just saving: revoking a permission changes the effective
  // settings, and the summary panel below would otherwise show a stale value.
  document
    .querySelectorAll<HTMLInputElement>("#permit-time-lapse, #permit-temperature")
    .forEach((toggle) => {
      toggle.addEventListener("change", () => {
        saveAdminPermissions(readPermissionToggles());
        onChange();
        renderAdminPage(root, onChange);
        flash("Learner permissions updated.");
      });
    });
}

function readPermissionToggles(): { timeLapse: boolean; temperature: boolean } {
  return {
    timeLapse: document.querySelector<HTMLInputElement>("#permit-time-lapse")?.checked ?? false,
    temperature: document.querySelector<HTMLInputElement>("#permit-temperature")?.checked ?? false
  };
}

/**
 * Both pages save the catalogue the same way, so the difference is only which layer
 * receives it.
 */
function wireCatalogue(save: () => void): void {
  document.querySelector<HTMLButtonElement>("#save-catalogue")?.addEventListener("click", save);

  // Dim an event and its triggers immediately, before saving, so the effect is visible.
  document.querySelectorAll<HTMLInputElement>("[data-event]").forEach((box) => {
    box.addEventListener("change", () => {
      box.closest(".catalogue-event")?.classList.toggle("is-disabled", !box.checked);
    });
  });
}

/** Local copy: configScreens must not depend on the learner-screen module. */
function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

export { BACKEND_DEFAULTS };
