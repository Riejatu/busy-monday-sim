import "./style.css";
import "./config/config.css";
import "./events/events.css";
import "./choiceSelector.css";
import "./messenger.css";

import {
  getAvailableLocales,
  getLocale,
  setLocale,
  t
} from "./localization/i18n";

import type { LocaleCode } from "./localization/i18n";

import {
  clockAccessibleLabel,
  clockDateLabel,
  clockTimeLabel,
  countryLabel,
  departmentLabel,
  languageAutonym,
  resolveDisplayTemperature,
  securityRatingLabel,
  temperatureAccessibleLabel,
  temperatureLabel,
  tenureLabel
} from "./localization/labels";

import { applyCompanyTheme, loadOrganizations } from "./data/roster";
import type { Company, Employee } from "./data/roster";

import {
  buildScenarioContext,
  formatMailAddress,
  getClockAt,
  getFullName,
  getInitial,
  getWorkdayStart,
  getWorkdayTotalMinutes
} from "./scenario";

import type { ScenarioContext } from "./scenario";

import { createSimClock } from "./simClock";
import type { SimClock } from "./simClock";
import "./phone.css";
import "./inPerson.css";
import "./consequences.css";

import {
  clearLayer,
  convertTemperature,
  isPhishingClassificationEnabled,
  LIMITS,
  resolveConfig,
  saveUserSettings
} from "./config/settings";

import type { ResolvedConfig, TemperatureUnit } from "./config/settings";
import { renderAdminPage, renderBackendPage } from "./config/configScreens";
import { withBase } from "./assetPath";
import {
  isConsequenceOpen,
  isVisibleConsequenceStyle,
  showConsequence
} from "./consequences";

import { createEventEngine } from "./events/engine";
import type { EventEngine } from "./events/engine";
import { SIM_EVENTS, SIM_TRIGGERS } from "./events/registry";
import type {
  ChatMessage,
  ChatThread,
  DesktopBridge,
  DesktopNotification,
  InjectedMessage,
  ChoiceOutcome,
  ChoicePrompt,
  LearnerAction,
  NotificationSource,
  PhoneCall,
  SpokenLine
} from "./events/types";
import { record, startSession } from "./eventLogger";

import { closeContextMenu, openContextMenu } from "./desktopMenu";
import type { MenuSection } from "./desktopMenu";

import { closeChoicePrompt, isChoiceOpen, openChoicePrompt } from "./choiceSelector";

/** Built-in messages, plus any id an event has injected. */
type EmailId = string;
type AppScreen =
  | "personalization"
  | "userConfig"
  | "intro"
  | "markVideo"
  | "login"
  | "desktop";

/* ------------------------------------------------------------------ *
 * Session state
 *
 * Deliberately in-memory only. The personalization screen promises that nothing
 * is saved or transmitted, so no profile, password or login record is persisted.
 * Only the language preference outlives a reload (see i18n.ts).
 * ------------------------------------------------------------------ */

let organizations: Company[] = [];
let currentScreen: AppScreen = "personalization";
let scenario: ScenarioContext | null = null;
let sessionPassword = "";

// In-progress personalization choices. Held here rather than read back off the
// <select> elements so a re-render (language change) does not discard them.
let selectedCompanyId: string | null = null;
let selectedEmployeeId: string | null = null;
let draftPassword = "";

// The employee whose locale has already been applied. Applying only on change is
// what lets a manual language override survive later re-renders.
let localeAppliedFor: string | null = null;

// The simulated workday clock. Created when the learner first reaches the desktop.
let simClock: SimClock | null = null;
let simMinutes = 0;

// Resolved backend -> admin -> user cascade. Re-read whenever a config page saves.
let config: ResolvedConfig = resolveConfig();

// Events and triggers. Created when the learner reaches the desktop.
let eventEngine: EventEngine | null = null;

// Whether the corporate network is even on the air. A future event can drop it.
let wifiAvailable = true;

// Which network the learner has joined, or null when offline. The taskbar icon and
// the no-connection prompt both derive from this rather than from sign-in.
let connectedNetworkId: string | null = null;

// Messages events have dropped into the inbox, kept so a re-render can replay them.
const injectedMessages = new Map<string, InjectedMessage>();

/** Resolvers waiting for the learner to open a particular message. */
let emailOpenWaiters: Array<{ messageId: string; resolve: () => void }> = [];

/**
 * The message in the reading pane while the mail window is up, or null. Drives the same
 * "do not announce what they are already looking at" rule the messenger uses.
 */
let openEmailId: string | null = null;

/**
 * The call on screen, if any. The handset is a prop - it holds no decisions - so a single
 * slot is enough: two simultaneous calls would be a fiction problem, not a data problem.
 */
let phoneCall: PhoneCall | null = null;
let phoneTimerHandle: number | null = null;
/** Real milliseconds when the call connected, for the call timer. */
let phoneConnectedAt = 0;
/** When the call timer was paused, or 0 while it is running. */
let phonePausedSince = 0;

/**
 * Whoever is currently standing at the learner's desk talking to them, or null.
 *
 * One slot: two people talking at once would be a fiction problem, not a data problem.
 */
let spokenLine: SpokenLine | null = null;
let spokenLineTimer: number | null = null;

/** Desktop icon size, chosen from the wallpaper context menu. */
type IconSize = "small" | "medium" | "large";
let iconSize: IconSize = "medium";

/**
 * The company messenger. One conversation is enough for now; keyed state would come in
 * the moment a second thread exists.
 */
/** A posted message, stamped with the simulated time it arrived. */
interface StoredChatMessage extends ChatMessage {
  timeLabel: string;
}

/**
 * One conversation in the messenger. A day holds several, and only one of them is the
 * attack - so the learner is reading a list of ordinary messages, not a single suspicious
 * one arriving out of nowhere.
 */
interface ChatConversation {
  thread: ChatThread;
  messages: StoredChatMessage[];
  unread: number;
  /**
   * Whether the learner has ever opened this conversation. Once they have, later messages
   * stop interrupting with toasts - they know the thread is there, and the tray badge is
   * enough. This is deliberately sticky across closing the window: a second toast for a
   * conversation the learner has already read is nagging, not news.
   */
  everOpened: boolean;
  /**
   * The interaction is finished - the learner answered and nothing further will arrive.
   * When every conversation is resolved and read, the tray icon goes away entirely.
   */
  resolved: boolean;
  /** Arrival order, so the list reads newest-first regardless of Map iteration. */
  sequence: number;
}

/** Keyed by thread id, in arrival order. */
const conversations = new Map<string, ChatConversation>();
let conversationSequence = 0;

/** The conversation showing in the window, or null. */
let openThreadId: string | null = null;
/** Whether the tray flyout listing the conversations is showing. */
let chatListOpen = false;

/** Resolvers waiting on `awaitChatOpened`, each for one thread. */
let chatOpenWaiters: Array<{ threadId: string; resolve: () => void }> = [];

function goToScreen(screen: AppScreen): void {
  currentScreen = screen;
  renderApp();
}

function requireScenario(): ScenarioContext {
  if (!scenario) {
    throw new Error("No profile selected. The personalization screen must run first.");
  }

  return scenario;
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

async function startApp(): Promise<void> {
  const root = document.querySelector<HTMLDivElement>("#app")!;

  // The operator pages need no roster, so skip the 300 KB fetch for them.
  const route = getRoute();

  if (route === "backend") {
    renderBackendPage(root, refreshConfig);
    return;
  }

  if (route === "admin") {
    renderAdminPage(root, refreshConfig);
    return;
  }

  organizations = await loadOrganizations();
  applyDefaultLocale();
  bindTimeKeys();
  bindContextMenu();
  renderApp();
}

/**
 * Dedicated URLs for the operator pages. Vite's dev server and any SPA-style host
 * serve index.html for these paths, so no router library is needed.
 */
function getRoute(): "backend" | "admin" | "simulation" {
  const path = window.location.pathname.replace(/\/+$/, "");

  // Compare against the trailing segment, not the full path: a non-root deploy (e.g.
  // GitHub Pages' /<repo>/ project sites) puts these routes at /<repo>/admin, not /admin.
  if (path.endsWith("/backend")) {
    return "backend";
  }

  if (path.endsWith("/admin")) {
    return "admin";
  }

  return "simulation";
}

/** Re-reads the cascade after a config page saves, and rebuilds anything derived. */
function refreshConfig(): void {
  config = resolveConfig();

  // The clock and the engine are both built from the effective settings, so a change
  // to either means discarding them and rebuilding on the next desktop entry.
  simClock?.stop();
  simClock = null;
  simMinutes = 0;
  eventEngine = null;
}

/**
 * The configured default language applies only when the learner has no stored
 * preference of their own; a profile locale or a manual choice still wins later.
 */
function applyDefaultLocale(): void {
  if (localStorage.getItem("locale")) {
    return;
  }

  setLocale(config.effective.defaultLocale);
}

/** Simulated minutes the right arrow skips, matching the clock's default display step. */
const FAST_FORWARD_MINUTES = 15;

/**
 * Right arrow skips the day ahead; space pauses and resumes it.
 *
 * Bound to the document once at boot rather than per render, so repeated screen renders
 * cannot stack duplicate handlers.
 */
function bindTimeKeys(): void {
  document.addEventListener("keydown", (event) => {
    if (currentScreen !== "desktop") {
      return;
    }

    // A prompt or a consequence owns the keyboard while it is up - their controls are
    // focusable buttons, and space is how a button is activated. The day is paused anyway.
    if (isChoiceOpen() || isConsequenceOpen()) {
      return;
    }

    if (event.key === "ArrowRight") {
      // Never steal the key from a field or a control that uses arrows itself.
      if (isTextEntryTarget(event.target)) {
        return;
      }

      event.preventDefault();
      simClock?.fastForward(FAST_FORWARD_MINUTES);
      return;
    }

    if (event.key === " " || event.key === "Spacebar") {
      /*
       * Space activates whatever control has focus, so it is only a pause key when nothing
       * interactive is focused. Hijacking it unconditionally would break keyboard
       * activation of every desktop icon and taskbar button.
       */
      if (isInteractiveTarget(event.target)) {
        return;
      }

      event.preventDefault();
      toggleLearnerTimePause();
    }
  });
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/**
 * Anything that consumes a space press itself. Broader than `isTextEntryTarget`, because
 * arrows and space are stolen by different things: arrows by text fields and selects, space
 * by every button and link as well.
 */
function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    isTextEntryTarget(target) ||
    Boolean(target.closest("button, a, [role=\"button\"], [tabindex]:not([tabindex=\"-1\"])"))
  );
}

/** Screens reachable before a profile has been chosen. */
const PRE_SCENARIO_SCREENS: AppScreen[] = ["personalization", "userConfig"];

function renderApp(): void {
  closeContextMenu();
  closeChoicePrompt();

  // Everything past the setup screens needs a chosen profile.
  if (!scenario && !PRE_SCENARIO_SCREENS.includes(currentScreen)) {
    currentScreen = "personalization";
  }

  // Keep the brand variables in step with the chosen company on every screen.
  if (scenario) {
    applyCompanyTheme(scenario.company);
  }

  if (currentScreen === "personalization") {
    renderPersonalizationScreen();
    return;
  }

  if (currentScreen === "userConfig") {
    renderUserConfigScreen();
    return;
  }

  if (currentScreen === "intro") {
    renderIntroScreen();
    return;
  }

  if (currentScreen === "markVideo") {
    renderMarkVideoScreen();
    return;
  }

  if (currentScreen === "login") {
    renderLoginScreen();
    return;
  }

  renderDesktopScreen();
}

/* ------------------------------------------------------------------ *
 * Personalization
 * ------------------------------------------------------------------ */

function renderPersonalizationScreen(): void {
  const company = getSelectedCompany();
  const employee = getSelectedEmployee(company);

  applyCompanyTheme(company);
  applyProfileLocale(employee);

  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div class="personalization-screen">
      <div class="personalization-window">

        <div class="personalization-content">
          <section class="personalization-hero" id="personalization-hero">
            ${renderHeroMarkup(company)}
          </section>

          <section class="personalization-form-panel">
            <div class="personalization-language-row">
              <button type="button" class="preferences-link" id="open-user-config">
                <span class="preferences-icon" aria-hidden="true">&#9881;</span>
                <span>${t("userConfig.open")}</span>
                <span class="preferences-current">${escapeHtml(languageAutonym(getLocale()))}</span>
              </button>
            </div>

            <h1>${t("personalization.heading")}</h1>

            <div class="privacy-note">
              <div class="privacy-icon">🛡</div>
              <p>${t("personalization.privacyNote")}</p>
            </div>

            <div class="form-divider"></div>

            <form id="personalization-form" class="personalization-form">
              <label>
                <span>${t("personalization.companyLabel")}</span>
                <div class="input-shell select-shell">
                  <span class="input-icon">🏢</span>
                  <select id="company-select">
                    ${organizations
                      .map(
                        (option) => `
                          <option value="${option.id}" ${option.id === company.id ? "selected" : ""}>
                            ${escapeHtml(option.name)}
                          </option>
                        `
                      )
                      .join("")}
                  </select>
                </div>
              </label>

              <label>
                <span>${t("personalization.profileLabel")}</span>
                <div class="input-shell select-shell">
                  <span class="input-icon">👤</span>
                  <select id="employee-select">
                    ${renderEmployeeOptionsMarkup(company, employee)}
                  </select>
                </div>
              </label>

              <div class="profile-summary" id="profile-summary">
                ${renderProfileSummaryMarkup(employee)}
              </div>

              <label>
                <span>${t("personalization.passwordLabel")}</span>
                <div class="input-shell">
                  <span class="input-icon">🔒</span>
                  <input
                    id="demo-password"
                    type="password"
                    autocomplete="off"
                    placeholder="${t("personalization.passwordPlaceholder")}"
                    value="${escapeHtml(draftPassword)}"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    id="password-toggle"
                    aria-label="${t("personalization.showPassword")}"
                  >
                    👁
                  </button>
                </div>
              </label>

              <div class="password-note">
                <div class="password-note-icon">🔒</div>
                <p>${t("personalization.passwordNote")}</p>
              </div>

              <button class="start-simulation-button" type="submit">
                ${t("personalization.start")}
                <span>→</span>
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  `;

  attachPersonalizationListeners();
}

function renderHeroMarkup(company: Company): string {
  return `
    <div class="hero-overlay"></div>

    <div class="hero-brand">
      <img class="hero-logo" src="${withBase(company.logo)}" alt="" />
      <div class="hero-company">
        <strong>${escapeHtml(company.name)}</strong>
        <span>${escapeHtml(company.industry)}</span>
      </div>
    </div>
  `;
}

function renderEmployeeOptionsMarkup(company: Company, selected: Employee): string {
  return company.employees
    .map(
      (employee) => `
        <option value="${employee.id}" ${employee.id === selected.id ? "selected" : ""}>
          ${escapeHtml(
            t("personalization.profileOption", {
              name: getFullName(employee),
              department: departmentLabel(employee.department)
            })
          )}
        </option>
      `
    )
    .join("");
}

function renderProfileSummaryMarkup(employee: Employee): string {
  const rows = [
    { label: t("personalization.summaryEmail"), value: employee.email },
    { label: t("personalization.summaryDepartment"), value: departmentLabel(employee.department) },
    { label: t("personalization.summaryLocation"), value: countryLabel(employee.locale) },
    { label: t("personalization.summaryTenure"), value: tenureLabel(employee.tenure) },
    {
      label: t("personalization.summaryRating"),
      value: securityRatingLabel(employee.securityRating),
      ratingClass: `rating-${employee.securityRating}`
    }
  ];

  return rows
    .map(
      (row) => `
        <div class="profile-summary-row">
          <span class="profile-summary-label">${escapeHtml(row.label)}</span>
          <span class="profile-summary-value ${row.ratingClass ?? ""}">
            ${escapeHtml(row.value)}
          </span>
        </div>
      `
    )
    .join("");
}

function attachPersonalizationListeners(): void {
  const form = document.querySelector<HTMLFormElement>("#personalization-form")!;
  const companySelect = document.querySelector<HTMLSelectElement>("#company-select")!;
  const employeeSelect = document.querySelector<HTMLSelectElement>("#employee-select")!;
  const passwordInput = document.querySelector<HTMLInputElement>("#demo-password")!;
  const passwordToggle = document.querySelector<HTMLButtonElement>("#password-toggle")!;
  const hero = document.querySelector<HTMLElement>("#personalization-hero")!;
  const summary = document.querySelector<HTMLDivElement>("#profile-summary")!;

  document
    .querySelector<HTMLButtonElement>("#open-user-config")!
    .addEventListener("click", () => {
      draftPassword = passwordInput.value;
      goToScreen("userConfig");
    });

  passwordInput.addEventListener("input", () => {
    draftPassword = passwordInput.value;
  });

  companySelect.addEventListener("change", () => {
    const company = findCompanyById(companySelect.value);
    const employee = getDefaultEmployee(company);

    selectedCompanyId = company.id;
    selectedEmployeeId = employee.id;

    // A locale switch changes every string on screen, so it needs a full re-render.
    // Otherwise patch in place, which keeps focus and scroll position steady.
    if (applyProfileLocale(employee)) {
      renderPersonalizationScreen();
      return;
    }

    applyCompanyTheme(company);
    hero.innerHTML = renderHeroMarkup(company);
    employeeSelect.innerHTML = renderEmployeeOptionsMarkup(company, employee);
    summary.innerHTML = renderProfileSummaryMarkup(employee);
  });

  employeeSelect.addEventListener("change", () => {
    const company = findCompanyById(companySelect.value);
    const employee = findEmployeeById(company, employeeSelect.value);

    selectedEmployeeId = employee.id;

    if (applyProfileLocale(employee)) {
      renderPersonalizationScreen();
      return;
    }

    summary.innerHTML = renderProfileSummaryMarkup(employee);
  });

  passwordToggle.addEventListener("click", () => {
    const isPasswordHidden = passwordInput.type === "password";

    passwordInput.type = isPasswordHidden ? "text" : "password";
    passwordToggle.textContent = isPasswordHidden ? "🙈" : "👁";
    passwordToggle.setAttribute(
      "aria-label",
      isPasswordHidden
        ? t("personalization.hidePassword")
        : t("personalization.showPassword")
    );
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const company = findCompanyById(companySelect.value);
    const employee = findEmployeeById(company, employeeSelect.value);

    draftPassword = passwordInput.value;
    sessionPassword = draftPassword;
    scenario = buildScenarioContext(company, employee, config.effective);

    goToScreen("intro");
  });
}

/**
 * Switches the interface to the employee's own locale when the selected profile
 * changes. Returns true if the language actually changed, so the caller knows a
 * full re-render is needed.
 *
 * Only fires on a profile change, which is what allows a learner's manual language
 * choice to stick for the rest of their time on this screen.
 */
function applyProfileLocale(employee: Employee): boolean {
  if (localeAppliedFor === employee.id) {
    return false;
  }

  localeAppliedFor = employee.id;

  if (employee.locale === getLocale()) {
    return false;
  }

  setLocale(employee.locale);
  return true;
}

/* ------------------------------------------------------------------ *
 * Roster selection helpers
 * ------------------------------------------------------------------ */

function findCompanyById(companyId: string): Company {
  return organizations.find((company) => company.id === companyId) ?? organizations[0];
}

function findEmployeeById(company: Company, employeeId: string): Employee {
  return (
    company.employees.find((employee) => employee.id === employeeId) ??
    getDefaultEmployee(company)
  );
}

/**
 * Defaults to someone who holds no narrative role, so the out-of-the-box run has
 * a learner distinct from the cast that emails them.
 */
function getDefaultEmployee(company: Company): Employee {
  const castIds = new Set(Object.values(company.scenarioRoles));

  return company.employees.find((employee) => !castIds.has(employee.id)) ?? company.employees[0];
}

function getSelectedCompany(): Company {
  if (selectedCompanyId) {
    return findCompanyById(selectedCompanyId);
  }

  return scenario ? findCompanyById(scenario.company.id) : organizations[0];
}

function getSelectedEmployee(company: Company): Employee {
  const preferredId =
    selectedEmployeeId ?? (scenario?.company.id === company.id ? scenario.learner.id : null);

  const preferred = preferredId
    ? company.employees.find((employee) => employee.id === preferredId)
    : undefined;

  return preferred ?? getDefaultEmployee(company);
}

/* ------------------------------------------------------------------ *
 * Learner preferences
 *
 * The bottom layer of the config cascade. Language is always offered; everything
 * else appears only where the admin granted permission.
 * ------------------------------------------------------------------ */

function renderUserConfigScreen(): void {
  const company = getSelectedCompany();
  const { effective, permissions, user } = config;

  // What the learner's taskbar currently shows - the unit may be locale-derived.
  const weather = resolveDisplayTemperature(effective);

  applyCompanyTheme(company);

  const dayStart = getWorkdayStart(effective.workdayStartHour);
  const dayEnd = getClockAt(dayStart, getWorkdayTotalMinutes(effective));
  const fullDayMinutes =
    (getWorkdayTotalMinutes(effective) / 60) * effective.realMinutesPerSimHour;

  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <main class="user-config-screen">
      <section class="user-config-card">
        <header class="user-config-header">
          <img class="user-config-logo" src="${withBase(company.logo)}" alt="" />
          <div>
            <h1>${t("userConfig.title")}</h1>
            <p>${t("userConfig.intro")}</p>
          </div>
        </header>

        <div class="user-config-field">
          <label for="user-language">${t("language.label")}</label>
          <select id="user-language">
            ${getAvailableLocales()
              .map(
                (locale) => `
                  <option value="${locale}" ${locale === getLocale() ? "selected" : ""}>
                    ${escapeHtml(languageAutonym(locale))}
                  </option>
                `
              )
              .join("")}
          </select>
          <p class="user-config-help">${t("userConfig.languageHelp")}</p>
        </div>

        ${
          permissions.timeLapse
            ? `
              <div class="user-config-field">
                <label for="user-time-lapse">${t("userConfig.timeLapseLabel")}</label>
                <div class="user-config-inline">
                  <input
                    id="user-time-lapse"
                    type="number"
                    step="1"
                    min="1"
                    max="120"
                    value="${effective.realMinutesPerSimHour}"
                  />
                  <span>${t("userConfig.timeLapseUnit")}</span>
                </div>
                <p class="user-config-help">${t("userConfig.timeLapseHelp")}</p>

                <dl class="user-config-readout">
                  <div>
                    <dt>${t("userConfig.workdayLabel")}</dt>
                    <dd>${escapeHtml(clockTimeLabel(dayStart))} &ndash; ${escapeHtml(clockTimeLabel(dayEnd))}</dd>
                  </div>
                  <div>
                    <dt>${t("userConfig.dayLengthLabel")}</dt>
                    <dd id="user-day-length">
                      ${escapeHtml(t("userConfig.dayLengthValue", { minutes: String(fullDayMinutes) }))}
                    </dd>
                  </div>
                </dl>

              </div>
            `
            : ""
        }

        ${
          permissions.temperature
            ? `
              <div class="user-config-field">
                <label for="user-temperature">${t("userConfig.temperatureLabel")}</label>
                <div class="user-config-inline">
                  <input
                    id="user-temperature"
                    type="number"
                    step="1"
                    min="${LIMITS.temperature[weather.unit].min}"
                    max="${LIMITS.temperature[weather.unit].max}"
                    value="${weather.value}"
                  />
                  <select id="user-temperature-unit" aria-label="${t("userConfig.temperatureUnitLabel")}">
                    ${(["fahrenheit", "celsius"] as TemperatureUnit[])
                      .map(
                        (unit) => `
                          <option value="${unit}" ${unit === weather.unit ? "selected" : ""}>
                            ${escapeHtml(t(`temperatureUnits.${unit}`))}
                          </option>
                        `
                      )
                      .join("")}
                  </select>
                  <span class="user-config-preview">
                    ${escapeHtml(temperatureLabel(weather.value, weather.unit))}
                  </span>
                </div>
                <p class="user-config-help">${t("userConfig.temperatureHelp")}</p>
              </div>
            `
            : ""
        }

        ${
          !permissions.timeLapse && !permissions.temperature
            ? `<p class="user-config-locked">${t("userConfig.lockedNotice")}</p>`
            : ""
        }

        <div class="user-config-actions">
          ${
            Object.keys(user).length > 0
              ? `<button type="button" class="user-config-reset" id="reset-user-config">
                   ${t("userConfig.resetToOrg")}
                 </button>`
              : ""
          }
          <button type="button" class="setup-primary-button" id="close-user-config">
            ${t("userConfig.back")}
          </button>
        </div>
      </section>
    </main>
  `;

  const languageSelect = document.querySelector<HTMLSelectElement>("#user-language")!;

  languageSelect.addEventListener("change", () => {
    setLocale(languageSelect.value as LocaleCode);
    renderUserConfigScreen();
  });

  const timeLapseInput = document.querySelector<HTMLInputElement>("#user-time-lapse");

  timeLapseInput?.addEventListener("change", () => {
    saveUserSettings({ realMinutesPerSimHour: Number(timeLapseInput.value) });
    refreshConfig();
    renderUserConfigScreen();
  });

  const temperatureInput = document.querySelector<HTMLInputElement>("#user-temperature");
  const temperatureUnit = document.querySelector<HTMLSelectElement>("#user-temperature-unit");

  // Either control is an explicit choice, which pins the unit and stops it following
  // the learner's locale. The cascade does the rest - no special case at display time.
  temperatureInput?.addEventListener("change", () => {
    saveUserSettings({
      temperatureValue: Number(temperatureInput.value),
      temperatureUnit: (temperatureUnit?.value ?? weather.unit) as TemperatureUnit,
      localizeTemperatureUnit: false
    });

    refreshConfig();
    renderUserConfigScreen();
  });

  // Switching scale keeps the same actual temperature rather than reinterpreting
  // the number, matching the operator pages.
  temperatureUnit?.addEventListener("change", () => {
    const nextUnit = temperatureUnit.value as TemperatureUnit;

    saveUserSettings({
      temperatureUnit: nextUnit,
      temperatureValue: convertTemperature(
        Number(temperatureInput?.value ?? weather.value),
        weather.unit,
        nextUnit
      ),
      localizeTemperatureUnit: false
    });

    refreshConfig();
    renderUserConfigScreen();
  });

  document
    .querySelector<HTMLButtonElement>("#reset-user-config")
    ?.addEventListener("click", () => {
      clearLayer("user");
      refreshConfig();
      renderUserConfigScreen();
    });

  document
    .querySelector<HTMLButtonElement>("#close-user-config")!
    .addEventListener("click", () => {
      goToScreen("personalization");
    });
}

/* ------------------------------------------------------------------ *
 * Briefing
 * ------------------------------------------------------------------ */

function renderIntroScreen(): void {
  const context = requireScenario();

  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <main class="setup-screen setup-text-screen">
      <section class="setup-card">
        <p class="setup-story-text">
          ${escapeHtml(
            t("intro.returnText", {
              company: context.company.name,
              coworker: getFullName(context.cast.narrator)
            })
          )}
        </p>

        <button class="setup-primary-button" id="continue-to-mark-video">
          ${t("intro.continue")}
        </button>
      </section>
    </main>
  `;

  document
    .querySelector<HTMLButtonElement>("#continue-to-mark-video")!
    .addEventListener("click", () => {
      goToScreen("markVideo");
    });
}

function renderMarkVideoScreen(): void {
  const context = requireScenario();
  const narratorName = getFullName(context.cast.narrator);

  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <main class="setup-screen mark-video-screen">
      <section class="mark-video-frame">
        <video
          id="mark-video"
          class="mark-video"
          src="${withBase("/assets/Mark.mp4")}"
          aria-label="${escapeHtml(t("markVideo.videoLabel", { coworker: narratorName }))}"
          autoplay
          playsinline
        ></video>
      </section>

      <div class="mark-video-actions" id="mark-video-actions">
        <button class="setup-primary-button" id="login-to-desktop">
          ${t("markVideo.loginToDesktop")}
        </button>

        <button class="setup-secondary-button" id="replay-mark-video">
          ${t("markVideo.replay")}
        </button>
      </div>
    </main>
  `;

  const video = document.querySelector<HTMLVideoElement>("#mark-video")!;

  document
    .querySelector<HTMLButtonElement>("#login-to-desktop")!
    .addEventListener("click", () => {
      goToScreen("login");
    });

  document
    .querySelector<HTMLButtonElement>("#replay-mark-video")!
    .addEventListener("click", () => {
      video.currentTime = 0;
      video.play();
    });

  video.play().catch(() => {
    // Browsers block autoplay in some contexts. Give the learner manual controls
    // so the briefing is never unreachable.
    video.controls = true;
  });
}

/* ------------------------------------------------------------------ *
 * Windows sign in
 * ------------------------------------------------------------------ */

function renderLoginScreen(): void {
  const context = requireScenario();
  const { company, learner } = context;

  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <main class="windows-login-screen">
      <div class="login-background-overlay"></div>

      <section class="windows-login-card" aria-label="${escapeHtml(company.name)}">
        <div class="login-company">
          <img class="login-company-logo" src="${withBase(company.logo)}" alt="" />
          <span>${escapeHtml(company.name)}</span>
        </div>

        <div class="login-avatar">${getInitial(learner.firstName)}</div>

        <h1>${escapeHtml(getFullName(learner))}</h1>
        <p class="login-email">${escapeHtml(learner.email)}</p>

        <form class="windows-login-form" id="windows-login-form">
          <label class="sr-only" for="login-password">
            ${t("login.passwordLabel")}
          </label>

          <div class="login-password-row">
            <input
              id="login-password"
              type="password"
              placeholder="${t("login.passwordPlaceholder")}"
              autocomplete="off"
            />

            <button type="submit" aria-label="${t("login.signIn")}">
              →
            </button>
          </div>

          <p class="login-error hidden" id="login-error">
            ${t("login.incorrectPassword")}
          </p>
        </form>

        <button class="login-secondary-link" id="back-to-briefing" type="button">
          ${t("login.backToBriefing")}
        </button>
      </section>
    </main>
  `;

  const form = document.querySelector<HTMLFormElement>("#windows-login-form")!;
  const passwordInput = document.querySelector<HTMLInputElement>("#login-password")!;
  const loginError = document.querySelector<HTMLParagraphElement>("#login-error")!;

  passwordInput.focus();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (passwordInput.value === sessionPassword) {
      goToScreen("desktop");
      return;
    }

    loginError.classList.remove("hidden");
    passwordInput.value = "";
    passwordInput.focus();
  });

  document
    .querySelector<HTMLButtonElement>("#back-to-briefing")!
    .addEventListener("click", () => {
      goToScreen("markVideo");
    });
}

/* ------------------------------------------------------------------ *
 * Desktop
 * ------------------------------------------------------------------ */

function renderDesktopScreen(): void {
  const context = requireScenario();
  const { company, learner, cast } = context;

  // Resolved against the current language, so the unit follows the learner.
  const weather = resolveDisplayTemperature(config.effective);

  // A campaign that does not cover this kind of phish should not ship one in the standing
  // inbox either, so the mail app asks the same question the event engine asks. Dropping
  // the message leaves two genuine emails, hence the derived count.
  const standingPhishCovered = isPhishingClassificationEnabled(
    config.effective,
    context.phishingClassification
  );
  const inboxCount = standingPhishCovered ? 3 : 2;

  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div class="desktop">

      <!-- Paused badge, top left. Empty unless the learner has stopped the clock. -->
      <div id="time-pause-host"></div>

      <button class="desktop-icon" id="email-icon" aria-label="${t("desktop.emailIcon")}">
        <div class="icon-box">${APP_GLYPHS.mail}</div>
        <div>${t("desktop.emailIcon")}</div>
      </button>

      <button class="desktop-icon notes-desktop-icon" id="notes-icon" aria-label="${t("desktop.notesIcon")}">
        <div class="icon-box notes-icon-box">${APP_GLYPHS.notes}</div>
        <div>${t("desktop.notesIcon")}</div>
      </button>

      <div class="app-window outlook-window hidden" id="email-window" data-window="mail" role="dialog" aria-label="${t("email.windowTitle")}">
        <div class="outlook-titlebar window-titlebar">
          <div class="window-app-title">
            <img class="window-app-logo" src="${withBase(company.logo)}" alt="" />
            <span>${t("email.windowTitle")}</span>
          </div>

          <div class="window-controls">
            <button aria-label="${t("desktop.minimize")}">—</button>
            <button aria-label="${t("desktop.maximize")}">□</button>
            <button id="close-email" aria-label="${t("email.close")}">×</button>
          </div>
        </div>

        <div class="outlook-ribbon">
          <button>${t("email.ribbon.newMail")}</button>
          <button>${t("email.ribbon.reply")}</button>
          <button>${t("email.ribbon.archive")}</button>
          <button>${t("email.ribbon.report")}</button>
          <button>${t("email.ribbon.delete")}</button>
        </div>

        <div class="outlook-layout">
          <aside class="outlook-sidebar">
            <div class="mailbox-owner">
              <div class="mailbox-avatar">${getInitial(learner.firstName)}</div>
              <div class="mailbox-identity">
                <strong>${escapeHtml(getFullName(learner))}</strong>
                <span>${escapeHtml(learner.email)}</span>
              </div>
            </div>

            <div class="mailbox-title">${t("email.folders.favorites")}</div>
            <button class="folder active">${t("email.folders.inbox")} <span>${inboxCount}</span></button>
            <button class="folder">${t("email.folders.sent")}</button>
            <button class="folder">${t("email.folders.drafts")}</button>
            <button class="folder">${t("email.folders.deleted")}</button>
          </aside>

          <section class="message-list">
            <div class="message-list-header">
              <strong>${t("email.folders.inbox")}</strong>
              <span>${t("email.folders.focused")}</span>
            </div>

            ${
              standingPhishCovered
                ? `<button class="message-card unread" data-email="benefits">
                     <div class="message-sender">${escapeHtml(context.phishingSender.name)}</div>
                     <div class="message-subject">${t("email.subjects.benefits")}</div>
                     <div class="message-preview">${t("email.benefits.body")}</div>
                   </button>`
                : ""
            }

            <button class="message-card" data-email="picnic">
              <div class="message-sender">${escapeHtml(getFullName(cast.marketingVp))}</div>
              <div class="message-subject">${t("email.subjects.picnic")}</div>
              <div class="message-preview">${t("email.picnic.body")}</div>
            </button>

            <button class="message-card" data-email="meeting">
              <div class="message-sender">${escapeHtml(getFullName(cast.cto))}</div>
              <div class="message-subject">${t("email.subjects.meeting")}</div>
              <div class="message-preview">${t("email.meeting.body")}</div>
            </button>
          </section>

          <main class="reading-pane" id="mail-body">
            <div class="empty-state">
              <div class="empty-icon">✉</div>
              <h2>${t("email.selectEmail")}</h2>
              <p>${t("email.selectEmailHint")}</p>
            </div>
          </main>
        </div>

        <!--
          Status bar, the way a real mail client previews a link target. role=status
          so a screen reader announces the URL when the link takes focus, which is
          the keyboard equivalent of hovering.
        -->
        <div class="mail-status-bar" id="mail-status-bar" role="status" aria-live="polite">
          <span id="mail-status-url"></span>
        </div>
      </div>

      <div class="app-window notes-window hidden" id="notes-window" data-window="notes" role="dialog" aria-label="${t("notes.windowTitle")}">
        <div class="notes-titlebar window-titlebar">
          <div class="window-app-title">
            <span class="notes-app-dot"></span>
            <span>${t("notes.windowTitle")}</span>
          </div>

          <div class="window-controls">
            <button aria-label="${t("desktop.minimize")}">—</button>
            <button aria-label="${t("desktop.maximize")}">□</button>
            <button id="close-notes" aria-label="${t("email.close")}">×</button>
          </div>
        </div>

        <main class="notes-content">
          <h1>${t("notes.heading")}</h1>

          <!--
            References first, deliberately. These are what the choice prompts tell the
            learner to check - "compare the number against the one in your own notes" - and
            they were originally last, below seven colleague cards, which put them under the
            fold of a scrolling window at the exact moment they were needed.
          -->
          <section class="notes-reference-list" aria-label="${t("notes.listLabel")}">
            <article class="notes-person-card trusted-reference">
              <h2>${escapeHtml(t("notes.wifiHeading", { ssid: company.wifi.trustedSsid }))}</h2>
              <p>${t("notes.wifiBody")}</p>
            </article>

            <article class="notes-person-card trusted-reference">
              <h2>${escapeHtml(t("notes.helpdeskHeading"))}</h2>
              <p>${escapeHtml(t("notes.helpdeskBody", { number: context.helpdeskNumber }))}</p>
            </article>

            <article class="notes-person-card trusted-reference">
              <h2>${escapeHtml(t("notes.cardHeading", { issuer: context.cardIssuer.name }))}</h2>
              <p>${escapeHtml(
                t("notes.cardBody", {
                  number: context.cardIssuer.officialNumber,
                  website: context.cardIssuer.website
                })
              )}</p>
            </article>
          </section>

          <h2 class="notes-section-heading">${t("notes.listLabel")}</h2>

          <section class="notes-person-list">
            ${renderNotesCastMarkup(context)}
          </section>
        </main>
      </div>

      <div class="taskbar">
        <div class="taskbar-left">
          <button
            class="widgets-button"
            aria-label="${escapeHtml(
              t("desktop.widgetsLabel", {
                temperature: temperatureAccessibleLabel(weather.value, weather.unit)
              })
            )}"
          >
            <span class="weather-icon" aria-hidden="true">☀</span>
            <span>${escapeHtml(temperatureLabel(weather.value, weather.unit))}</span>
          </button>
        </div>

        <div class="taskbar-center">
          <button class="taskbar-icon" aria-label="${t("desktop.startLabel")}">
            <span class="windows-logo">⊞</span>
          </button>

          <button class="taskbar-icon" aria-label="${t("desktop.searchLabel")}">
            🔍
          </button>

          <button class="taskbar-icon hidden" id="taskbar-mail" aria-label="${t("email.windowTitle")}">
            ${APP_GLYPHS.mail}
          </button>

          <button class="taskbar-icon hidden" id="taskbar-notes" aria-label="${t("notes.windowTitle")}">
            ${APP_GLYPHS.notes}
          </button>
        </div>

        <div class="taskbar-right">
          <!-- Messenger tray icon, present only once a conversation exists. -->
          <span id="chat-tray"></span>

          <span class="system-icon">⌃</span>
          <button class="system-icon-button" id="wifi-button">
            <span id="wifi-glyph" aria-hidden="true">${APP_GLYPHS.networkOnline}</span>
          </button>
          <span class="system-icon" role="img" aria-label="${t("desktop.volumeLabel")}">🔊</span>
          <span class="system-clock" id="system-clock">
            <span id="system-clock-time"></span>
            <span id="system-clock-date"></span>
          </span>
        </div>
      </div>

      <!-- Messenger window, injected by an event rather than present up front. -->
      <div id="chat-window-host"></div>

      <!--
        Someone physically in the room, top right. Deliberately outside the desktop's own
        visual language - see SpokenLine in src/events/types.ts for why a person talking is
        never a toast.
      -->
      <div id="speaker-host"></div>

      <!-- The phone, shown only while a call is in progress. -->
      <div id="phone-host"></div>

      <!-- Windows-style notification host, bottom right above the taskbar. -->
      <div class="toast-host" id="toast-host" role="log" aria-live="polite" aria-relevant="additions"></div>

      <div class="wifi-panel hidden" id="wifi-panel">
        <div class="wifi-panel-header">
          <div>
            <strong>${t("wifi.panelTitle")}</strong>
            <span>${t("wifi.availableNetworks")}</span>
          </div>
          <button id="close-wifi" aria-label="${t("wifi.closePanel")}">×</button>
        </div>

        <div class="wifi-list">
          <button class="wifi-network suspicious" data-network="rogue">
            <div class="wifi-main-row">
              <span class="wifi-strength">📶</span>
              <div>
                <strong>${escapeHtml(company.wifi.rogueSsid)}</strong>
                <span class="wifi-network-status">${t("wifi.notSecured")}</span>
              </div>
            </div>
            <span class="wifi-connected-label hidden">${t("wifi.connected")}</span>
          </button>

          <button class="wifi-network trusted" data-network="official">
            <div class="wifi-main-row">
              <span class="wifi-strength">📶</span>
              <div>
                <strong>${escapeHtml(company.wifi.trustedSsid)}</strong>
                <span class="wifi-network-status">${t("wifi.secured")}</span>
              </div>
            </div>
            <span class="wifi-connected-label hidden">${t("wifi.connected")}</span>
          </button>
        </div>
      </div>

    </div>
  `;

  attachEventListeners();
  applyIconSize();
  startWorkdayClock();
  startEventEngine();
}

/** Adds an event-delivered message to the inbox, newest first. */
function renderInjectedMessageCard(message: InjectedMessage): void {
  const list = document.querySelector<HTMLElement>(".message-list");

  if (!list || list.querySelector(`[data-email="${message.id}"]`)) {
    return;
  }

  const card = document.createElement("button");
  card.className = "message-card unread arrived";
  card.dataset.email = message.id;
  card.innerHTML = `
    <div class="message-sender">${escapeHtml(message.senderName)}</div>
    <div class="message-subject">${escapeHtml(message.subject)}</div>
    <div class="message-preview">${escapeHtml(message.preview)}</div>
  `;

  const header = list.querySelector(".message-list-header");
  header?.insertAdjacentElement("afterend", card);

  card.addEventListener("click", () => {
    selectMessageCard(card);
    renderEmail(message.id, document.querySelector<HTMLDivElement>("#mail-body")!);
  });

  // Keep the unread count honest.
  const badge = document.querySelector<HTMLElement>(".folder.active span");

  if (badge) {
    badge.textContent = String(document.querySelectorAll(".message-card.unread").length);
  }
}

/** Shared selection behaviour for built-in and injected cards alike. */
function selectMessageCard(card: HTMLElement): void {
  document.querySelectorAll(".message-card").forEach((other) => {
    other.classList.remove("selected");
  });

  card.classList.add("selected");
  card.classList.remove("unread");
}

/* ------------------------------------------------------------------ *
 * Company messenger
 * ------------------------------------------------------------------ */

/* ---------------- state helpers ---------------- */

/** Newest first: the list is a notification list, not a chronological transcript. */
function listedConversations(): ChatConversation[] {
  return [...conversations.values()].sort((a, b) => b.sequence - a.sequence);
}

function totalUnread(): number {
  return [...conversations.values()].reduce((sum, entry) => sum + entry.unread, 0);
}

/**
 * The tray icon is a tracker of outstanding work, so it disappears once there is none.
 *
 * Resolution, not unread, is the test. Resolving clears a conversation's unread count for
 * exactly this reason: a sign-off that arrived after the learner closed the window would
 * otherwise keep the icon alive with nothing left for them to do about it.
 */
function hasOutstandingConversations(): boolean {
  return [...conversations.values()].some((entry) => !entry.resolved);
}

/* ---------------- opening, closing, resolving ---------------- */

function openChatThread(threadId: string): void {
  const conversation = conversations.get(threadId);

  if (!conversation) {
    return;
  }

  const wasOpen = openThreadId === threadId;

  openThreadId = threadId;
  chatListOpen = false;
  conversation.everOpened = true;
  conversation.unread = 0;

  eventEngine?.setStateFlag("chatUnread", totalUnread() > 0);

  if (!wasOpen) {
    reportLearnerAction("chatOpened", threadId);
  }

  renderChatSurfaces();

  // Release anything waiting for the learner to come to this conversation.
  const waiting = chatOpenWaiters.filter((waiter) => waiter.threadId === threadId);

  chatOpenWaiters = chatOpenWaiters.filter((waiter) => waiter.threadId !== threadId);
  waiting.forEach((waiter) => waiter.resolve());
}

/**
 * Closing an unfinished conversation leaves it exactly as it is - it stays in the list so
 * the learner can come back, and any pending prompt is still pending.
 *
 * Closing a finished one clears it off the list. See the reasoning inline.
 */
function closeChatThread(): void {
  if (!openThreadId) {
    return;
  }

  const threadId = openThreadId;
  const conversation = conversations.get(threadId);

  reportLearnerAction("chatClosed", threadId);
  openThreadId = null;

  /*
   * Closing a FINISHED conversation clears it off the list - the exchange is over and the
   * learner has now dismissed it, so there is nothing left for it to be doing there. That
   * makes finishing and clearing two separate gestures: answer it, then close it.
   *
   * An unfinished one stays exactly as it was. Closing the window mid-exchange is not the
   * same as being done with it, and any prompt it left pending is still pending.
   */
  if (conversation?.resolved) {
    conversations.delete(threadId);
  }

  renderChatSurfaces();
}

/** Marks a conversation finished. Called by the event that owns it, not by the UI. */
function resolveChatThread(threadId: string): void {
  const conversation = conversations.get(threadId);

  if (!conversation || conversation.resolved) {
    return;
  }

  conversation.resolved = true;

  // The exchange is over, so a trailing sign-off is not something to chase. Leaving it
  // counted as unread would keep the tray icon alive with nothing left to do about it.
  conversation.unread = 0;

  reportLearnerAction("chatResolved", threadId);
  eventEngine?.setStateFlag("chatUnread", totalUnread() > 0);
  renderChatSurfaces();
}

function toggleChatList(): void {
  chatListOpen = !chatListOpen;
  renderChatSurfaces();
}

/* ---------------- rendering ---------------- */

function renderChatSurfaces(): void {
  renderChatTray();
  renderChatWindow();
}

function renderChatTray(): void {
  const host = document.querySelector<HTMLElement>("#chat-tray");

  if (!host) {
    return;
  }

  if (!hasOutstandingConversations()) {
    // Everything dealt with: the tracker has nothing left to track.
    chatListOpen = false;
    host.innerHTML = "";
    return;
  }

  const unread = totalUnread();
  const appName = listedConversations()[0]?.thread.appName ?? t("chat.appName");
  const label = unread > 0
    ? t("chat.trayUnread", { app: appName, count: String(unread) })
    : t("chat.trayLabel", { app: appName });

  host.innerHTML = `
    <button
      type="button"
      class="chat-tray-button ${unread > 0 ? "has-unread" : ""}"
      id="chat-tray-button"
      aria-label="${escapeHtml(label)}"
      aria-expanded="${chatListOpen}"
    >
      <span class="chat-tray-glyph" aria-hidden="true">${APP_GLYPHS.messenger}</span>
      ${unread > 0 ? `<span class="chat-tray-badge" aria-hidden="true">${unread}</span>` : ""}
    </button>

    ${chatListOpen ? renderChatListMarkup() : ""}
  `;

  host
    .querySelector<HTMLButtonElement>("#chat-tray-button")!
    .addEventListener("click", (event) => {
      // Stops the document listener below from immediately closing what this opened.
      event.stopPropagation();
      toggleChatList();
    });

  host.querySelectorAll<HTMLButtonElement>("[data-thread]").forEach((button) => {
    button.addEventListener("click", () => openChatThread(button.dataset.thread as string));
  });

  host.querySelector<HTMLButtonElement>("#close-chat-list")?.addEventListener("click", () => {
    chatListOpen = false;
    renderChatSurfaces();
  });
}

/** The flyout: every conversation of the day, what is unread, and what is done. */
function renderChatListMarkup(): string {
  const entries = listedConversations();

  return `
    <div class="chat-list" id="chat-list" role="dialog" aria-label="${t("chat.listTitle")}">
      <div class="chat-list-header">
        <strong>${t("chat.listTitle")}</strong>
        <button type="button" id="close-chat-list" aria-label="${t("chat.closeList")}">&times;</button>
      </div>

      <div class="chat-list-items">
        ${entries.map(renderChatListItem).join("")}
      </div>
    </div>
  `;
}

function renderChatListItem(conversation: ChatConversation): string {
  const last = conversation.messages[conversation.messages.length - 1];
  // The learner's own last line is a poor summary of a thread, so prefer the other side's.
  const summarySource =
    [...conversation.messages].reverse().find((message) => !message.fromLearner) ?? last;
  const snippet = summarySource?.paragraphs[0] ?? "";

  return `
    <button
      type="button"
      class="chat-list-item ${conversation.unread > 0 ? "is-unread" : ""} ${
        conversation.resolved ? "is-resolved" : ""
      }"
      data-thread="${escapeHtml(conversation.thread.id)}"
      aria-label="${escapeHtml(
        t("chat.openConversation", { name: conversation.thread.title })
      )}"
    >
      <span class="chat-list-avatar" aria-hidden="true">${escapeHtml(
        summarySource?.avatarText ?? getInitial(conversation.thread.title)
      )}</span>

      <span class="chat-list-text">
        <span class="chat-list-name">${escapeHtml(conversation.thread.title)}</span>
        <span class="chat-list-snippet">${escapeHtml(snippet)}</span>
      </span>

      <span class="chat-list-meta">
        <span class="chat-list-time">${escapeHtml(last?.timeLabel ?? "")}</span>
        ${
          conversation.unread > 0
            ? `<span class="chat-list-badge" aria-hidden="true">${conversation.unread}</span>`
            : conversation.resolved
              ? `<span class="chat-list-done">${t("chat.resolved")}</span>`
              : ""
        }
      </span>
    </button>
  `;
}

function renderChatWindow(): void {
  const host = document.querySelector<HTMLElement>("#chat-window-host");

  if (!host) {
    return;
  }

  const conversation = openThreadId ? conversations.get(openThreadId) : undefined;

  if (!conversation) {
    host.innerHTML = "";
    return;
  }

  const { thread, messages } = conversation;

  host.innerHTML = `
    <section class="app-window chat-window" data-window="chat" role="dialog" aria-label="${escapeHtml(thread.appName)}">
      <header class="chat-titlebar window-titlebar">
        <div class="window-app-title">
          <span class="chat-app-mark" aria-hidden="true">T</span>
          <span>${escapeHtml(thread.appName)}</span>
        </div>

        <div class="window-controls">
          <button id="close-chat" aria-label="${t("chat.close")}">&times;</button>
        </div>
      </header>

      <div class="chat-thread-head">
        <div class="chat-avatar">${escapeHtml(messages[0]?.avatarText ?? "?")}</div>
        <div class="chat-thread-identity">
          <strong>${escapeHtml(thread.title)}</strong>
        </div>
      </div>

      <div class="chat-messages" id="chat-messages">
        ${messages.map(renderChatBubble).join("")}
      </div>

      <div class="mail-status-bar" id="chat-status-bar" role="status" aria-live="polite">
        <span id="chat-status-url"></span>
      </div>
    </section>
  `;

  host
    .querySelector<HTMLButtonElement>("#close-chat")!
    .addEventListener("click", closeChatThread);

  const windowElement = host.querySelector<HTMLElement>(".chat-window")!;

  wireLinkInspection(
    windowElement,
    host.querySelector<HTMLElement>("#chat-messages")!,
    "#chat-status-bar",
    "#chat-status-url"
  );

  const list = host.querySelector<HTMLElement>("#chat-messages")!;
  list.scrollTop = list.scrollHeight;

  // Rebuilt from scratch above, so anywhere the learner dragged it has to be reapplied.
  restoreWindowPositions();
}

function renderChatBubble(message: StoredChatMessage): string {
  return `
    <article class="chat-bubble ${message.fromLearner ? "from-learner" : ""}">
      ${
        message.fromLearner
          ? ""
          : `<div class="chat-bubble-head">
               <strong>${escapeHtml(message.author)}</strong>
               ${message.handle ? `<code>${escapeHtml(message.handle)}</code>` : ""}
             </div>`
      }
      <div class="chat-bubble-body">
        ${message.paragraphs.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        ${
          message.link
            ? `<p>${renderMailLinkMarkup(message.link.label, message.link.url, message.link.risk)}</p>`
            : ""
        }
      </div>
      <span class="chat-bubble-time">${escapeHtml(message.timeLabel)}</span>
    </article>
  `;
}

/**
 * Opens the mail app on one message. This is the toast's way in, and it is what lets an
 * event wait for a message to be read without the learner having to go and find it.
 */
function openInboxMessage(messageId: string): void {
  const emailWindow = document.querySelector<HTMLElement>("#email-window");
  const mailBody = document.querySelector<HTMLDivElement>("#mail-body");
  const card = document.querySelector<HTMLElement>(`.message-card[data-email="${messageId}"]`);

  if (!emailWindow || !mailBody || !card) {
    return;
  }

  if (emailWindow.classList.contains("hidden")) {
    reportLearnerAction("mailAppOpened");
    emailWindow.classList.remove("hidden");
  }

  const taskbarMail = document.querySelector<HTMLElement>("#taskbar-mail");

  taskbarMail?.classList.remove("hidden");
  taskbarMail?.classList.add("active");
  raiseWindow(emailWindow);
  document.querySelector<HTMLElement>("#taskbar-notes")?.classList.remove("active");

  selectMessageCard(card);
  renderEmail(messageId, mailBody);
}

/**
 * Applies the pause state from every reason there is to be paused.
 *
 * The clock, the event engine and the call timer are all frozen together - "all time
 * pauses" - and each of the three is idempotent, so calling this repeatedly is safe.
 */
function syncTimePause(): void {
  if (learnerPausedTime || choicePending || consequencePending) {
    simClock?.pause();
    eventEngine?.setPaused(true);
    pauseCallTimer();
  } else {
    resumeCallTimer();
    eventEngine?.setPaused(false);
    simClock?.resume();
  }

  renderTimePauseIndicator();
}

function toggleLearnerTimePause(): void {
  learnerPausedTime = !learnerPausedTime;
  reportLearnerAction(learnerPausedTime ? "timePaused" : "timeResumed");
  syncTimePause();
}

/**
 * The paused badge, top left.
 *
 * Shown only for a pause the learner asked for. A prompt also stops the clock, but that is
 * implicit in the prompt being there, and badging it would put an indicator on screen for
 * every decision in the day.
 */
function renderTimePauseIndicator(): void {
  const host = document.querySelector<HTMLElement>("#time-pause-host");

  if (!host) {
    return;
  }

  if (!learnerPausedTime) {
    host.innerHTML = "";
    return;
  }

  host.innerHTML = `
    <div class="time-paused" role="status" aria-label="${escapeHtml(t("desktop.timePaused"))}">
      <svg class="time-paused-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="6" y="4" width="4.2" height="16" rx="1.4" />
        <rect x="13.8" y="4" width="4.2" height="16" rx="1.4" />
      </svg>
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * App glyphs
 * ------------------------------------------------------------------ */

/**
 * One glyph per app, used by the app's own surface AND by any toast it raises.
 *
 * Defined once on purpose. The point of an app's icon appearing on its notification is that
 * the learner recognises where the notice came from - and that only holds if the toast and
 * the app are showing the same mark. Two hardcoded copies would drift the first time one
 * changed.
 */
const APP_GLYPHS = {
  mail: "\u2709",
  notes: "\u{1F4DD}",
  messenger: "\u{1F4AC}",
  /** Signal bars when there is a connection, a globe when there is not. */
  networkOnline: "\u{1F4F6}",
  networkOffline: "\u{1F310}",
  phone: "\u{1F4DE}",
  /** The simulation or the OS itself talking. */
  system: "\u24D8"
} as const;

const NOTIFICATION_GLYPHS: Record<NotificationSource, string> = {
  system: APP_GLYPHS.system,
  mail: APP_GLYPHS.mail,
  messenger: APP_GLYPHS.messenger,
  // A network notice is always about not having one, which is the state the globe shows.
  network: APP_GLYPHS.networkOffline,
  phone: APP_GLYPHS.phone
};

/**
 * The app's name, for screen readers.
 *
 * Drawn from each app's own window title rather than a parallel set of strings, so a toast
 * can never announce an app by a different name than the app uses for itself. `system` has
 * no app behind it, so it gets no prefix - its title already says what it is.
 */
function notificationSourceLabel(source: NotificationSource): string | null {
  switch (source) {
    case "mail":
      return t("email.windowTitle");
    case "messenger":
      return t("chat.appName");
    case "network":
      return t("wifi.panelTitle");
    case "phone":
      return t("phone.appName");
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ *
 * Someone in the room
 * ------------------------------------------------------------------ */

/**
 * A featureless silhouette: a circle and a shoulder arc, no hair, clothing or features, so
 * it carries no sex, race or age. `currentColor` lets the panel theme it.
 */
const NEUTRAL_PERSON_ICON = `
  <svg class="speaker-glyph" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <circle cx="24" cy="16" r="8.5" />
    <path d="M7.5 44a16.5 16.5 0 0 1 33 0z" />
  </svg>
`;

/**
 * Draws the in-person panel from state, so a re-render or a language change cannot lose
 * someone mid-sentence.
 *
 * There is no close button. A person talking to you is not a window, and dismissing them is
 * not one of the things the learner gets to do - the event that brought them decides when
 * they are done.
 */
function renderSpeaker(): void {
  const host = document.querySelector<HTMLElement>("#speaker-host");

  if (!host) {
    return;
  }

  if (!spokenLine) {
    host.innerHTML = "";
    return;
  }

  const { speaker, role, lines } = spokenLine;

  host.innerHTML = `
    <aside
      class="in-person"
      role="status"
      aria-live="polite"
      aria-label="${escapeHtml(t("inPerson.speakingLabel", { speaker }))}"
    >
      <div class="in-person-avatar">${NEUTRAL_PERSON_ICON}</div>

      <p class="in-person-speaker">${escapeHtml(speaker)}</p>
      ${role ? `<p class="in-person-role">${escapeHtml(role)}</p>` : ""}

      <div class="in-person-lines">
        ${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
      </div>
    </aside>
  `;
}

function clearSpokenLineTimer(): void {
  if (spokenLineTimer !== null) {
    window.clearTimeout(spokenLineTimer);
    spokenLineTimer = null;
  }
}

/* ------------------------------------------------------------------ *
 * Window stacking
 * ------------------------------------------------------------------ */

/*
 * Every app window shares one band, and the last one the learner opened or clicked sits on
 * top. Before this each window carried a hard-coded z-index, which meant the mail client
 * could never come forward over the notes window - clicking it did nothing at all.
 *
 * The band stays below the taskbar (50), the Wi-Fi flyout (60), toasts (70) and the phone
 * (80): those are system chrome and a window should not cover them.
 */
const WINDOW_STACK_MIN = 10;
const WINDOW_STACK_MAX = 44;

/**
 * The notes window while a decision is pending, above the choice overlay (300).
 *
 * Notes is the learner's own trusted reference, and the prompts explicitly tell them to
 * check it - "compare the number against the one in your own notes" is only advice if the
 * notes are unreadable. Measured before this existed, the notes window was 55% reachable at
 * 1600x1000 and 36% at 1280x1000 with a prompt open.
 *
 * Nothing is lost by letting it cover the prompt: a choice cannot be dismissed, and all
 * time is paused until it is answered, so the decision is exactly where they left it.
 */
const REFERENCE_STACK = 320;

let windowStackTop = WINDOW_STACK_MIN;
/** True while a choice prompt is on screen. */
let choicePending = false;

/**
 * True when the learner has stopped the clock themselves with the space key.
 *
 * Kept separate from `choicePending` because the two are independent reasons for the same
 * thing: a learner who paused, was interrupted by a prompt, and answered it should still be
 * paused afterwards. Composing them in one place is what stops the prompt's resume from
 * quietly undoing their pause.
 */
let learnerPausedTime = false;

/**
 * True while a negative consequence is on screen waiting to be dismissed.
 *
 * A third independent reason to be stopped, alongside the learner's own pause and an open
 * prompt. It exists because the consequence outlives the prompt that caused it: the choice
 * overlay is gone by the time the tear is up, so `choicePending` cannot carry it.
 */
let consequencePending = false;

function raiseWindow(element: HTMLElement | null): void {
  if (!element) {
    return;
  }

  if (element.id === "notes-window" && choicePending) {
    element.style.zIndex = String(REFERENCE_STACK);
    return;
  }

  if (windowStackTop >= WINDOW_STACK_MAX) {
    // Renumber from the bottom rather than climbing out of the band forever.
    const ordered = [...document.querySelectorAll<HTMLElement>(".app-window")].sort(
      (a, b) => Number(a.style.zIndex || 0) - Number(b.style.zIndex || 0)
    );

    windowStackTop = WINDOW_STACK_MIN;
    ordered.forEach((window_) => {
      window_.style.zIndex = String(windowStackTop);
      windowStackTop += 1;
    });
  }

  windowStackTop += 1;
  element.style.zIndex = String(windowStackTop);
}

/**
 * Moves the notes window between the normal band and the reference layer as prompts come
 * and go, so the order the learner does things in does not matter - opening notes during a
 * prompt and having a prompt appear over already-open notes both work.
 */
function applyChoicePendingStacking(): void {
  const notes = document.querySelector<HTMLElement>("#notes-window");

  if (!notes) {
    return;
  }

  // Drives the docked geometry in CSS. A class rather than inline styles, so the two
  // concerns stay apart: JS owns the stacking, the stylesheet owns the layout.
  document.body.classList.toggle("choice-pending", choicePending);

  if (choicePending) {
    notes.style.zIndex = String(REFERENCE_STACK);
    return;
  }

  // Back into the band, at the top of it.
  notes.style.zIndex = "";
  raiseWindow(notes);
}

/**
 * Clicking anywhere in a window brings it forward. Delegated from the document because the
 * messenger window is re-rendered on every message, and capture so it runs before the
 * window's own handlers.
 */
let windowRaisingWired = false;

function wireWindowRaising(): void {
  if (windowRaisingWired) {
    return;
  }

  windowRaisingWired = true;

  document.addEventListener(
    "mousedown",
    (event) => {
      const target = event.target as Element | null;

      raiseWindow(target?.closest<HTMLElement>(".app-window") ?? null);
    },
    true
  );
}

/* ------------------------------------------------------------------ *
 * Window dragging
 * ------------------------------------------------------------------ */

/*
 * Windows are dragged by their titlebar. Pointer events rather than mouse events, so a pen
 * or a touch screen works and `setPointerCapture` keeps the moves coming if the pointer
 * leaves the titlebar mid-drag.
 *
 * Positions are remembered per window rather than living only in the DOM, because the
 * messenger window is rebuilt from scratch on every message - without this, a dragged chat
 * window would jump back to its default corner the moment a new message arrived.
 */
const windowPositions = new Map<string, { left: number; top: number }>();

/**
 * The taskbar's real height, border included. Measured rather than assumed: the CSS sets
 * `height: 48px` but adds a 1px top border, and hard-coding 48 let a window dragged all the
 * way down overlap the taskbar by exactly that pixel.
 */
function taskbarHeight(): number {
  return document.querySelector<HTMLElement>(".taskbar")?.offsetHeight ?? 48;
}

/**
 * Keeps a dragged window wholly on the desktop and clear of the taskbar.
 *
 * Full containment rather than letting a window hang off an edge. Allowing it off the left
 * edge looked more like a real desktop until the consequence showed up in testing: the only
 * part still on screen is the window's right-hand corner, which is exactly where the
 * minimize/maximize/close buttons live - so the learner could close the window but never
 * drag it back. Nothing in the simulation needs a window pushed off-screen, and every
 * window is smaller than the desktop, so containment costs nothing.
 */
function clampWindowPosition(
  element: HTMLElement,
  left: number,
  top: number
): { left: number; top: number } {
  const desktop = element.offsetParent as HTMLElement | null;
  const bounds = {
    width: desktop?.clientWidth ?? window.innerWidth,
    height: desktop?.clientHeight ?? window.innerHeight
  };

  // Math.max(0, ...) guards the degenerate case of a window larger than the space it is
  // being clamped into, where the upper bound would otherwise fall below the lower one.
  const maxLeft = Math.max(0, bounds.width - element.offsetWidth);
  const maxTop = Math.max(0, bounds.height - taskbarHeight() - element.offsetHeight);

  return {
    left: Math.min(Math.max(left, 0), maxLeft),
    top: Math.min(Math.max(top, 0), maxTop)
  };
}

/**
 * Switches a window from whatever CSS placed it to explicit left/top.
 *
 * The messenger window is positioned with `right`/`bottom`, so dragging it has to convert
 * first or the very first pointer move would teleport it across the screen.
 */
function pinWindowPosition(element: HTMLElement, left: number, top: number): void {
  const clamped = clampWindowPosition(element, left, top);

  element.style.left = `${clamped.left}px`;
  element.style.top = `${clamped.top}px`;
  element.style.right = "auto";
  element.style.bottom = "auto";

  // Marks the window as placed by the learner. The notes window's docked geometry backs off
  // for a moved window - having put it somewhere, they should not have it moved for them.
  element.dataset.moved = "true";

  const key = element.dataset.window;

  if (key) {
    windowPositions.set(key, clamped);
  }
}

/** Reapplies remembered positions after a re-render rebuilds a window. */
function restoreWindowPositions(): void {
  document.querySelectorAll<HTMLElement>(".app-window").forEach((element) => {
    const key = element.dataset.window;
    const stored = key ? windowPositions.get(key) : undefined;

    if (stored) {
      pinWindowPosition(element, stored.left, stored.top);
    }
  });
}

let windowDraggingWired = false;

function wireWindowDragging(): void {
  if (windowDraggingWired) {
    return;
  }

  windowDraggingWired = true;

  document.addEventListener("pointerdown", (event) => {
    const target = event.target as Element | null;
    const handle = target?.closest<HTMLElement>(".window-titlebar");

    // The window controls live in the titlebar; clicking Close is not a drag.
    if (!handle || target?.closest("button, input, select, a")) {
      return;
    }

    const element = handle.closest<HTMLElement>(".app-window");

    if (!element || event.button !== 0) {
      return;
    }

    raiseWindow(element);

    const startX = event.clientX;
    const startY = event.clientY;
    const originLeft = element.offsetLeft;
    const originTop = element.offsetTop;

    handle.setPointerCapture(event.pointerId);
    document.body.classList.add("window-dragging");

    const onMove = (moveEvent: PointerEvent) => {
      pinWindowPosition(
        element,
        originLeft + (moveEvent.clientX - startX),
        originTop + (moveEvent.clientY - startY)
      );
    };

    const onDone = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onDone);
      handle.removeEventListener("pointercancel", onDone);
      document.body.classList.remove("window-dragging");
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onDone);
    handle.addEventListener("pointercancel", onDone);
  });

  // A window that was hanging off the edge can end up unreachable when the desktop shrinks.
  window.addEventListener("resize", () => {
    document.querySelectorAll<HTMLElement>(".app-window").forEach((element) => {
      if (element.dataset.moved) {
        pinWindowPosition(element, element.offsetLeft, element.offsetTop);
      }
    });
  });
}

/* ------------------------------------------------------------------ *
 * Telephone
 * ------------------------------------------------------------------ */

/**
 * Draws the handset from state, so a re-render or a language change cannot lose a call in
 * progress.
 *
 * Everything below the number is marked aria-hidden: the mute, keypad and speaker glyphs
 * are scenery that makes the screen read as a call screen, and announcing three controls
 * that do nothing would be worse than silence. The call state itself is announced through
 * the live region at the top.
 */
function renderPhone(): void {
  const host = document.querySelector<HTMLElement>("#phone-host");

  if (!host) {
    return;
  }

  if (!phoneCall) {
    host.innerHTML = "";
    return;
  }

  const { contactName, number, numberSource, status } = phoneCall;
  const statusLabel =
    status === "dialing" ? t("phone.dialing") : formatCallDuration(Date.now() - phoneConnectedAt);

  host.innerHTML = `
    <aside
      class="phone is-${status}"
      aria-label="${escapeHtml(t("phone.callLabel", { contact: contactName, number }))}"
    >
      <div class="phone-shell">
        <div class="phone-notch" aria-hidden="true"></div>

        <div class="phone-screen">
          <p class="phone-status" id="phone-status" role="status" aria-live="polite">
            ${escapeHtml(statusLabel)}
          </p>

          <div class="phone-avatar" aria-hidden="true">${escapeHtml(getInitial(contactName))}</div>

          <p class="phone-contact">${escapeHtml(contactName)}</p>
          <p class="phone-number">${escapeHtml(number)}</p>
          <p class="phone-source">${escapeHtml(numberSource)}</p>

          <div class="phone-controls" aria-hidden="true">
            <span class="phone-key">&#128263;</span>
            <span class="phone-key">&#9286;</span>
            <span class="phone-key">&#128266;</span>
          </div>

          <div class="phone-end" aria-hidden="true">${APP_GLYPHS.phone}</div>
        </div>
      </div>
    </aside>
  `;
}

/** mm:ss, the way a phone shows call length. */
function formatCallDuration(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

/**
 * The timer updates only the status line, not the whole handset: redrawing every second
 * would restart the CSS animations and fight with a screen reader on the live region.
 */
function startCallTimer(): void {
  stopCallTimer();

  phoneTimerHandle = window.setInterval(() => {
    const line = document.querySelector<HTMLElement>("#phone-status");

    if (line && phoneCall?.status === "connected") {
      line.textContent = formatCallDuration(Date.now() - phoneConnectedAt);
    }
  }, 1000);
}

function stopCallTimer(): void {
  if (phoneTimerHandle !== null) {
    window.clearInterval(phoneTimerHandle);
    phoneTimerHandle = null;
  }
}

/**
 * Freezes the displayed call length. Paused time is added back to the start instant on
 * resume rather than accumulated separately, so the timer is always derived from one
 * subtraction and cannot drift - the same approach the event engine takes.
 */
function pauseCallTimer(): void {
  if (phoneCall?.status === "connected" && phonePausedSince === 0) {
    phonePausedSince = Date.now();
  }

  stopCallTimer();
}

function resumeCallTimer(): void {
  if (phonePausedSince !== 0) {
    phoneConnectedAt += Date.now() - phonePausedSince;
    phonePausedSince = 0;
  }

  if (phoneCall?.status === "connected") {
    startCallTimer();
  }
}

/* ------------------------------------------------------------------ *
 * Context menus
 * ------------------------------------------------------------------ */

/**
 * Screens that are meant to read as an operating system. The browser's own context
 * menu is suppressed on these because it exposes "Open link in new tab", "Save video
 * as" and "View page source" - the fiction leaks, and so do the real URLs.
 *
 * The setup and preferences screens keep the native menu: they are plainly app UI, and
 * copy and paste there is legitimate.
 */
const IMMERSIVE_SCREENS: AppScreen[] = ["intro", "markVideo", "login", "desktop"];

/**
 * Bound to the document once at boot rather than per render, so repeated renders
 * cannot stack duplicate handlers.
 *
 * Note this is presentation only, not a security control - F12 and the browser menu
 * still work. It exists to keep the simulation coherent.
 */
function bindContextMenu(): void {
  document.addEventListener("contextmenu", (event) => {
    if (!IMMERSIVE_SCREENS.includes(currentScreen)) {
      return;
    }

    // Suppress the native menu everywhere on these screens...
    event.preventDefault();

    const desktopElement = document.querySelector<HTMLElement>(".desktop");

    // ...and offer our own only on the wallpaper itself. A right-click on a window,
    // an icon or the taskbar simply does nothing, as no menu is defined for those yet.
    if (!desktopElement || event.target !== desktopElement) {
      closeContextMenu();
      return;
    }

    reportLearnerAction("desktopContextMenuOpened");
    openContextMenu(event.clientX, event.clientY, buildWallpaperMenu());
  });
}

/** The Windows-style desktop menu. Every entry does something or is plainly greyed. */
function buildWallpaperMenu(): MenuSection[] {
  const sizes: IconSize[] = ["large", "medium", "small"];

  return [
    [
      {
        label: t("desktopMenu.view"),
        submenu: sizes.map((size) => ({
          label: t(`desktopMenu.icons.${size}`),
          selected: iconSize === size,
          onSelect: () => setIconSize(size)
        }))
      },
      {
        label: t("desktopMenu.refresh"),
        onSelect: () => renderApp()
      }
    ],
    [
      {
        // Nothing has been copied, so this is unavailable - as it would be in Windows.
        label: t("desktopMenu.paste"),
        disabled: true
      }
    ],
    [
      {
        label: t("desktopMenu.displaySettings"),
        onSelect: showManagedBySettingsNotice
      },
      {
        label: t("desktopMenu.personalize"),
        onSelect: showManagedBySettingsNotice
      }
    ]
  ];
}

function setIconSize(size: IconSize): void {
  iconSize = size;
  applyIconSize();
}

function applyIconSize(): void {
  const desktopElement = document.querySelector<HTMLElement>(".desktop");

  desktopElement?.classList.remove("icons-small", "icons-medium", "icons-large");
  desktopElement?.classList.add(`icons-${iconSize}`);
}

/**
 * A corporate image would have these locked down, which is both plausible and honest -
 * the menu entry does something rather than silently failing.
 */
function showManagedBySettingsNotice(): void {
  showDesktopNotification({
    title: t("desktopMenu.managedTitle"),
    body: t("desktopMenu.managedBody"),
    // Device policy: the OS talking, not an app.
    source: "system",
    tone: "info"
  });
}

/* ------------------------------------------------------------------ *
 * Events and triggers
 * ------------------------------------------------------------------ */

/**
 * The only surface events use to change the desktop. Narrow on purpose - adding a
 * capability here should be a deliberate decision, not a side effect of a new event.
 */
function createDesktopBridge(): DesktopBridge {
  return {
    notify: showDesktopNotification,

    addInboxMessage: (message) => {
      injectedMessages.set(message.id, message);
      renderInjectedMessageCard(message);

      // Same rule as a chat message: announce it only if they are not already reading it.
      if (message.toastBody && openEmailId !== message.id) {
        showDesktopNotification({
          title: message.senderName,
          body: message.toastBody,
          source: "mail",
          tone: message.toastTone,
          onActivate: () => openInboxMessage(message.id),
          holdSeconds: 8
        });
      }
    },

    awaitEmailOpened: (messageId) =>
      new Promise<void>((resolve) => {
        if (openEmailId === messageId) {
          resolve();
          return;
        }

        emailOpenWaiters.push({ messageId, resolve });
      }),

    placeCall: (call) => {
      const wasOnCall = phoneCall !== null;

      phoneCall = call;

      if (call.status === "connected" && (!wasOnCall || phoneConnectedAt === 0)) {
        phoneConnectedAt = Date.now();
        startCallTimer();
      }

      renderPhone();

      if (!wasOnCall) {
        // The number is the point: which one they dialed is the whole assessment.
        reportLearnerAction("callPlaced", call.number);
        eventEngine?.setStateFlag("callActive", true);
      }
    },

    speak: (line) => {
      clearSpokenLineTimer();
      spokenLine = line;
      renderSpeaker();
      eventEngine?.setStateFlag("personSpeaking", true);

      // A hold is optional: while a choice is pending the words have to stay put, because
      // they are what the learner is answering.
      if (line.holdSeconds !== undefined) {
        spokenLineTimer = window.setTimeout(() => {
          spokenLineTimer = null;
          spokenLine = null;
          renderSpeaker();
          eventEngine?.setStateFlag("personSpeaking", false);
        }, line.holdSeconds * 1000);
      }
    },

    endConversation: () => {
      clearSpokenLineTimer();
      spokenLine = null;
      renderSpeaker();
      eventEngine?.setStateFlag("personSpeaking", false);
    },

    endCall: () => {
      stopCallTimer();
      phoneCall = null;
      phoneConnectedAt = 0;
      phonePausedSince = 0;
      renderPhone();
      eventEngine?.setStateFlag("callActive", false);
    },

    setWifiAvailable: (available) => {
      wifiAvailable = available;

      // Losing the network means losing the connection to it, which is what lets a
      // future "the Wi-Fi goes out" event drive the no-connection prompt for free.
      if (!available && connectedNetworkId === "official") {
        connectedNetworkId = null;
      }

      applyWifiAvailability();
      syncWifiConnectionState();
    },

    withdrawNotifications: (eventId) => {
      document
        .querySelectorAll<HTMLElement>(`.toast[data-source-event="${eventId}"]`)
        .forEach(dismissToast);
    },

    postChatMessage: (thread, message) => {
      const context = requireScenario();

      let conversation = conversations.get(thread.id);

      if (!conversation) {
        conversationSequence += 1;
        conversation = {
          thread,
          messages: [],
          unread: 0,
          everOpened: false,
          resolved: false,
          sequence: conversationSequence
        };
        conversations.set(thread.id, conversation);
      }

      conversation.thread = thread;

      // Stamped here, from the same value the taskbar shows, so the thread and the clock
      // can never disagree. Time is paused while a choice is open, which is why a reply
      // carries the moment the learner was asked rather than the moment they answered.
      conversation.messages.push({
        ...message,
        timeLabel: clockTimeLabel(getClockAt(context.dayStart, simMinutes))
      });

      const isOpen = openThreadId === thread.id;

      // A message the learner sent is not news, and neither is one that arrives while
      // they are already reading the conversation.
      if (!message.fromLearner) {
        reportLearnerAction("chatMessageReceived", message.id);

        if (!isOpen) {
          conversation.unread += 1;
        }
      }

      renderChatSurfaces();
      eventEngine?.setStateFlag("chatUnread", totalUnread() > 0);

      // Notify only for a conversation the learner has not yet been to.
      if (message.toastBody && !message.fromLearner && !conversation.everOpened) {
        const threadId = thread.id;

        showDesktopNotification({
          title: message.author,
          body: message.toastBody,
          source: "messenger",
          tone: message.toastTone,
          onActivate: () => openChatThread(threadId),
          holdSeconds: 8
        });
      }
    },

    endScenario: (eventId) => {
      const incidentId = pendingWrongDecisions.get(eventId);

      if (incidentId === undefined) {
        return;
      }

      pendingWrongDecisions.delete(eventId);

      // Not awaited: the engine cannot block on the learner, and it does not need to - the
      // feedback stops the clock itself for as long as it is up.
      void showWrongDecisionFeedback(incidentId);
    },

    resolveChatThread,

    openChat: (threadId) => openChatThread(threadId),

    awaitChatOpened: (threadId) =>
      new Promise<void>((resolve) => {
        if (openThreadId === threadId) {
          resolve();
          return;
        }

        chatOpenWaiters.push({ threadId, resolve });
      }),

    askChoice: async (prompt) => {
      // No accent passed: the stylesheet already falls back to --brand-primary, so a
      // prompt picks up the company's colour unless the event overrides it explicitly.
      const outcome = await withChoiceOpen(() => openChoicePrompt(prompt));

      // Answers are behaviour: log the choice with its risk so scoring can use it, and
      // let triggers react to a specific answer via `promptId:choiceId`.
      reportLearnerAction(
        "choiceMade",
        outcome.choiceId ? `${prompt.id}:${outcome.choiceId}` : `${prompt.id}:none`
      );

      record("learnerAction", "choiceResolved", simMinutes, {
        promptId: prompt.id,
        choiceId: outcome.choiceId,
        risk: outcome.choice?.risk ?? null,
        dismissed: outcome.dismissed,
        timedOut: outcome.timedOut,
        elapsedMs: outcome.elapsedMs
      });

      // Noted, not shown: the feedback waits for the scenario's last stage. The scenario
      // therefore carries on normally from here, and is not interrupted mid-flow.
      noteWrongDecision(prompt, outcome);

      return outcome;
    }
  };
}

/**
 * Wrong decisions waiting for their scenario to finish, keyed by the event that owns them.
 *
 * Feedback is held back to the LAST stage of a scenario rather than fired on the answer
 * that earned it. A multi-stage scenario would otherwise be interrupted partway through and
 * then carry on playing out the bad outcome anyway - and in the T.O.A.D. it could interrupt
 * twice in one scenario.
 *
 * Deferring structurally, off the engine's "this event has finished" signal, rather than by
 * a flag each prompt declares: a scenario added later gets the behaviour for free instead of
 * depending on its author remembering to mark intermediate stages.
 */
const pendingWrongDecisions = new Map<string, string>();

/**
 * Notes a risky answer against its scenario, to be shown when the scenario ends.
 *
 * Generic on purpose: it keys off the choice's own `risk`, so any prompt in any event earns
 * feedback for a wrong answer without the event knowing this exists.
 *
 * Nothing is noted for a safe or neutral answer, or when an operator has set feedback to
 * None. Where several stages were answered badly the most recent one is kept - the wording
 * is centralized and identical either way, so this only decides what the log records.
 */
function noteWrongDecision(prompt: ChoicePrompt, outcome: ChoiceOutcome): void {
  if (
    !isVisibleConsequenceStyle(config.effective.consequenceStyle) ||
    outcome.choice?.risk !== "risky"
  ) {
    return;
  }

  const incidentId = `${prompt.id}:${outcome.choiceId}`;

  // No owning event means nothing will ever signal the end of a scenario, so show it now
  // rather than never. Every prompt the engine raises is stamped; this is the safety net.
  if (!prompt.sourceEventId) {
    void showWrongDecisionFeedback(incidentId);
    return;
  }

  pendingWrongDecisions.set(prompt.sourceEventId, incidentId);
}

/** Shows the feedback and waits for the learner to dismiss it, with the day stopped. */
async function showWrongDecisionFeedback(incidentId: string): Promise<void> {
  const style = config.effective.consequenceStyle;

  if (!isVisibleConsequenceStyle(style)) {
    return;
  }

  consequencePending = true;
  syncTimePause();

  record("learnerAction", "consequenceShown", simMinutes, { incidentId, style });

  try {
    await showConsequence(style, incidentId);
  } finally {
    consequencePending = false;
    syncTimePause();
  }

  reportLearnerAction("consequenceDismissed", incidentId);
}

/**
 * Raises the `choiceOpen` state for as long as the prompt is up, so triggers that
 * declare `pauseWhile: "choiceOpen"` hold off rather than talking over it.
 */
async function withChoiceOpen<T>(open: () => Promise<T>): Promise<T> {
  closeContextMenu();

  // All time stops while the learner is deciding: the simulated day, every trigger
  // countdown, and the fast-forward key. Paused stretches are deducted on both clocks,
  // so nothing lurches forward or fires in a burst when the prompt closes.
  eventEngine?.setStateFlag("choiceOpen", true);
  // Lets the learner bring their notes over the prompt for as long as it is up.
  choicePending = true;
  applyChoicePendingStacking();
  // Stops the clock, the engine and the call timer together. Routed through one function
  // so that resuming here cannot undo a pause the learner asked for themselves.
  syncTimePause();

  try {
    return await open();
  } finally {
    choicePending = false;
    applyChoicePendingStacking();
    eventEngine?.setStateFlag("choiceOpen", false);
    syncTimePause();
  }
}

function startEventEngine(): void {
  const context = requireScenario();

  if (!eventEngine) {
    startSession({
      companyId: context.company.id,
      department: context.learner.department,
      tenure: context.learner.tenure,
      securityRating: context.learner.securityRating,
      locale: getLocale()
    });

    eventEngine = createEventEngine({
      events: SIM_EVENTS,
      triggers: SIM_TRIGGERS,
      eventSettings: config.effective.events,
      triggerSettings: config.effective.triggers,
      scenario: context,
      settings: config.effective,
      desktop: createDesktopBridge()
    });

    eventEngine.start();
  }

  // Replay whatever the environment already had - a re-render must not lose it.
  applyWifiAvailability();
  syncWifiConnectionState();
  renderChatSurfaces();
  injectedMessages.forEach((message) => renderInjectedMessageCard(message));
}

/** Reports something the learner did, so triggers and the behaviour log both see it. */
function reportLearnerAction(action: LearnerAction, target?: string): void {
  eventEngine?.handleLearnerAction(action, target);
}

const DEFAULT_TOAST_SECONDS = 5;

/**
 * A Windows-style toast in the bottom right. Held for real seconds rather than
 * simulated minutes: the learner reads it at human speed, so it should not shrink
 * when the time lapse is turned up.
 */
function showDesktopNotification(notification: DesktopNotification): void {
  const host = document.querySelector<HTMLElement>("#toast-host");

  if (!host) {
    return;
  }

  // The icon says which app; the tone class says how serious. Before this the glyph
  // carried the severity and every toast looked like it came from the same place.
  const toast = document.createElement("div");
  toast.className = `toast toast-${notification.tone ?? "info"}${
    notification.onActivate ? " is-actionable" : ""
  }`;

  // Tagged so the event that raised it can withdraw it again later.
  if (notification.sourceEventId) {
    toast.dataset.sourceEvent = notification.sourceEventId;
  }
  const appLabel = notificationSourceLabel(notification.source);

  toast.innerHTML = `
    <div class="toast-icon" aria-hidden="true">${NOTIFICATION_GLYPHS[notification.source]}</div>
    <div class="toast-body">
      ${appLabel ? `<span class="sr-only">${escapeHtml(appLabel)}</span>` : ""}
      <strong>${escapeHtml(notification.title)}</strong>
      <p>${escapeHtml(notification.body)}</p>
    </div>
    <button type="button" class="toast-close" aria-label="${t("desktop.dismissNotification")}">&times;</button>
  `;

  host.appendChild(toast);

  toast
    .querySelector<HTMLButtonElement>(".toast-close")!
    .addEventListener("click", (event) => {
      // Dismissing must not also count as opening it.
      event.stopPropagation();
      dismissToast(toast);
    });

  if (notification.onActivate) {
    toast.addEventListener("click", () => {
      dismissToast(toast);
      notification.onActivate?.();
    });
  }

  window.setTimeout(
    () => dismissToast(toast),
    (notification.holdSeconds ?? DEFAULT_TOAST_SECONDS) * 1000
  );
}

/** Idempotent: a toast withdrawn early must not be dismissed twice. */
function dismissToast(toast: HTMLElement): void {
  if (toast.classList.contains("leaving")) {
    return;
  }

  toast.classList.add("leaving");
  window.setTimeout(() => toast.remove(), 220);
}

/** Hides or restores the corporate network in the Wi-Fi list. */
function applyWifiAvailability(): void {
  const trusted = document.querySelector<HTMLElement>('.wifi-network[data-network="official"]');

  trusted?.classList.toggle("hidden", !wifiAvailable);
}

/** True when the learner has no working connection, for whatever reason. */
function isOffline(): boolean {
  return connectedNetworkId === null;
}

/**
 * Publishes the connection state and repaints the taskbar indicator.
 *
 * The icon is driven by the state itself, not by the notice event: it should tell the
 * truth about the connection even if an operator has switched the prompt off.
 */
function syncWifiConnectionState(): void {
  const glyph = document.querySelector<HTMLElement>("#wifi-glyph");
  const button = document.querySelector<HTMLElement>("#wifi-button");
  const offline = isOffline();

  if (glyph && button) {
    // A globe rather than signal bars is how Windows shows "connected to nothing".
    glyph.textContent = offline ? APP_GLYPHS.networkOffline : APP_GLYPHS.networkOnline;
    button.classList.toggle("no-internet", offline);
    button.setAttribute(
      "aria-label",
      offline ? t("wifi.noConnectionLabel") : t("wifi.connectedLabel", { ssid: connectedSsid() })
    );
  }

  eventEngine?.setStateFlag("wifiDisconnected", offline);
}

function connectedSsid(): string {
  const context = requireScenario();

  return connectedNetworkId === "official"
    ? context.company.wifi.trustedSsid
    : context.company.wifi.rogueSsid;
}

/* ------------------------------------------------------------------ *
 * Simulated workday clock
 * ------------------------------------------------------------------ */

function startWorkdayClock(): void {
  if (!simClock) {
    simClock = createSimClock({
      totalMinutes: getWorkdayTotalMinutes(config.effective),
      realMinutesPerSimHour: config.effective.realMinutesPerSimHour,
      displayStepMinutes: config.effective.clockStepMinutes,
      onTick: (minutes) => {
        simMinutes = minutes;
        renderWorkdayClock();
      },
      // Every poll, not just on a visible clock change: triggers are evaluated
      // continuously, and real-time ones do not wait for the quarter hour.
      onAdvance: (rawMinutes) => eventEngine?.tick(rawMinutes),
      onDayEnd: handleWorkdayEnd
    });
  }

  simClock.start();
}

function renderWorkdayClock(): void {
  const context = scenario;
  const clockElement = document.querySelector<HTMLElement>("#system-clock");

  if (!context || !clockElement) {
    return;
  }

  const time = getClockAt(context.dayStart, simMinutes);

  document.querySelector<HTMLElement>("#system-clock-time")!.textContent = clockTimeLabel(time);
  document.querySelector<HTMLElement>("#system-clock-date")!.textContent = clockDateLabel(time);
  clockElement.setAttribute("aria-label", clockAccessibleLabel(time));
}

/**
 * End of the simulated day. The clock has already stopped at 17:00; the 5 pm
 * scenario event hangs off here once it exists.
 */
function handleWorkdayEnd(): void {
  document.querySelector<HTMLElement>("#system-clock")?.classList.add("day-ended");
}

/** Card order matches the story beats: coworker, HR, supervisor, then leadership. */
const NOTES_CAST_ORDER = [
  { role: "narrator", accent: "" },
  { role: "hrBenefits", accent: "trusted-reference" },
  { role: "supervisor", accent: "trusted-reference" },
  { role: "ceo", accent: "executive-reference" },
  { role: "cto", accent: "executive-reference" },
  { role: "salesManager", accent: "trusted-reference" },
  { role: "marketingVp", accent: "executive-reference" }
] as const;

function renderNotesCastMarkup(context: ScenarioContext): string {
  return NOTES_CAST_ORDER.map(({ role, accent }) => {
    const employee = context.cast[role];

    return `
      <article class="notes-person-card ${accent}">
        <h2>${escapeHtml(getFullName(employee))}</h2>
        <p>${escapeHtml(t(`notes.roles.${role}`, { first: employee.firstName }))}</p>
      </article>
    `;
  }).join("");
}

/* ------------------------------------------------------------------ *
 * Desktop interaction
 * ------------------------------------------------------------------ */

function attachEventListeners(): void {
  wireWindowRaising();
  wireWindowDragging();
  restoreWindowPositions();

  const emailWindow = document.querySelector<HTMLDivElement>("#email-window")!;
  const emailIcon = document.querySelector<HTMLButtonElement>("#email-icon")!;
  const closeEmail = document.querySelector<HTMLButtonElement>("#close-email")!;
  const mailBody = document.querySelector<HTMLDivElement>("#mail-body")!;
  const taskbarMail = document.querySelector<HTMLButtonElement>("#taskbar-mail")!;
  const notesWindow = document.querySelector<HTMLDivElement>("#notes-window")!;
  const notesIcon = document.querySelector<HTMLButtonElement>("#notes-icon")!;
  const closeNotes = document.querySelector<HTMLButtonElement>("#close-notes")!;
  const taskbarNotes = document.querySelector<HTMLButtonElement>("#taskbar-notes")!;
  const wifiButton = document.querySelector<HTMLButtonElement>("#wifi-button")!;
  const wifiPanel = document.querySelector<HTMLDivElement>("#wifi-panel")!;
  const desktop = document.querySelector<HTMLDivElement>(".desktop")!;
  const closeWifi = document.querySelector<HTMLButtonElement>("#close-wifi")!;

  function openEmailClient(): void {
    reportLearnerAction("mailAppOpened");
    emailWindow.classList.remove("hidden");
    raiseWindow(emailWindow);
    taskbarMail.classList.remove("hidden");
    taskbarMail.classList.add("active");
    taskbarNotes.classList.remove("active");
  }

  function openNotesApp(): void {
    reportLearnerAction("notesAppOpened");
    notesWindow.classList.remove("hidden");
    raiseWindow(notesWindow);
    taskbarNotes.classList.remove("hidden");
    taskbarNotes.classList.add("active");
    taskbarMail.classList.remove("active");
  }

  emailIcon.addEventListener("dblclick", () => {
    openEmailClient();
  });

  // Single-click only focuses the icon, matching desktop behavior.
  emailIcon.addEventListener("click", () => {
    emailIcon.classList.add("selected");
    notesIcon.classList.remove("selected");
  });

  notesIcon.addEventListener("dblclick", () => {
    openNotesApp();
  });

  notesIcon.addEventListener("click", () => {
    notesIcon.classList.add("selected");
    emailIcon.classList.remove("selected");
  });

  closeEmail.addEventListener("click", () => {
    emailWindow.classList.add("hidden");
    taskbarMail.classList.add("hidden");
    taskbarMail.classList.remove("active");
    openEmailId = null;
  });

  closeNotes.addEventListener("click", () => {
    notesWindow.classList.add("hidden");
    taskbarNotes.classList.add("hidden");
    taskbarNotes.classList.remove("active");
  });

  taskbarMail.addEventListener("click", () => {
    openEmailClient();
  });

  taskbarNotes.addEventListener("click", () => {
    openNotesApp();
  });

  document.querySelectorAll<HTMLButtonElement>(".message-card").forEach((button) => {
    button.addEventListener("click", () => {
      const emailId = button.dataset.email as EmailId;

      selectMessageCard(button);
      renderEmail(emailId, mailBody);
    });
  });

  attachLinkStatusBar(emailWindow, mailBody, "#mail-status-bar", "#mail-status-url");

  wifiButton.addEventListener("click", () => {
    wifiPanel.classList.toggle("hidden");

    if (!wifiPanel.classList.contains("hidden")) {
      reportLearnerAction("wifiPanelOpened");
    }

    syncWifiPanelState();
  });

  closeWifi.addEventListener("click", () => {
    wifiPanel.classList.add("hidden");
    syncWifiPanelState();
  });

  // Clicking away dismisses the flyout, the way a real system tray panel behaves.
  //
  // Bound to the desktop element rather than the document so the listener dies with
  // the render that created it - a document-level one would stack up on re-render.
  // The toggle button is excluded, or it would close and reopen in the same click.
  desktop.addEventListener("click", (event) => {
    const target = event.target as Node;

    if (!wifiPanel.classList.contains("hidden")) {
      if (!wifiPanel.contains(target) && !wifiButton.contains(target)) {
        wifiPanel.classList.add("hidden");
        syncWifiPanelState();
      }
    }

    // The message list is a tray flyout like the Wi-Fi one, and closes the same way.
    if (chatListOpen && !(target instanceof Element && target.closest("#chat-tray"))) {
      chatListOpen = false;
      renderChatSurfaces();
    }
  });

  /**
   * Publishes whether the Wi-Fi list is open. Triggers that declare
   * `pauseWhile: "wifiPanelOpen"` hold their countdown while it is - there is no point
   * nagging someone who is already looking at the network list.
   */
  function syncWifiPanelState(): void {
    eventEngine?.setStateFlag("wifiPanelOpen", !wifiPanel.classList.contains("hidden"));
  }

  document.querySelectorAll<HTMLButtonElement>(".wifi-network").forEach((networkButton) => {
    networkButton.addEventListener("click", () => {
      const networkId = networkButton.dataset.network;

      document.querySelectorAll<HTMLButtonElement>(".wifi-network").forEach((button) => {
        button.classList.remove("connected");
        button
          .querySelector<HTMLSpanElement>(".wifi-connected-label")
          ?.classList.add("hidden");
      });

      reportLearnerAction("wifiNetworkSelected", networkId);

      connectedNetworkId = networkId ?? null;
      syncWifiConnectionState();

      networkButton.classList.add("connected");
      networkButton
        .querySelector<HTMLSpanElement>(".wifi-connected-label")
        ?.classList.remove("hidden");

      if (networkId === "official") {
        showChoiceConfirmEffect(networkButton);
      }
    });
  });
}

/* ------------------------------------------------------------------ *
 * Link status bar
 * ------------------------------------------------------------------ */

/**
 * Reveals a link's true destination in a window's bottom-left status bar, on hover or on
 * keyboard focus. Shared by the mail client and the messenger, so link inspection is one
 * habit rather than a different one per app.
 *
 * Listeners are delegated from `hoverRoot` because its contents are replaced whenever the
 * learner opens a different message.
 */
function attachLinkStatusBar(
  container: HTMLElement,
  hoverRoot: HTMLElement,
  statusBarSelector: string,
  statusUrlSelector: string
): void {
  const statusBar = container.querySelector<HTMLDivElement>(statusBarSelector)!;
  const statusUrl = container.querySelector<HTMLSpanElement>(statusUrlSelector)!;

  // Tracked separately so moving the mouse away does not hide a URL that is still
  // focused, and vice versa.
  let hoveredUrl: string | null = null;
  let focusedUrl: string | null = null;

  function refresh(): void {
    const url = hoveredUrl ?? focusedUrl;

    if (url) {
      statusUrl.textContent = url;
      statusBar.classList.add("visible");
      return;
    }

    statusBar.classList.remove("visible");
  }

  function linkFrom(target: EventTarget | null): HTMLElement | null {
    return target instanceof Element ? target.closest<HTMLElement>(".mail-link") : null;
  }

  hoverRoot.addEventListener("mouseover", (event) => {
    hoveredUrl = linkFrom(event.target)?.dataset.url ?? null;

    if (hoveredUrl) {
      reportLearnerAction("linkHovered", hoveredUrl);
    }

    refresh();
  });

  hoverRoot.addEventListener("mouseout", (event) => {
    if (linkFrom(event.target)) {
      hoveredUrl = null;
      refresh();
    }
  });

  hoverRoot.addEventListener("focusin", (event) => {
    focusedUrl = linkFrom(event.target)?.dataset.url ?? null;
    refresh();
  });

  hoverRoot.addEventListener("focusout", (event) => {
    if (linkFrom(event.target)) {
      focusedUrl = null;
      refresh();
    }
  });

  hoverRoot.addEventListener("click", (event) => {
    const link = linkFrom(event.target);

    if (link) {
      activateMailLink(link);
    }
  });

  // role=link elements are activated with Enter, not Space.
  hoverRoot.addEventListener("keydown", (event) => {
    const link = linkFrom(event.target);

    if (link && event.key === "Enter") {
      event.preventDefault();
      activateMailLink(link);
    }
  });
}

/**
 * Wires the status-bar link preview that mail clients show in the bottom-left corner.
 *
 * Hover and keyboard focus are tracked separately, and hover wins when both are live -
 * a pointer moving over a link should show that link, not whatever still has focus.
 * Shared by the mail window and the messenger, which is why the elements are passed in
 * rather than looked up by a fixed id.
 */
function wireLinkInspection(
  windowElement: HTMLElement,
  scrollHost: HTMLElement,
  statusBarSelector: string,
  statusUrlSelector: string
): void {
  const bar = windowElement.querySelector<HTMLElement>(statusBarSelector)!;
  const output = windowElement.querySelector<HTMLElement>(statusUrlSelector)!;

  let hoveredUrl: string | null = null;
  let focusedUrl: string | null = null;

  function update(): void {
    const url = hoveredUrl ?? focusedUrl;

    if (url) {
      output.textContent = url;
      bar.classList.add("visible");
      return;
    }

    bar.classList.remove("visible");
  }

  const linkFrom = (target: EventTarget | null): HTMLElement | null =>
    target instanceof Element ? target.closest<HTMLElement>(".mail-link") : null;

  scrollHost.addEventListener("mouseover", (event) => {
    hoveredUrl = linkFrom(event.target)?.dataset.url ?? null;

    // Logged on hover as well as click: choosing to inspect a link is the behaviour.
    if (hoveredUrl) {
      reportLearnerAction("linkHovered", hoveredUrl);
    }

    update();
  });

  scrollHost.addEventListener("mouseout", (event) => {
    if (linkFrom(event.target)) {
      hoveredUrl = null;
      update();
    }
  });

  scrollHost.addEventListener("focusin", (event) => {
    focusedUrl = linkFrom(event.target)?.dataset.url ?? null;
    update();
  });

  scrollHost.addEventListener("focusout", (event) => {
    if (linkFrom(event.target)) {
      focusedUrl = null;
      update();
    }
  });

  scrollHost.addEventListener("click", (event) => {
    const link = linkFrom(event.target);

    if (link) {
      activateMailLink(link);
    }
  });

  scrollHost.addEventListener("keydown", (event) => {
    const link = linkFrom(event.target);

    if (link && event.key === "Enter") {
      event.preventDefault();
      activateMailLink(link);
    }
  });
}

/**
 * Clicking through on the phishing link is the risky outcome, so it earns the same
 * coaching as trusting the message. A genuine link is simply followed - nothing to
 * teach, and nothing actually navigates in the simulation.
 *
 * This is where a `link_clicked` event will belong once eventLogger.ts exists.
 */
function activateMailLink(link: HTMLElement): void {
  const context = requireScenario();

  reportLearnerAction("linkClicked", link.dataset.url);
  link.classList.add("visited");

  if (link.dataset.risk !== "malicious") {
    return;
  }

  showFeedback(
    t("feedback.riskyTrust", {
      suspicious: context.company.lookalikeDomain,
      legitimate: context.company.domain
    }),
    "risky"
  );
}

/* ------------------------------------------------------------------ *
 * Reading pane
 * ------------------------------------------------------------------ */

function renderEmail(emailId: EmailId, mailBody: HTMLDivElement): void {
  const context = requireScenario();
  const { company, cast } = context;
  const recipient = t("email.to", { recipient: context.learnerAddress.address });

  reportLearnerAction("emailOpened", emailId);

  openEmailId = emailId;

  // Release anything waiting for this message to be read.
  const waiting = emailOpenWaiters.filter((waiter) => waiter.messageId === emailId);

  emailOpenWaiters = emailOpenWaiters.filter((waiter) => waiter.messageId !== emailId);
  waiting.forEach((waiter) => waiter.resolve());

  const injected = injectedMessages.get(emailId);

  if (injected) {
    mailBody.innerHTML = renderInjectedEmailMarkup(injected, recipient);
    return;
  }

  if (emailId === "benefits") {
    mailBody.innerHTML = `
      <article class="email-message">
        <header class="email-header">
          <h1>${t("email.benefits.heading")}</h1>

          <div class="sender-row">
            <div class="sender-avatar">${getInitial(context.phishingSender.name)}</div>
            <div>
              <div><strong>${escapeHtml(formatMailAddress(context.phishingSender))}</strong></div>
              <div class="email-meta">
                ${escapeHtml(recipient)} • ${t("email.receivedBenefits")}
              </div>
            </div>
          </div>
        </header>

        <div class="email-content">
          <p>${t("email.benefits.greeting")}</p>

          <p>${t("email.benefits.body")}</p>

          <p>${t("email.benefits.urgency")}</p>

          <p>
            ${renderMailLinkMarkup(t("email.benefits.linkLabel"), context.phishingUrl, "malicious")}
          </p>

          ${
            context.showInspectionHint
              ? `
                <div class="link-inspection-hint">
                  ${t("email.benefits.hoverTarget")}
                  <code>${escapeHtml(context.phishingUrl)}</code>
                </div>
              `
              : ""
          }

          <div class="actions">
            <button id="report-email" class="primary-action">${t("actions.report")}</button>
            <button id="trust-email">${t("actions.trust")}</button>
            <button id="ignore-email">${t("actions.ignore")}</button>
          </div>

          <div id="feedback" class="feedback hidden"></div>
        </div>
      </article>
    `;

    const domains = {
      suspicious: company.lookalikeDomain,
      legitimate: company.domain
    };

    document
      .querySelector<HTMLButtonElement>("#report-email")!
      .addEventListener("click", (event) => {
        reportLearnerAction("emailReported", "benefits");
        showChoiceConfirmEffect(event.currentTarget as HTMLElement);
        showFeedback(t("feedback.correctReport", domains), "correct");
      });

    document
      .querySelector<HTMLButtonElement>("#trust-email")!
      .addEventListener("click", () => {
        reportLearnerAction("emailTrusted", "benefits");
        showFeedback(t("feedback.riskyTrust", domains), "risky");
      });

    document
      .querySelector<HTMLButtonElement>("#ignore-email")!
      .addEventListener("click", () => {
        reportLearnerAction("emailIgnored", "benefits");
        showFeedback(t("feedback.ignoredMalicious"), "partial");
      });

    return;
  }

  if (emailId === "picnic") {
    mailBody.innerHTML = renderPlainEmailMarkup({
      heading: t("email.picnic.heading"),
      sender: cast.marketingVp,
      meta: `${escapeHtml(recipient)} • ${t("email.receivedPicnic")}`,
      paragraphs: [t("email.picnic.body"), t("email.picnic.noAction")],
      link: { label: t("email.picnic.linkLabel"), url: context.safeUrl, risk: "safe" }
    });

    return;
  }

  if (emailId === "meeting") {
    mailBody.innerHTML = renderPlainEmailMarkup({
      heading: t("email.meeting.heading"),
      sender: cast.cto,
      meta: `${escapeHtml(recipient)} • ${t("email.receivedMeeting")}`,
      paragraphs: [t("email.meeting.body")]
    });
  }
}

/** Reading-pane markup for an event-delivered message. */
function renderInjectedEmailMarkup(message: InjectedMessage, recipient: string): string {
  return `
    <article class="email-message">
      <header class="email-header">
        <h1>${escapeHtml(message.subject)}</h1>

        <div class="sender-row">
          <div class="sender-avatar">${getInitial(message.senderName)}</div>
          <div>
            <div><strong>${escapeHtml(
              formatMailAddress({ name: message.senderName, address: message.senderAddress })
            )}</strong></div>
            <div class="email-meta">${escapeHtml(recipient)} &bull; ${escapeHtml(
              message.receivedLabel
            )}</div>
          </div>
        </div>
      </header>

      <div class="email-content">
        ${message.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        ${
          message.link
            ? `<p>${renderMailLinkMarkup(message.link.label, message.link.url, message.link.risk)}</p>`
            : ""
        }
        ${message.phone ? renderMailPhoneMarkup(message.phone.label, message.phone.number) : ""}
      </div>
    </article>
  `;
}

/**
 * A phone number a message wants called.
 *
 * Rendered as a labelled block rather than a control: in a T.O.A.D. attack the number IS
 * the payload, so it has to be prominent enough to be read and compared - but making it
 * clickable would create a way to act that bypasses the choice prompt, and a `tel:` anchor
 * would put a real link in the browser's status bar. Text, styled to stand out.
 */
function renderMailPhoneMarkup(label: string, number: string): string {
  return `
    <div class="mail-phone">
      <span class="mail-phone-label">${escapeHtml(label)}</span>
      <span class="mail-phone-number">${escapeHtml(number)}</span>
    </div>
  `;
}

type LinkRisk = "safe" | "malicious";

/**
 * A simulated mail-client link.
 *
 * Deliberately NOT an <a href>: a real anchor makes the browser show its own status
 * bar preview (`localhost:5173/#`), which both spoils the fiction and contradicts
 * the URL we want the learner to inspect. A span carries the appearance, and
 * role=link plus tabindex keeps it reachable by keyboard and announced correctly.
 *
 * The true destination lives in data-url and surfaces only through the in-app
 * status bar, so hovering is the learner's own deliberate act.
 */
function renderMailLinkMarkup(label: string, url: string, risk: LinkRisk): string {
  return `<span
    class="mail-link"
    role="link"
    tabindex="0"
    data-url="${escapeHtml(url)}"
    data-risk="${risk}"
  >${label}</span>`;
}

function renderPlainEmailMarkup(email: {
  heading: string;
  sender: Employee;
  meta: string;
  paragraphs: string[];
  link?: { label: string; url: string; risk: LinkRisk };
}): string {
  return `
    <article class="email-message">
      <header class="email-header">
        <h1>${email.heading}</h1>

        <div class="sender-row">
          <div class="sender-avatar">${getInitial(email.sender.firstName)}</div>
          <div>
            <div>
              <strong>${escapeHtml(
                formatMailAddress({
                  name: getFullName(email.sender),
                  address: email.sender.email
                })
              )}</strong>
            </div>
            <div class="email-meta">${email.meta}</div>
          </div>
        </div>
      </header>

      <div class="email-content">
        ${email.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
        ${
          email.link
            ? `<p>${renderMailLinkMarkup(email.link.label, email.link.url, email.link.risk)}</p>`
            : ""
        }
      </div>
    </article>
  `;
}

type FeedbackTone = "correct" | "partial" | "risky";

function showFeedback(message: string, tone: FeedbackTone): void {
  const feedback = document.querySelector<HTMLDivElement>("#feedback");

  if (!feedback) {
    return;
  }

  feedback.textContent = message;
  feedback.classList.remove("correct", "partial", "risky", "hidden");
  feedback.classList.add(tone);
}

/* ------------------------------------------------------------------ *
 * Confirmation effect
 * ------------------------------------------------------------------ */

function showChoiceConfirmEffect(targetElement: HTMLElement): void {
  const targetRect = targetElement.getBoundingClientRect();

  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top + targetRect.height / 2;

  const effect = document.createElement("div");
  effect.className = "choice-confirm-effect";

  effect.style.setProperty("--target-x", `${targetX}px`);
  effect.style.setProperty("--target-y", `${targetY}px`);

  effect.innerHTML = `
    <div class="choice-confirm-mark">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="46"></circle>
        <path d="M36 61 L52 77 L86 42"></path>
      </svg>
    </div>

    <div class="choice-confirm-echo">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="46"></circle>
      </svg>
    </div>
  `;

  document.body.appendChild(effect);

  window.setTimeout(() => {
    effect.classList.add("choice-confirm-hold-complete");
  }, 2200);

  window.setTimeout(() => {
    effect.remove();
  }, 2750);
}

/* ------------------------------------------------------------------ *
 * Utilities
 * ------------------------------------------------------------------ */

function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

startApp();
