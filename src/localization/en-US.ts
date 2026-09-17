export const enUS = {
  app: {
    title: "Busy Monday Simulation"
  },

  personalization: {
    heading: "Let’s personalize your<br />desktop simulation experience!",
    privacyNote:
      "No information will be saved or transmitted in this simulation. As an additional safety measure, please do not enter real world information.",
    companyLabel: "Company",
    profileLabel: "Employee profile",
    profileOption: "{name} — {department}",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter a password",
    passwordNote:
      "This password is for use in this instance of the simulation only.<br />Do not use any known password.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    start: "Start Simulation",
    summaryEmail: "Work email",
    summaryDepartment: "Department",
    summaryTenure: "Years with company",
    summaryRating: "Security rating",
    summaryLocation: "Location"
  },

  userConfig: {
    open: "Preferences",
    title: "Your preferences",
    intro:
      "Adjust how the simulation runs for you. Your organization decides which options are available.",
    languageHelp: "Applies immediately, across the whole simulation.",
    timeLapseLabel: "Time lapse",
    timeLapseHelp: "Real minutes per simulated hour.",
    timeLapseUnit: "min per simulated hour",
    workdayLabel: "Simulated workday",
    dayLengthLabel: "A full day takes",
    dayLengthValue: "{minutes} real minutes",
    lockedNotice: "Your organization has not enabled any other options.",
    temperatureLabel: "Desktop temperature",
    temperatureHelp: "Shown on the taskbar weather widget.",
    temperatureUnitLabel: "Temperature unit",
    resetToOrg: "Use organization default",
    back: "Back"
  },

  departments: {
    accounting: "Accounting",
    customerService: "Customer Service",
    engineering: "Engineering",
    executive: "Executive",
    finance: "Finance",
    hr: "HR",
    it: "IT",
    legal: "Legal",
    maintenance: "Maintenance",
    marketing: "Marketing",
    operations: "Operations",
    payroll: "Payroll",
    purchasing: "Purchasing",
    sales: "Sales"
  },

  temperatureUnits: {
    fahrenheit: "Fahrenheit (°F)",
    celsius: "Celsius (°C)"
  },

  tenure: {
    newHire: "New Hire",
    upToTwo: "0-2 years",
    twoToFive: "2-5 years",
    fiveToTen: "5-10 years",
    tenPlus: "10+ years"
  },

  securityRating: {
    unrated: "Not yet rated",
    scale: "{rating} of 4"
  },

  intro: {
    returnText:
      "You return to work at {company} from some well-earned time off. After getting back into your chair, your colleague, {coworker}, whom you've known for years, greets you...",
    continue: "Continue"
  },

  markVideo: {
    loginToDesktop: "Login to the Desktop",
    replay: "Replay",
    videoLabel: "{coworker} explains what you missed while you were away."
  },

  login: {
    passwordLabel: "Password",
    passwordPlaceholder: "Password",
    signIn: "Sign in",
    incorrectPassword: "The password is incorrect. Try again.",
    backToBriefing: "Back to briefing"
  },

  desktop: {
    timePaused: "Simulated time is paused",
    emailIcon: "Email",
    notesIcon: "Notes",
    startLabel: "Start",
    searchLabel: "Search",
    widgetsLabel: "Widgets, {temperature}",
    volumeLabel: "Volume",
    dismissNotification: "Dismiss notification",
    minimize: "Minimize",
    maximize: "Maximize"
  },

  desktopMenu: {
    view: "View",
    icons: { large: "Large icons", medium: "Medium icons", small: "Small icons" },
    refresh: "Refresh",
    paste: "Paste",
    displaySettings: "Display settings",
    personalize: "Personalize",
    managedTitle: "Managed by your organization",
    managedBody: "Your IT administrator has locked these settings."
  },

  email: {
    windowTitle: "Mail",
    selectEmail: "Select an email.",
    selectEmailHint: "Select a message from the inbox to preview it.",
    close: "Close",
    to: "To: {recipient}",
    receivedBenefits: "Today, 7:12 AM",
    receivedPicnic: "Today, 7:38 AM",
    receivedMeeting: "Today, 7:55 AM",

    ribbon: {
      newMail: "New mail",
      reply: "Reply",
      archive: "Archive",
      report: "Report",
      delete: "Delete"
    },

    folders: {
      favorites: "Favorites",
      inbox: "Inbox",
      sent: "Sent",
      drafts: "Drafts",
      deleted: "Deleted Items",
      focused: "Focused"
    },

    subjects: {
      benefits: "Benefits enrollment expires today",
      picnic: "Company picnic photos",
      meeting: "Possible meeting later today"
    },

    benefits: {
      heading: "Benefits enrollment expires today",
      greeting: "Hello,",
      body: "Please confirm your benefits information immediately.",
      urgency:
        "Your enrollment window expires today. Use the link below to avoid losing access to your benefits.",
      linkLabel: "Confirm benefits information",
      hoverTarget: "Hover target:"
    },

    picnic: {
      heading: "Company picnic photos",
      body: "Here are the photos from the company picnic.",
      linkLabel: "View the picnic album",
      noAction: "No action needed."
    },

    meeting: {
      heading: "Possible meeting later today",
      body: "I may send a meeting invite later once I have the details confirmed."
    }
  },

  notes: {
    windowTitle: "Notes",
    heading: "My Notes",
    listLabel: "Known coworkers and leaders",

    roles: {
      narrator: "Coworker. Shared the morning update when you returned.",
      hrBenefits: "HR benefits manager. Benefits information may come from {first} or HR.",
      supervisor: "Supervisor. May follow up about last week's purchase.",
      ceo: "CEO. Stopped by the company picnic.",
      cto: "CTO. A meeting invite may come from {first} later today.",
      salesManager:
        "Sales manager. The sales team is still talking about winning one of the picnic games.",
      marketingVp: "Marketing VP. Took photos at the company picnic."
    },

    helpdeskHeading: "IT service desk",
    helpdeskBody:
      "{number}. The only number to call for IT. It is on the back of your badge too.",
    cardHeading: "{issuer} — corporate card",
    cardBody:
      "Card services: {number}. Printed on the back of the card, and the same number on {website}. Anything else is not them.",
    wifiHeading: "Wi-Fi: {ssid}",
    wifiBody:
      "The only office network IT told us to use. Note the hyphen — anything without it is not ours."
  },

  choice: {
    instruction: "Choose a response",
    timeRemaining: "Time remaining"
  },

  phone: {
    // Used to announce a phone toast to a screen reader.
    appName: "Phone",
    dialing: "Dialing…",
    callLabel: "Call to {contact} on {number}",
    sources: {
      email: "Number taken from the email",
      card: "Number from the back of your card",
      website: "Number from the issuer's own website",
      notes: "Number from your own notes",
    }
  },

  // Someone physically in the room. See SpokenLine in src/events/types.ts.
  inPerson: {
    whatDoYouSay: "What do you say?",
    speakingLabel: "{speaker} is speaking to you"
  },
  // Negative consequences. `incidents` is keyed promptId:choiceId; anything with
  // no entry falls back, so a newly risky answer is never left without a message.
  consequences: {
    dismiss: "Close and carry on with the day",
    fallback: {
      title: "That went wrong",
      body: "That answer would have caused real harm at work.",
      detail: "Take a moment, then carry on with the day.",
    },
    incidents: {
      "coworker-check-in:wifiPassword": {
        title: "You said the password out loud",
        body: "A password spoken across a desk is a password anyone nearby now has.",
        detail:
          "Nobody needs yours - not a colleague, not IT. Point them at the service desk instead.",
      },
      "messenger-invoice-phish-follow-up:clickLink": {
        title: "You opened the link",
        body: "The page you landed on was built to take the credentials you typed into it.",
        detail:
          "The name on the message was real. The address it came from was not, and that was the only thing separating them.",
      },
      "card-verification-toad-digits:readDigits": {
        title: "You read out the card",
        body:
          "The full number and the security code are everything needed to spend on that card.",
        detail:
          "A card company already has your number. Being asked to read it back is the tell.",
      },
    },
  },
  chat: {
    appName: "Teams",
    close: "Close Teams",
    listTitle: "Messages",
    closeList: "Close message list",
    resolved: "Done",
    openConversation: "Open the conversation with {name}",
    trayLabel: "{app}",
    trayUnread: "{app}, {count} unread"
  },

  events: {
    messengerPhish: {
      toast: "Quick one about an unpaid invoice \u2014 can you look now?",
      toastFollowUp: "Following up \u2014 this needs doing before close of business.",
      verified: "Called the real number: no invoice was sent. Reported to security.",
      first: {
        greeting: "Hi {first}, sorry to message out of the blue.",
        body:
          "Finance flagged an unpaid supplier invoice against your cost centre. I need you to confirm it in the portal before the run closes at midday.",
        linkLabel: "Open invoice 8841",
        ask: "They want you to confirm an invoice through their link. What do you do?"
      },
      second: {
        body: "I know you are busy, but this one is holding up the whole payment run.",
        linkLabel: "Open invoice 8841 now",
        pressure:
          "If it is not confirmed in the next few minutes it goes to your manager as an exception. It takes thirty seconds.",
        ask: "They are pushing harder now. What do you do?"
      },
      choices: {
        clickLink: "Open the link",
        callAccountant: "Call accounting",
        later: "Say you will look later",
        contactSecurity: "Message security"
      },
      says: {
        clickLink: "Open the invoice link they sent.",
        callAccountant: "Ring the accounting team on the number you already have.",
        later: "\u201CI will get to it later today.\u201D",
        contactSecurity: "Forward the message to the security team and wait."
      },
      // What the learner sends into the thread, shared by both rounds. `ignore`
      // has no entry: not replying means nothing is posted.
      threadReplies: {
        clickLink: "Opening it now.",
        callAccountant: "Let me check this with accounting on the number I already have first.",
        later: "I will get to it later today.",
        contactSecurity: "I am passing this to our security team to look at.",
        reportSecurity: "I have reported this account to our security team."
      },
      followUpChoices: {
        clickLink: "Open it now",
        callAccountant: "Call accounting",
        ignore: "Stop replying",
        reportSecurity: "Report it"
      },
      followUpSays: {
        clickLink: "Give in and open the link.",
        callAccountant: "Ring the accounting team on the number you already have.",
        ignore: "Leave the conversation without replying.",
        reportSecurity: "Report the account to the security team."
      }
    },
    serviceDeskCall: {
      senderName: "IT Service Desk",
      subject: "Encryption check due on your laptop",
      preview: "Your laptop is due its quarterly encryption check.",
      greeting: "Hi {first},",
      body:
        "Your laptop is due its quarterly encryption check. It takes about five minutes and we run it over the phone. Give the service desk a ring whenever suits you.",
      closing: "No rush today — any time before Friday is fine.",
      phoneLabel: "Service desk",
      toast: "Encryption check due — call the service desk this week.",
      ask: "A routine request, and it wants you to phone in. What do you do?",
      choices: {
        checkNotesFirst: "Check my notes",
        callNumber: "Call the number",
        ignore: "Leave it",
        reportPhishing: "Report as phishing",
      },
      says: {
        checkNotesFirst: "Compare the number against the one in your own notes, then call.",
        callNumber: "Ring the number in the email.",
        ignore: "Do nothing for now.",
        reportPhishing: "Send it to the security team as a suspected phish.",
      },
      outcomes: {
        checkNotesFirst:
          "The number matched your notes, and the service desk ran the check in four minutes. That is the habit: the number, then the call.",
        callNumber:
          "The service desk answered and ran the check. This one was genuine — though you had no way of knowing that before you dialed.",
        ignore:
          "Nothing bad happened, but the check is still outstanding and the service desk will chase it.",
        reportPhishing:
          "Security confirmed it was genuine. No harm done — but reporting real mail has a cost, and the number was in your notes all along.",
      }
    },
    cardToad: {
      senderName: "{issuer} Fraud Prevention",
      subject: "Action required: verify recent activity on your corporate card",
      preview: "We have blocked a transaction on your corporate card.",
      greeting: "Dear {first},",
      body:
        "We have placed a temporary block on your {issuer} corporate card after a transaction we were unable to verify. To lift the block, please call our verification line and confirm your card details with an advisor.",
      urgency:
        "If we do not hear from you within 24 hours the card will be cancelled and a replacement issued to your head office.",
      phoneLabel: "Verification line",
      toast: "A transaction on your corporate card has been blocked.",
      ask: "The email wants you to phone the number it gives. What do you do?",
      callee: "{issuer} advisor",
      choices: {
        callListedNumber: "Call the listed number",
        verifyNumber: "Check the number",
        callNumberOnCard: "Call the card number",
        lookUpOfficialNumber: "Look it up",
      },
      says: {
        callListedNumber: "Ring the verification line printed in the email.",
        verifyNumber: "Compare the number in the email against the one you already have.",
        callNumberOnCard: "Ignore their number and ring the one on the back of the card.",
        lookUpOfficialNumber: "Find the issuer's number yourself, on their own website.",
      },
      digits: {
        ask:
          "The advisor asks you to read out the long number on the front of the card and the three digits on the back. What do you do?",
      },
      digitChoices: {
        readDigits: "Read them out",
        lastFourOnly: "Give the last four",
        refuse: "Refuse and hang up",
        hangUpAndCallCard: "Hang up, call the card",
      },
      digitSays: {
        readDigits: "Read out the full card number and the security code.",
        lastFourOnly: "Offer only the last four digits, to be safe.",
        refuse: "Say you will not read out card details, and end the call.",
        hangUpAndCallCard: "End the call and ring the number on the back of the card instead.",
      },
      outcomes: {
        calledOfficial:
          "The real card services team has no record of a block or of any unverified transaction. The email was not from them, and the number in it was never theirs.",
        verifiedMismatch:
          "The number in the email is not the issuer's. Their published line is {official}, the one on the back of the card. There is nothing to call back.",
        readDigits:
          "That was not the card company. The full number and the security code are enough to spend on the card — and the call is why they never had to break anything.",
        lastFourOnly:
          "Four digits, to someone who was not the card company. Those four are what will make their next call to the real issuer sound like you.",
        refuse:
          "Right call. A card company already holds your card number and never needs you to read it back to them.",
        hangUpAndCallCard:
          "The number on the card reached the real card services team, who confirmed there was no block. Hanging up mid-call is always allowed.",
      }
    },
    messengerChats: {
      picnic: {
        opening:
          "That picnic went better than I expected. Sales are still telling everyone they won the tug of war.",
        toast: "Sales are still claiming they won the tug of war.",
        ask: "What do you say?",
        choices: {
          loved: "It was a good day",
          missedIt: "I missed it",
          photos: "Ask about the photos",
        },
        lines: {
          loved: "It was a genuinely good day. Best one we have had in a while.",
          missedIt: "I was away that week — sorry to have missed it.",
          photos: "Did anyone actually get photos of the tug of war?",
        },
        closing: "I will dig some out. Right, back to it.",
      },
      returnCheckin: {
        opening:
          "Morning! How is the first day back going? Give me a shout if anything odd has turned up in your inbox.",
        toast: "How is the first day back going?",
        ask: "How do you reply?",
        choices: {
          fine: "All fine so far",
          catchingUp: "Still catching up",
          straightIn: "Straight into it",
        },
        lines: {
          fine: "All fine so far, thanks.",
          catchingUp: "Still working through the inbox, but getting there.",
          straightIn: "Straight into it — no easing in this morning.",
        },
        closing: "Good. I am around if you need anything.",
      },
      reportNudge: {
        opening:
          "Quick one — can the quarterly summary wait until Thursday? The review got moved.",
        toast: "Can the quarterly summary wait until Thursday?",
        ask: "What do you tell them?",
        choices: {
          thursday: "Thursday is fine",
          needMore: "Ask for longer",
          alreadySent: "It is already sent",
        },
        lines: {
          thursday: "Thursday works, no problem.",
          needMore: "Could I have until Friday? Thursday is tight.",
          alreadySent: "It went over last week — I will resend it.",
        },
        closing: "Thanks, that helps. Talk later.",
      },
      lunchPlan: {
        opening: "A few of us are getting lunch at half twelve. Want in?",
        toast: "A few of us are getting lunch at half twelve.",
        ask: "What do you say?",
        choices: {
          in: "Count me in",
          out: "Not today",
          whereTo: "Ask where",
        },
        lines: {
          in: "Count me in, I could do with getting out of the building.",
          out: "Not today, thanks — too much to get through.",
          whereTo: "Where are you all going?",
        },
        closing: "Fair enough. We are at the usual place if you change your mind.",
      },
      onboarding: {
        opening:
          "Hi {first}, just checking the onboarding paperwork is making sense. Anything still outstanding at your end?",
        toast: "Checking your onboarding paperwork is all making sense.",
        ask: "How do you answer?",
        choices: {
          allGood: "All done",
          haveQuestions: "I have questions",
          laterToday: "Later today",
        },
        lines: {
          allGood: "All done and submitted, I think.",
          haveQuestions: "A couple of questions, actually — can I send them over?",
          laterToday: "I will get to it later today.",
        },
        closing: "No rush. Ping me whenever.",
      },
    },
    messengerHijack: {
      opening: "Are you at your desk? Might need a hand with something for the review.",
      toast: "Are you at your desk?",
      firstAsk: "Your supervisor is asking if you are around. What do you say?",
      firstChoices: {
        atDesk: "I am here",
        inAMeeting: "In a meeting",
        whatIsIt: "Ask what it is",
      },
      firstLines: {
        atDesk: "At my desk — what do you need?",
        inAMeeting: "In a meeting for the next half hour. After that?",
        whatIsIt: "I am around. What is it?",
      },
      payload:
        "Finance need a vendor's bank details updated before the payment run closes. I cannot get into the portal from this laptop.",
      pressure:
        "Can you confirm the change from your side? I will send the new details over — it just needs someone to approve it.",
      payloadToast: "Need a vendor's bank details updated before the run closes.",
      secondAsk:
        "Now they want you to approve a change to a vendor's bank details. What do you do?",
      secondChoices: {
        confirm: "Approve it",
        callThem: "Call them",
        report: "Report it",
        later: "Say you cannot",
      },
      secondLines: {
        confirm: "Send them over and I will get it approved.",
        callThem: "Let me call you on your desk number before I touch anything.",
        report: "I am going to check this with the security team first.",
        later: "Bank changes are not something I can approve. Finance will have to do it.",
      },
      outcomes: {
        confirm:
          "A bank detail change is the payment that never comes back. The friendly exchange first is what made the ask feel like the next step — and the address it came from was never your supervisor's.",
        callThem:
          "Right call. The real supervisor knew nothing about it, and the number you already had reached them in seconds.",
        report:
          "Security already had two other reports of the same message. Checking before acting is what makes those reports worth anything.",
        later:
          "Declining kept the money safe, though the account is still out there. Reporting it would have warned everyone else too.",
      },
    },
    coworkerCheckIn: {
      role: "Coworker",
      question: "Morning! How's your day going so far?",
      choices: {
        fine: "All good",
        busy: "Swamped",
        offline: "Can't get online",
        wifiPassword: "Ask for the Wi-Fi password"
      },
      says: {
        fine: "\u201CGood, thanks.\u201D",
        busy: "\u201CBusy \u2014 a lot piled up while I was out.\u201D",
        offline: "\u201CNot great, I can\u2019t get online.\u201D",
        wifiPassword: "\u201CFine. Remind me of the Wi-Fi password?\u201D"
      },
      replies: {
        fine: "Good to hear. Shout if you need anything.",
        busy: "Tell me about it. Ease back into it.",
        offline: "Check the Wi-Fi list — make sure you pick the right network.",
        wifiPassword: "I'd rather not say it out loud. IT can sort you out."
      }
    },
    wifiNotConnected: {
      title: "No internet connection",
      body: "You are not connected to a network. Open Wi-Fi settings to connect."
    }
  },

  wifi: {
    panelTitle: "Wi-Fi",
    availableNetworks: "Available networks",
    closePanel: "Close Wi-Fi panel",
    buttonLabel: "Wi-Fi",
    noConnectionLabel: "Not connected to the internet",
    connectedLabel: "Connected to {ssid}",
    secured: "Secured",
    notSecured: "Not secured",
    connected: "Connected"
  },

  actions: {
    report: "Report",
    trust: "Trust",
    ignore: "Ignore"
  },

  feedback: {
    correctReport: "Good catch. The sender domain is {suspicious}, not {legitimate}.",
    riskyTrust: "This would be risky. The sender uses {suspicious} instead of {legitimate}.",
    ignoredMalicious:
      "Ignoring avoids clicking, but reporting would help protect the organization."
  },

  // Language and country names come from Intl.DisplayNames, not from these
  // dictionaries - see src/localization/labels.ts.
  language: {
    label: "Language"
  }
} as const;
