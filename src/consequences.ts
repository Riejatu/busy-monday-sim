// Negative consequences: what the simulation does when the learner gets something wrong.
//
// A generic process, not a per-event one. Any risky answer can drive it, and the styles are
// interchangeable - "Page Rip" is the first, and adding another means one entry in
// CONSEQUENCE_STYLES plus its markup and CSS.
//
// Three rules from the brief, worth keeping in view:
//
//   * ONE style per simulation. Operators pick from a list rather than switching several
//     on, so a day never mixes two visual languages for the same idea.
//   * Time stops until the learner dismisses it. Not a toast that scrolls past - a full
//     stop, because the point is that a bad decision interrupts the day.
//   * The words vary by incident. The style is the container; the text is content, keyed by
//     incident with a generic fallback for anything not yet written.

import { hasMessage, t } from "./localization/i18n";

/**
 * The styles an operator can choose between. Operator-facing text is English here, the way
 * event names are: these appear only on /backend and /admin.
 */
export const CONSEQUENCE_STYLES = [
  {
    id: "pageRip",
    label: "Page Rip",
    description:
      "A white tear opens from the top centre of the screen and runs to the bottom, " +
      "widening to about a third of the page with the top wider than the foot. The inside " +
      "is black, and the consequence is written in it. A dismiss control fades in a few " +
      "seconds later; until it is used, the day is stopped."
  }
] as const;

export type ConsequenceStyleId = (typeof CONSEQUENCE_STYLES)[number]["id"];

export const CONSEQUENCE_STYLE_IDS = CONSEQUENCE_STYLES.map((style) => style.id);

export function isConsequenceStyleId(value: string): value is ConsequenceStyleId {
  return (CONSEQUENCE_STYLE_IDS as readonly string[]).includes(value);
}

/** Real seconds the learner gets to read before the way out appears. */
const DISMISS_DELAY_SECONDS = 2.6;

/** Matches the CSS fade so the element is gone only once it is invisible. */
const FADE_OUT_MS = 460;

export interface ConsequenceContent {
  /**
   * Stable identifier for what went wrong, as `promptId:choiceId`. Used to look up the
   * wording and to record the incident in the behaviour log.
   */
  incidentId: string;
  title: string;
  lines: string[];
}

/**
 * The wording for an incident, falling back to a generic message.
 *
 * This is the placeholder the brief asks for: authoring text for a new incident means
 * adding `consequences.incidents.<promptId>:<choiceId>` to the dictionaries and nothing
 * else. Until that exists the generic copy is used, so a newly risky answer is never
 * silently consequence-free.
 */
export function resolveConsequenceContent(incidentId: string): ConsequenceContent {
  const base = `consequences.incidents.${incidentId}`;
  const authored = hasMessage(`${base}.title`);
  const prefix = authored ? base : "consequences.fallback";

  const lines = [t(`${prefix}.body`)];

  if (hasMessage(`${prefix}.detail`)) {
    lines.push(t(`${prefix}.detail`));
  }

  return { incidentId, title: t(`${prefix}.title`), lines };
}

let openConsequence: HTMLElement | null = null;

export function isConsequenceOpen(): boolean {
  return openConsequence !== null;
}

/**
 * Shows the consequence and resolves once the learner dismisses it.
 *
 * Awaited by the caller, which is what makes "time stops until they continue" true: the
 * choice that caused it does not resolve, and the clock stays paused, until this settles.
 */
export function showConsequence(
  style: ConsequenceStyleId,
  content: ConsequenceContent
): Promise<void> {
  dismissConsequence();

  return new Promise<void>((resolve) => {
    const overlay = document.createElement("div");

    overlay.className = `consequence consequence-${style}`;
    overlay.dataset.incident = content.incidentId;
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "consequence-title");
    overlay.innerHTML = buildMarkup(style, content);

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
      // still-visible tear.
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
 * Page Rip
 * ------------------------------------------------------------------ */

/**
 * The torn edge, as an SVG polygon in a 100x1000 viewBox stretched to the element.
 *
 * Built rather than written out so the shape is legible and tunable: the taper and the
 * raggedness are parameters, not a wall of coordinates. The offsets are a fixed cycle
 * rather than random, so the tear looks the same every time - a screenshot or a bug report
 * has to still describe the thing being looked at.
 */
function buildRipPath(): string {
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

  return `M ${left.join(" L ")} L ${right.reverse().join(" L ")} Z`;
}

function buildMarkup(style: ConsequenceStyleId, content: ConsequenceContent): string {
  void style;

  return `
    <div class="rip-tear" aria-hidden="true">
      <svg class="rip-edge" viewBox="0 0 100 1000" preserveAspectRatio="none">
        <path d="${buildRipPath()}" vector-effect="non-scaling-stroke" />
      </svg>
    </div>

    <div class="rip-panel">
      <!--
        The message is its own block so the dismiss control can be positioned against it.
        Anchored to the panel instead, it floated hundreds of pixels above the words.
      -->
      <div class="rip-message">
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

        <h2 id="consequence-title">${escapeHtml(content.title)}</h2>
        ${content.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
      </div>
    </div>
  `;
}

/** Local copy: this module must not depend on the screen-rendering module. */
function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
