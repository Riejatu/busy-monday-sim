// The catalogue of events and triggers.
//
// This is the file that grows. Adding an event means one entry here plus its text in
// the dictionaries; the engine, the config cascade and the operator pages pick it up
// automatically without changes.
//
// Operator-facing `name` and `description` are English - they appear only on /backend
// and /admin. Anything the learner reads goes through t().

import { t } from "../localization/i18n";
import { getClockAt, getFullName, getInitial } from "../scenario";
import { clockTimeLabel } from "../localization/labels";

/**
 * A real-time pause, for pacing UI rather than the fiction - the same reasoning as a
 * toast's hold time. Used to let a message land on screen before a prompt asks about it.
 */
const beat = (seconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
import { isPhishingCovered } from "../phishingTaxonomy";
import { planMessengerDay } from "./messengerPlan";
import type { ScenarioRole } from "../data/roster";
import type { MessengerConversationMeta } from "./types";
import type { DesktopBridge, PhoneCall, SimEventDefinition, TriggerDefinition } from "./types";
import type { SimulationSettings } from "../config/settings";

/**
 * Whether an event may run at all: its own toggle, and the phishing category it belongs to.
 *
 * Shared by the engine and the messenger day planner so the two cannot disagree about what
 * is live. Coverage is checked first - an operator who switched a whole phishing type off
 * should not have to also find every event of that type in the catalogue.
 */
export function isEventAvailable(
  definition: SimEventDefinition,
  settings: SimulationSettings
): boolean {
  if (definition.phishing && !isPhishingCovered(settings.phishing, definition.phishing)) {
    return false;
  }

  return settings.events?.[definition.id] ?? definition.defaultEnabled;
}

/**
 * Dials, rings, connects. Real seconds like a toast's hold time: this is the person at the
 * keyboard watching a phone ring, not something happening inside the fiction.
 *
 * The caller is left holding the call. Whoever places one is responsible for ending it -
 * every path through an event that dials has to reach `endCall`, or the handset stays on
 * screen after the scenario is over.
 */
const dial = async (
  desktop: DesktopBridge,
  call: Omit<PhoneCall, "status">
): Promise<void> => {
  desktop.placeCall({ ...call, status: "dialing" });
  await beat(4);
  desktop.placeCall({ ...call, status: "connected" });
  await beat(3);
};

/**
 * Builds an ordinary work conversation: someone writes, the learner picks a reply, the
 * sender signs off, done.
 *
 * Every benign conversation has that same shape, so they are generated from data rather
 * than written out four times. What differs is who sends it, who it is plausible for, and
 * what the strings say - and the strings all live under one predictable prefix, which is
 * what keeps adding a fifth conversation cheap.
 *
 * These exist to be unremarkable. A learner who only ever sees the messenger light up for
 * an attack learns to distrust the icon rather than to read the message.
 */
function benignConversation(options: {
  id: string;
  /** Dictionary key under events.messengerChats. */
  stringKey: string;
  role: ScenarioRole;
  choiceIds: readonly string[];
  audience?: MessengerConversationMeta["audience"];
  name: string;
  description: string;
}): SimEventDefinition {
  const { id, stringKey, role, choiceIds, audience, name, description } = options;

  return {
    id,
    category: "Messenger",
    name,
    description,
    defaultEnabled: true,
    messenger: { kind: "benign", ...(audience ? { audience } : {}) },
    apply: async ({ desktop, scenario }) => {
      const sender = scenario.cast[role];

      // The learner's first name is offered to every string in the set. Most ignore it;
      // an opening that greets them by name should not need its own plumbing to do so.
      const text = (path: string) =>
        t(`events.messengerChats.${stringKey}.${path}`, {
          first: scenario.learner.firstName,
          sender: sender.firstName
        });

      const thread = {
        id,
        appName: t("chat.appName"),
        title: getFullName(sender)
      };

      desktop.postChatMessage(thread, {
        id: `${id}-open`,
        author: getFullName(sender),
        // A colleague on the company's own domain. The contrast with an attack's lookalike
        // is only worth anything if the honest messages show the real thing.
        handle: sender.email,
        avatarText: getInitial(sender.firstName),
        paragraphs: [text("opening")],
        toastBody: text("toast")
      });

      await desktop.awaitChatOpened(id);
      await beat(2);

      const outcome = await desktop.askChoice({
        id,
        appearance: { scrim: false },
        context: {
          title: getFullName(sender),
          body: text("ask"),
          avatarText: getInitial(sender.firstName)
        },
        // No risk on any of these: there is nothing here to get wrong, and tagging one
        // would put a scoring signal on small talk.
        choices: choiceIds.map((choiceId) => ({
          id: choiceId,
          label: text(`choices.${choiceId}`),
          detail: text(`lines.${choiceId}`)
        }))
      });

      if (outcome.choiceId) {
        desktop.postChatMessage(thread, {
          id: `${id}-reply`,
          author: getFullName(scenario.learner),
          avatarText: getInitial(scenario.learner.firstName),
          paragraphs: [text(`lines.${outcome.choiceId}`)],
          fromLearner: true
        });

        await beat(2);

        desktop.postChatMessage(thread, {
          id: `${id}-closing`,
          author: getFullName(sender),
          handle: sender.email,
          avatarText: getInitial(sender.firstName),
          paragraphs: [text("closing")]
        });
      }

      desktop.resolveChatThread(id);
    }
  };
}

export const SIM_EVENTS: SimEventDefinition[] = [
  {
    id: "wifi-not-connected-notice",
    category: "Network",
    name: "Not connected to Wi-Fi",
    description:
      "A Windows-style toast in the bottom right telling the learner they have no " +
      "network connection. Prompts them to open the Wi-Fi list, where the real " +
      "network and its lookalike sit side by side.",
    defaultEnabled: true,
    apply: ({ desktop }) => {
      desktop.notify({
                       // the connection itself, not an app.
                       source: "network",
        title: t("events.wifiNotConnected.title"),
        body: t("events.wifiNotConnected.body"),
        tone: "warning",
        holdSeconds: 5
      });
    }
  }
,
  {
    id: "coworker-check-in",
    category: "Social",
    name: "Coworker asks how the day is going",
    description:
      "The colleague from the briefing stops by in person and asks how things are going, " +
      "and the learner picks a reply from a radial choice selector. One reply casually " +
      "asks for the Wi-Fi password, which is the point: it records how readily the learner " +
      "talks about credentials in passing. They are physically present, so they appear in " +
      "the in-person panel at the top right rather than as a toast.",
    defaultEnabled: true,
    apply: async ({ desktop, scenario }) => {
      const coworker = scenario.cast.narrator;
      const speaker = {
        speaker: getFullName(coworker),
        role: t("events.coworkerCheckIn.role")
      };

      // Someone at the desk, not a notification. No hold: the words stay up because they
      // are what the choice below is answering.
      desktop.speak({ ...speaker, lines: [t("events.coworkerCheckIn.question")] });

      const outcome = await desktop.askChoice({
        id: "coworker-check-in",
        context: {
          title: getFullName(coworker),
          // The words themselves are in the panel; the card only asks for a reply.
          body: t("inPerson.whatDoYouSay"),
          avatarText: getInitial(coworker.firstName)
        },
        // Short labels for the dial; the line the learner actually says goes in `detail`,
        // which the hub shows on hover or focus.
        choices: (["fine", "busy", "offline", "wifiPassword"] as const).map((id) => ({
          id,
          label: t(`events.coworkerCheckIn.choices.${id}`),
          detail: t(`events.coworkerCheckIn.says.${id}`),
          // Never rendered - metadata for the log and for scoring later.
          risk: id === "wifiPassword" ? ("risky" as const) : ("neutral" as const)
        }))
      });

      // Walking away without answering is itself a valid outcome; they simply leave.
      if (!outcome.choiceId) {
        desktop.endConversation();
        return;
      }

      // Their reply, then they go. A hold here rather than an explicit end, so the learner
      // gets to read it.
      desktop.speak({
        ...speaker,
        lines: [t(`events.coworkerCheckIn.replies.${outcome.choiceId}`)],
        holdSeconds: 8
      });
    }
  }
,
  {
    id: "messenger-invoice-phish",
    category: "Messenger",
    name: "Messenger phish impersonating accounting",
    description:
      "A Teams-style message arrives from someone using the accounting contact's name but " +
      "an outside address, pushing the learner to open an invoice link. A toast shows a " +
      "snapshot; if it lapses, a tray badge waits instead. Opening the conversation puts a " +
      "choice to the learner. Calling the accountant ends it; anything else gets a second, " +
      "pushier message and a second choice.",
    defaultEnabled: true,
    // The link goes to a portal that wants the invoice "confirmed" - the theft happens on
    // the landing page, not on the click, which is what makes this Data Entry rather than
    // Drive by.
    phishing: "dataEntry",
    // One of the attacks the day planner may draw. No audience: this is the fallback that
    // suits any learner.
    messenger: { kind: "malicious" },
    apply: async ({ desktop, scenario }) => {
      const impersonated = scenario.cast.accounting;
      const threadId = "messenger-invoice-phish";

      const thread = {
        id: threadId,
        appName: t("chat.appName"),
        title: getFullName(impersonated)
      };

      // Display name is the real colleague's; the address is the only tell.
      const handle = `${impersonated.firstName.toLowerCase()}.${impersonated.lastName.toLowerCase()}@${scenario.company.lookalikeDomain}`;
      const invoiceUrl = `https://${scenario.company.lookalikeDomain}/invoice/8841`;

      /**
       * Puts the learner's answer into the thread, so the conversation reads as one after
       * they have replied rather than as a monologue.
       *
       * `ignore` gets no bubble: choosing not to reply means nothing was sent.
       */
      const postReply = (stage: number, choiceId: string | null): void => {
        if (!choiceId || choiceId === "ignore") {
          return;
        }

        desktop.postChatMessage(thread, {
          id: `invoice-reply-${stage}-${choiceId}`,
          author: getFullName(scenario.learner),
          avatarText: getInitial(scenario.learner.firstName),
          paragraphs: [t(`events.messengerPhish.threadReplies.${choiceId}`)],
          fromLearner: true
        });
      };

      // `toastBody` rather than a notify() call: the messenger raises the toast itself,
      // and only while the conversation is not already on screen.
      desktop.postChatMessage(thread, {
        id: "invoice-1",
        author: getFullName(impersonated),
        handle,
        avatarText: getInitial(impersonated.firstName),
        paragraphs: [
          t("events.messengerPhish.first.greeting", { first: scenario.learner.firstName }),
          t("events.messengerPhish.first.body")
        ],
        link: {
          label: t("events.messengerPhish.first.linkLabel"),
          url: invoiceUrl,
          risk: "malicious"
        },
        toastBody: t("events.messengerPhish.toast")
      });

      // Wait for the learner to come to the conversation rather than pushing a prompt at
      // them with no context.
      await desktop.awaitChatOpened(threadId);

      // Let the conversation register before asking about it.
      await beat(2);

      const first = await desktop.askChoice({
        id: "messenger-invoice-phish",
        // No scrim: the learner has to be able to re-read the message, hover the link and
        // check the sender's address WHILE deciding. Dimming the desktop would hide the
        // very evidence the choice is about. Time is still paused either way.
        appearance: { scrim: false },
        context: {
          title: getFullName(impersonated),
          body: t("events.messengerPhish.first.ask"),
          avatarText: getInitial(impersonated.firstName)
        },
        choices: (["clickLink", "callAccountant", "later", "contactSecurity"] as const).map(
          (id) => ({
            id,
            label: t(`events.messengerPhish.choices.${id}`),
            detail: t(`events.messengerPhish.says.${id}`),
            risk:
              id === "clickLink"
                ? ("risky" as const)
                : id === "callAccountant"
                  ? ("safe" as const)
                  : ("neutral" as const)
          })
        )
      });

      postReply(1, first.choiceId);

      // Verifying out of band is the one answer that ends it.
      if (first.choiceId === "callAccountant") {
        // A direct notify, not a chat message: this is the outcome of the learner's own
        // action, not another line from the impersonator. It is the only acknowledgement
        // the correct answer gets, so it is not held back for an open window.
        desktop.notify({
                         // coaching about a messenger exchange.
                         source: "messenger",
          title: getFullName(impersonated),
          body: t("events.messengerPhish.verified"),
          tone: "info",
          holdSeconds: 8
        });

        desktop.resolveChatThread(threadId);

        return;
      }

      // Anything else and the impersonator pushes harder.
      desktop.postChatMessage(thread, {
        id: "invoice-2",
        author: getFullName(impersonated),
        handle,
        avatarText: getInitial(impersonated.firstName),
        paragraphs: [
          t("events.messengerPhish.second.body"),
          t("events.messengerPhish.second.pressure")
        ],
        link: {
          label: t("events.messengerPhish.second.linkLabel"),
          url: invoiceUrl,
          risk: "malicious"
        },
        // Only raised if the learner has since closed the window; if they are still
        // reading, the new line simply appears in front of them.
        toastBody: t("events.messengerPhish.toastFollowUp"),
        toastTone: "warning"
      });

      // Resolves at once when the window is still open.
      await desktop.awaitChatOpened(threadId);

      // The second answer is logged like any other. A follow-up event can hang off it via
      // an onLearnerAction trigger matching "messenger-invoice-phish-follow-up:<choiceId>",
      // which is why nothing is scheduled here yet.
      await beat(2);

      const second = await desktop.askChoice({
        id: "messenger-invoice-phish-follow-up",
        // No scrim: the learner has to be able to re-read the message, hover the link and
        // check the sender's address WHILE deciding. Dimming the desktop would hide the
        // very evidence the choice is about. Time is still paused either way.
        appearance: { scrim: false },
        context: {
          title: getFullName(impersonated),
          body: t("events.messengerPhish.second.ask"),
          avatarText: getInitial(impersonated.firstName)
        },
        choices: (["clickLink", "callAccountant", "ignore", "reportSecurity"] as const).map(
          (id) => ({
            id,
            label: t(`events.messengerPhish.followUpChoices.${id}`),
            detail: t(`events.messengerPhish.followUpSays.${id}`),
            risk:
              id === "clickLink"
                ? ("risky" as const)
                : id === "ignore"
                  ? ("neutral" as const)
                  : ("safe" as const)
          })
        )
      });

      postReply(2, second.choiceId);
      desktop.resolveChatThread(threadId);
    }
  }
,
  {
    id: "facilities-permit-call",
    category: "Mail",
    name: "Legitimate call-back request from the service desk",
    description:
      "A genuine internal email asking the learner to phone the service desk to finish a " +
      "scheduled laptop encryption check. Real company domain, and the number matches the " +
      "one already in the learner's notes, so calling it is the correct answer. It exists " +
      "so the simulation does not teach that a phone number in an email is itself the " +
      "tell - without a legitimate counterexample, 'never call' scores better than " +
      "'verify', which is the wrong lesson. Reporting it is recorded as a false positive.",
    defaultEnabled: true,
    // Deliberately unclassified: this is not phishing, and phishing coverage must never
    // silence it. Turning off T.O.A.D. removes the attack and leaves the honest call.
    apply: async ({ desktop, scenario, atMinutes }) => {
      const messageId = "service-desk-encryption";
      const receivedLabel = clockTimeLabel(getClockAt(scenario.dayStart, atMinutes));
      const deskName = t("events.serviceDeskCall.senderName");

      desktop.addInboxMessage({
        id: messageId,
        senderName: deskName,
        // The company's own domain, which is the reassurance the lookalike cannot forge.
        senderAddress: `servicedesk@${scenario.company.domain}`,
        subject: t("events.serviceDeskCall.subject"),
        preview: t("events.serviceDeskCall.preview"),
        paragraphs: [
          t("events.serviceDeskCall.greeting", { first: scenario.learner.firstName }),
          t("events.serviceDeskCall.body"),
          t("events.serviceDeskCall.closing")
        ],
        phone: {
          label: t("events.serviceDeskCall.phoneLabel"),
          number: scenario.helpdeskNumber
        },
        receivedLabel,
        toastBody: t("events.serviceDeskCall.toast")
      });

      await desktop.awaitEmailOpened(messageId);
      await beat(2);

      const outcome = await desktop.askChoice({
        id: "facilities-permit-call",
        // No scrim: the number in the message is the thing being judged, so it has to stay
        // readable while deciding - and it is what the learner should be comparing.
        appearance: { scrim: false },
        context: {
          title: deskName,
          body: t("events.serviceDeskCall.ask"),
          avatarText: "\u260E"
        },
        choices: (["checkNotesFirst", "callNumber", "ignore", "reportPhishing"] as const).map(
          (id) => ({
            id,
            label: t(`events.serviceDeskCall.choices.${id}`),
            detail: t(`events.serviceDeskCall.says.${id}`),
            // Checking first then calling is the behaviour worth reinforcing; calling a
            // number that happens to be right is a good outcome from a weaker habit.
            risk:
              id === "checkNotesFirst" || id === "callNumber"
                ? ("safe" as const)
                : ("neutral" as const)
          })
        )
      });

      if (outcome.choiceId === "checkNotesFirst" || outcome.choiceId === "callNumber") {
        await dial(desktop, {
          contactName: deskName,
          number: scenario.helpdeskNumber,
          numberSource:
            outcome.choiceId === "checkNotesFirst"
              ? t("phone.sources.notes")
              : t("phone.sources.email")
        });

        desktop.endCall();

        desktop.notify({
                         // the outcome of a call.
                         source: "phone",
          title: deskName,
          body: t(`events.serviceDeskCall.outcomes.${outcome.choiceId}`),
          tone: "info",
          holdSeconds: 10
        });

        return;
      }

      if (!outcome.choiceId) {
        return;
      }

      // Ignoring a real request, or reporting it as a phish, are both worth naming: a
      // false positive is a cost, not a win.
      desktop.notify({
                       // the outcome of a call.
                       source: "phone",
        title: deskName,
        body: t(`events.serviceDeskCall.outcomes.${outcome.choiceId}`),
        tone: "warning",
        holdSeconds: 10
      });
    }
  }
,
  {
    id: "card-verification-toad",
    category: "Mail",
    name: "T.O.A.D. corporate card verification callback",
    description:
      "A fraud alert borrowing the card issuer's brand from a lookalike domain, with no " +
      "link and no attachment - only a phone number. Calling the listed number puts the " +
      "learner on the phone with the attacker, who asks for the digits on the card; a " +
      "second choice decides what they hand over. Calling the number on the back of the " +
      "card, or the one published on the issuer's site, reaches the real issuer and ends " +
      "it. Both safe answers still place a call, because the lesson is verify the number, " +
      "not never phone anyone.",
    defaultEnabled: true,
    phishing: "toad",
    apply: async ({ desktop, scenario, atMinutes }) => {
      const issuer = scenario.cardIssuer;
      const messageId = "card-verification";
      const receivedLabel = clockTimeLabel(getClockAt(scenario.dayStart, atMinutes));

      desktop.addInboxMessage({
        id: messageId,
        senderName: t("events.cardToad.senderName", { issuer: issuer.name }),
        // The tell, for anyone who looks: the issuer's brand on someone else's domain.
        senderAddress: `fraud-alerts@${issuer.lookalikeDomain}`,
        subject: t("events.cardToad.subject"),
        preview: t("events.cardToad.preview"),
        paragraphs: [
          t("events.cardToad.greeting", { first: scenario.learner.firstName }),
          t("events.cardToad.body", { issuer: issuer.name }),
          t("events.cardToad.urgency")
        ],
        phone: {
          label: t("events.cardToad.phoneLabel"),
          number: issuer.spoofedNumber
        },
        receivedLabel,
        toastBody: t("events.cardToad.toast"),
        toastTone: "warning"
      });

      await desktop.awaitEmailOpened(messageId);
      await beat(2);

      const first = await desktop.askChoice({
        id: "card-verification-toad",
        appearance: { scrim: false },
        context: {
          title: issuer.name,
          body: t("events.cardToad.ask"),
          avatarText: "\u260E"
        },
        choices: (
          ["callListedNumber", "verifyNumber", "callNumberOnCard", "lookUpOfficialNumber"] as const
        ).map((id) => ({
          id,
          label: t(`events.cardToad.choices.${id}`),
          detail: t(`events.cardToad.says.${id}`),
          risk: id === "callListedNumber" ? ("risky" as const) : ("safe" as const)
        }))
      });

      /*
       * Both of these reach the real issuer. The handset shows the SAME contact name as the
       * attack path does - the learner believes they are calling the issuer either way - so
       * the only difference on screen is the number and the caption saying where it came
       * from. That contrast is the lesson, and it is why the safe answers place a real call
       * instead of just producing a message.
       */
      if (first.choiceId === "callNumberOnCard" || first.choiceId === "lookUpOfficialNumber") {
        await dial(desktop, {
          contactName: issuer.name,
          number: issuer.officialNumber,
          numberSource:
            first.choiceId === "callNumberOnCard"
              ? t("phone.sources.card")
              : t("phone.sources.website")
        });

        desktop.endCall();

        desktop.notify({
                         // the outcome of a call.
                         source: "phone",
          title: issuer.name,
          body: t("events.cardToad.outcomes.calledOfficial"),
          tone: "info",
          holdSeconds: 12
        });

        return;
      }

      if (first.choiceId === "verifyNumber") {
        desktop.notify({
                         // the outcome of a call.
                         source: "phone",
          title: issuer.name,
          body: t("events.cardToad.outcomes.verifiedMismatch", {
            official: issuer.officialNumber
          }),
          tone: "info",
          holdSeconds: 12
        });

        return;
      }

      if (first.choiceId !== "callListedNumber") {
        // Torn down rather than answered; nothing to say.
        return;
      }

      await dial(desktop, {
        contactName: issuer.name,
        number: issuer.spoofedNumber,
        numberSource: t("phone.sources.email")
      });

      // The call stays up through the choice: what is on the handset is the context for it.
      const second = await desktop.askChoice({
        id: "card-verification-toad-digits",
        appearance: { scrim: false },
        context: {
          title: t("events.cardToad.callee", { issuer: issuer.name }),
          body: t("events.cardToad.digits.ask"),
          avatarText: "\u260E"
        },
        choices: (["readDigits", "lastFourOnly", "refuse", "hangUpAndCallCard"] as const).map(
          (id) => ({
            id,
            label: t(`events.cardToad.digitChoices.${id}`),
            detail: t(`events.cardToad.digitSays.${id}`),
            // Reading out only the last four still hands over something the caller can use
            // to sound legitimate to the real issuer, so it is not a middle ground.
            risk:
              id === "readDigits" || id === "lastFourOnly" ? ("risky" as const) : ("safe" as const)
          })
        )
      });

      // Hanging up and dialling the number on the card is the recovery, and it deserves to
      // be shown as one - a second call, to the right number this time.
      if (second.choiceId === "hangUpAndCallCard") {
        desktop.endCall();
        await beat(1);

        await dial(desktop, {
          contactName: issuer.name,
          number: issuer.officialNumber,
          numberSource: t("phone.sources.card")
        });
      }

      desktop.endCall();

      if (!second.choiceId) {
        return;
      }

      desktop.notify({
                       // the outcome of a call.
                       source: "phone",
        title: issuer.name,
        body: t(`events.cardToad.outcomes.${second.choiceId}`),
        tone: second.choiceId === "readDigits" || second.choiceId === "lastFourOnly"
          ? "warning"
          : "info",
        holdSeconds: 12
      });
    }
  },
  benignConversation({
    id: "messenger-picnic-chat",
    stringKey: "picnic",
    role: "marketingVp",
    choiceIds: ["loved", "missedIt", "photos"],
    name: "Small talk about the company picnic",
    description:
      "The marketing VP asks what the learner made of the picnic. Suits anyone, and is " +
      "the most likely opener."
  })
,
  benignConversation({
    id: "messenger-return-checkin",
    stringKey: "returnCheckin",
    role: "narrator",
    choiceIds: ["fine", "catchingUp", "straightIn"],
    name: "Coworker checks in on the first day back",
    description:
      "The coworker who briefed the learner asks how the morning is going, and mentions " +
      "shouting if anything odd turns up in the inbox. Suits anyone."
  })
,
  benignConversation({
    id: "messenger-report-nudge",
    stringKey: "reportNudge",
    role: "supervisor",
    choiceIds: ["thursday", "needMore", "alreadySent"],
    // Not a message someone who started last week would get - they have no quarterly
    // summary to move.
    audience: { tenures: ["0-2 years", "2-5 years", "5-10 years", "10+ years"] },
    name: "Supervisor moves a reporting deadline",
    description:
      "The supervisor asks whether the quarterly summary can slip to Thursday. Excluded " +
      "for New Hires, who would have nothing to move."
  })
,
  benignConversation({
    id: "messenger-lunch-plan",
    stringKey: "lunchPlan",
    role: "salesManager",
    choiceIds: ["in", "out", "whereTo"],
    // No audience: suits anyone, which is what gives every learner a fourth eligible
    // benign conversation and so an actual choice of which three they get.
    name: "Team lunch invitation",
    description:
      "The sales manager is rounding people up for lunch. Suits anyone, and exists so " +
      "that every learner has more eligible benign conversations than slots to fill - " +
      "without that the only variety left is the ordering."
  })
,
  benignConversation({
    id: "messenger-onboarding-checkin",
    stringKey: "onboarding",
    role: "hrBenefits",
    choiceIds: ["allGood", "haveQuestions", "laterToday"],
    // The mirror image: only plausible while onboarding is still recent.
    audience: { tenures: ["New Hire", "0-2 years"] },
    name: "HR checks in on onboarding paperwork",
    description:
      "HR asks whether the onboarding paperwork makes sense. Only for New Hires and the " +
      "0-2 year band, which is what makes the benign set differ by tenure."
  })
,
  {
    id: "messenger-thread-hijack",
    category: "Messenger",
    name: "Reply-to impersonation of the supervisor",
    description:
      "Opens with a harmless question and waits for an answer before asking for anything. " +
      "Once there is a reply above it, the real ask arrives: confirm a change to a " +
      "vendor's bank details. No link and no attachment - the trust bought by the first " +
      "exchange IS the attack, which is what makes it Reply-to. Drawn only for learners " +
      "rated 2 or safer, who get the subtler of the two attacks.",
    defaultEnabled: true,
    phishing: "replyTo",
    messenger: { kind: "malicious", audience: { maxSecurityRating: 2 } },
    apply: async ({ desktop, scenario }) => {
      const impersonated = scenario.cast.supervisor;
      const threadId = "messenger-thread-hijack";
      const text = (path: string) => t(`events.messengerHijack.${path}`);

      const thread = {
        id: threadId,
        appName: t("chat.appName"),
        title: getFullName(impersonated)
      };

      // The supervisor's real name, at a domain that is not the company's.
      const handle = `${impersonated.firstName.toLowerCase()}.${impersonated.lastName.toLowerCase()}@${scenario.company.lookalikeDomain}`;

      const fromThem = (id: string, paragraphs: string[], toastBody?: string) => {
        desktop.postChatMessage(thread, {
          id,
          author: getFullName(impersonated),
          handle,
          avatarText: getInitial(impersonated.firstName),
          paragraphs,
          ...(toastBody ? { toastBody } : {})
        });
      };

      const fromLearner = (id: string, line: string) => {
        desktop.postChatMessage(thread, {
          id,
          author: getFullName(scenario.learner),
          avatarText: getInitial(scenario.learner.firstName),
          paragraphs: [line],
          fromLearner: true
        });
      };

      /* ---- beat one: nothing is asked for, which is the point ---- */
      fromThem("hijack-1", [text("opening")], text("toast"));

      await desktop.awaitChatOpened(threadId);
      await beat(2);

      const first = await desktop.askChoice({
        id: "messenger-thread-hijack",
        appearance: { scrim: false },
        context: {
          title: getFullName(impersonated),
          body: text("firstAsk"),
          avatarText: getInitial(impersonated.firstName)
        },
        // Still no risk attached: nothing has been asked for yet, and replying to your
        // supervisor is not a mistake. The decision that matters is the next one.
        choices: (["atDesk", "inAMeeting", "whatIsIt"] as const).map((id) => ({
          id,
          label: text(`firstChoices.${id}`),
          detail: text(`firstLines.${id}`)
        }))
      });

      if (!first.choiceId) {
        desktop.resolveChatThread(threadId);
        return;
      }

      fromLearner("hijack-reply-1", text(`firstLines.${first.choiceId}`));
      await beat(2);

      /* ---- beat two: the ask, now with a conversation above it ---- */
      fromThem("hijack-2", [text("payload"), text("pressure")], text("payloadToast"));

      await desktop.awaitChatOpened(threadId);
      await beat(2);

      const second = await desktop.askChoice({
        id: "messenger-thread-hijack-payload",
        appearance: { scrim: false },
        context: {
          title: getFullName(impersonated),
          body: text("secondAsk"),
          avatarText: getInitial(impersonated.firstName)
        },
        choices: (["confirm", "callThem", "report", "later"] as const).map((id) => ({
          id,
          label: text(`secondChoices.${id}`),
          detail: text(`secondLines.${id}`),
          risk:
            id === "confirm"
              ? ("risky" as const)
              : id === "later"
                ? ("neutral" as const)
                : ("safe" as const)
        }))
      });

      if (second.choiceId) {
        fromLearner("hijack-reply-2", text(`secondLines.${second.choiceId}`));

        desktop.notify({
                         // coaching about a messenger exchange.
                         source: "messenger",
          title: getFullName(impersonated),
          body: text(`outcomes.${second.choiceId}`),
          tone: second.choiceId === "confirm" ? "warning" : "info",
          holdSeconds: 12
        });
      }

      desktop.resolveChatThread(threadId);
    }
  }
,
  {
    id: "messenger-day-plan",
    category: "Messenger",
    name: "Messenger conversations for the day",
    description:
      "Chooses which conversations this learner gets and spaces them across the day. " +
      "Exactly one is an attack and it is never the first, so the learner meets the " +
      "messenger doing something harmless before it matters. Selection is seeded per " +
      "learner, so a profile always draws the same set. The count and the spacing are " +
      "configured above; switching a conversation off here removes it from the draw.",
    defaultEnabled: true,
    apply: ({ scenario, settings, schedule }) => {
      const plan = planMessengerDay({
        events: SIM_EVENTS,
        settings,
        learner: scenario.learner,
        seed: `${scenario.company.id}:${scenario.learner.id}`
      });

      // Spaced rather than simultaneous: several conversations arriving at once would read
      // as a system doing something, not as a workday.
      plan.forEach((eventId, index) => {
        schedule(eventId, index * settings.messengerGapMinutes);
      });
    }
  }
];

export const SIM_TRIGGERS: TriggerDefinition[] = [
  {
    id: "wifi-notice-while-disconnected",
    eventId: "wifi-not-connected-notice",
    name: "Whenever there is no connection",
    description:
      "Watches the connection state rather than sign-in, so it covers arriving " +
      "disconnected and any later event that drops the network. The first prompt comes " +
      "30 real seconds after going offline and repeats every 30 seconds until a network " +
      "is joined. The taskbar icon changes immediately either way - that is not " +
      "configurable.",
    defaultEnabled: true,
    condition: { type: "whileState", flag: "wifiDisconnected" },
    // No point prompting while the learner is already looking at the network list, and
    // a toast must not slide in over a choice the learner is answering.
    pauseWhile: ["wifiPanelOpen", "choiceOpen", "callActive", "personSpeaking"],
    repeat: {
      // Real seconds, so the prompt keeps human pace whatever the time lapse is. This
      // also sets when the first prompt appears. No occurrence ceiling: the
      // disconnected state is what bounds it.
      everySeconds: 30
    }
  }
,
  {
    id: "coworker-check-in-midmorning",
    eventId: "coworker-check-in",
    name: "Half an hour into the day",
    description:
      "Simulated time, not real seconds: this belongs to the fiction of the workday, so " +
      "it moves with the time lapse. 30 minutes in is 08:30 with the default workday.",
    defaultEnabled: true,
    condition: { type: "atSimTime", minutesFromDayStart: 30 }
  }
,
  {
    id: "messenger-day-start",
    eventId: "messenger-day-plan",
    name: "Early in the morning",
    description:
      "Fires once, and everything in the messenger follows from it. 20 minutes in means " +
      "the learner has had a moment to look around before the first message arrives. The " +
      "individual conversations have no trigger of their own - the plan schedules them.",
    defaultEnabled: true,
    condition: { type: "atSimTime", minutesFromDayStart: 20 }
  },
  {
    id: "service-desk-call-midmorning",
    eventId: "facilities-permit-call",
    name: "An hour into the day",
    description:
      "Placed BEFORE the T.O.A.D. attack on purpose. The learner meets a legitimate " +
      "call-back request first, so the later attack tests whether they can tell the two " +
      "apart rather than teaching them that any phone number is a trap.",
    defaultEnabled: true,
    condition: { type: "atSimTime", minutesFromDayStart: 60 }
  }
,
  {
    id: "card-toad-late-morning",
    eventId: "card-verification-toad",
    name: "Late morning",
    description:
      "45 simulated minutes after the legitimate call-back request, so the honest one is " +
      "recent enough to be the thing this is compared against.",
    defaultEnabled: true,
    condition: { type: "atSimTime", minutesFromDayStart: 105 }
  }
];

export function getEventById(eventId: string): SimEventDefinition | undefined {
  return SIM_EVENTS.find((event) => event.id === eventId);
}

/** Default enable flags, forming the base of the config cascade. */
export function getDefaultEventToggles(): Record<string, boolean> {
  return Object.fromEntries(SIM_EVENTS.map((event) => [event.id, event.defaultEnabled]));
}

export function getDefaultTriggerToggles(): Record<string, boolean> {
  return Object.fromEntries(
    SIM_TRIGGERS.map((trigger) => [trigger.id, trigger.defaultEnabled])
  );
}
