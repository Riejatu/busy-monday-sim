export const frFR = {
  app: {
    title: "Simulation du lundi chargé"
  },

  personalization: {
    heading: "Personnalisons votre<br />simulation de bureau !",
    privacyNote:
      "Aucune information ne sera enregistrée ni transmise dans cette simulation. Par mesure de sécurité supplémentaire, veuillez ne pas saisir d'informations réelles.",
    companyLabel: "Entreprise",
    profileLabel: "Profil de l'employé",
    profileOption: "{name} — {department}",
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Saisissez un mot de passe",
    passwordNote:
      "Ce mot de passe ne sert que pour cette instance de la simulation.<br />N'utilisez aucun mot de passe connu.",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    start: "Démarrer la simulation",
    summaryEmail: "Adresse professionnelle",
    summaryDepartment: "Service",
    summaryTenure: "Ancienneté",
    summaryRating: "Note de sécurité",
    summaryLocation: "Localisation"
  },

  userConfig: {
    open: "Préférences",
    title: "Vos préférences",
    intro:
      "Adaptez le déroulement de la simulation. Votre organisation détermine les options disponibles.",
    languageHelp: "S'applique immédiatement à toute la simulation.",
    timeLapseLabel: "Accélération du temps",
    timeLapseHelp: "Minutes réelles par heure simulée.",
    timeLapseUnit: "min par heure simulée",
    workdayLabel: "Journée simulée",
    dayLengthLabel: "Une journée complète dure",
    dayLengthValue: "{minutes} minutes réelles",
    lockedNotice: "Votre organisation n'a activé aucune autre option.",
    temperatureLabel: "Température du bureau",
    temperatureHelp: "Affichée sur le widget météo de la barre des tâches.",
    temperatureUnitLabel: "Unité de température",
    resetToOrg: "Utiliser la valeur de l'organisation",
    back: "Retour"
  },

  departments: {
    accounting: "Comptabilité",
    customerService: "Service client",
    engineering: "Ingénierie",
    executive: "Direction",
    finance: "Finance",
    hr: "Ressources humaines",
    it: "Informatique",
    legal: "Juridique",
    maintenance: "Maintenance",
    marketing: "Marketing",
    operations: "Opérations",
    payroll: "Paie",
    purchasing: "Achats",
    sales: "Ventes"
  },

  temperatureUnits: {
    fahrenheit: "Fahrenheit (°F)",
    celsius: "Celsius (°C)"
  },

  tenure: {
    newHire: "Nouvelle recrue",
    upToTwo: "0 à 2 ans",
    twoToFive: "2 à 5 ans",
    fiveToTen: "5 à 10 ans",
    tenPlus: "Plus de 10 ans"
  },

  securityRating: {
    unrated: "Pas encore évalué",
    scale: "{rating} sur 4"
  },

  intro: {
    returnText:
      "Vous revenez travailler chez {company} après un congé bien mérité. Après vous être réinstallé à votre bureau, votre collègue {coworker}, que vous connaissez depuis des années, vous accueille...",
    continue: "Continuer"
  },

  markVideo: {
    loginToDesktop: "Se connecter au bureau",
    replay: "Revoir",
    videoLabel: "{coworker} explique ce que vous avez manqué pendant votre absence."
  },

  login: {
    passwordLabel: "Mot de passe",
    passwordPlaceholder: "Mot de passe",
    signIn: "Se connecter",
    incorrectPassword: "Le mot de passe est incorrect. Veuillez réessayer.",
    backToBriefing: "Retour au briefing"
  },

  desktop: {
    timePaused: "Le temps simulé est en pause",
    emailIcon: "Courrier",
    notesIcon: "Bloc-notes",
    startLabel: "Démarrer",
    searchLabel: "Rechercher",
    widgetsLabel: "Widgets, {temperature}",
    volumeLabel: "Volume",
    dismissNotification: "Ignorer la notification",
    minimize: "Réduire",
    maximize: "Agrandir"
  },

  desktopMenu: {
    view: "Affichage",
    icons: {
      large: "Grandes icônes",
      medium: "Icônes moyennes",
      small: "Petites icônes"
    },
    refresh: "Actualiser",
    paste: "Coller",
    displaySettings: "Paramètres d'affichage",
    personalize: "Personnaliser",
    managedTitle: "Géré par votre organisation",
    managedBody: "Votre administrateur informatique a verrouillé ces paramètres."
  },

  email: {
    windowTitle: "Courrier",
    selectEmail: "Sélectionnez un e-mail.",
    selectEmailHint: "Sélectionnez un message dans la boîte de réception pour l'afficher.",
    close: "Fermer",
    to: "À : {recipient}",
    receivedBenefits: "Aujourd'hui, 07:12",
    receivedPicnic: "Aujourd'hui, 07:38",
    receivedMeeting: "Aujourd'hui, 07:55",

    ribbon: {
      newMail: "Nouveau message",
      reply: "Répondre",
      archive: "Archiver",
      report: "Signaler",
      delete: "Supprimer"
    },

    folders: {
      favorites: "Favoris",
      inbox: "Boîte de réception",
      sent: "Éléments envoyés",
      drafts: "Brouillons",
      deleted: "Éléments supprimés",
      focused: "Prioritaire"
    },

    subjects: {
      benefits: "L'inscription aux avantages expire aujourd'hui",
      picnic: "Photos du pique-nique de l'entreprise",
      meeting: "Réunion possible plus tard dans la journée"
    },

    benefits: {
      heading: "L'inscription aux avantages expire aujourd'hui",
      greeting: "Bonjour,",
      body: "Veuillez confirmer immédiatement vos informations d'avantages sociaux.",
      urgency:
        "Votre période d'inscription expire aujourd'hui. Utilisez le lien ci-dessous pour ne pas perdre l'accès à vos avantages.",
      linkLabel: "Confirmer les informations d'avantages",
      hoverTarget: "Cible du survol :"
    },

    picnic: {
      heading: "Photos du pique-nique de l'entreprise",
      body: "Voici les photos du pique-nique de l'entreprise.",
      linkLabel: "Voir l'album du pique-nique",
      noAction: "Aucune action requise."
    },

    meeting: {
      heading: "Réunion possible plus tard dans la journée",
      body: "Je vous enverrai peut-être une invitation à une réunion dès que j'aurai confirmé les détails."
    }
  },

  notes: {
    windowTitle: "Bloc-notes",
    heading: "Mes notes",
    listLabel: "Collègues et responsables connus",

    roles: {
      narrator: "Collègue. A partagé les nouvelles du matin à votre retour.",
      hrBenefits:
        "Responsable des avantages sociaux. Les informations sur les avantages peuvent venir de {first} ou des RH.",
      supervisor: "Superviseur. Pourrait faire le suivi de l'achat de la semaine dernière.",
      ceo: "PDG. Est passé au pique-nique de l'entreprise.",
      cto: "Directeur technique. Une invitation à une réunion peut venir de {first} plus tard aujourd'hui.",
      salesManager:
        "Responsable des ventes. L'équipe commerciale parle encore de sa victoire à l'un des jeux du pique-nique.",
      marketingVp: "Vice-président marketing. A pris des photos au pique-nique de l'entreprise."
    },

    helpdeskHeading: "Assistance informatique",
    helpdeskBody:
      "{number}. Le seul numéro à appeler pour l'informatique. Il figure aussi au dos de votre badge.",
    cardHeading: "{issuer} — carte professionnelle",
    cardBody:
      "Service cartes : {number}. Imprimé au dos de la carte, et le même numéro sur {website}. Tout autre numéro n'est pas le leur.",
    wifiHeading: "Wi-Fi : {ssid}",
    wifiBody:
      "Le seul réseau du bureau que l'informatique nous a dit d'utiliser. Notez le trait d'union — tout réseau sans celui-ci n'est pas le nôtre."
  },

  choice: {
    instruction: "Choisissez une réponse",
    timeRemaining: "Temps restant"
  },

  phone: {
    // Used to announce a phone toast to a screen reader.
    appName: "Téléphone",
    dialing: "Appel en cours…",
    callLabel: "Appel vers {contact} au {number}",
    sources: {
      email: "Numéro pris dans l'e-mail",
      card: "Numéro au dos de votre carte",
      website: "Numéro du site officiel de l'émetteur",
      notes: "Numéro de vos propres notes",
    }
  },

  // Someone physically in the room. See SpokenLine in src/events/types.ts.
  inPerson: {
    whatDoYouSay: "Que réponds-tu ?",
    speakingLabel: "{speaker} te parle"
  },
  // Negative consequences. `incidents` is keyed promptId:choiceId; anything with
  // no entry falls back, so a newly risky answer is never left without a message.
  consequences: {
    dismiss: "Fermer et reprendre la journée",
    fallback: {
      title: "Mauvais choix",
      body: "Cette réponse aurait causé un réel préjudice au travail.",
      detail: "Prends un instant, puis reprends ta journée.",
    },
    incidents: {
      "coworker-check-in:wifiPassword": {
        title: "Tu as dit le mot de passe à voix haute",
        body:
          "Un mot de passe prononcé au-dessus d un bureau est un mot de passe que tous les voisins connaissent désormais.",
        detail:
          "Personne n a besoin du tien, ni un collègue, ni le service informatique. Renvoie-les vers l assistance.",
      },
      "messenger-invoice-phish-follow-up:clickLink": {
        title: "Tu as ouvert le lien",
        body: "La page atteinte était conçue pour récupérer les identifiants que tu y saisis.",
        detail:
          "Le nom sur le message était réel. L adresse d envoi ne l était pas, et c était la seule différence.",
      },
      "card-verification-toad-digits:readDigits": {
        title: "Tu as dicté la carte",
        body: "Le numéro complet et le code de sécurité suffisent à dépenser avec cette carte.",
        detail:
          "Un émetteur de carte possède déjà ton numéro. Qu on te demande de le dicter, c est justement le signe.",
      },
    },
  },
  chat: {
    appName: "Teams",
    close: "Fermer Teams",
    listTitle: "Messages",
    closeList: "Fermer la liste des messages",
    resolved: "Terminé",
    openConversation: "Ouvrir la conversation avec {name}",
    trayLabel: "{app}",
    trayUnread: "{app}, {count} non lu(s)"
  },

  events: {
    messengerPhish: {
      toast: "Une facture impayée \u2014 tu peux regarder maintenant ?",
      toastFollowUp: "Je relance \u2014 il faut le faire avant la fin de journée.",
      verified: "Appel au vrai numéro : aucune facture n'a été envoyée. Signalé à la sécurité.",
      first: {
        greeting: "Bonjour {first}, désolé de te écrire à l'improviste.",
        body:
          "La comptabilité a signalé une facture fournisseur impayée sur ton centre de coûts. Merci de la confirmer dans le portail avant la clôture de midi.",
        linkLabel: "Ouvrir la facture 8841",
        ask: "On te demande de confirmer une facture via leur lien. Que fais-tu ?"
      },
      second: {
        body: "Je sais que tu es occupé, mais cela bloque tout le cycle de paiement.",
        linkLabel: "Ouvrir la facture 8841 maintenant",
        pressure:
          "Sans confirmation dans les prochaines minutes, cela remonte à ton responsable comme exception. Cela prend trente secondes.",
        ask: "La pression augmente. Que fais-tu ?"
      },
      choices: {
        clickLink: "Ouvrir le lien",
        callAccountant: "Appeler la comptabilité",
        later: "Dire plus tard",
        contactSecurity: "Écrire à la sécurité"
      },
      says: {
        clickLink: "Ouvrir le lien de facture envoyé.",
        callAccountant: "Appeler la comptabilité au numéro que tu possèdes déjà.",
        later: "\u00AB Je m'en occupe plus tard aujourd'hui. \u00BB",
        contactSecurity: "Transmettre le message à l'équipe de sécurité et attendre."
      },
      // What the learner sends into the thread, shared by both rounds. `ignore`
      // has no entry: not replying means nothing is posted.
      threadReplies: {
        clickLink: "Je l'ouvre tout de suite.",
        callAccountant:
          "Je vais d'abord vérifier avec la comptabilité au numéro que je possède déjà.",
        later: "Je m'en occupe plus tard aujourd'hui.",
        contactSecurity: "Je transmets ça à notre équipe de sécurité.",
        reportSecurity: "J'ai signalé ce compte à notre équipe de sécurité."
      },
      followUpChoices: {
        clickLink: "L'ouvrir maintenant",
        callAccountant: "Appeler la comptabilité",
        ignore: "Ne plus répondre",
        reportSecurity: "Le signaler"
      },
      followUpSays: {
        clickLink: "Céder et ouvrir le lien.",
        callAccountant: "Appeler la comptabilité au numéro que tu possèdes déjà.",
        ignore: "Quitter la conversation sans répondre.",
        reportSecurity: "Signaler le compte à l'équipe de sécurité."
      }
    },
    serviceDeskCall: {
      senderName: "Assistance informatique",
      subject: "Contrôle de chiffrement à faire sur votre portable",
      preview: "Votre portable doit passer son contrôle de chiffrement trimestriel.",
      greeting: "Bonjour {first},",
      body:
        "Votre portable doit passer son contrôle de chiffrement trimestriel. Cela prend environ cinq minutes et nous le faisons par téléphone. Appelez l'assistance quand cela vous arrange.",
      closing: "Rien d'urgent aujourd'hui — avant vendredi, c'est parfait.",
      phoneLabel: "Assistance",
      toast: "Contrôle de chiffrement à faire — appelez l'assistance cette semaine.",
      ask: "Une demande de routine, et on vous demande d'appeler. Que faites-vous ?",
      choices: {
        checkNotesFirst: "Vérifier mes notes",
        callNumber: "Appeler le numéro",
        ignore: "Laisser de côté",
        reportPhishing: "Signaler comme phishing",
      },
      says: {
        checkNotesFirst: "Comparer le numéro avec celui de vos propres notes, puis appeler.",
        callNumber: "Composer le numéro indiqué dans l'e-mail.",
        ignore: "Ne rien faire pour l'instant.",
        reportPhishing: "Transmettre à l'équipe de sécurité comme phishing supposé.",
      },
      outcomes: {
        checkNotesFirst:
          "Le numéro correspondait à vos notes, et l'assistance a fait le contrôle en quatre minutes. C'est le bon réflexe : le numéro, puis l'appel.",
        callNumber:
          "L'assistance a répondu et fait le contrôle. Celui-ci était authentique — mais rien ne vous permettait de le savoir avant d'appeler.",
        ignore: "Rien de grave, mais le contrôle reste à faire et l'assistance va vous relancer.",
        reportPhishing:
          "La sécurité a confirmé que l'e-mail était authentique. Aucun dégât — mais signaler un vrai message a un coût, et le numéro était dans vos notes depuis le début.",
      }
    },
    cardToad: {
      senderName: "{issuer} — Service anti-fraude",
      subject: "Action requise : vérifiez une opération récente sur votre carte professionnelle",
      preview: "Nous avons bloqué une opération sur votre carte professionnelle.",
      greeting: "Bonjour {first},",
      body:
        "Nous avons temporairement bloqué votre carte professionnelle {issuer} après une opération que nous n'avons pas pu vérifier. Pour lever le blocage, appelez notre ligne de vérification et confirmez les informations de votre carte avec un conseiller.",
      urgency:
        "Sans réponse de votre part dans les 24 heures, la carte sera annulée et une nouvelle envoyée à votre siège.",
      phoneLabel: "Ligne de vérification",
      toast: "Une opération sur votre carte professionnelle a été bloquée.",
      ask: "L'e-mail vous demande d'appeler le numéro indiqué. Que faites-vous ?",
      callee: "Conseiller {issuer}",
      choices: {
        callListedNumber: "Appeler ce numéro",
        verifyNumber: "Vérifier le numéro",
        callNumberOnCard: "Appeler le numéro de la carte",
        lookUpOfficialNumber: "Le chercher moi-même",
      },
      says: {
        callListedNumber: "Composer la ligne de vérification indiquée dans l'e-mail.",
        verifyNumber: "Comparer le numéro de l'e-mail avec celui que vous avez déjà.",
        callNumberOnCard: "Ignorer leur numéro et appeler celui au dos de la carte.",
        lookUpOfficialNumber: "Trouver vous-même le numéro de l'émetteur sur son site officiel.",
      },
      digits: {
        ask:
          "Le conseiller vous demande de lire le long numéro au recto de la carte et les trois chiffres au verso. Que faites-vous ?",
      },
      digitChoices: {
        readDigits: "Les lire",
        lastFourOnly: "Donner les 4 derniers",
        refuse: "Refuser et raccrocher",
        hangUpAndCallCard: "Raccrocher, appeler la carte",
      },
      digitSays: {
        readDigits: "Lire le numéro complet de la carte et le code de sécurité.",
        lastFourOnly: "Ne donner que les quatre derniers chiffres, par prudence.",
        refuse:
          "Dire que vous ne lirez pas les informations de la carte et mettre fin à l'appel.",
        hangUpAndCallCard:
          "Mettre fin à l'appel et composer plutôt le numéro au dos de la carte.",
      },
      outcomes: {
        calledOfficial:
          "Le vrai service cartes n'a aucune trace d'un blocage ni d'une opération non vérifiée. L'e-mail ne venait pas d'eux, et le numéro qu'il donnait n'a jamais été le leur.",
        verifiedMismatch:
          "Le numéro de l'e-mail n'est pas celui de l'émetteur. Leur ligne publiée est le {official}, celle au dos de la carte. Il n'y a personne à rappeler.",
        readDigits:
          "Ce n'était pas la société de cartes. Le numéro complet et le code de sécurité suffisent pour dépenser avec la carte — et l'appel explique pourquoi ils n'ont eu rien à forcer.",
        lastFourOnly:
          "Quatre chiffres, donnés à quelqu'un qui n'était pas la société de cartes. Ce sont ces quatre chiffres qui feront passer leur prochain appel au vrai émetteur pour le vôtre.",
        refuse:
          "Bonne décision. Une société de cartes connaît déjà votre numéro de carte et n'a jamais besoin que vous le lui lisiez.",
        hangUpAndCallCard:
          "Le numéro au dos de la carte a mis en ligne le vrai service cartes, qui a confirmé qu'il n'y avait aucun blocage. Raccrocher en pleine conversation est toujours permis.",
      }
    },
    messengerChats: {
      picnic: {
        opening:
          "Ce pique-nique s'est mieux passé que prévu. Les commerciaux racontent encore à tout le monde qu'ils ont gagné le tir à la corde.",
        toast: "Les commerciaux prétendent encore avoir gagné le tir à la corde.",
        ask: "Que réponds-tu ?",
        choices: {
          loved: "C'était une belle journée",
          missedIt: "Je n'y étais pas",
          photos: "Demander les photos",
        },
        lines: {
          loved: "C'était vraiment une belle journée. La meilleure depuis longtemps.",
          missedIt: "J'étais absent cette semaine-là, dommage.",
          photos: "Quelqu'un a vraiment pris des photos du tir à la corde ?",
        },
        closing: "Je vais en retrouver. Bon, au travail.",
      },
      returnCheckin: {
        opening:
          "Bonjour ! Comment se passe ce premier jour de retour ? Fais-moi signe si quelque chose d'étrange arrive dans ta boîte.",
        toast: "Comment se passe ce premier jour de retour ?",
        ask: "Comment réponds-tu ?",
        choices: {
          fine: "Tout va bien",
          catchingUp: "Je rattrape encore",
          straightIn: "Direct dans le bain",
        },
        lines: {
          fine: "Tout va bien pour l'instant, merci.",
          catchingUp: "Je suis encore dans la boîte mail, mais ça avance.",
          straightIn: "Direct dans le bain, pas de mise en route ce matin.",
        },
        closing: "Parfait. Je suis là si tu as besoin.",
      },
      reportNudge: {
        opening:
          "Petite question : le bilan trimestriel peut-il attendre jeudi ? La revue a été déplacée.",
        toast: "Le bilan trimestriel peut-il attendre jeudi ?",
        ask: "Que réponds-tu ?",
        choices: {
          thursday: "Jeudi, c'est bon",
          needMore: "Demander plus de temps",
          alreadySent: "Déjà envoyé",
        },
        lines: {
          thursday: "Jeudi, ça me va, aucun souci.",
          needMore: "Je pourrais avoir jusqu'à vendredi ? Jeudi, c'est juste.",
          alreadySent: "Il est parti la semaine dernière, je le renvoie.",
        },
        closing: "Merci, ça m'aide. À plus tard.",
      },
      lunchPlan: {
        opening: "On va manger à midi et demi, quelques-uns. Tu viens ?",
        toast: "On va manger à midi et demi, quelques-uns.",
        ask: "Que réponds-tu ?",
        choices: {
          in: "Je viens",
          out: "Pas aujourd'hui",
          whereTo: "Demander où",
        },
        lines: {
          in: "Je viens, ça me fera du bien de sortir du bâtiment.",
          out: "Pas aujourd'hui, merci, j'ai trop de choses à finir.",
          whereTo: "Vous allez où ?",
        },
        closing: "Pas de souci. On sera à l'endroit habituel si tu changes d'avis.",
      },
      onboarding: {
        opening:
          "Bonjour {first}, je vérifie juste que les documents d'intégration sont clairs. Il te reste quelque chose à faire ?",
        toast: "Je vérifie que tes documents d'intégration sont clairs.",
        ask: "Que réponds-tu ?",
        choices: {
          allGood: "Tout est fait",
          haveQuestions: "J'ai des questions",
          laterToday: "Plus tard aujourd'hui",
        },
        lines: {
          allGood: "Tout est rempli et envoyé, je crois.",
          haveQuestions: "J'ai deux ou trois questions, en fait. Je peux te les envoyer ?",
          laterToday: "Je m'en occupe plus tard aujourd'hui.",
        },
        closing: "Rien d'urgent. Écris-moi quand tu veux.",
      },
    },
    messengerHijack: {
      opening: "Tu es à ton bureau ? J'aurais peut-être besoin d'un coup de main pour la revue.",
      toast: "Tu es à ton bureau ?",
      firstAsk: "Ton responsable demande si tu es disponible. Que réponds-tu ?",
      firstChoices: {
        atDesk: "Je suis là",
        inAMeeting: "En réunion",
        whatIsIt: "Demander de quoi il s'agit",
      },
      firstLines: {
        atDesk: "À mon bureau, de quoi as-tu besoin ?",
        inAMeeting: "En réunion pour la prochaine demi-heure. Après ?",
        whatIsIt: "Je suis là. De quoi s'agit-il ?",
      },
      payload:
        "La comptabilité doit mettre à jour les coordonnées bancaires d'un fournisseur avant la clôture du cycle de paiement. Je n'arrive pas à accéder au portail depuis ce portable.",
      pressure:
        "Tu peux confirmer le changement de ton côté ? Je t'envoie les nouvelles coordonnées, il faut juste que quelqu'un valide.",
      payloadToast: "Coordonnées bancaires d'un fournisseur à mettre à jour avant la clôture.",
      secondAsk:
        "On te demande maintenant de valider un changement de coordonnées bancaires. Que fais-tu ?",
      secondChoices: {
        confirm: "Valider",
        callThem: "L'appeler",
        report: "Signaler",
        later: "Dire que non",
      },
      secondLines: {
        confirm: "Envoie-les, je fais valider.",
        callThem: "Je t'appelle sur ta ligne interne avant de toucher à quoi que ce soit.",
        report: "Je vérifie d'abord avec l'équipe de sécurité.",
        later:
          "Un changement bancaire, je ne peux pas le valider. Il faudra passer par la comptabilité.",
      },
      outcomes: {
        confirm:
          "Un changement de coordonnées bancaires, c'est le paiement qui ne revient jamais. L'échange sympathique du début est ce qui a fait passer la demande pour la suite logique — et l'adresse d'où elle venait n'a jamais été celle de ton responsable.",
        callThem:
          "Bonne décision. Le vrai responsable n'était au courant de rien, et le numéro que tu avais déjà l'a joint en quelques secondes.",
        report:
          "La sécurité avait déjà deux autres signalements du même message. Vérifier avant d'agir est ce qui donne de la valeur à ces signalements.",
        later:
          "Refuser a protégé l'argent, mais le compte est toujours actif. Le signaler aurait aussi prévenu les autres.",
      },
    },
    coworkerCheckIn: {
      role: "Collègue",
      question: "Salut ! Comment se passe ta journée jusqu'ici ?",
      choices: {
        fine: "Tout va bien",
        busy: "Débordé",
        offline: "Pas de connexion",
        wifiPassword: "Demander le mot de passe Wi-Fi"
      },
      says: {
        fine: "\u00AB Bien, merci. \u00BB",
        busy: "\u00AB Charg\u00E9 \u2014 beaucoup de choses se sont accumul\u00E9es pendant mon absence. \u00BB",
        offline: "\u00AB Pas terrible, je n\u2019arrive pas \u00E0 me connecter. \u00BB",
        wifiPassword: "\u00AB \u00C7a va. Tu me rappelles le mot de passe du Wi-Fi ? \u00BB"
      },
      replies: {
        fine: "Content de l'entendre. Dis-moi si tu as besoin de quelque chose.",
        busy: "Je comprends. Reprends tranquillement.",
        offline: "Regarde la liste des réseaux Wi-Fi — choisis bien le bon.",
        wifiPassword: "Je préfère ne pas le dire à voix haute. L'informatique t'aidera."
      }
    },
    wifiNotConnected: {
      title: "Aucune connexion Internet",
      body: "Vous n'êtes connecté à aucun réseau. Ouvrez les paramètres Wi-Fi pour vous connecter."
    }
  },

  wifi: {
    panelTitle: "Wi-Fi",
    availableNetworks: "Réseaux disponibles",
    closePanel: "Fermer le panneau Wi-Fi",
    buttonLabel: "Wi-Fi",
    noConnectionLabel: "Aucune connexion Internet",
    connectedLabel: "Connecté à {ssid}",
    secured: "Sécurisé",
    notSecured: "Non sécurisé",
    connected: "Connecté"
  },

  actions: {
    report: "Signaler",
    trust: "Faire confiance",
    ignore: "Ignorer"
  },

  feedback: {
    correctReport:
      "Bien vu. Le domaine de l'expéditeur est {suspicious}, et non {legitimate}.",
    riskyTrust:
      "Ce serait risqué. L'expéditeur utilise {suspicious} au lieu de {legitimate}.",
    ignoredMalicious:
      "Ignorer évite de cliquer, mais le signalement aiderait à protéger l'organisation."
  },

  language: {
    label: "Langue"
  }
} as const;
