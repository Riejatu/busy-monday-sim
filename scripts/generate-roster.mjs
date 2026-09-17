// Generates the demo org roster: 10 companies x 100 employees.
//
// Deterministic by design. Every random choice comes from a seeded PRNG keyed on
// the company id, so re-running this script reproduces byte-identical output and
// re-generating never churns the committed data.
//
//   node scripts/generate-roster.mjs
//
// Outputs:
//   src/data/orgs.json         - consumed by the app via src/data/roster.ts
//   docs/roster.csv            - flat table for human review / spreadsheet import
//   public/assets/logos/*.svg  - placeholder monogram logos, one per company

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const EMPLOYEES_PER_COMPANY = 100;

/* ------------------------------------------------------------------ *
 * Seeded PRNG
 * ------------------------------------------------------------------ */

function hashSeed(text) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;

  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted(rng, weights) {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);

  let roll = rng() * total;

  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return value;
    }
  }

  return entries[entries.length - 1][0];
}

function scaleWeights(base, multipliers) {
  const scaled = {};

  for (const [key, weight] of Object.entries(base)) {
    scaled[key] = weight * (multipliers?.[key] ?? 1);
  }

  return scaled;
}

/* ------------------------------------------------------------------ *
 * Companies
 * ------------------------------------------------------------------ */

// Zorin Industries stays first: it is the fictional employer the simulation is
// already branded to, and its roster is seeded with the existing Notes app cast.
//
// Every `primary` clears WCAG AA (4.5:1) against white, so white text on a branded
// titlebar or button is readable without per-company special casing. `secondary` is
// a deeper companion shade for gradients and dark surfaces.
const COMPANIES = [
  {
    id: "zorin",
    name: "Zorin Industries",
    domain: "zorin.com",
    lookalikeDomain: "zorin-benefits.co",
    industry: "Industrial Manufacturing",
    monogram: "ZI",
    colors: { primary: "#0F6CBD", secondary: "#08304F" }
  },
  {
    id: "cascade-health",
    name: "Cascade Health Partners",
    domain: "cascadehealthpartners.org",
    lookalikeDomain: "cascadehealth-partners.org",
    industry: "Healthcare",
    monogram: "CH",
    colors: { primary: "#0B6B6A", secondary: "#06403F" }
  },
  {
    id: "meridian",
    name: "Meridian Financial Group",
    domain: "meridianfg.com",
    lookalikeDomain: "meridianfg-secure.com",
    industry: "Financial Services",
    monogram: "MF",
    colors: { primary: "#1B365D", secondary: "#0C1B30" }
  },
  {
    id: "halcyon",
    name: "Halcyon Logistics",
    domain: "halcyonlogistics.com",
    lookalikeDomain: "halcyon-logistics.net",
    industry: "Transportation and Logistics",
    monogram: "HL",
    colors: { primary: "#B34A05", secondary: "#5C2603" }
  },
  {
    id: "brightpath",
    name: "Brightpath Education Group",
    domain: "brightpathedu.org",
    lookalikeDomain: "brightpathedu-portal.com",
    industry: "Education",
    monogram: "BE",
    colors: { primary: "#5B2D90", secondary: "#2E1650" }
  },
  {
    id: "ironvale",
    name: "Ironvale Steel Works",
    domain: "ironvale.com",
    lookalikeDomain: "ironvale-hr.com",
    industry: "Metals and Mining",
    monogram: "IS",
    colors: { primary: "#C0392B", secondary: "#5A1A13" }
  },
  {
    id: "copperline",
    name: "Copperline Retail Group",
    domain: "copperlineretail.com",
    lookalikeDomain: "copperline-retail.com",
    industry: "Retail",
    monogram: "CR",
    colors: { primary: "#9E5518", secondary: "#4A2C12" }
  },
  {
    id: "vantage-energy",
    name: "Vantage Energy Solutions",
    domain: "vantageenergy.com",
    lookalikeDomain: "vantageenergy-payroll.com",
    industry: "Energy and Utilities",
    monogram: "VE",
    colors: { primary: "#2E7D32", secondary: "#14401A" }
  },
  {
    id: "larkspur",
    name: "Larkspur Media",
    domain: "larkspurmedia.com",
    lookalikeDomain: "larkspurmedia.co",
    industry: "Media and Publishing",
    monogram: "LM",
    colors: { primary: "#5C4FC7", secondary: "#2A2470" }
  },
  {
    id: "sable-crowe",
    name: "Sable & Crowe LLP",
    domain: "sablecrowe.com",
    lookalikeDomain: "sablecrowe-docs.com",
    industry: "Legal Services",
    monogram: "SC",
    colors: { primary: "#7B1E3A", secondary: "#350C19" }
  }
];

/* ------------------------------------------------------------------ *
 * Departments, tenure, security rating
 * ------------------------------------------------------------------ */

// Base headcount share per department, out of 100. Jittered per company below so
// the ten rosters do not share an identical shape.
const DEPARTMENT_WEIGHTS = {
  Sales: 14,
  "Customer Service": 13,
  Engineering: 10,
  IT: 9,
  Operations: 9,
  Marketing: 8,
  Finance: 6,
  Accounting: 6,
  HR: 5,
  Maintenance: 5,
  Purchasing: 5,
  Payroll: 4,
  Legal: 3,
  Executive: 3
};

const DEPARTMENTS = Object.keys(DEPARTMENT_WEIGHTS);

const TENURE_WEIGHTS = {
  "New Hire": 8,
  "0-2 years": 24,
  "2-5 years": 28,
  "5-10 years": 24,
  "10+ years": 16
};

// Senior-heavy departments skew long-tenured; high-churn ones skew new.
const TENURE_BY_DEPARTMENT = {
  Executive: { "New Hire": 0.2, "0-2 years": 0.4, "2-5 years": 0.8, "5-10 years": 1.6, "10+ years": 2.4 },
  Legal: { "New Hire": 0.4, "0-2 years": 0.7, "2-5 years": 1.0, "5-10 years": 1.4, "10+ years": 1.6 },
  Maintenance: { "New Hire": 0.6, "0-2 years": 0.8, "2-5 years": 1.0, "5-10 years": 1.2, "10+ years": 1.5 },
  Finance: { "New Hire": 0.7, "0-2 years": 0.9, "2-5 years": 1.0, "5-10 years": 1.2, "10+ years": 1.2 },
  Accounting: { "New Hire": 0.7, "0-2 years": 0.9, "2-5 years": 1.0, "5-10 years": 1.2, "10+ years": 1.2 },
  Payroll: { "New Hire": 0.7, "0-2 years": 0.9, "2-5 years": 1.0, "5-10 years": 1.2, "10+ years": 1.1 },
  Purchasing: { "New Hire": 0.7, "0-2 years": 0.9, "2-5 years": 1.0, "5-10 years": 1.2, "10+ years": 1.1 },
  IT: { "New Hire": 0.8, "0-2 years": 1.0, "2-5 years": 1.1, "5-10 years": 1.0, "10+ years": 0.9 },
  Engineering: { "New Hire": 0.8, "0-2 years": 1.0, "2-5 years": 1.1, "5-10 years": 1.0, "10+ years": 1.0 },
  HR: { "New Hire": 0.8, "0-2 years": 1.0, "2-5 years": 1.0, "5-10 years": 1.1, "10+ years": 1.0 },
  Marketing: { "New Hire": 1.2, "0-2 years": 1.3, "2-5 years": 1.1, "5-10 years": 0.8, "10+ years": 0.6 },
  Sales: { "New Hire": 1.3, "0-2 years": 1.4, "2-5 years": 1.1, "5-10 years": 0.8, "10+ years": 0.6 },
  "Customer Service": { "New Hire": 1.6, "0-2 years": 1.6, "2-5 years": 1.0, "5-10 years": 0.6, "10+ years": 0.4 },
  Operations: {}
};

// Ratings 1-4 only. Rating 0 is reserved for New Hires: it means "not yet rated"
// rather than "perfectly safe", per the spec's "0 (new)".
const RATING_WEIGHTS = { 1: 30, 2: 34, 3: 24, 4: 12 };

const RATING_BY_DEPARTMENT = {
  IT: { 1: 2.0, 2: 1.2, 3: 0.5, 4: 0.25 },
  Legal: { 1: 1.6, 2: 1.2, 3: 0.7, 4: 0.5 },
  Engineering: { 1: 1.3, 2: 1.1, 3: 0.9, 4: 0.7 },
  Finance: { 1: 1.2, 2: 1.1, 3: 0.9, 4: 0.8 },
  Accounting: { 1: 1.2, 2: 1.1, 3: 0.9, 4: 0.8 },
  Payroll: { 1: 1.1, 2: 1.1, 3: 1.0, 4: 0.9 },
  HR: { 1: 1.0, 2: 1.1, 3: 1.0, 4: 0.9 },
  Operations: {},
  Purchasing: { 1: 0.9, 2: 1.0, 3: 1.1, 4: 1.1 },
  Maintenance: { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.2 },
  Marketing: { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.3 },
  "Customer Service": { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.4 },
  Sales: { 1: 0.7, 2: 1.0, 3: 1.3, 4: 1.5 },
  Executive: { 1: 0.7, 2: 0.9, 3: 1.5, 4: 2.0 }
};

// Where each employee works, which seeds their initial language. Weighted heavily
// to the US per the current demo audience; the remaining 10% splits evenly.
//
// Every locale here must have a dictionary in src/localization/, otherwise the
// language picker would offer a language the app cannot actually render.
const LOCALE_WEIGHTS = {
  "en-US": 90,
  "fr-FR": 2.5,
  "de-DE": 2.5,
  "ja-JP": 2.5,
  "it-IT": 2.5
};

// Longer tenure trends safer: more accumulated training and more pattern exposure.
const RATING_BY_TENURE = {
  "0-2 years": { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.3 },
  "2-5 years": {},
  "5-10 years": { 1: 1.15, 2: 1.05, 3: 0.9, 4: 0.8 },
  "10+ years": { 1: 1.25, 2: 1.05, 3: 0.85, 4: 0.7 }
};

/* ------------------------------------------------------------------ *
 * Name pools
 * ------------------------------------------------------------------ */

const FIRST_NAMES = [
  "Aaron", "Abigail", "Adam", "Adriana", "Ahmed", "Aisha", "Alan", "Alejandro", "Alice", "Amara",
  "Amelia", "Andre", "Angela", "Anika", "Anthony", "Arjun", "Ashley", "Astrid", "Aubrey", "Ava",
  "Benjamin", "Bianca", "Blake", "Brandon", "Brianna", "Bruno", "Caleb", "Camila", "Carlos", "Caroline",
  "Catherine", "Cedric", "Chen", "Chloe", "Christopher", "Claire", "Colin", "Dalia", "Damon", "Daniel",
  "Daria", "David", "Deandre", "Deepa", "Derek", "Diana", "Dmitri", "Dominic", "Eduardo", "Elena",
  "Eli", "Elise", "Emeka", "Emily", "Eric", "Esther", "Ethan", "Eva", "Farah", "Felix",
  "Fiona", "Franklin", "Gabriel", "Gemma", "George", "Grace", "Gregory", "Hana", "Hannah", "Harold",
  "Hassan", "Heather", "Hector", "Helena", "Henry", "Ian", "Imani", "Ingrid", "Isaac", "Isabel",
  "Ivan", "Jackson", "Jacob", "Jada", "Jamal", "James", "Jasmine", "Javier", "Jennifer", "Jeremy",
  "Jessica", "Joanna", "Jonas", "Jordan", "Jorge", "Joseph", "Joshua", "Julia", "Julian", "Kaito",
  "Kara", "Katherine", "Keiko", "Kelvin", "Kenji", "Kevin", "Khalid", "Kiara", "Klaus", "Laila",
  "Lars", "Laura", "Leah", "Leo", "Lila", "Lin", "Lorenzo", "Lucas", "Lucia", "Luke",
  "Madeline", "Malik", "Marcus", "Maria", "Mark", "Martin", "Mateo", "Matt", "Maya", "Meera",
  "Melanie", "Micah", "Michael", "Mika", "Miriam", "Mohamed", "Monica", "Nadia", "Nathan", "Nia",
  "Nicholas", "Nina", "Noah", "Nora", "Olga", "Oliver", "Omar", "Oscar", "Paul", "Penelope",
  "Peter", "Priya", "Quentin", "Rachel", "Rafael", "Rahul", "Ravi", "Rebecca", "Reza", "Ricardo",
  "Rita", "Robert", "Rosa", "Ruth", "Ryan", "Sabine", "Samuel", "Sandra", "Sanjay", "Sarah",
  "Sean", "Selena", "Sergei", "Simone", "Sofia", "Solomon", "Stephanie", "Susan", "Sven", "Tamara",
  "Tariq", "Tessa", "Theodore", "Thomas", "Tobias", "Trevor", "Valeria", "Vanessa", "Victor", "Vikram",
  "Vincent", "Wei", "Wendy", "William", "Xiomara", "Yara", "Yosef", "Yuki", "Zachary", "Zoe"
];

const LAST_NAMES = [
  "Abbott", "Adeyemi", "Aguilar", "Ahmadi", "Albright", "Almeida", "Andersen", "Anand", "Archer", "Ashford",
  "Bailey", "Baptiste", "Barnes", "Bauer", "Beaumont", "Bennett", "Bergstrom", "Bhatt", "Bitgade", "Blackwell",
  "Bonner", "Bradshaw", "Brennan", "Bullfree", "Burke", "Cabrera", "Calloway", "Cardenas", "Carrington", "Castellano",
  "Chandra", "Chapman", "Chaudhry", "Cheng", "Chowdhury", "Clarke", "Colton", "Conway", "Cortez", "Crawford",
  "Cunningham", "Dalton", "Darrow", "Delacroix", "Delgado", "Dempsey", "Devries", "Diallo", "Donovan", "Draper",
  "Duarte", "Dunlap", "Eastwood", "Eberhardt", "Ellison", "Emerson", "Escobar", "Fairchild", "Faulkner", "Ferreira",
  "Fitzgerald", "Fleming", "Fontaine", "Forsythe", "Freeman", "Gallagher", "Garrison", "Gentry", "Ghosh", "Gibbons",
  "Goldberg", "Granger", "Greaves", "Gustafson", "Hadley", "Haldane", "Halvorsen", "Hammond", "Harrington", "Hartley",
  "Hasegawa", "Hawthorne", "Hendricks", "Herrera", "Hirsch", "Holloway", "Hoffmann", "Ibarra", "Ingram", "Iqbal",
  "Ishikawa", "Jamison", "Jaworski", "Jennings", "Kaminski", "Kapoor", "Keating", "Kendrick", "Khatri", "Kingsley",
  "Kirby", "Kobayashi", "Kowalczyk", "Laurent", "Lawson", "Ledger", "Lindqvist", "Lockhart", "Lombardi", "Loveless",
  "Lux", "Mackenzie", "Maldonado", "Mansour", "Marchetti", "Mathison", "Mbeki", "Mcallister", "Mcgrath", "Mehta",
  "Mendoza", "Merrick", "Mikkelsen", "Montgomery", "Moreau", "Mortensen", "Nakamura", "Navarro", "Nguyen", "Nikolaev",
  "Norrington", "Nyberg", "Oakley", "Obasi", "Odell", "Okafor", "Oliveira", "Orozco", "Osborne", "Padilla",
  "Pahlavi", "Palmer", "Pankhurst", "Parrish", "Patel", "Pemberton", "Perrault", "Petrov", "Pierce", "Prescott",
  "Quintero", "Radcliffe", "Ramirez", "Rasmussen", "Ravensdale", "Red", "Redmond", "Reyes", "Rhodes", "Ridgeway",
  "Rivera", "Rosenthal", "Rutherford", "Salazar", "Sanderson", "Santos", "Sawyer", "Schneider", "Sheikh", "Sinclair",
  "Solberg", "Sorensen", "Stanton", "Sterling", "Stroud", "Sullivan", "Suzuki", "Tanaka", "Tavares", "Thornbury",
  "Torres", "Touroline", "Trenholm", "Underwood", "Vaccaro", "Valdez", "Vance", "Vasquez", "Villanueva", "Wagner",
  "Wainwright", "Walsh", "Whitaker", "Whitmore", "Winslow", "Woodman", "Wyatt", "Yamada", "Yoon", "Zielinski"
];

/* ------------------------------------------------------------------ *
 * Zorin's known cast
 * ------------------------------------------------------------------ */

// Mark is the colleague in the pre-recorded briefing video, so he has to exist at
// whichever company the learner picks - with that company's own email domain.
// Pinned first at all ten companies.
const NARRATOR = {
  firstName: "Mark",
  lastName: "Bitgade",
  department: "Operations",
  tenure: "10+ years",
  securityRating: 2,
  locale: "en-US"
};

// The rest of the cast already named in the simulation's Notes app. Pinning them
// into the Zorin roster keeps the played scenario and the roster data consistent.
const ZORIN_KNOWN_CAST = [
  { firstName: "Luke", lastName: "Bullfree", department: "Executive", tenure: "10+ years", securityRating: 3, locale: "en-US" },
  { firstName: "John", lastName: "Red", department: "Executive", tenure: "10+ years", securityRating: 2, locale: "en-US" },
  { firstName: "Susan", lastName: "Touroline", department: "HR", tenure: "5-10 years", securityRating: 1, locale: "en-US" },
  { firstName: "Matt", lastName: "Woodman", department: "Purchasing", tenure: "5-10 years", securityRating: 2, locale: "en-US" },
  { firstName: "Paul", lastName: "Sheikh", department: "Marketing", tenure: "2-5 years", securityRating: 3, locale: "en-US" },
  { firstName: "Ruth", lastName: "Lux", department: "Sales", tenure: "2-5 years", securityRating: 3, locale: "en-US" }
];

// Which employee fills each narrative role. Resolved here, in data, so the app
// looks up ids instead of re-deriving a cast with runtime heuristics.
//
// Every role picks the earliest matching employee, which for Zorin lands exactly on
// the hand-pinned cast above.
const SCENARIO_ROLES = {
  narrator: { department: "Operations", offset: 0 },
  ceo: { department: "Executive", offset: 0 },
  cto: { department: "Executive", offset: 1 },
  hrBenefits: { department: "HR", offset: 0 },
  supervisor: { department: "Purchasing", offset: 0 },
  marketingVp: { department: "Marketing", offset: 0 },
  salesManager: { department: "Sales", offset: 0 },
  accounting: { department: "Accounting", offset: 0 }
};

function resolveScenarioRoles(employees) {
  const roles = {};

  for (const [role, { department, offset }] of Object.entries(SCENARIO_ROLES)) {
    const candidates = employees.filter((employee) => employee.department === department);
    const chosen = candidates[offset] ?? candidates[0] ?? employees[0];

    roles[role] = chosen.id;
  }

  return roles;
}

// "Zorin Industries" -> "Zorin". The rogue network drops the hyphen; that single
// character is the tell the Notes app tells the learner to look for.
function buildWifiNames(companyName) {
  const brandToken = companyName.split(/\s+/)[0].replace(/[^A-Za-z0-9]/g, "");

  return {
    trustedSsid: `${brandToken}-Secure`,
    rogueSsid: `${brandToken} Secure`
  };
}

/* ------------------------------------------------------------------ *
 * Generation
 * ------------------------------------------------------------------ */

// Jitter the base department shares, then hand out exactly EMPLOYEES_PER_COMPANY
// seats using largest-remainder so every department keeps at least one person.
function buildDepartmentPlan(rng) {
  const jittered = DEPARTMENTS.map((department) => ({
    department,
    weight: DEPARTMENT_WEIGHTS[department] * (0.7 + rng() * 0.6)
  }));

  const totalWeight = jittered.reduce((sum, entry) => sum + entry.weight, 0);
  const seatsToShare = EMPLOYEES_PER_COMPANY - DEPARTMENTS.length;

  const allocations = jittered.map((entry) => {
    const exact = (entry.weight / totalWeight) * seatsToShare;

    return {
      department: entry.department,
      count: 1 + Math.floor(exact),
      remainder: exact - Math.floor(exact)
    };
  });

  let assigned = allocations.reduce((sum, entry) => sum + entry.count, 0);

  const byRemainder = [...allocations].sort((a, b) => b.remainder - a.remainder);
  let cursor = 0;

  while (assigned < EMPLOYEES_PER_COMPANY) {
    byRemainder[cursor % byRemainder.length].count += 1;
    cursor += 1;
    assigned += 1;
  }

  return allocations.flatMap((entry) => Array.from({ length: entry.count }, () => entry.department));
}

function slugifyNamePart(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * At 2.5% each, a 100-person company will sometimes draw zero employees for a
 * locale - which means that company cannot demonstrate that language at all.
 *
 * Guarantee one of each by converting en-US employees from the end of the roster
 * backwards. Costs at most four US seats per company and leaves the pinned cast,
 * who are all en-US by design, untouched.
 */
function ensureEveryLocaleRepresented(employees, pinnedCount) {
  const nonDefaultLocales = Object.keys(LOCALE_WEIGHTS).filter((locale) => locale !== "en-US");

  for (const locale of nonDefaultLocales) {
    if (employees.some((employee) => employee.locale === locale)) {
      continue;
    }

    for (let index = employees.length - 1; index >= pinnedCount; index -= 1) {
      if (employees[index].locale === "en-US") {
        employees[index].locale = locale;
        break;
      }
    }
  }
}

function buildCompanyRoster(company) {
  const rng = mulberry32(hashSeed(company.id));
  const localeRng = mulberry32(hashSeed(`${company.id}:locale`));
  const departmentPlan = buildDepartmentPlan(rng);

  const usedNames = new Set();
  const usedEmails = new Set();
  const employees = [];

  const knownCast = [NARRATOR, ...(company.id === "zorin" ? ZORIN_KNOWN_CAST : [])];

  function addEmployee({ firstName, lastName, department, tenure, securityRating, locale }) {
    const localPart = `${slugifyNamePart(firstName)}.${slugifyNamePart(lastName)}`;

    let email = `${localPart}@${company.domain}`;
    let suffix = 1;

    while (usedEmails.has(email)) {
      suffix += 1;
      email = `${localPart}${suffix}@${company.domain}`;
    }

    usedEmails.add(email);
    usedNames.add(`${firstName} ${lastName}`);

    employees.push({
      id: `${company.id}-${String(employees.length + 1).padStart(3, "0")}`,
      companyId: company.id,
      firstName,
      lastName,
      email,
      department,
      tenure,
      securityRating,
      locale: locale ?? pickWeighted(localeRng, LOCALE_WEIGHTS)
    });
  }

  for (const castMember of knownCast) {
    addEmployee(castMember);
  }

  // The pinned cast already consumed seats; drop one planned seat per cast member
  // from their own department so the company still totals exactly 100.
  const remainingPlan = [...departmentPlan];

  for (const castMember of knownCast) {
    const index = remainingPlan.indexOf(castMember.department);
    remainingPlan.splice(index === -1 ? 0 : index, 1);
  }

  for (const department of remainingPlan) {
    let firstName;
    let lastName;
    let attempts = 0;

    do {
      firstName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
      lastName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
      attempts += 1;
    } while (usedNames.has(`${firstName} ${lastName}`) && attempts < 50);

    const tenure = pickWeighted(
      rng,
      scaleWeights(TENURE_WEIGHTS, TENURE_BY_DEPARTMENT[department])
    );

    const securityRating =
      tenure === "New Hire"
        ? 0
        : Number(
            pickWeighted(
              rng,
              scaleWeights(
                scaleWeights(RATING_WEIGHTS, RATING_BY_DEPARTMENT[department]),
                RATING_BY_TENURE[tenure]
              )
            )
          );

    addEmployee({ firstName, lastName, department, tenure, securityRating });
  }

  ensureEveryLocaleRepresented(employees, knownCast.length);

  return {
    id: company.id,
    name: company.name,
    url: `https://www.${company.domain}`,
    domain: company.domain,
    lookalikeDomain: company.lookalikeDomain,
    industry: company.industry,
    logo: `${LOGO_WEB_PATH}/${company.id}.svg`,
    wallpaper: `${WALLPAPER_WEB_PATH}/${company.id}.svg`,
    colors: company.colors,
    wifi: buildWifiNames(company.name),
    scenarioRoles: resolveScenarioRoles(employees),
    employees
  };
}

/* ------------------------------------------------------------------ *
 * Placeholder logos
 * ------------------------------------------------------------------ */

// Served from public/, so the web paths are root-relative and need no bundler import.
const LOGO_WEB_PATH = "/assets/logos";
const WALLPAPER_WEB_PATH = "/assets/wallpapers";

/**
 * SVG is XML, so it is parsed strictly - a bare "&" in "Sable & Crowe LLP" is a
 * fatal error that stops the whole image from rendering. Escape anything
 * interpolated into generated SVG markup.
 */
function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Blends a hex color toward white by `amount` (0-1). */
function lighten(hex, amount) {
  const value = parseInt(hex.slice(1), 16);

  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) =>
    Math.round(channel + (255 - channel) * amount)
  );

  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** Blends a hex color toward black by `amount` (0-1). */
function darken(hex, amount) {
  const value = parseInt(hex.slice(1), 16);

  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) =>
    Math.round(channel * (1 - amount))
  );

  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

// Deliberately plain: a monogram tile in the company's own colors. These exist so
// the demo has a working local asset at every logo path. Replacing a file in place
// with real artwork requires no data or code change.
function buildLogoSvg(company) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="${escapeXml(company.name)} logo">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${company.colors.primary}"/>
      <stop offset="1" stop-color="${company.colors.secondary}"/>
    </linearGradient>
  </defs>
  <rect width="240" height="240" rx="36" fill="url(#brand)"/>
  <text
    x="120"
    y="120"
    fill="#ffffff"
    font-family="Segoe UI, Arial, sans-serif"
    font-size="104"
    font-weight="700"
    letter-spacing="2"
    text-anchor="middle"
    dominant-baseline="central"
  >${escapeXml(company.monogram)}</text>
</svg>
`;
}

/**
 * Desktop wallpaper, derived entirely from the company's two brand colors: a dark
 * base wash, two soft brand glows, layered silk bands, and a faint monogram.
 *
 * SVG rather than a bitmap so it stays a couple of KB and scales to any display.
 * `index` rotates the band geometry so the ten wallpapers are not identical.
 *
 * Deliberately dark - white desktop icon labels sit on top of it.
 */
function buildWallpaperSvg(company, index) {
  const { primary, secondary } = company.colors;
  const bandAngle = -18 + ((index * 7) % 26);
  const glowX = (0.3 + ((index % 3) * 0.14)).toFixed(2);

  const hairlines = Array.from({ length: 16 }, (_, line) => {
    const x = -400 + line * 190;
    return `<line x1="${x}" y1="1180" x2="${x + 620}" y2="-100"/>`;
  }).join("\n      ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="0.85" y2="1">
      <stop offset="0" stop-color="${darken(secondary, 0.18)}"/>
      <stop offset="0.52" stop-color="${darken(secondary, 0.62)}"/>
      <stop offset="1" stop-color="#05070d"/>
    </linearGradient>

    <radialGradient id="glow" cx="${glowX}" cy="0.26" r="0.66">
      <stop offset="0" stop-color="${primary}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="glowFar" cx="0.84" cy="0.88" r="0.52">
      <stop offset="0" stop-color="${lighten(primary, 0.5)}" stop-opacity="0.15"/>
      <stop offset="1" stop-color="${lighten(primary, 0.5)}" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0.4">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="0.48" stop-color="${lighten(primary, 0.25)}" stop-opacity="0.26"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <rect width="1920" height="1080" fill="url(#base)"/>
  <rect width="1920" height="1080" fill="url(#glow)"/>
  <rect width="1920" height="1080" fill="url(#glowFar)"/>

  <g stroke="#ffffff" stroke-opacity="0.035" stroke-width="1" fill="none">
      ${hairlines}
  </g>

  <g transform="rotate(${bandAngle} 960 540)" fill="url(#band)">
    <path d="M-300 742 C 420 566, 1020 858, 2220 470 L 2220 1320 L -300 1320 Z" opacity="0.55"/>
    <path d="M-300 906 C 520 742, 1140 986, 2220 654 L 2220 1320 L -300 1320 Z" opacity="0.4"/>
    <path d="M-300 1046 C 600 918, 1260 1122, 2220 838 L 2220 1320 L -300 1320 Z" opacity="0.28"/>
  </g>

  <!--
    Kept well inside the frame: background-size:cover crops the edges by up to
    ~100px per side at common aspect ratios, which clipped a right-anchored mark.
  -->
  <text
    x="1520"
    y="890"
    fill="#ffffff"
    fill-opacity="0.05"
    font-family="Segoe UI, Arial, sans-serif"
    font-size="300"
    font-weight="700"
    letter-spacing="10"
    text-anchor="end"
  >${escapeXml(company.monogram)}</text>
</svg>
`;
}

/* ------------------------------------------------------------------ *
 * Output
 * ------------------------------------------------------------------ */

function toCsv(organizations) {
  const header = [
    "Company Name",
    "Company URL",
    "Company Logo",
    "Company Color 1",
    "Company Color 2",
    "First Name",
    "Last Name",
    "Dept",
    "Years with Company",
    "Security Rating",
    "Locale",
    "Email",
    "Employee ID"
  ];

  const rows = organizations.flatMap((company) =>
    company.employees.map((employee) =>
      [
        company.name,
        company.url,
        company.logo,
        company.colors.primary,
        company.colors.secondary,
        employee.firstName,
        employee.lastName,
        employee.department,
        employee.tenure,
        employee.securityRating,
        employee.locale,
        employee.email,
        employee.id
      ]
        .map((cell) => {
          const text = String(cell);
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(",")
    )
  );

  return [header.join(","), ...rows].join("\n") + "\n";
}

function writeOutput(relativePath, contents) {
  const target = resolve(projectRoot, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, "utf8");
  return target;
}

/**
 * A malformed SVG fails silently - the browser just renders nothing, and the app
 * still "works". Fail the build here instead, so an unescaped company name can
 * never ship as a blank logo again.
 */
function assertValidSvg(markup, label) {
  const strayAmpersand = /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.exec(markup);

  if (strayAmpersand) {
    const context = markup.slice(Math.max(0, strayAmpersand.index - 40), strayAmpersand.index + 40);
    throw new Error(
      `${label}: unescaped "&" at index ${strayAmpersand.index} - SVG is XML and will not parse.\n  ...${context}...`
    );
  }

  if (!markup.trimStart().startsWith("<svg") || !markup.trimEnd().endsWith("</svg>")) {
    throw new Error(`${label}: does not open and close with an <svg> element.`);
  }
}

function writeSvg(relativePath, markup) {
  assertValidSvg(markup, relativePath);
  return writeOutput(relativePath, markup);
}

const organizations = COMPANIES.map(buildCompanyRoster);

writeOutput("src/data/orgs.json", `${JSON.stringify(organizations, null, 2)}\n`);
writeOutput("docs/roster.csv", toCsv(organizations));

COMPANIES.forEach((company, index) => {
  writeSvg(`public${LOGO_WEB_PATH}/${company.id}.svg`, buildLogoSvg(company));
  writeSvg(`public${WALLPAPER_WEB_PATH}/${company.id}.svg`, buildWallpaperSvg(company, index));
});

/* ------------------------------------------------------------------ *
 * Summary
 * ------------------------------------------------------------------ */

const totalEmployees = organizations.reduce((sum, company) => sum + company.employees.length, 0);

console.log(`Generated ${organizations.length} companies, ${totalEmployees} employees.\n`);

for (const company of organizations) {
  const ratings = company.employees.reduce((counts, employee) => {
    counts[employee.securityRating] = (counts[employee.securityRating] ?? 0) + 1;
    return counts;
  }, {});

  const ratingSummary = [0, 1, 2, 3, 4]
    .map((rating) => `${rating}:${String(ratings[rating] ?? 0).padStart(2, " ")}`)
    .join("  ");

  console.log(
    `${company.name.padEnd(26)} ${String(company.employees.length).padStart(3)} employees   ` +
      `ratings ${ratingSummary}`
  );
}
