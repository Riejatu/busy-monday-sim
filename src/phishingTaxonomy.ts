// How the simulation classifies phishing.
//
// These are the categories the security team uses when triaging what they actually see,
// so the simulation uses the same words rather than inventing its own. Three of them
// describe how real reported mail gets filed today; T.O.A.D. and Reply-to are the two
// being added because they are what the team wants learners exposed to next.
//
// Each category is a thing an operator can switch off for a campaign, and a thing a
// piece of simulated content declares itself to be. Content declares; configuration
// gates; the engine enforces. Nothing here knows how a category is staged on screen -
// that is the content's job, and is deliberately still open.
//
// One structural note worth keeping in view: the first four categories describe the
// PAYLOAD (a link, a form, a file, a phone number), while Reply-to describes the
// PACING - trust built over an exchange before any payload lands. A reply-to attack
// therefore ends in one of the other four. The team files such mail as Reply-to because
// that is the behaviour worth naming, so the simulation classifies each piece of content
// with exactly one category and treats Reply-to as the outer one. If a future campaign
// needs to report "reply-to carrying a data-entry payload", this is the decision to
// revisit; see the notes in docs/.

export const PHISHING_CLASSIFICATION_IDS = [
  "driveBy",
  "dataEntry",
  "attachment",
  "toad",
  "replyTo"
] as const;

export type PhishingClassificationId = (typeof PHISHING_CLASSIFICATION_IDS)[number];

export interface PhishingClassification {
  id: PhishingClassificationId;
  /** Operator-facing label, written the way the security team writes it. */
  label: string;
  /** The industry name, where the label above is a house term. */
  alsoKnownAs?: string;
  /** What puts a piece of mail in this category. */
  summary: string;
  /**
   * The distinct forms the category takes. Listed rather than folded into the summary
   * because each one is a separate thing to build and to assess in the simulation.
   */
  vectors: string[];
  /** What the attacker gets if it works. */
  objective: string;
}

export const PHISHING_CLASSIFICATIONS: PhishingClassification[] = [
  {
    id: "driveBy",
    label: "Drive by",
    summary:
      "A malicious link where the click itself is the attack - the learner is not asked " +
      "to type anything or open anything, so there is no second step to think twice about.",
    vectors: [
      "Text link in the body",
      "Image or button standing in for the link",
      "QR code, moving the click onto a phone the org may not manage"
    ],
    objective: "Load hostile content in the browser on the strength of one click."
  },
  {
    id: "dataEntry",
    label: "Data Entry",
    alsoKnownAs: "Credential harvesting",
    summary:
      "A link to a page that asks the learner to do something once they arrive: sign in, " +
      "fill in a form, or download a file. The landing page is where the theft happens, " +
      "which is why the link alone can look unremarkable.",
    vectors: [
      "Counterfeit sign-in page on a lookalike domain",
      "Form asking for details a real system would already hold",
      "Download served from the landing page"
    ],
    objective: "Credentials typed in by hand, or a payload the learner fetched themselves."
  },
  {
    id: "attachment",
    label: "Attachment",
    summary:
      "A malicious file travelling with the message. The lure is whatever makes opening " +
      "the file feel like the obvious next step.",
    vectors: [
      "Office document that wants macros enabled",
      "Archive hiding the real extension inside",
      "PDF acting as a wrapper for a link or a file",
      "Script or installer dressed as a document"
    ],
    objective: "Get something running on the endpoint."
  },
  {
    id: "toad",
    label: "T.O.A.D.",
    alsoKnownAs: "Telephone-Oriented Attack Delivery, or callback phishing",
    summary:
      "No link and no attachment - a phone number. The mail exists only to get the " +
      "learner to call, and everything harmful happens on the call, out of reach of " +
      "anything that scans mail.",
    vectors: [
      "Invoice, renewal or subscription notice with a support number to dispute it",
      "Fraud alert inviting the learner to call and confirm they did not authorize it",
      "Missed-voicemail or delivery notice with a callback number"
    ],
    objective:
      "Credentials, remote access, or a payment - handed over by voice to someone the " +
      "learner called themselves."
  },
  {
    id: "replyTo",
    label: "Reply-to",
    summary:
      "Opens or joins a correspondence and lets it run before asking for anything. By " +
      "the time the payload arrives there is a thread behind it, so it reads as the " +
      "continuation of something the learner already agreed to.",
    vectors: [
      "Harmless opening message whose only purpose is to get a reply",
      "Hijack of a real thread, so the history above is genuine",
      "The ask arriving only once rapport exists, carrying any of the payloads above"
    ],
    objective: "Deliver something that would have been refused if it had arrived cold."
  }
];

const BY_ID = new Map<PhishingClassificationId, PhishingClassification>(
  PHISHING_CLASSIFICATIONS.map((entry) => [entry.id, entry])
);

export function getPhishingClassification(
  id: PhishingClassificationId
): PhishingClassification {
  // The id type is a closed union, so a miss means the table and the union drifted apart.
  const found = BY_ID.get(id);

  if (!found) {
    throw new Error(`Unknown phishing classification "${id}".`);
  }

  return found;
}

/** Label for operator surfaces, e.g. "Data Entry". */
export function phishingLabel(id: PhishingClassificationId): string {
  return getPhishingClassification(id).label;
}

/**
 * Every classification on, which is the factory position: a campaign starts covering
 * everything the team sees, and an operator narrows it deliberately.
 */
export function getDefaultPhishingToggles(): Record<string, boolean> {
  return Object.fromEntries(PHISHING_CLASSIFICATION_IDS.map((id) => [id, true]));
}

/**
 * Whether a coverage map covers this classification. Absent means covered, so a category
 * added to the taxonomy later is live everywhere immediately rather than silently off for
 * every operator who saved their settings before it existed.
 *
 * Lives here rather than in the config module so that anything needing the rule can have it
 * without importing the whole settings cascade - which would make the import graph circular.
 */
export function isPhishingCovered(
  coverage: Record<string, boolean> | undefined,
  id: PhishingClassificationId
): boolean {
  return coverage?.[id] ?? true;
}

export function isPhishingClassificationId(value: string): value is PhishingClassificationId {
  return (PHISHING_CLASSIFICATION_IDS as readonly string[]).includes(value);
}
