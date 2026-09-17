// Turns a (company, learner) pair from the roster into everything the simulation
// needs to render: who sends what, from which address, and how much coaching to show.
//
// Content strings stay in the localization files. This module only resolves the
// language-neutral facts - people, addresses, domains, network names.

import { SCENARIO_ROLES } from "./data/roster";
import type { Company, Employee, ScenarioRole } from "./data/roster";
import type { SimulationSettings } from "./config/settings";
import type { PhishingClassificationId } from "./phishingTaxonomy";

export interface MailAddress {
  /** Display name, e.g. "Susan Touroline". */
  name: string;
  /** Address, e.g. "susan.touroline@zorin-benefits.co". */
  address: string;
}

export interface ScenarioContext {
  company: Company;
  learner: Employee;
  cast: Record<ScenarioRole, Employee>;
  /** The learner's own mailbox. */
  learnerAddress: MailAddress;
  /** The impersonation: the real HR name, at the lookalike domain. */
  phishingSender: MailAddress;
  phishingUrl: string;
  /**
   * Which category the standing inbox phish belongs to. Declared here with the rest of
   * that message's language-neutral facts, so campaign coverage can gate it exactly the
   * way it gates an event rather than the mail UI carrying a special case.
   */
  phishingClassification: PhishingClassificationId;
  /**
   * A genuine link on the company's own domain. The learner needs a safe URL to
   * compare against, otherwise "the message with a link" is the whole tell.
   */
  safeUrl: string;
  /**
   * The corporate card issuer, whose brand a T.O.A.D. attack borrows.
   *
   * Two numbers, and the gap between them is the entire lesson: `officialNumber` is
   * printed on the card and published on the issuer's site, so the learner already has a
   * trustworthy copy of it (see the Notes app). `spoofedNumber` is what the attacker puts
   * in the email. Comparing them is the behaviour being taught.
   */
  cardIssuer: {
    name: string;
    /** On the back of the card and on the issuer's real site. */
    officialNumber: string;
    /** In the attacker's email. Reaches the attacker, not the issuer. */
    spoofedNumber: string;
    website: string;
    /** Lookalike the attacker sends from. */
    lookalikeDomain: string;
  };
  /**
   * The internal helpdesk. Also in the Notes app, which is what makes "call the number you
   * already have" a thing the learner can actually act on rather than advice.
   */
  helpdeskNumber: string;
  /**
   * Whether to surface the explicit "hover target" hint under the suspicious link.
   * Extra scaffolding for learners who have no rating yet or a risky one.
   */
  showInspectionHint: boolean;
  /** In-fiction date and start-of-day time. The sim clock advances from here. */
  dayStart: Date;
}

/**
 * The scenario is "A Busy Monday", so the desktop clock shows the most recent
 * Monday rather than the real weekday - and derives the date rather than hard-coding
 * a year, which would date the demo.
 *
 * The opening hour comes from configuration; see src/config/settings.ts.
 */
export function getWorkdayStart(startHour: number, now: Date = new Date()): Date {
  const start = new Date(now);

  // getDay() is 0=Sunday; shift so Monday is 0.
  const daysSinceMonday = (start.getDay() + 6) % 7;

  start.setDate(start.getDate() - daysSinceMonday);
  start.setHours(startHour, 0, 0, 0);

  return start;
}

/** Simulated minutes in the configured workday. */
export function getWorkdayTotalMinutes(settings: SimulationSettings): number {
  return (settings.workdayEndHour - settings.workdayStartHour) * 60;
}

/** The in-fiction wall-clock time after `simMinutes` of the workday have passed. */
export function getClockAt(dayStart: Date, simMinutes: number): Date {
  return new Date(dayStart.getTime() + simMinutes * 60_000);
}

export function buildScenarioContext(
  company: Company,
  learner: Employee,
  settings: SimulationSettings
): ScenarioContext {
  const cast = resolveCast(company, learner);
  const hrBenefits = cast.hrBenefits;

  return {
    company,
    learner,
    cast,
    learnerAddress: toMailAddress(learner),
    phishingSender: {
      name: getFullName(hrBenefits),
      address: `${localPart(hrBenefits.email)}@${company.lookalikeDomain}`
    },
    phishingUrl: `https://${company.lookalikeDomain}/login`,
    // The link lands on a counterfeit sign-in page, so the credentials are typed in by
    // hand on arrival: Data Entry, not Drive by.
    phishingClassification: "dataEntry",
    cardIssuer: resolveCardIssuer(company),
    helpdeskNumber: fictionalNumber(company.id, "helpdesk"),
    safeUrl: `https://${company.domain}/photos/summer-picnic`,
    showInspectionHint: learner.securityRating === 0 || learner.securityRating >= 3,
    dayStart: getWorkdayStart(settings.workdayStartHour)
  };
}

/* ------------------------------------------------------------------ *
 * Telephone fiction
 * ------------------------------------------------------------------ */

/**
 * Fictional card issuers. Deliberately none of the roster company names, so the issuer
 * never reads as the learner's own employer.
 */
const CARD_ISSUERS = [
  { name: "Ardenmoor Card Services", slug: "ardenmoor" },
  { name: "Belhaven Card Services", slug: "belhaven" },
  { name: "Calderwood Card Services", slug: "calderwood" },
  { name: "Thornbury Card Services", slug: "thornbury" },
  { name: "Westmarch Card Services", slug: "westmarch" }
] as const;

/**
 * Small stable hash, so a company always draws the same issuer and the same numbers.
 * Reproducibility matters here for the same reason it does in the roster generator: a
 * screenshot or a bug report has to still describe the thing being looked at.
 */
function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 100_000;
  }

  return hash;
}

/**
 * Real toll-free codes for a published service line, and real metro codes for a number an
 * attacker would use. Which pool a number comes from is itself part of the fiction: a card
 * issuer publishes a toll-free line, so a "verification line" on a city code is already
 * slightly wrong to anyone who notices.
 */
const AREA_CODES = {
  tollFree: ["800", "888", "877", "866"],
  geographic: ["213", "312", "415", "646", "702"]
} as const;

/**
 * A number in the 555-0100..555-0199 block, which is reserved for fiction and can never
 * reach a real subscriber whatever the area code - the telephone equivalent of
 * example.com. `purpose` keeps the several numbers one company needs from colliding.
 *
 * Rendered in one format for every locale on purpose: a published service number is a
 * printed string, not a quantity, and a real issuer does not reformat it by language.
 * Inventing per-locale phone formatting here would be fake precision.
 */
function fictionalNumber(
  companyId: string,
  purpose: string,
  kind: keyof typeof AREA_CODES = "tollFree"
): string {
  const codes = AREA_CODES[kind];
  const seed = hashString(`${companyId}:${purpose}`);
  const areaCode = codes[seed % codes.length];
  const line = String(100 + (seed % 100)).padStart(4, "0");

  return `+1 (${areaCode}) 555-${line}`;
}

function resolveCardIssuer(company: Company): ScenarioContext["cardIssuer"] {
  const issuer = CARD_ISSUERS[hashString(company.id) % CARD_ISSUERS.length];

  return {
    name: issuer.name,
    officialNumber: fictionalNumber(company.id, "card-official"),
    // A city code rather than a toll-free one, so the two numbers differ at a glance
    // instead of having to be read digit by digit.
    spoofedNumber: fictionalNumber(company.id, "card-spoofed", "geographic"),
    website: `https://${issuer.slug}card.com`,
    lookalikeDomain: `${issuer.slug}card-alerts.com`
  };
}

/**
 * The roster names a single employee per role, but the learner may *be* that
 * person - nobody should receive a phish impersonating themselves. When that
 * happens, stand in the next colleague from the same department.
 */
function resolveCast(company: Company, learner: Employee): Record<ScenarioRole, Employee> {
  const byId = new Map(company.employees.map((employee) => [employee.id, employee]));
  const cast = {} as Record<ScenarioRole, Employee>;

  for (const role of SCENARIO_ROLES) {
    const named = byId.get(company.scenarioRoles[role]);

    cast[role] =
      named && named.id !== learner.id ? named : findUnderstudy(company, learner, named);
  }

  return cast;
}

function findUnderstudy(
  company: Company,
  learner: Employee,
  original: Employee | undefined
): Employee {
  const sameDepartment = company.employees.find(
    (employee) => employee.id !== learner.id && employee.department === original?.department
  );

  if (sameDepartment) {
    return sameDepartment;
  }

  const anyoneElse = company.employees.find((employee) => employee.id !== learner.id);

  // A single-employee company cannot occur in the generated roster, but the type
  // system does not know that.
  return anyoneElse ?? learner;
}

export function getFullName(employee: Employee): string {
  return `${employee.firstName} ${employee.lastName}`;
}

export function toMailAddress(employee: Employee): MailAddress {
  return { name: getFullName(employee), address: employee.email };
}

/** Renders an address the way a mail client does: `Name <local@domain>`. */
export function formatMailAddress(mailAddress: MailAddress): string {
  return `${mailAddress.name} <${mailAddress.address}>`;
}

export function getInitial(value: string): string {
  return value.charAt(0).toUpperCase();
}

function localPart(email: string): string {
  return email.split("@")[0];
}
