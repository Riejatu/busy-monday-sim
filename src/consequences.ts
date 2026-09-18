// Feedback for a wrong decision: what the simulation says when the learner gets something
// wrong, and how it says it.
//
// A generic process, not a per-event one. It keys off a choice's own `risk`, so any prompt
// in any event draws feedback for a wrong answer without the event knowing this exists.
//
// Three rules worth keeping in view:
//
//   * ONE setting, three options. "None", "Page Rip" and "MM Style" are values of the same
//     operator control, so a day never mixes two visual languages for the same idea, and
//     turning feedback off is the same decision as choosing between the styles.
//   * ONE message for every wrong decision. Centralized deliberately: whatever the learner
//     got wrong, the words are the same, so the text is a single entry in the dictionaries
//     rather than a growing table keyed by incident.
//   * Time stops until the learner dismisses it. Not a toast that scrolls past - a full
//     stop, because the point is that a bad decision interrupts the day.
//
// "None" means no text at time of decision. It does NOT mean nothing happens: an individual
// threat can still play out its own consequences in the simulation - a call that connects, a
// coaching notification - it just does not put a message on screen.

import { t } from "./localization/i18n";

/**
 * What an operator can choose between. Operator-facing text is English here, the way event
 * names are: these appear only on /backend and /admin.
 */
export const CONSEQUENCE_STYLES = [
  {
    id: "none",
    label: "None",
    description:
      "No feedback at the moment of decision. An individual threat can still play out its " +
      "own consequences in the simulation, but no message is put on screen and the day is " +
      "not stopped."
  },
  {
    id: "pageRip",
    label: "Page Rip",
    description:
      "A white tear opens from the top centre of the screen and runs to the bottom, " +
      "widening to about 39% of the page with the top wider than the foot. The inside is " +
      "black with nothing drawn across the top or bottom, and the message is written in it."
  },
  {
    id: "mmStyle",
    label: "MM Style",
    description:
      "A black bar with white top and bottom borders sweeps in from the left and spans the " +
      "full width of the window, half the page height and centred vertically. The message " +
      "reads the same as Page Rip's."
  }
] as const;

export type ConsequenceStyleId = (typeof CONSEQUENCE_STYLES)[number]["id"];

/** The styles that actually draw something. Everything except "none". */
export type VisibleConsequenceStyleId = Exclude<ConsequenceStyleId, "none">;

export const CONSEQUENCE_STYLE_IDS = CONSEQUENCE_STYLES.map((style) => style.id);

export function isConsequenceStyleId(value: string): value is ConsequenceStyleId {
  return (CONSEQUENCE_STYLE_IDS as readonly string[]).includes(value);
}

export function isVisibleConsequenceStyle(
  style: ConsequenceStyleId
): style is VisibleConsequenceStyleId {
  return style !== "none";
}

/** Real seconds the learner gets to read before the way out appears. */
const DISMISS_DELAY_SECONDS = 2.6;

/** Matches the CSS fade so the element is gone only once it is invisible. */
const FADE_OUT_MS = 460;

export interface WrongDecisionMessage {
  title: string;
  lines: string[];
}

/**
 * The one message shown for every wrong decision, whatever it was.
 *
 * Centralized on purpose. An earlier draft keyed the wording off `promptId:choiceId` with a
 * generic fallback; the decision since is that all wrong answers read the same, so there is
 * one entry to write and one to translate. If per-incident wording is ever wanted again,
 * this function is the only place that has to change.
 */
export function getWrongDecisionMessage(): WrongDecisionMessage {
  return {
    title: t("consequences.message.title"),
    lines: [t("consequences.message.body"), t("consequences.message.detail")]
  };
}

let openConsequence: HTMLElement | null = null;

export function isConsequenceOpen(): boolean {
  return openConsequence !== null;
}

/**
 * Shows the feedback and resolves once the learner dismisses it.
 *
 * Awaited by the caller, which is what makes "time stops until they continue" true: the
 * choice that caused it does not resolve, and the clock stays paused, until this settles.
 *
 * Takes a visible style only - "none" is the caller's decision not to call this at all,
 * which the type makes impossible to get wrong.
 */
export function showConsequence(
  style: VisibleConsequenceStyleId,
  incidentId: string
): Promise<void> {
  dismissConsequence();

  return new Promise<void>((resolve) => {
    const overlay = document.createElement("div");

    overlay.className = `consequence consequence-${style}`;
    // Not used for the wording, which is centralized - kept so the element on screen can be
    // traced back to the decision that caused it.
    overlay.dataset.incident = incidentId;
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "consequence-title");
    overlay.innerHTML = buildMarkup(style, getWrongDecisionMessage());

    document.body.appendChild(overlay);
    openConsequence = overlay;

    let settled = false;

    function finish(): void {
      if (settled) {
        return;
      }

      settled = true;
      overlay.classList.add("is-leaving");
      document.removeEventListener("keydown", onKeyDown, true);

      // Removed only once it has actually faded, so the day does not resume behind a
      // still-visible overlay.
      window.setTimeout(() => {
        overlay.remove();

        if (openConsequence === overlay) {
          openConsequence = null;
        }

        resolve();
      }, FADE_OUT_MS);
    }

    function onKeyDown(event: KeyboardEvent): void {
      // Only once the way out is offered. Escape as well as the button: this is not a
      // decision with a right answer, so a keyboard user should not be forced to the mouse.
      if (event.key === "Escape" && overlay.classList.contains("can-dismiss")) {
        event.preventDefault();
        event.stopPropagation();
        finish();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);

    const dismiss = overlay.querySelector<HTMLButtonElement>(".consequence-dismiss")!;

    dismiss.addEventListener("click", finish);

    // "After a few seconds": the reveal is deliberate, so the learner reads the reason
    // before the way out is available.
    window.setTimeout(() => {
      overlay.classList.add("can-dismiss");
      dismiss.focus();
    }, DISMISS_DELAY_SECONDS * 1000);
  });
}

/** Tears down whatever is on screen without waiting for the fade. */
export function dismissConsequence(): void {
  openConsequence?.remove();
  openConsequence = null;
}

/* ------------------------------------------------------------------ *
 * Markup
 * ------------------------------------------------------------------ */

/**
 * Every style is a surface plus the same message on top of it.
 *
 * The message is a SIBLING of the animated surface, never a child: both styles animate with
 * a one-axis scale, and a parent being scaled that way squashes whatever it contains.
 */
function buildMarkup(style: VisibleConsequenceStyleId, message: WrongDecisionMessage): string {
  return `
    ${buildSurface(style)}

    <div class="consequence-panel">
      <!--
        The message is its own block so the dismiss control can be positioned against it.
        Anchored to the panel instead, it floated hundreds of pixels above the words.
      -->
      <div class="consequence-message">
        <button
          type="button"
          class="consequence-dismiss"
          aria-label="${escapeHtml(t("consequences.dismiss"))}"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="10.6" />
            <path d="M8.4 8.4 15.6 15.6 M15.6 8.4 8.4 15.6" />
          </svg>
        </button>

        <h2 id="consequence-title">${escapeHtml(message.title)}</h2>
        ${message.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
      </div>
    </div>
  `;
}

function buildSurface(style: VisibleConsequenceStyleId): string {
  if (style === "mmStyle") {
    // A plain block: the borders and the sweep are entirely CSS, so there is nothing to
    // build here the way the torn edge has to be.
    return `<div class="consequence-surface" aria-hidden="true"></div>`;
  }

  const rip = buildRipGeometry();

  return `
    <div class="consequence-surface" aria-hidden="true">
      <svg class="rip-edge" viewBox="0 0 100 1000" preserveAspectRatio="none">
        <path class="rip-fill" d="${rip.fill}" />
        <path class="rip-side" d="${rip.left}" vector-effect="non-scaling-stroke" />
        <path class="rip-side" d="${rip.right}" vector-effect="non-scaling-stroke" />
      </svg>
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * Page Rip
 * ------------------------------------------------------------------ */

/**
 * The tear, as three paths in a 100x1000 viewBox stretched to the element.
 *
 * Three rather than one because the white edge belongs on the SIDES ONLY. A single closed
 * path with a stroke draws that stroke all the way round, which put a white line across the
 * top and the bottom of the screen; the fill is therefore closed and unstroked, and the two
 * torn edges are open polylines that never join across the ends.
 *
 * Built rather than written out so the shape is legible and tunable: the taper and the
 * raggedness are parameters, not a wall of coordinates. The offsets are a fixed cycle
 * rather than random, so the tear looks the same every time - a screenshot or a bug report
 * has to still describe the thing being looked at.
 */
function buildRipGeometry(): { fill: string; left: string; right: string } {
  const HEIGHT = 1000;
  const CENTRE = 50;
  /** Half-widths: the top is wider than the foot, as specified. */
  const TOP_HALF = 47;
  const BOTTOM_HALF = 33;
  const JAGS = [0, 4.5, -3, 6, -4.5, 2.5, -2, 5, -3.5, 3, -5, 1.5, -2.5, 4, 0];

  const halfAt = (index: number): number => {
    const progress = index / (JAGS.length - 1);
    return TOP_HALF + (BOTTOM_HALF - TOP_HALF) * progress;
  };
  const yAt = (index: number): number => (index / (JAGS.length - 1)) * HEIGHT;

  const left: string[] = [];
  const right: string[] = [];

  JAGS.forEach((jag, index) => {
    const half = halfAt(index);
    // Mirrored jaggedness would read as a zip; opposing it reads as a tear.
    left.push(`${(CENTRE - half + jag).toFixed(1)},${yAt(index).toFixed(0)}`);
    right.push(`${(CENTRE + half - jag * 0.8).toFixed(1)},${yAt(index).toFixed(0)}`);
  });

  return {
    // Closed, so the black reaches the top and bottom edges of the screen with nothing
    // drawn across them.
    fill: `M ${left.join(" L ")} L ${[...right].reverse().join(" L ")} Z`,
    // Open: no Z, so neither end is capped.
    left: `M ${left.join(" L ")}`,
    right: `M ${right.join(" L ")}`
  };
}

/** Local copy: this module must not depend on the screen-rendering module. */
function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
