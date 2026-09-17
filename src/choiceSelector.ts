// The choice selector: a minimalist radial menu for any moment the simulation asks the
// learner to decide something.
//
// Generic on purpose. It knows nothing about coworkers, email or Wi-Fi - it takes a
// prompt and resolves with what was picked, so any event can use it by describing the
// question rather than by adding UI.
//
// Three rules worth keeping:
//
//   * A choice's `risk` is never rendered. Marking the risky answer would hand the
//     learner the answer.
//   * There is no way for the learner to dismiss a prompt - no close button, and Escape
//     is swallowed. A choice that is presented has to be answered, otherwise the
//     behaviour log records nothing about the moment that mattered.
//   * The ring is a visual arrangement only. Semantically this is an ordinary dialog
//     with a list of buttons in clockwise order, so keyboard and screen-reader users
//     get something sensible rather than a geometry puzzle.
//
// Authoring note: a dial only reads well with SHORT labels - two or three words. Put the
// full sentence in `detail`, which is shown below the dial for whichever option has
// attention. A prompt whose options are all long sentences wants `layout: "list"`.
//
// The detail line sits below the dial rather than in its centre: the gap between the
// options at three and nine o'clock is only about a hundred pixels, which cannot hold a
// sentence at any dial size that still fits the card.

import { t } from "./localization/i18n";
import type { ChoiceOption, ChoiceOutcome, ChoicePrompt } from "./events/types";

/** Above this many options a dial gets too crowded, so it becomes a list. */
export const LIST_LAYOUT_THRESHOLD = 6;

const DEFAULT_RADIUS_PERCENT = 34;

let openPrompt: HTMLElement | null = null;

export function isChoiceOpen(): boolean {
  return openPrompt !== null;
}

/**
 * Shows the prompt and resolves once the learner answers, dismisses it, or runs out of
 * time. Only one prompt is on screen at a time; a second call closes the first as
 * dismissed so the caller is never left waiting forever.
 */
export function openChoicePrompt(prompt: ChoicePrompt): Promise<ChoiceOutcome> {
  closeChoicePrompt();

  return new Promise<ChoiceOutcome>((resolve) => {
    const startedAt = Date.now();
    const appearance = prompt.appearance ?? {};
    const layout =
      appearance.layout ??
      (prompt.choices.length > LIST_LAYOUT_THRESHOLD ? "list" : "radial");

    const overlay = document.createElement("div");
    overlay.className = `choice-overlay layout-${layout}`;
    overlay.dataset.promptId = prompt.id;

    if (appearance.scrim === false) {
      overlay.classList.add("no-scrim");
    }

    if (appearance.accent) {
      overlay.style.setProperty("--choice-accent", appearance.accent);
    }

    overlay.innerHTML = buildMarkup(prompt, layout, appearance.radiusPercent);
    document.body.appendChild(overlay);
    openPrompt = overlay;

    let settled = false;
    let timeoutId: number | null = null;

    function settle(outcome: Omit<ChoiceOutcome, "elapsedMs">): void {
      if (settled) {
        return;
      }

      settled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      document.removeEventListener("keydown", onKeyDown, true);
      overlay.classList.add("leaving");
      window.setTimeout(() => overlay.remove(), 180);

      if (openPrompt === overlay) {
        openPrompt = null;
      }

      resolve({ ...outcome, elapsedMs: Date.now() - startedAt });
    }

    // Exposed so a later prompt, or a screen change, can tear this one down.
    overlay.dataset.settleAs = "dismissed";
    (overlay as HTMLElement & { __dismiss?: () => void }).__dismiss = () =>
      settle({ choiceId: null, timedOut: false, dismissed: true });

    /* ---------------------------- interaction ---------------------------- */

    const detailLine = overlay.querySelector<HTMLElement>(".choice-detail-text");
    const options = [...overlay.querySelectorAll<HTMLButtonElement>(".choice-option")];

    // One line under the dial: the instruction until an option has attention, then that
    // option's own wording.
    const describe = (option?: ChoiceOption): void => {
      if (detailLine) {
        detailLine.textContent = option?.detail ?? t("choice.instruction");
        detailLine.classList.toggle("is-detail", Boolean(option?.detail));
      }
    };

    options.forEach((button, index) => {
      const option = prompt.choices[index];

      button.addEventListener("click", () =>
        settle({ choiceId: option.id, choice: option, timedOut: false, dismissed: false })
      );

      button.addEventListener("mouseenter", () => describe(option));
      button.addEventListener("focus", () => describe(option));
      button.addEventListener("mouseleave", () => describe());
      button.addEventListener("blur", () => describe());
    });

    function onKeyDown(event: KeyboardEvent): void {
      // Escape is swallowed rather than honoured: the learner has to answer. Stopping
      // propagation keeps it from reaching anything else that closes on Escape.
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Arrow keys walk the ring in either direction; Tab is trapped to the options.
      const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
      const back = event.key === "ArrowLeft" || event.key === "ArrowUp";

      if (!forward && !back && event.key !== "Tab") {
        return;
      }

      event.preventDefault();

      const current = options.indexOf(document.activeElement as HTMLButtonElement);
      const step = back || (event.key === "Tab" && event.shiftKey) ? -1 : 1;
      const next = (current + step + options.length) % options.length;

      options[next]?.focus();
    }

    document.addEventListener("keydown", onKeyDown, true);

    if (prompt.timeoutSeconds && prompt.timeoutSeconds > 0) {
      const bar = overlay.querySelector<HTMLElement>(".choice-timer-bar");

      if (bar) {
        bar.style.transitionDuration = `${prompt.timeoutSeconds}s`;
        // Next frame, so the transition has a start value to animate from.
        requestAnimationFrame(() => bar.classList.add("running"));
      }

      timeoutId = window.setTimeout(
        () => settle({ choiceId: null, timedOut: true, dismissed: false }),
        prompt.timeoutSeconds * 1000
      );
    }

    describe();
    options[0]?.focus();
  });
}

/** Tears down whatever is open, resolving it as dismissed. */
export function closeChoicePrompt(): void {
  const current = openPrompt as (HTMLElement & { __dismiss?: () => void }) | null;

  current?.__dismiss?.();
  openPrompt = null;
}

/* ------------------------------------------------------------------ *
 * Markup
 * ------------------------------------------------------------------ */

function buildMarkup(
  prompt: ChoicePrompt,
  layout: "radial" | "list",
  radiusPercent = DEFAULT_RADIUS_PERCENT
): string {
  const { context } = prompt;
  const titleId = `choice-title-${prompt.id}`;
  const bodyId = `choice-body-${prompt.id}`;

  const avatar = context.avatarImageUrl
    ? `<img class="choice-avatar" src="${escapeHtml(context.avatarImageUrl)}" alt="" />`
    : context.avatarText
      ? `<div class="choice-avatar" aria-hidden="true">${escapeHtml(context.avatarText)}</div>`
      : "";

  return `
    <div
      class="choice-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="${titleId}"
      aria-describedby="${bodyId}"
    >
      <header class="choice-context">
        ${avatar}
        <div class="choice-context-text">
          <strong id="${titleId}">${escapeHtml(context.title)}</strong>
          <p id="${bodyId}">${escapeHtml(context.body)}</p>
        </div>
      </header>

      ${
        prompt.timeoutSeconds
          ? `<div class="choice-timer" role="timer" aria-label="${escapeHtml(
              t("choice.timeRemaining")
            )}"><div class="choice-timer-bar"></div></div>`
          : ""
      }

      ${
        layout === "radial"
          ? renderRadial(prompt.choices, radiusPercent)
          : renderList(prompt.choices)
      }

      <p class="choice-detail" aria-live="polite">
        <span class="choice-detail-text"></span>
      </p>
    </div>
  `;
}

function renderRadial(choices: ChoiceOption[], radiusPercent: number): string {
  const options = choices
    .map((choice, index) => {
      // First option at twelve o'clock, then clockwise. Positions are computed here
      // rather than with rotate() so the labels stay upright.
      const angle = (-90 + (360 / choices.length) * index) * (Math.PI / 180);
      const left = 50 + Math.cos(angle) * radiusPercent;
      const top = 50 + Math.sin(angle) * radiusPercent;

      return renderOption(choice, `left:${left.toFixed(2)}%;top:${top.toFixed(2)}%;`);
    })
    .join("");

  return `<div class="choice-dial" role="group">${options}</div>`;
}

function renderList(choices: ChoiceOption[]): string {
  return `
    <div class="choice-list" role="group">
      ${choices.map((choice) => renderOption(choice)).join("")}
    </div>
  `;
}

/** No risk styling: the markup must not reveal which answer is the good one. */
function renderOption(choice: ChoiceOption, style = ""): string {
  return `
    <button type="button" class="choice-option" data-choice-id="${escapeHtml(choice.id)}"
      ${style ? `style="${style}"` : ""}>
      ${choice.icon ? `<span class="choice-icon" aria-hidden="true">${escapeHtml(choice.icon)}</span>` : ""}
      <span class="choice-label">${escapeHtml(choice.label)}</span>
    </button>
  `;
}

function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}
