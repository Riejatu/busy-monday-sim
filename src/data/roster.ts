// Typed access to the demo org roster (10 companies x 100 employees).
//
// The data itself is generated, not hand-maintained: edit scripts/generate-roster.mjs
// and run `npm run generate:roster`. Do not edit orgs.json directly.

import type { LocaleCode } from "../localization/i18n";

export const DEPARTMENTS = [
  "Accounting",
  "Customer Service",
  "Engineering",
  "Executive",
  "Finance",
  "HR",
  "IT",
  "Legal",
  "Maintenance",
  "Marketing",
  "Operations",
  "Payroll",
  "Purchasing",
  "Sales"
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const TENURE_BANDS = [
  "New Hire",
  "0-2 years",
  "2-5 years",
  "5-10 years",
  "10+ years"
] as const;

export type TenureBand = (typeof TENURE_BANDS)[number];

/**
 * 0 means "not yet rated" and is reserved for New Hires. 1 is the safest rated
 * behavior, 4 the riskiest.
 */
export type SecurityRating = 0 | 1 | 2 | 3 | 4;

/** Narrative slots the scenario casts from a company's own roster. */
export const SCENARIO_ROLES = [
  "narrator",
  "ceo",
  "cto",
  "hrBenefits",
  "supervisor",
  "marketingVp",
  "salesManager",
  "accounting"
] as const;

export type ScenarioRole = (typeof SCENARIO_ROLES)[number];

export interface CompanyWifi {
  /** The real corporate network. */
  trustedSsid: string;
  /** Evil twin: same name, hyphen dropped. */
  rogueSsid: string;
}

export interface CompanyColors {
  /** Brand color for titlebars, buttons and accents. Passes AA against white. */
  primary: string;
  /** Deeper companion shade for gradients and dark surfaces. */
  secondary: string;
}

export interface Employee {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: Department;
  tenure: TenureBand;
  securityRating: SecurityRating;
  /**
   * Where this employee works. Seeds the initial language when the profile loads;
   * the learner can still override it on the personalization screen.
   */
  locale: LocaleCode;
}

export interface Company {
  id: string;
  name: string;
  url: string;
  /** Bare domain, e.g. "zorin.com". Legitimate mail is addressed from here. */
  domain: string;
  /** Plausible near-miss domain for phishing content, e.g. "zorin-benefits.co". */
  lookalikeDomain: string;
  industry: string;
  /** Root-relative path to a local asset served from public/. */
  logo: string;
  /** Desktop and sign-in wallpaper, generated from this company's brand colors. */
  wallpaper: string;
  colors: CompanyColors;
  wifi: CompanyWifi;
  /** Employee id per narrative role. */
  scenarioRoles: Record<ScenarioRole, string>;
  employees: Employee[];
}

/** A single learner, paired with the company they belong to. */
export interface EmployeeContext {
  company: Company;
  employee: Employee;
}

let cachedOrganizations: Company[] | null = null;

/**
 * Loads the roster as a separate chunk so the ~250 KB dataset stays out of the
 * initial bundle. Subsequent calls resolve from cache.
 */
export async function loadOrganizations(): Promise<Company[]> {
  if (!cachedOrganizations) {
    const raw = await import("./orgs.json?raw");
    cachedOrganizations = JSON.parse(raw.default) as Company[];
  }

  return cachedOrganizations;
}

export async function findCompany(companyId: string): Promise<Company | undefined> {
  const organizations = await loadOrganizations();

  return organizations.find((company) => company.id === companyId);
}

export async function findEmployee(
  employeeId: string
): Promise<EmployeeContext | undefined> {
  const organizations = await loadOrganizations();

  for (const company of organizations) {
    const employee = company.employees.find((candidate) => candidate.id === employeeId);

    if (employee) {
      return { company, employee };
    }
  }

  return undefined;
}

export function getEmployeesByDepartment(
  company: Company,
  department: Department
): Employee[] {
  return company.employees.filter((employee) => employee.department === department);
}

export function getFullName(employee: Employee): string {
  return `${employee.firstName} ${employee.lastName}`;
}

export function isNewHire(employee: Employee): boolean {
  return employee.tenure === "New Hire";
}

/**
 * Publishes the company's branding as CSS custom properties so stylesheets can
 * theme against `var(--brand-primary)` instead of hard-coded hex values.
 */
export function applyCompanyTheme(
  company: Company,
  target: HTMLElement = document.documentElement
): void {
  target.style.setProperty("--brand-primary", company.colors.primary);
  target.style.setProperty("--brand-secondary", company.colors.secondary);
  target.style.setProperty("--brand-logo", `url("${company.logo}")`);
  target.style.setProperty("--brand-wallpaper", `url("${company.wallpaper}")`);
}
