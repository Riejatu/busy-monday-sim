// Bridges roster data values to localized display text.
//
// Departments and tenure bands are stored as language-neutral English identifiers
// in orgs.json. These maps keep the dictionaries free of keys like "10+ years".

import { getLocale, t } from "./i18n";
import type { LocaleCode } from "./i18n";
import type { Department, SecurityRating, TenureBand } from "../data/roster";
import { convertTemperature } from "../config/settings";
import type { TemperatureUnit } from "../config/settings";

const DEPARTMENT_KEYS: Record<Department, string> = {
  Accounting: "accounting",
  "Customer Service": "customerService",
  Engineering: "engineering",
  Executive: "executive",
  Finance: "finance",
  HR: "hr",
  IT: "it",
  Legal: "legal",
  Maintenance: "maintenance",
  Marketing: "marketing",
  Operations: "operations",
  Payroll: "payroll",
  Purchasing: "purchasing",
  Sales: "sales"
};

const TENURE_KEYS: Record<TenureBand, string> = {
  "New Hire": "newHire",
  "0-2 years": "upToTwo",
  "2-5 years": "twoToFive",
  "5-10 years": "fiveToTen",
  "10+ years": "tenPlus"
};

export function departmentLabel(department: Department): string {
  return t(`departments.${DEPARTMENT_KEYS[department]}`);
}

export function tenureLabel(tenure: TenureBand): string {
  return t(`tenure.${TENURE_KEYS[tenure]}`);
}

export function securityRatingLabel(rating: SecurityRating): string {
  if (rating === 0) {
    return t("securityRating.unrated");
  }

  return t("securityRating.scale", { rating: String(rating) });
}

/**
 * The language picker shows each option as its own autonym - "Deutsch", not
 * "German" - which is what users scanning for their language actually look for.
 * Intl supplies these, so adding a locale needs no new dictionary entries.
 */
export function languageAutonym(locale: LocaleCode): string {
  try {
    const names = new Intl.DisplayNames([locale], { type: "language" });
    return capitalize(names.of(locale) ?? locale);
  } catch {
    return locale;
  }
}

/** Country name for an employee's locale, in the language currently displayed. */
export function countryLabel(locale: LocaleCode): string {
  const region = locale.split("-")[1];

  if (!region) {
    return locale;
  }

  try {
    const names = new Intl.DisplayNames([getLocale()], { type: "region" });
    return names.of(region) ?? region;
  } catch {
    return region;
  }
}

// Several languages lower-case their own name; a picker option reads better capitalized.
function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}

/*
 * Desktop clock. Intl decides the conventions per locale, so en-US gets a 12-hour
 * clock and M/D/Y while de-DE gets 24-hour and D.M.Y - no per-locale strings and
 * nothing to keep in sync in the dictionaries.
 */

/**
 * The locale's own short-time pattern, which is why de-DE pads to "09:41" while
 * en-US stays "9:41 AM" and ja-JP stays "9:41". Spelling the components out by hand
 * instead would pad all of them or none.
 */
export function clockTimeLabel(date: Date): string {
  return formatDate(date, { timeStyle: "short" });
}

/**
 * Explicit numeric components rather than dateStyle "short": CLDR's short date
 * abbreviates the year in several locales ("6/22/26"), while a Windows taskbar
 * shows it in full.
 */
export function clockDateLabel(date: Date): string {
  return formatDate(date, { year: "numeric", month: "numeric", day: "numeric" });
}

/** Full date and time, for the clock's accessible label. */
export function clockAccessibleLabel(date: Date): string {
  return formatDate(date, { dateStyle: "full", timeStyle: "short" });
}

/*
 * Temperature. Intl supplies the unit symbol and the locale's spacing convention:
 * en-US and ja-JP use no separator ("72°F"), de-DE and it-IT a plain space,
 * fr-FR a narrow no-break space (U+202F).
 *
 * unitDisplay "short" rather than "narrow": narrow drops the letter entirely in
 * en-US ("72°"), which would make Fahrenheit and Celsius indistinguishable once the
 * unit is configurable.
 */

/**
 * The scale a locale conventionally uses. Fahrenheit is essentially a US-only
 * convention (plus a few territories), so Celsius is the default and the exceptions
 * are listed explicitly.
 *
 * An explicit map rather than the Intl locale-info proposal, which is not reliably
 * available yet - and with a handful of supported locales this is easier to audit.
 */
const FAHRENHEIT_REGIONS = new Set(["US", "BS", "BZ", "KY", "LR", "PW", "FM", "MH"]);

export function conventionalTemperatureUnit(locale: LocaleCode): TemperatureUnit {
  const region = locale.split("-")[1]?.toUpperCase();

  return region && FAHRENHEIT_REGIONS.has(region) ? "fahrenheit" : "celsius";
}

/**
 * Turns the configured reading into what should actually be shown: the authored
 * value converted into the learner's conventional scale when unit localization is
 * on, or left exactly as authored when it is off.
 */
export function resolveDisplayTemperature(settings: {
  temperatureValue: number;
  temperatureUnit: TemperatureUnit;
  localizeTemperatureUnit: boolean;
}): { value: number; unit: TemperatureUnit } {
  const unit = settings.localizeTemperatureUnit
    ? conventionalTemperatureUnit(getLocale())
    : settings.temperatureUnit;

  return {
    value: convertTemperature(settings.temperatureValue, settings.temperatureUnit, unit),
    unit
  };
}

export function temperatureLabel(value: number, unit: TemperatureUnit): string {
  return formatTemperature(value, unit, "short");
}

/** Spoken form for assistive tech, e.g. "72 degrees Fahrenheit". */
export function temperatureAccessibleLabel(value: number, unit: TemperatureUnit): string {
  return formatTemperature(value, unit, "long");
}

function formatTemperature(
  value: number,
  unit: TemperatureUnit,
  unitDisplay: "short" | "long"
): string {
  try {
    return new Intl.NumberFormat(getLocale(), {
      style: "unit",
      unit,
      unitDisplay,
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `${Math.round(value)}°${unit === "celsius" ? "C" : "F"}`;
  }
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(getLocale(), options).format(date);
  } catch {
    return date.toISOString();
  }
}
