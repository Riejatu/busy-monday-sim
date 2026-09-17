import { enUS } from "./en-US";
import { frFR } from "./fr-FR";
import { deDE } from "./de-DE";
import { itIT } from "./it-IT";
import { jaJP } from "./ja-JP";

/**
 * Every locale the app can actually render. Employee `locale` values in the roster
 * are constrained to this list, so a profile can never select a language that has
 * no dictionary behind it.
 */
const translations = {
  "en-US": enUS,
  "fr-FR": frFR,
  "de-DE": deDE,
  "it-IT": itIT,
  "ja-JP": jaJP
};

export type LocaleCode = keyof typeof translations;

export const DEFAULT_LOCALE: LocaleCode = "en-US";

type TranslationDictionary = typeof enUS;

const availableLocales = Object.keys(translations) as LocaleCode[];

export function isSupportedLocale(value: string): value is LocaleCode {
  return (availableLocales as string[]).includes(value);
}

const storedLocale = localStorage.getItem("locale");

let currentLocale: LocaleCode =
  storedLocale && isSupportedLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE;

// index.html ships with a placeholder lang; correct it immediately so assistive
// tech and the browser see the real language even before any locale change.
document.documentElement.lang = currentLocale;

export function getLocale(): LocaleCode {
  return currentLocale;
}

export function setLocale(locale: LocaleCode): void {
  currentLocale = locale;
  localStorage.setItem("locale", locale);
  document.documentElement.lang = locale;
}

export function getAvailableLocales(): LocaleCode[] {
  return [...availableLocales];
}

/**
 * Looks up a dot-path and substitutes `{placeholder}` tokens.
 *
 *   t("intro.returnText", { coworkerName: "Mark Bitgade" })
 *
 * Values are substituted verbatim. Anything interpolated into HTML still has to be
 * escaped at the call site.
 */
/**
 * Whether a message exists, without asking for it.
 *
 * `t()` warns on a miss, which is the right default - a missing string is nearly always a
 * bug. But a caller that deliberately probes for optional text (per-incident consequence
 * copy, say, with a generic fallback) would fill the console with warnings for keys nobody
 * has authored yet, and those warnings are how the drivers detect real misses.
 */
export function hasMessage(path: string): boolean {
  const dictionary = translations[currentLocale] as TranslationDictionary;

  if (typeof getNestedValue(dictionary, path) === "string") {
    return true;
  }

  return typeof getNestedValue(translations["en-US"] as TranslationDictionary, path) === "string";
}

export function t(path: string, params?: Record<string, string>): string {
  const dictionary = translations[currentLocale] as TranslationDictionary;
  const fallbackDictionary = translations["en-US"] as TranslationDictionary;

  const value = getNestedValue(dictionary, path);
  const fallbackValue = getNestedValue(fallbackDictionary, path);

  if (typeof value === "string") {
    return interpolate(value, params);
  }

  if (typeof fallbackValue === "string") {
    console.warn(`Missing translation for "${path}" in ${currentLocale}. Falling back to en-US.`);
    return interpolate(fallbackValue, params);
  }

  console.warn(`Missing translation key: "${path}"`);
  return path;
}

function interpolate(template: string, params?: Record<string, string>): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key in params) {
      return params[key];
    }

    console.warn(`Missing interpolation value "${key}" for "${template}"`);
    return match;
  });
}

function getNestedValue(object: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, object);
}