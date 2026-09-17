export const itIT = {
  app: {
    title: "Simulazione di un lunedì intenso"
  },

  personalization: {
    heading: "Personalizziamo la tua<br />simulazione del desktop!",
    privacyNote:
      "In questa simulazione nessuna informazione viene salvata o trasmessa. Come ulteriore misura di sicurezza, non inserire dati reali.",
    companyLabel: "Azienda",
    profileLabel: "Profilo del dipendente",
    profileOption: "{name} — {department}",
    passwordLabel: "Password",
    passwordPlaceholder: "Inserisci una password",
    passwordNote:
      "Questa password vale solo per questa istanza della simulazione.<br />Non usare password già in uso.",
    showPassword: "Mostra password",
    hidePassword: "Nascondi password",
    start: "Avvia simulazione",
    summaryEmail: "E-mail aziendale",
    summaryDepartment: "Reparto",
    summaryTenure: "Anzianità aziendale",
    summaryRating: "Valutazione di sicurezza",
    summaryLocation: "Sede"
  },

  userConfig: {
    open: "Preferenze",
    title: "Le tue preferenze",
    intro:
      "Adatta il funzionamento della simulazione. La tua organizzazione decide quali opzioni sono disponibili.",
    languageHelp: "Si applica immediatamente a tutta la simulazione.",
    timeLapseLabel: "Accelerazione del tempo",
    timeLapseHelp: "Minuti reali per ora simulata.",
    timeLapseUnit: "min per ora simulata",
    workdayLabel: "Giornata simulata",
    dayLengthLabel: "Una giornata intera dura",
    dayLengthValue: "{minutes} minuti reali",
    lockedNotice: "La tua organizzazione non ha abilitato altre opzioni.",
    temperatureLabel: "Temperatura del desktop",
    temperatureHelp: "Mostrata nel widget meteo della barra delle applicazioni.",
    temperatureUnitLabel: "Unità di temperatura",
    resetToOrg: "Usa il valore dell'organizzazione",
    back: "Indietro"
  },

  departments: {
    accounting: "Contabilità",
    customerService: "Assistenza clienti",
    engineering: "Ingegneria",
    executive: "Direzione",
    finance: "Finanza",
    hr: "Risorse umane",
    it: "IT",
    legal: "Ufficio legale",
    maintenance: "Manutenzione",
    marketing: "Marketing",
    operations: "Operazioni",
    payroll: "Ufficio paghe",
    purchasing: "Acquisti",
    sales: "Vendite"
  },

  temperatureUnits: {
    fahrenheit: "Fahrenheit (°F)",
    celsius: "Celsius (°C)"
  },

  tenure: {
    newHire: "Neoassunto",
    upToTwo: "0-2 anni",
    twoToFive: "2-5 anni",
    fiveToTen: "5-10 anni",
    tenPlus: "Oltre 10 anni"
  },

  securityRating: {
    unrated: "Non ancora valutato",
    scale: "{rating} su 4"
  },

  intro: {
    returnText:
      "Torni al lavoro presso {company} dopo un periodo di riposo meritato. Appena ti risiedi alla tua postazione, {coworker}, un collega che conosci da anni, ti saluta...",
    continue: "Continua"
  },

  markVideo: {
    loginToDesktop: "Accedi al desktop",
    replay: "Rivedi",
    videoLabel: "{coworker} racconta cosa ti sei perso durante la tua assenza."
  },

  login: {
    passwordLabel: "Password",
    passwordPlaceholder: "Password",
    signIn: "Accedi",
    incorrectPassword: "La password non è corretta. Riprova.",
    backToBriefing: "Torna al briefing"
  },

  desktop: {
    timePaused: "Il tempo simulato è in pausa",
    emailIcon: "Posta",
    notesIcon: "Blocco note",
    startLabel: "Start",
    searchLabel: "Cerca",
    widgetsLabel: "Widget, {temperature}",
    volumeLabel: "Volume",
    dismissNotification: "Chiudi la notifica",
    minimize: "Riduci a icona",
    maximize: "Ingrandisci"
  },

  desktopMenu: {
    view: "Visualizza",
    icons: {
      large: "Icone grandi",
      medium: "Icone medie",
      small: "Icone piccole"
    },
    refresh: "Aggiorna",
    paste: "Incolla",
    displaySettings: "Impostazioni schermo",
    personalize: "Personalizza",
    managedTitle: "Gestito dalla tua organizzazione",
    managedBody: "L'amministratore IT ha bloccato queste impostazioni."
  },

  email: {
    windowTitle: "Posta",
    selectEmail: "Seleziona un'e-mail.",
    selectEmailHint: "Seleziona un messaggio dalla posta in arrivo per visualizzarlo.",
    close: "Chiudi",
    to: "A: {recipient}",
    receivedBenefits: "Oggi, 07:12",
    receivedPicnic: "Oggi, 07:38",
    receivedMeeting: "Oggi, 07:55",

    ribbon: {
      newMail: "Nuovo messaggio",
      reply: "Rispondi",
      archive: "Archivia",
      report: "Segnala",
      delete: "Elimina"
    },

    folders: {
      favorites: "Preferiti",
      inbox: "Posta in arrivo",
      sent: "Posta inviata",
      drafts: "Bozze",
      deleted: "Posta eliminata",
      focused: "Prioritaria"
    },

    subjects: {
      benefits: "L'iscrizione ai benefit scade oggi",
      picnic: "Foto del picnic aziendale",
      meeting: "Possibile riunione nel corso della giornata"
    },

    benefits: {
      heading: "L'iscrizione ai benefit scade oggi",
      greeting: "Salve,",
      body: "Conferma immediatamente i dati relativi ai tuoi benefit.",
      urgency:
        "Il periodo di iscrizione scade oggi. Usa il link qui sotto per non perdere l'accesso ai tuoi benefit.",
      linkLabel: "Conferma i dati dei benefit",
      hoverTarget: "Destinazione del collegamento:"
    },

    picnic: {
      heading: "Foto del picnic aziendale",
      body: "Ecco le foto del picnic aziendale.",
      linkLabel: "Guarda l'album del picnic",
      noAction: "Nessuna azione richiesta."
    },

    meeting: {
      heading: "Possibile riunione nel corso della giornata",
      body: "Potrei inviare un invito a una riunione più tardi, appena avrò confermato i dettagli."
    }
  },

  notes: {
    windowTitle: "Blocco note",
    heading: "I miei appunti",
    listLabel: "Colleghi e responsabili conosciuti",

    roles: {
      narrator: "Collega. Ti ha aggiornato sulle novità della mattina al tuo rientro.",
      hrBenefits:
        "Responsabile dei benefit. Le informazioni sui benefit possono arrivare da {first} o dalle risorse umane.",
      supervisor: "Supervisore. Potrebbe chiedere aggiornamenti sull'acquisto della settimana scorsa.",
      ceo: "Amministratore delegato. È passato al picnic aziendale.",
      cto: "Direttore tecnico. Un invito a una riunione potrebbe arrivare da {first} nel corso della giornata.",
      salesManager:
        "Responsabile vendite. Il team commerciale parla ancora della vittoria a uno dei giochi del picnic.",
      marketingVp: "Direttore marketing. Ha scattato le foto al picnic aziendale."
    },

    helpdeskHeading: "Assistenza IT",
    helpdeskBody:
      "{number}. L'unico numero da chiamare per l'IT. È anche sul retro del tuo badge.",
    cardHeading: "{issuer} — carta aziendale",
    cardBody:
      "Servizio carte: {number}. Stampato sul retro della carta, e lo stesso numero su {website}. Qualsiasi altro numero non è loro.",
    wifiHeading: "Wi-Fi: {ssid}",
    wifiBody:
      "L'unica rete dell'ufficio autorizzata dall'IT. Attenzione al trattino — una rete senza trattino non è la nostra."
  },

  choice: {
    instruction: "Scegli una risposta",
    timeRemaining: "Tempo rimanente"
  },

  phone: {
    // Used to announce a phone toast to a screen reader.
    appName: "Telefono",
    dialing: "Chiamata in corso…",
    callLabel: "Chiamata a {contact} al {number}",
    sources: {
      email: "Numero preso dall'e-mail",
      card: "Numero sul retro della carta",
      website: "Numero dal sito ufficiale dell'emittente",
      notes: "Numero dai tuoi appunti",
    }
  },

  // Someone physically in the room. See SpokenLine in src/events/types.ts.
  inPerson: {
    whatDoYouSay: "Cosa rispondi?",
    speakingLabel: "{speaker} ti sta parlando"
  },
  // Negative consequences. `incidents` is keyed promptId:choiceId; anything with
  // no entry falls back, so a newly risky answer is never left without a message.
  consequences: {
    dismiss: "Chiudi e riprendi la giornata",
    fallback: {
      title: "È andata male",
      body: "Quella risposta avrebbe causato un danno reale al lavoro.",
      detail: "Prenditi un momento, poi riprendi la giornata.",
    },
    incidents: {
      "coworker-check-in:wifiPassword": {
        title: "Hai detto la password ad alta voce",
        body:
          "Una password pronunciata sopra una scrivania è una password che ora conoscono tutti i vicini.",
        detail:
          "Nessuno ha bisogno della tua: né un collega né il reparto IT. Indirizzali all assistenza.",
      },
      "messenger-invoice-phish-follow-up:clickLink": {
        title: "Hai aperto il link",
        body:
          "La pagina raggiunta era costruita per prendere le credenziali che vi avresti inserito.",
        detail:
          "Il nome sul messaggio era vero. L indirizzo da cui arrivava no, ed era l unica differenza.",
      },
      "card-verification-toad-digits:readDigits": {
        title: "Hai dettato la carta",
        body:
          "Il numero completo e il codice di sicurezza sono tutto ciò che serve per spendere con quella carta.",
        detail:
          "Chi emette la carta ha già il tuo numero. Che ti venga chiesto di dettarlo è proprio il segnale.",
      },
    },
  },
  chat: {
    appName: "Teams",
    close: "Chiudi Teams",
    listTitle: "Messaggi",
    closeList: "Chiudi l'elenco dei messaggi",
    resolved: "Completato",
    openConversation: "Apri la conversazione con {name}",
    trayLabel: "{app}",
    trayUnread: "{app}, {count} non letti"
  },

  events: {
    messengerPhish: {
      toast: "Una cosa veloce su una fattura non pagata \u2014 puoi guardare ora?",
      toastFollowUp: "Ti ricontatto \u2014 va fatto entro la chiusura.",
      verified: "Chiamato il numero vero: nessuna fattura è stata inviata. Segnalato alla sicurezza.",
      first: {
        greeting: "Ciao {first}, scusa il messaggio inatteso.",
        body:
          "La contabilità ha segnalato una fattura fornitore non pagata sul tuo centro di costo. Confermala nel portale prima della chiusura di mezzogiorno.",
        linkLabel: "Apri la fattura 8841",
        ask: "Ti chiedono di confermare una fattura tramite il loro link. Cosa fai?"
      },
      second: {
        body: "So che hai da fare, ma questo blocca tutto il ciclo dei pagamenti.",
        linkLabel: "Apri subito la fattura 8841",
        pressure:
          "Se non viene confermata nei prossimi minuti passa al tuo responsabile come eccezione. Ci vogliono trenta secondi.",
        ask: "Ora insistono. Cosa fai?"
      },
      choices: {
        clickLink: "Apri il link",
        callAccountant: "Chiama la contabilità",
        later: "Dire più tardi",
        contactSecurity: "Scrivi alla sicurezza"
      },
      says: {
        clickLink: "Aprire il link della fattura ricevuto.",
        callAccountant: "Telefonare alla contabilità al numero che hai già.",
        later: "\u00AB Ci penso più tardi oggi. \u00BB",
        contactSecurity: "Inoltrare il messaggio al team di sicurezza e attendere."
      },
      // What the learner sends into the thread, shared by both rounds. `ignore`
      // has no entry: not replying means nothing is posted.
      threadReplies: {
        clickLink: "Lo apro subito.",
        callAccountant: "Prima verifico con la contabilità al numero che ho già.",
        later: "Ci penso più tardi oggi.",
        contactSecurity: "Passo la cosa al nostro team di sicurezza.",
        reportSecurity: "Ho segnalato questo account al nostro team di sicurezza."
      },
      followUpChoices: {
        clickLink: "Aprirlo ora",
        callAccountant: "Chiama la contabilità",
        ignore: "Non rispondere più",
        reportSecurity: "Segnalarlo"
      },
      followUpSays: {
        clickLink: "Cedere e aprire il link.",
        callAccountant: "Telefonare alla contabilità al numero che hai già.",
        ignore: "Lasciare la conversazione senza rispondere.",
        reportSecurity: "Segnalare l'account al team di sicurezza."
      }
    },
    serviceDeskCall: {
      senderName: "Assistenza IT",
      subject: "Controllo di cifratura da fare sul tuo portatile",
      preview: "Il tuo portatile deve fare il controllo di cifratura trimestrale.",
      greeting: "Ciao {first},",
      body:
        "Il tuo portatile deve fare il controllo di cifratura trimestrale. Richiede circa cinque minuti e lo facciamo al telefono. Chiama l'assistenza quando ti è comodo.",
      closing: "Nessuna fretta oggi — va bene entro venerdì.",
      phoneLabel: "Assistenza",
      toast: "Controllo di cifratura da fare — chiama l'assistenza questa settimana.",
      ask: "Una richiesta di routine, e ti chiede di telefonare. Cosa fai?",
      choices: {
        checkNotesFirst: "Controllo i miei appunti",
        callNumber: "Chiamo il numero",
        ignore: "Lascio perdere",
        reportPhishing: "Segnalo come phishing",
      },
      says: {
        checkNotesFirst: "Confrontare il numero con quello nei tuoi appunti, poi chiamare.",
        callNumber: "Chiamare il numero indicato nell'e-mail.",
        ignore: "Non fare nulla per ora.",
        reportPhishing: "Inoltrarla al team di sicurezza come sospetto phishing.",
      },
      outcomes: {
        checkNotesFirst:
          "Il numero corrispondeva ai tuoi appunti e l'assistenza ha fatto il controllo in quattro minuti. L'abitudine giusta è questa: prima il numero, poi la chiamata.",
        callNumber:
          "L'assistenza ha risposto e ha fatto il controllo. Questa era autentica — ma non avevi modo di saperlo prima di chiamare.",
        ignore:
          "Non è successo niente di grave, ma il controllo resta da fare e l'assistenza ti ricontatterà.",
        reportPhishing:
          "La sicurezza ha confermato che era autentica. Nessun danno — ma segnalare posta vera ha un costo, e il numero era nei tuoi appunti dal principio.",
      }
    },
    cardToad: {
      senderName: "{issuer} — Prevenzione frodi",
      subject: "Azione richiesta: verifica un'operazione recente sulla tua carta aziendale",
      preview: "Abbiamo bloccato un'operazione sulla tua carta aziendale.",
      greeting: "Gentile {first},",
      body:
        "Abbiamo bloccato temporaneamente la tua carta aziendale {issuer} dopo un'operazione che non siamo riusciti a verificare. Per sbloccarla, chiama la nostra linea di verifica e conferma i dati della carta con un operatore.",
      urgency:
        "Se non ci contatti entro 24 ore la carta verrà annullata e una sostitutiva inviata alla tua sede centrale.",
      phoneLabel: "Linea di verifica",
      toast: "Un'operazione sulla tua carta aziendale è stata bloccata.",
      ask: "L'e-mail vuole che tu chiami il numero indicato. Cosa fai?",
      callee: "Operatore {issuer}",
      choices: {
        callListedNumber: "Chiamo quel numero",
        verifyNumber: "Verifico il numero",
        callNumberOnCard: "Chiamo il numero della carta",
        lookUpOfficialNumber: "Lo cerco io",
      },
      says: {
        callListedNumber: "Chiamare la linea di verifica indicata nell'e-mail.",
        verifyNumber: "Confrontare il numero dell'e-mail con quello che hai già.",
        callNumberOnCard: "Ignorare il loro numero e chiamare quello sul retro della carta.",
        lookUpOfficialNumber: "Cercare da solo il numero dell'emittente sul suo sito ufficiale.",
      },
      digits: {
        ask:
          "L'operatore ti chiede di leggere il numero lungo sul fronte della carta e le tre cifre sul retro. Cosa fai?",
      },
      digitChoices: {
        readDigits: "Le leggo",
        lastFourOnly: "Do le ultime quattro",
        refuse: "Rifiuto e chiudo",
        hangUpAndCallCard: "Chiudo, chiamo la carta",
      },
      digitSays: {
        readDigits: "Leggere il numero completo della carta e il codice di sicurezza.",
        lastFourOnly: "Dare soltanto le ultime quattro cifre, per prudenza.",
        refuse: "Dire che non leggerai i dati della carta e chiudere la chiamata.",
        hangUpAndCallCard:
          "Chiudere la chiamata e chiamare invece il numero sul retro della carta.",
      },
      outcomes: {
        calledOfficial:
          "Il vero servizio carte non ha traccia di alcun blocco né di operazioni non verificate. L'e-mail non veniva da loro, e il numero che conteneva non è mai stato il loro.",
        verifiedMismatch:
          "Il numero nell'e-mail non è quello dell'emittente. La loro linea pubblicata è {official}, quella sul retro della carta. Non c'è nessuno da richiamare.",
        readDigits:
          "Non era la società della carta. Il numero completo e il codice di sicurezza bastano per spendere sulla carta — e la chiamata è il motivo per cui non hanno dovuto forzare nulla.",
        lastFourOnly:
          "Quattro cifre, a qualcuno che non era la società della carta. Sono quelle quattro che faranno sembrare tua la loro prossima chiamata al vero emittente.",
        refuse:
          "Scelta giusta. Una società di carte ha già il tuo numero di carta e non ha mai bisogno che glielo leggi.",
        hangUpAndCallCard:
          "Il numero sulla carta ha raggiunto il vero servizio carte, che ha confermato che non c'era alcun blocco. Chiudere una chiamata a metà è sempre lecito.",
      }
    },
    messengerChats: {
      picnic: {
        opening:
          "Quel picnic è andato meglio del previsto. Le vendite continuano a dire a tutti che hanno vinto il tiro alla corda.",
        toast: "Le vendite sostengono ancora di aver vinto il tiro alla corda.",
        ask: "Cosa rispondi?",
        choices: {
          loved: "Bella giornata",
          missedIt: "Non c'ero",
          photos: "Chiedere le foto",
        },
        lines: {
          loved: "È stata davvero una bella giornata. La migliore da un po'.",
          missedIt: "Quella settimana ero via, mi è dispiaciuto.",
          photos: "Qualcuno ha davvero fatto foto al tiro alla corda?",
        },
        closing: "Ne cerco qualcuna. Bene, torniamo al lavoro.",
      },
      returnCheckin: {
        opening:
          "Buongiorno! Come va il primo giorno di rientro? Fammi un fischio se nella posta è arrivato qualcosa di strano.",
        toast: "Come va il primo giorno di rientro?",
        ask: "Come rispondi?",
        choices: {
          fine: "Tutto bene",
          catchingUp: "Sto recuperando",
          straightIn: "Subito in pista",
        },
        lines: {
          fine: "Per ora tutto bene, grazie.",
          catchingUp: "Sto ancora smaltendo la posta, ma ci siamo quasi.",
          straightIn: "Subito in pista, niente rodaggio stamattina.",
        },
        closing: "Bene. Sono qui se ti serve qualcosa.",
      },
      reportNudge: {
        opening:
          "Una cosa veloce: il riepilogo trimestrale può aspettare giovedì? La revisione è stata spostata.",
        toast: "Il riepilogo trimestrale può aspettare giovedì?",
        ask: "Cosa gli dici?",
        choices: {
          thursday: "Giovedì va bene",
          needMore: "Chiedere più tempo",
          alreadySent: "Già inviato",
        },
        lines: {
          thursday: "Giovedì va bene, nessun problema.",
          needMore: "Potrei avere fino a venerdì? Giovedì è stretto.",
          alreadySent: "È partito la settimana scorsa, te lo rimando.",
        },
        closing: "Grazie, mi aiuti. A dopo.",
      },
      lunchPlan: {
        opening: "Alcuni di noi vanno a pranzo alle dodici e mezza. Ci stai?",
        toast: "Alcuni di noi vanno a pranzo alle dodici e mezza.",
        ask: "Cosa rispondi?",
        choices: {
          in: "Ci sto",
          out: "Oggi no",
          whereTo: "Chiedere dove",
        },
        lines: {
          in: "Ci sto, mi farebbe bene uscire dall'ufficio.",
          out: "Oggi no, grazie, ho troppo da finire.",
          whereTo: "Dove andate?",
        },
        closing: "Va bene. Siamo al solito posto se cambi idea.",
      },
      onboarding: {
        opening:
          "Ciao {first}, controllo solo che i documenti di inserimento siano chiari. Ti resta qualcosa da fare?",
        toast: "Controllo che i documenti di inserimento siano chiari.",
        ask: "Come rispondi?",
        choices: {
          allGood: "Tutto fatto",
          haveQuestions: "Ho delle domande",
          laterToday: "Più tardi oggi",
        },
        lines: {
          allGood: "Tutto compilato e inviato, credo.",
          haveQuestions: "In realtà ho un paio di domande. Posso mandartele?",
          laterToday: "Ci penso più tardi oggi.",
        },
        closing: "Nessuna fretta. Scrivimi quando vuoi.",
      },
    },
    messengerHijack: {
      opening: "Sei alla postazione? Potrei aver bisogno di una mano per la revisione.",
      toast: "Sei alla postazione?",
      firstAsk: "Il tuo responsabile chiede se sei disponibile. Cosa rispondi?",
      firstChoices: {
        atDesk: "Sono qui",
        inAMeeting: "In riunione",
        whatIsIt: "Chiedere di cosa si tratta",
      },
      firstLines: {
        atDesk: "Sono alla postazione, cosa ti serve?",
        inAMeeting: "In riunione per la prossima mezz'ora. Dopo?",
        whatIsIt: "Sono qui. Di cosa si tratta?",
      },
      payload:
        "La contabilità deve aggiornare le coordinate bancarie di un fornitore prima della chiusura del ciclo dei pagamenti. Da questo portatile non riesco a entrare nel portale.",
      pressure:
        "Puoi confermare la modifica dalla tua parte? Ti mando le nuove coordinate, serve solo che qualcuno approvi.",
      payloadToast: "Coordinate bancarie di un fornitore da aggiornare prima della chiusura.",
      secondAsk:
        "Ora ti chiedono di approvare una modifica alle coordinate bancarie di un fornitore. Cosa fai?",
      secondChoices: {
        confirm: "Approvare",
        callThem: "Chiamarlo",
        report: "Segnalare",
        later: "Dire che non puoi",
      },
      secondLines: {
        confirm: "Mandale, faccio approvare io.",
        callThem: "Ti chiamo sul numero interno prima di toccare qualsiasi cosa.",
        report: "Prima verifico con il team di sicurezza.",
        later: "Le modifiche bancarie non posso approvarle io. Deve farlo la contabilità.",
      },
      outcomes: {
        confirm:
          "Una modifica alle coordinate bancarie è il pagamento che non torna più. Lo scambio cordiale iniziale è ciò che ha fatto sembrare la richiesta il passo successivo — e l'indirizzo da cui arrivava non è mai stato quello del tuo responsabile.",
        callThem:
          "Scelta giusta. Il vero responsabile non ne sapeva nulla, e il numero che avevi già l'ha raggiunto in pochi secondi.",
        report:
          "La sicurezza aveva già altre due segnalazioni dello stesso messaggio. Verificare prima di agire è ciò che rende utili quelle segnalazioni.",
        later:
          "Rifiutare ha protetto il denaro, ma l'account è ancora attivo. Segnalarlo avrebbe avvisato anche tutti gli altri.",
      },
    },
    coworkerCheckIn: {
      role: "Collega",
      question: "Buongiorno! Come sta andando la giornata?",
      choices: {
        fine: "Tutto bene",
        busy: "Molto da fare",
        offline: "Niente rete",
        wifiPassword: "Chiedere la password Wi-Fi"
      },
      says: {
        fine: "\u00AB Bene, grazie. \u00BB",
        busy: "\u00AB Piena \u2014 si \u00E8 accumulato molto mentre ero via. \u00BB",
        offline: "\u00AB Non bene, non riesco a connettermi. \u00BB",
        wifiPassword: "\u00AB Tutto bene. Mi ricordi la password del Wi-Fi? \u00BB"
      },
      replies: {
        fine: "Mi fa piacere. Dimmi se ti serve qualcosa.",
        busy: "Ti capisco. Riprendi con calma.",
        offline: "Controlla l'elenco delle reti Wi-Fi — assicurati di scegliere quella giusta.",
        wifiPassword: "Preferisco non dirla ad alta voce. L'IT può aiutarti."
      }
    },
    wifiNotConnected: {
      title: "Nessuna connessione a Internet",
      body: "Non sei connesso a nessuna rete. Apri le impostazioni Wi-Fi per connetterti."
    }
  },

  wifi: {
    panelTitle: "Wi-Fi",
    availableNetworks: "Reti disponibili",
    closePanel: "Chiudi il pannello Wi-Fi",
    buttonLabel: "Wi-Fi",
    noConnectionLabel: "Nessuna connessione a Internet",
    connectedLabel: "Connesso a {ssid}",
    secured: "Protetta",
    notSecured: "Non protetta",
    connected: "Connesso"
  },

  actions: {
    report: "Segnala",
    trust: "Considera attendibile",
    ignore: "Ignora"
  },

  feedback: {
    correctReport:
      "Ottima osservazione. Il dominio del mittente è {suspicious}, non {legitimate}.",
    riskyTrust:
      "Sarebbe rischioso. Il mittente usa {suspicious} invece di {legitimate}.",
    ignoredMalicious:
      "Ignorare evita il clic, ma segnalare aiuterebbe a proteggere l'organizzazione."
  },

  language: {
    label: "Lingua"
  }
} as const;
