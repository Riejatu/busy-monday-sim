// Events and triggers.
//
//   An EVENT is something that happens in the simulated environment - an email
//   arrives, the Wi-Fi drops, a message pops up. Each one is coded into the app and
//   owns its own `apply` function.
//
//   A TRIGGER decides WHEN an event is applied: at a simulated time, a delay after
//   another event, or in response to something the learner does. A trigger can also
//   enable or disable other triggers.
//
// The engine deliberately knows nothing about specific event kinds. Adding an event
// means adding a registry entry, not changing the engine - which is what keeps the
// catalogue open-ended.

import type { ScenarioContext } from "../scenario";
import type { SimulationSettings } from "../config/settings";
import type { PhishingClassificationId } from "../phishingTaxonomy";
import type { Department, TenureBand } from "../data/roster";

/* ------------------------------------------------------------------ *
 * Things the learner does, observable by triggers
 * ------------------------------------------------------------------ */

export const LEARNER_ACTIONS = [
  "mailAppOpened",
  "notesAppOpened",
  "emailOpened",
  "linkHovered",
  "linkClicked",
  "emailReported",
  "emailTrusted",
  "emailIgnored",
  "wifiPanelOpened",
  "desktopContextMenuOpened",
  "wifiNetworkSelected",
  "choiceMade",
  "chatOpened",
  "chatClosed",
  "chatMessageReceived",
  /** The learner placed a call, whatever number they used. */
  "callPlaced",
  /** A messenger conversation finished - the learner answered and it is done. */
  "chatResolved",
  /** The learner stopped the clock themselves with the space key, and started it again. */
  "timePaused",
  "timeResumed",
  /** A wrong answer drew a negative consequence, and the learner cleared it. */
  "consequenceDismissed"
] as const;

export type LearnerAction = (typeof LEARNER_ACTIONS)[number];

/**
 * Ongoing states of the simulated desktop, as opposed to one-off actions. A trigger
 * can pause while one of these holds - so a nag stops counting down while the learner
 * is already dealing with the thing it is nagging about.
 */
export const SIM_STATE_FLAGS = [
  "wifiPanelOpen",
  "wifiDisconnected",
  /** A choice prompt is on screen and waiting for the learner. */
  "choiceOpen",
  /** The messenger has a message the learner has not read. */
  "chatUnread",
  /** A call is on screen. Nothing should toast over a conversation the learner is having. */
  "callActive",
  /** Someone is physically at the learner's desk talking to them. */
  "personSpeaking"
] as const;

export type SimStateFlag = (typeof SIM_STATE_FLAGS)[number];

/* ------------------------------------------------------------------ *
 * What an event may do to the desktop
 * ------------------------------------------------------------------ */

/** A message an event can drop into the inbox. */
export interface InjectedMessage {
  id: string;
  senderName: string;
  senderAddress: string;
  subject: string;
  preview: string;
  paragraphs: string[];
  receivedLabel: string;
  link?: { label: string; url: string; risk: "safe" | "malicious" };
  /**
   * A phone number the message wants the learner to call - the whole artefact of a
   * T.O.A.D. attack, where there is no link to hover and no file to open.
   *
   * Rendered as emphasized text, not as a control: the decision to call is made through a
   * choice prompt, so a clickable number would be a second, competing way to act. Like a
   * simulated link it is never an <a href>, for the same status-bar reason.
   */
  phone?: { label: string; number: string };
  /** Show the Report / Trust / Ignore controls on this message. */
  decidable?: boolean;
  /**
   * Snapshot for a notification. Raised only while the learner is not already reading this
   * message; clicking it opens the mail app on it. Same rule, and the same reasoning, as a
   * chat message's `toastBody`.
   */
  toastBody?: string;
  toastTone?: "info" | "warning";
}

/* ------------------------------------------------------------------ *
 * Someone in the room
 * ------------------------------------------------------------------ */

/**
 * A person physically present, speaking to the learner.
 *
 * CONVENTION - this applies to every scenario, present and future. Any time another person
 * is bodily in the room talking to the learner, it goes through `speak()` and appears in the
 * in-person panel at the top right: a neutral person icon with the words below it. It does
 * NOT use a toast.
 *
 * The reason is that a toast is a thing the *computer* did. Someone standing at your desk is
 * not a notification, and dressing it as one teaches the learner to read a human
 * interruption as screen furniture - which is exactly the reflex a tailgating or
 * shoulder-surfing scenario needs them not to have. These interactions are deliberately
 * outside the desktop's visual language.
 *
 * What belongs here: a colleague stopping by, a visitor at the desk, someone asking to
 * borrow a badge, a stranger asking to be let through a door.
 *
 * What does NOT: anything arriving through a device. Mail, the messenger and the telephone
 * each have their own surface, and a voice on a phone is not in the room. System feedback
 * and coaching stay as toasts, because that genuinely is the simulation talking.
 *
 * The icon is deliberately a featureless silhouette - no hair, clothing, skin tone or build
 * - so that it carries no sex, race or age. Every learner should be able to read the person
 * as whoever they picture.
 */
export interface SpokenLine {
  /** Who is speaking, as the learner knows them. */
  speaker: string;
  /** Short relationship or role, shown under the name. e.g. "Coworker". */
  role?: string;
  /** What they say, one paragraph per element. */
  lines: string[];
  /**
   * Real seconds to hold before it clears by itself. Real rather than simulated, for the
   * same reason a toast's hold is: this is someone talking at human speed.
   *
   * Omit to leave it on screen until the event replaces it or ends the conversation - which
   * is what you want while a choice is pending, because the words are what the learner is
   * answering.
   */
  holdSeconds?: number;
}

/* ------------------------------------------------------------------ *
 * Telephone
 * ------------------------------------------------------------------ */

/**
 * A call in progress, shown as a phone handset on the desktop.
 *
 * The handset is a stage prop, not a control surface: it shows who is being called, on
 * what number, and where that number came from, and nothing on it is clickable. What the
 * learner does on the call is put to them through a choice prompt, so that the decision
 * cannot be side-stepped by hanging up.
 */
export interface PhoneCall {
  /** Who the learner believes they are calling. */
  contactName: string;
  /** The number as dialed, exactly as it appeared wherever they got it. */
  number: string;
  /**
   * Where that number came from, already localized - "the number in the email", "the back
   * of your card". Shown as a caption under the number, which is what makes two otherwise
   * identical-looking calls tell different stories.
   */
  numberSource: string;
  /** `dialing` shows the ringing state; `connected` starts the call timer. */
  status: "dialing" | "connected";
}

/**
 * Which app raised a notification.
 *
 * A toast carries the icon of the app that called it, so an email notice shows the mail
 * icon and a message notice shows the messenger's - the same glyph the app uses on the
 * desktop, taskbar or tray. Learning where a notification came from at a glance is part of
 * what the simulation is teaching, and a generic bubble on every toast throws that away.
 *
 * `system` is the simulation or the OS itself talking - a policy notice, or coaching after
 * a decision. It is the only source with no app behind it.
 */
export const NOTIFICATION_SOURCES = [
  "system",
  "mail",
  "messenger",
  "network",
  "phone"
] as const;

export type NotificationSource = (typeof NOTIFICATION_SOURCES)[number];

export interface DesktopNotification {
  title: string;
  body: string;
  /**
   * Required, not optional with a default: an omitted source would silently fall back to a
   * generic icon, and the compiler listing every call site is what keeps a new toast from
   * shipping without the app it came from.
   */
  source: NotificationSource;
  /** Severity. Drives the toast's colour; the icon comes from `source`. */
  tone?: "info" | "warning";
  /**
   * Makes the toast clickable. Used for a message notification: clicking the toast is
   * one of the two ways into the conversation, the tray badge being the other.
   */
  onActivate?: () => void;
  /**
   * Real seconds on screen. Real rather than simulated, because a toast is a piece of
   * UI the learner reads at human speed - it should not shrink when the time lapse is
   * turned up. Defaults to 5.
   */
  holdSeconds?: number;
  /**
   * Set by the engine, not by event authors: which event raised this notification, so
   * it can be withdrawn again later.
   */
  sourceEventId?: string;
}

/* ------------------------------------------------------------------ *
 * Choice prompts
 * ------------------------------------------------------------------ */

/**
 * One answer the learner can pick.
 *
 * `risk` is metadata for the behaviour log and future scoring - it is deliberately
 * NEVER rendered. Styling the risky answer differently would hand the learner the
 * answer and destroy the teaching value.
 */
export interface ChoiceOption {
  id: string;
  label: string;
  /** Optional elaboration, shown in the hub while this option has focus. */
  detail?: string;
  /** Optional glyph shown above the label. */
  icon?: string;
  risk?: "safe" | "neutral" | "risky";
}

/** The context area at the top: who is asking, and about what. */
export interface ChoiceContext {
  /** Who or what is prompting, e.g. a coworker's name. */
  title: string;
  /** What they are asking. */
  body: string;
  /** Single letter or short glyph for the avatar. Omit for no avatar. */
  avatarText?: string;
  /** Image in place of the avatar letter, e.g. a company logo. */
  avatarImageUrl?: string;
}

/** Visual customization. Everything is optional and falls back to the brand theme. */
export interface ChoiceAppearance {
  /** CSS colour for the accent. Defaults to the company's brand colour. */
  accent?: string;
  /** Radius of the option ring as a percentage of the dial. Default 38. */
  radiusPercent?: number;
  /**
   * "radial" arranges options on a circle; "list" stacks them. Defaults to radial,
   * falling back to a list above `LIST_LAYOUT_THRESHOLD` options, where a dial gets
   * too crowded to read.
   */
  layout?: "radial" | "list";
  /** Dim the desktop behind the prompt. Default true. */
  scrim?: boolean;
}

export interface ChoicePrompt {
  /** Stable id, used in the behaviour log and for trigger matching. */
  id: string;
  context: ChoiceContext;
  choices: ChoiceOption[];
  appearance?: ChoiceAppearance;
  /**
   * Real seconds before the prompt gives up. Omit for no time limit.
   *
   * There is deliberately no `dismissible` option: a choice put to the learner has to be
   * answered. The only ways out are answering it, a timeout if one is set, or the
   * simulation tearing the prompt down itself.
   */
  timeoutSeconds?: number;
  /**
   * Set by the engine, not by event authors: which event raised this prompt.
   *
   * It is what lets wrong-decision feedback wait for the whole scenario rather than firing
   * on an intermediate stage - the answers of one event belong to one scenario.
   */
  sourceEventId?: string;
}

export interface ChoiceOutcome {
  /** The option picked, or null if it timed out or was torn down. */
  choiceId: string | null;
  /** The option picked, for convenience. */
  choice?: ChoiceOption;
  timedOut: boolean;
  /**
   * True only when the simulation itself closed the prompt - a screen change, or another
   * prompt superseding it. The learner cannot dismiss a choice.
   */
  dismissed: boolean;
  /** Real milliseconds the learner took, the basis for time-to-decision. */
  elapsedMs: number;
}

/* ------------------------------------------------------------------ *
 * Company messenger
 * ------------------------------------------------------------------ */

/**
 * One message in a messenger conversation.
 *
 * There is no timestamp field: the app stamps each message with the simulated clock as
 * it is posted, so a thread can never disagree with the taskbar.
 */
export interface ChatMessage {
  id: string;
  /** Display name, which an impersonator will have set to a real colleague's. */
  author: string;
  /**
   * Secondary line under the name. With no "external" badge to lean on, the address is
   * the tell the learner has to notice.
   */
  handle?: string;
  avatarText?: string;
  paragraphs: string[];
  link?: { label: string; url: string; risk: "safe" | "malicious" };
  /** True for a line the learner sent, which renders on the other side. */
  fromLearner?: boolean;
  /**
   * Snapshot for a notification. A toast is raised only for a conversation the learner has
   * not opened yet; once they have been to it, later messages arrive quietly behind the
   * tray badge. Keeping that rule here means an event never has to ask what the learner is
   * currently looking at.
   */
  toastBody?: string;
  toastTone?: "info" | "warning";
}

/** The conversation a message belongs to, and the app chrome around it. */
export interface ChatThread {
  id: string;
  /** Product name in the window chrome, e.g. "Teams". */
  appName: string;
  /** Conversation title, usually the other participant. */
  title: string;
  subtitle?: string;
}

/**
 * The surface events use to change the environment. Kept narrow on purpose: a new
 * capability here is a deliberate decision, not a side effect of adding an event.
 */
export interface DesktopBridge {
  addInboxMessage: (message: InjectedMessage) => void;
  /**
   * Resolves once the learner has this message open, immediately if it already is. Lets an
   * event wait for the mail to be read before asking about it, rather than putting a choice
   * to someone who has not seen the thing being decided.
   */
  awaitEmailOpened: (messageId: string) => Promise<void>;
  /**
   * Puts the phone on screen, or updates the call already showing. Call again with a new
   * `status` to move from dialing to connected.
   */
  placeCall: (call: PhoneCall) => void;
  /** Takes the phone off screen. An event that placed a call must always end it. */
  endCall: () => void;
  /**
   * Shows someone physically present speaking to the learner, in the in-person panel at the
   * top right. Call again to replace what they are saying.
   *
   * This is the ONLY way a person in the room should ever address the learner - see
   * SpokenLine for why, and for what does not belong here.
   */
  speak: (line: SpokenLine) => void;
  /** Clears the in-person panel. Harmless if nobody is speaking. */
  endConversation: () => void;
  setWifiAvailable: (available: boolean) => void;
  notify: (notification: DesktopNotification) => void;
  /** Removes any notification still on screen that came from this event. */
  withdrawNotifications: (eventId: string) => void;
  /**
   * Puts a choice to the learner and resolves once they answer, dismiss it or run out
   * of time. The only bridge call that returns something, which is why an event's
   * `apply` may be async.
   */
  askChoice: (prompt: ChoicePrompt) => Promise<ChoiceOutcome>;
  /**
   * Called by the engine when an event's `apply` has finished, however it finished.
   *
   * This is what marks the end of a scenario. Wrong-decision feedback is held back until
   * then, so a multi-stage scenario is never interrupted on an intermediate stage - and a
   * scenario added later gets that for free, without having to declare anything.
   *
   * Event authors never call this.
   */
  endScenario: (eventId: string) => void;
  /**
   * Delivers a message into the messenger. The window does not open by itself - the
   * message waits behind an unread badge until the learner goes to it. Once the
   * conversation IS open, further messages arrive quietly: no badge, no toast.
   */
  postChatMessage: (thread: ChatThread, message: ChatMessage) => void;
  openChat: (threadId: string) => void;
  /**
   * Marks a conversation finished. The event that owns the thread calls this when its
   * interaction is over; the messenger uses it to decide when the tray icon has nothing
   * left to track and can disappear.
   */
  resolveChatThread: (threadId: string) => void;
  /**
   * Resolves once the learner has the conversation open, immediately if it already is.
   * Lets an event wait for the learner to come to the message rather than pushing a
   * prompt at them out of context.
   */
  awaitChatOpened: (threadId: string) => Promise<void>;
}

/* ------------------------------------------------------------------ *
 * Events
 * ------------------------------------------------------------------ */

export interface SimEventContext {
  /** Simulated minutes from the start of the day when this event fired. */
  atMinutes: number;
  scenario: ScenarioContext;
  settings: SimulationSettings;
  desktop: DesktopBridge;
  /** Fire another event, optionally after a delay in simulated minutes. */
  schedule: (eventId: string, delayMinutes?: number) => void;
  /** Turn a trigger on or off while the day is running. */
  setTriggerEnabled: (triggerId: string, enabled: boolean) => void;
}

/**
 * Marks an event as a messenger conversation the day planner may choose.
 *
 * A day gets several conversations and exactly one attack, so benign chatter is content in
 * its own right rather than filler - see src/events/messengerPlan.ts.
 */
export interface MessengerConversationMeta {
  kind: "benign" | "malicious";
  /**
   * Who this conversation is plausible for. Every stated condition must hold; omit one and
   * it is not a constraint. This is what stops a supervisor chasing last quarter's report
   * from landing on someone who started last week.
   */
  audience?: {
    departments?: Department[];
    tenures?: TenureBand[];
    minSecurityRating?: number;
    maxSecurityRating?: number;
  };
}

export interface SimEventDefinition {
  id: string;
  /** Grouping shown on the operator pages, e.g. "Mail" or "Network". */
  category: string;
  /** Operator-facing name and description. */
  name: string;
  description: string;
  defaultEnabled: boolean;
  /**
   * Which kind of phish this event stages, for an event that stages one at all. An event
   * whose classification is switched off never fires, however its own toggle is set -
   * campaign coverage outranks the catalogue.
   *
   * Exactly one classification, matching how the security team files real reported mail.
   * See src/phishingTaxonomy.ts for why Reply-to is the outer category when an attack
   * would arguably fit two.
   */
  phishing?: PhishingClassificationId;
  /**
   * Present on messenger conversations. An event with this is never given a trigger of its
   * own: the day planner selects which ones run and schedules them.
   */
  messenger?: MessengerConversationMeta;
  /**
   * May return a promise - an event that asks the learner something has to wait for
   * the answer. The engine does not block on it, so the rest of the day keeps running.
   */
  apply: (context: SimEventContext) => void | Promise<void>;
}

/* ------------------------------------------------------------------ *
 * Triggers
 * ------------------------------------------------------------------ */

export type TriggerCondition =
  /** At a fixed point in the simulated day. */
  | { type: "atSimTime"; minutesFromDayStart: number }
  /**
   * Real seconds after the learner reaches the desktop. Real time, not simulated:
   * some prompts are about the person at the keyboard, not the fiction, and should
   * not move when the time lapse changes.
   */
  | { type: "afterLogin"; delaySeconds: number }
  /**
   * While a state of the desktop holds - "there is no network connection" rather than
   * "the learner just signed in". Fires one `repeat` interval after the state begins,
   * then every interval while it lasts, and stops when it clears - so a state that
   * resolves quickly never prompts at all.
   *
   * Because it watches the state rather than an event, anything that causes the state
   * drives it: signing in disconnected, or a later event dropping the connection.
   */
  | { type: "whileState"; flag: SimStateFlag }
  /** A delay after another event has been applied. */
  | { type: "afterEvent"; eventId: string; delayMinutes: number }
  /** In response to something the learner does. */
  | { type: "onLearnerAction"; action: LearnerAction; target?: string };

/**
 * Makes a trigger recur until the learner does something about it - a nag, in other
 * words. Without `untilAction` it needs `maxOccurrences`, or it would never stop.
 */
export interface TriggerRepeat {
  everySeconds: number;
  /** Stops repeating once this action occurs. */
  untilAction?: LearnerAction;
  /** Narrows `untilAction` to one target. Omit to accept any. */
  untilTarget?: string;
  /** Hard ceiling on how many times it may fire. */
  maxOccurrences?: number;
}

export interface TriggerDefinition {
  id: string;
  /** The event this trigger applies. */
  eventId: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
  condition: TriggerCondition;
  /** Fire at most once per session. Default true; ignored when `repeat` is set. */
  once?: boolean;
  /** Repeat until the learner responds. */
  repeat?: TriggerRepeat;
  /**
   * Suspends this trigger's countdown while any of these states hold, and withdraws any
   * notification its event has on screen. Time spent paused does not count towards the
   * next firing, so clearing the state resumes rather than restarts.
   */
  pauseWhile?: SimStateFlag | SimStateFlag[];
  /** Triggers switched on when this one fires. */
  enables?: string[];
  /** Triggers switched off when this one fires. */
  disables?: string[];
}

/** Operator-editable parameters, resolved through the config cascade. */
export interface TriggerSettings {
  enabled?: boolean;
  /** Overrides `atSimTime.minutesFromDayStart`. */
  minutesFromDayStart?: number;
  /** Overrides `afterEvent.delayMinutes`. */
  delayMinutes?: number;
  /** Overrides `afterLogin.delaySeconds`. */
  delaySeconds?: number;
  /** Overrides `repeat.everySeconds`. */
  repeatEverySeconds?: number;
}
