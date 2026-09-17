export const jaJP = {
  app: {
    title: "忙しい月曜日のシミュレーション"
  },

  personalization: {
    heading: "デスクトップ シミュレーションを<br />カスタマイズしましょう",
    privacyNote:
      "このシミュレーションでは、情報が保存または送信されることはありません。安全のため、実在する情報は入力しないでください。",
    companyLabel: "会社",
    profileLabel: "従業員プロファイル",
    profileOption: "{name} — {department}",
    passwordLabel: "パスワード",
    passwordPlaceholder: "パスワードを入力",
    passwordNote:
      "このパスワードは、このシミュレーション内でのみ使用します。<br />実際に使用しているパスワードは入力しないでください。",
    showPassword: "パスワードを表示",
    hidePassword: "パスワードを非表示",
    start: "シミュレーションを開始",
    summaryEmail: "会社のメールアドレス",
    summaryDepartment: "部門",
    summaryTenure: "勤続年数",
    summaryRating: "セキュリティ評価",
    summaryLocation: "勤務地"
  },

  userConfig: {
    open: "設定",
    title: "あなたの設定",
    intro:
      "シミュレーションの進み方を調整できます。利用できる項目は所属組織が決定します。",
    languageHelp: "シミュレーション全体にすぐ適用されます。",
    timeLapseLabel: "時間の進む速さ",
    timeLapseHelp: "シミュレーション上の1時間にかかる実時間（分）。",
    timeLapseUnit: "分 / シミュレーション1時間",
    workdayLabel: "シミュレーション上の勤務時間",
    dayLengthLabel: "1日全体にかかる時間",
    dayLengthValue: "実時間 {minutes} 分",
    lockedNotice: "所属組織はこれ以外の項目を有効にしていません。",
    temperatureLabel: "デスクトップの気温",
    temperatureHelp: "タスクバーの天気ウィジェットに表示されます。",
    temperatureUnitLabel: "温度の単位",
    resetToOrg: "組織の既定値を使用",
    back: "戻る"
  },

  departments: {
    accounting: "経理",
    customerService: "カスタマーサービス",
    engineering: "エンジニアリング",
    executive: "経営",
    finance: "財務",
    hr: "人事",
    it: "IT",
    legal: "法務",
    maintenance: "設備管理",
    marketing: "マーケティング",
    operations: "業務",
    payroll: "給与",
    purchasing: "購買",
    sales: "営業"
  },

  temperatureUnits: {
    fahrenheit: "華氏 (°F)",
    celsius: "摂氏 (°C)"
  },

  tenure: {
    newHire: "新入社員",
    upToTwo: "0〜2年",
    twoToFive: "2〜5年",
    fiveToTen: "5〜10年",
    tenPlus: "10年以上"
  },

  securityRating: {
    unrated: "未評価",
    scale: "4段階中 {rating}"
  },

  intro: {
    returnText:
      "しっかり休暇を取ったあと、{company} に出社します。席に着くと、長年の同僚である{coworker}が声をかけてきました…",
    continue: "続ける"
  },

  markVideo: {
    loginToDesktop: "デスクトップにログイン",
    replay: "もう一度再生",
    videoLabel: "{coworker}が、不在中の出来事を説明します。"
  },

  login: {
    passwordLabel: "パスワード",
    passwordPlaceholder: "パスワード",
    signIn: "サインイン",
    incorrectPassword: "パスワードが正しくありません。もう一度お試しください。",
    backToBriefing: "説明に戻る"
  },

  desktop: {
    timePaused: "シミュレーション時間は一時停止中です",
    emailIcon: "メール",
    notesIcon: "メモ",
    startLabel: "スタート",
    searchLabel: "検索",
    widgetsLabel: "ウィジェット、{temperature}",
    volumeLabel: "音量",
    dismissNotification: "通知を閉じる",
    minimize: "最小化",
    maximize: "最大化"
  },

  desktopMenu: {
    view: "表示",
    icons: { large: "大アイコン", medium: "中アイコン", small: "小アイコン" },
    refresh: "更新",
    paste: "貼り付け",
    displaySettings: "ディスプレイ設定",
    personalize: "個人用設定",
    managedTitle: "組織によって管理されています",
    managedBody: "IT 管理者がこれらの設定をロックしています。"
  },

  email: {
    windowTitle: "メール",
    selectEmail: "メールを選択してください。",
    selectEmailHint: "受信トレイからメッセージを選択すると内容が表示されます。",
    close: "閉じる",
    to: "宛先: {recipient}",
    receivedBenefits: "今日 7:12",
    receivedPicnic: "今日 7:38",
    receivedMeeting: "今日 7:55",

    ribbon: {
      newMail: "新規メール",
      reply: "返信",
      archive: "アーカイブ",
      report: "報告",
      delete: "削除"
    },

    folders: {
      favorites: "お気に入り",
      inbox: "受信トレイ",
      sent: "送信済みアイテム",
      drafts: "下書き",
      deleted: "削除済みアイテム",
      focused: "優先"
    },

    subjects: {
      benefits: "福利厚生の登録は本日締め切りです",
      picnic: "社内ピクニックの写真",
      meeting: "本日この後の打ち合わせについて"
    },

    benefits: {
      heading: "福利厚生の登録は本日締め切りです",
      greeting: "お世話になっております。",
      body: "福利厚生に関する情報を至急ご確認ください。",
      urgency:
        "登録期間は本日で終了します。福利厚生を利用できなくならないよう、下のリンクからお手続きください。",
      linkLabel: "福利厚生の情報を確認する",
      hoverTarget: "リンク先:"
    },

    picnic: {
      heading: "社内ピクニックの写真",
      body: "社内ピクニックの写真を共有します。",
      linkLabel: "ピクニックのアルバムを見る",
      noAction: "対応は不要です。"
    },

    meeting: {
      heading: "本日この後の打ち合わせについて",
      body: "詳細が確定したら、後ほど打ち合わせの招待をお送りするかもしれません。"
    }
  },

  notes: {
    windowTitle: "メモ",
    heading: "自分のメモ",
    listLabel: "知っている同僚と責任者",

    roles: {
      narrator: "同僚。出社したときに朝の状況を教えてくれた人。",
      hrBenefits:
        "福利厚生の担当者。福利厚生の連絡は{first}または人事から届く可能性がある。",
      supervisor: "上司。先週の購買について確認してくるかもしれない。",
      ceo: "最高経営責任者。社内ピクニックに顔を出していた。",
      cto: "最高技術責任者。本日この後、{first}から打ち合わせの招待が届く可能性がある。",
      salesManager:
        "営業責任者。営業チームはピクニックのゲームでの優勝をまだ話題にしている。",
      marketingVp: "マーケティング責任者。社内ピクニックで写真を撮っていた。"
    },

    helpdeskHeading: "ITサービスデスク",
    helpdeskBody: "{number}。IT関連の連絡先はここだけ。社員証の裏にも記載あり。",
    cardHeading: "{issuer}（法人カード）",
    cardBody: "カードサービス：{number}。カード裏面に印刷されていて、{website} にも同じ番号が記載されている。それ以外の番号は彼らではない。",
    wifiHeading: "Wi-Fi: {ssid}",
    wifiBody:
      "IT部門から使用を指示されている唯一の社内ネットワーク。ハイフンに注意 — ハイフンがないものは社内のものではない。"
  },

  choice: {
    instruction: "返答を選んでください",
    timeRemaining: "残り時間"
  },

  phone: {
    // Used to announce a phone toast to a screen reader.
    appName: "電話",
    dialing: "発信中…",
    callLabel: "{contact} （{number}）へ発信中",
    sources: {
      email: "メールに記載の番号",
      card: "カード裏面の番号",
      website: "カード会社公式サイトの番号",
      notes: "自分のメモの番号",
    }
  },

  // Someone physically in the room. See SpokenLine in src/events/types.ts.
  inPerson: {
    whatDoYouSay: "どう答えますか？",
    speakingLabel: "{speaker} が話しかけています"
  },
  // Negative consequences. `incidents` is keyed promptId:choiceId; anything with
  // no entry falls back, so a newly risky answer is never left without a message.
  consequences: {
    dismiss: "閉じて一日を続ける",
    fallback: {
      title: "対応を誤りました",
      body: "その回答は、実際の職場では本当の被害につながっていました。",
      detail: "少し落ち着いてから、一日を続けてください。",
    },
    incidents: {
      "coworker-check-in:wifiPassword": {
        title: "パスワードを声に出しました",
        body: "机越しに口にしたパスワードは、その場にいた全員が知ったパスワードです。",
        detail: "あなたのパスワードを必要とする人はいません。同僚でも情報システム部門でもです。サービスデスクを案内してください。",
      },
      "messenger-invoice-phish-follow-up:clickLink": {
        title: "リンクを開きました",
        body: "開いたページは、そこに入力された資格情報を盗むために作られていました。",
        detail: "メッセージの名前は本物でした。差出人のアドレスは違い、その一点だけが見分ける手がかりでした。",
      },
      "card-verification-toad-digits:readDigits": {
        title: "カード番号を読み上げました",
        body: "完全な番号とセキュリティコードがあれば、そのカードで支払いができます。",
        detail: "カード会社はあなたの番号をすでに持っています。読み上げを求めること自体が手がかりです。",
      },
    },
  },
  chat: {
    appName: "Teams",
    close: "Teams を閉じる",
    listTitle: "メッセージ",
    closeList: "メッセージ一覧を閉じる",
    resolved: "完了",
    openConversation: "{name} との会話を開く",
    trayLabel: "{app}",
    trayUnread: "{app}、未読 {count} 件"
  },

  events: {
    messengerPhish: {
      toast: "未払いの請求書について、いま確認できますか？",
      toastFollowUp: "再度のご連絡です。本日の終業までに対応が必要です。",
      verified: "本来の番号に電話しました。請求書は送られていません。セキュリティに報告済みです。",
      first: {
        greeting: "{first}さん、突然のメッセージで失礼します。",
        body:
          "経理から、あなたのコストセンターに未払いの仕入請求書があると連絡がありました。正午の締めまでにポータルで確認をお願いします。",
        linkLabel: "請求書 8841 を開く",
        ask: "相手のリンクから請求書を確認するよう求められています。どうしますか？"
      },
      second: {
        body: "お忙しいところ恐れ入りますが、これが支払処理全体を止めています。",
        linkLabel: "請求書 8841 をいま開く",
        pressure:
          "数分以内に確認いただけない場合、例外として上長に報告されます。30 秒で終わります。",
        ask: "相手はさらに強く迫っています。どうしますか？"
      },
      choices: {
        clickLink: "リンクを開く",
        callAccountant: "経理に電話する",
        later: "後で対応と伝える",
        contactSecurity: "セキュリティに連絡"
      },
      says: {
        clickLink: "送られてきた請求書のリンクを開く。",
        callAccountant: "すでに知っている番号で経理チームに電話する。",
        later: "「今日の後ほど対応します。」",
        contactSecurity: "メッセージをセキュリティチームに転送して待つ。"
      },
      // What the learner sends into the thread, shared by both rounds. `ignore`
      // has no entry: not replying means nothing is posted.
      threadReplies: {
        clickLink: "今開きます。",
        callAccountant: "まず手元の番号で経理部に確認します。",
        later: "今日のうちに見ておきます。",
        contactSecurity: "この件はセキュリティ部門に回します。",
        reportSecurity: "このアカウントをセキュリティ部門に報告しました。"
      },
      followUpChoices: {
        clickLink: "いま開く",
        callAccountant: "経理に電話する",
        ignore: "返信をやめる",
        reportSecurity: "報告する"
      },
      followUpSays: {
        clickLink: "押しに応じてリンクを開く。",
        callAccountant: "すでに知っている番号で経理チームに電話する。",
        ignore: "返信せず会話から離れる。",
        reportSecurity: "このアカウントをセキュリティチームに報告する。"
      }
    },
    serviceDeskCall: {
      senderName: "ITサービスデスク",
      subject: "ノートPCの暗号化確認のご案内",
      preview: "ノートPCの四半期ごとの暗号化確認の時期です。",
      greeting: "{first} さん、",
      body: "ノートPCの四半期ごとの暗号化確認の時期です。5分程度で、お電話で対応しています。ご都合のよいときにサービスデスクまでお電話ください。",
      closing: "本日でなくても結構です—金曜日までにご連絡を。",
      phoneLabel: "サービスデスク",
      toast: "暗号化確認の時期—今週中にサービスデスクへ。",
      ask: "定期的な依頼で、電話を求めています。どうしますか？",
      choices: {
        checkNotesFirst: "メモを確認",
        callNumber: "番号に電話",
        ignore: "後回しにする",
        reportPhishing: "フィッシングとして報告",
      },
      says: {
        checkNotesFirst: "自分のメモの番号と照らし合わせてから電話する。",
        callNumber: "メールに記載の番号に電話する。",
        ignore: "今は何もしない。",
        reportPhishing: "フィッシングの疑いとしてセキュリティ部門に転送する。",
      },
      outcomes: {
        checkNotesFirst: "番号はメモと一致し、4分で確認が完了した。この順序が大事—まず番号、それから電話。",
        callNumber: "サービスデスクが対応し確認は完了。今回は本物だった—ただし、かける前にそれを知る方法はなかった。",
        ignore: "大事にはならなかったが、確認は未完了のままで、サービスデスクから再度連絡が来る。",
        reportPhishing: "セキュリティ部門が本物と確認。実害はなし—ただ、本物のメールを報告するのにもコストはあるし、番号は最初からメモにあった。",
      }
    },
    cardToad: {
      senderName: "{issuer} 不正利用対策センター",
      subject: "【要対応】法人カードの最近のご利用の確認",
      preview: "法人カードの取引を停止しました。",
      greeting: "{first} 様、",
      body: "確認が取れない取引があったため、{issuer} の法人カードを一時的に停止しております。解除には、確認専用回線までお電話の上、担当者にカード情報をご確認ください。",
      urgency: "24時間以内にご連絡がない場合、カードを失効とし、代替カードを本社宛に発送します。",
      phoneLabel: "確認専用回線",
      toast: "法人カードの取引が停止されました。",
      ask: "メールに記載の番号へ電話するよう求めています。どうしますか？",
      callee: "{issuer} 担当者",
      choices: {
        callListedNumber: "記載の番号に電話",
        verifyNumber: "番号を確かめる",
        callNumberOnCard: "カードの番号に電話",
        lookUpOfficialNumber: "自分で調べる",
      },
      says: {
        callListedNumber: "メールに記載の確認専用回線に電話する。",
        verifyNumber: "メールの番号を、すでに手元にある番号と照らし合わせる。",
        callNumberOnCard: "相手の番号は使わず、カード裏面の番号に電話する。",
        lookUpOfficialNumber: "カード会社の番号を公式サイトで自分で探す。",
      },
      digits: {
        ask: "担当者は、カード表面の長い番号と裏面の3桁を読み上げるよう求めています。どうしますか？",
      },
      digitChoices: {
        readDigits: "読み上げる",
        lastFourOnly: "下4桁だけ伝える",
        refuse: "断って切る",
        hangUpAndCallCard: "切ってカードに電話",
      },
      digitSays: {
        readDigits: "カード番号とセキュリティコードをすべて読み上げる。",
        lastFourOnly: "念のため、下4桁だけ伝える。",
        refuse: "カード情報は読み上げないと伝えて通話を終える。",
        hangUpAndCallCard: "通話を終え、カード裏面の番号にかけ直す。",
      },
      outcomes: {
        calledOfficial: "本物のカードサービスには、停止も未確認の取引も記録がなかった。あのメールは彼らからではなく、記載の番号も彼らのものではなかった。",
        verifiedMismatch: "メールの番号はカード会社のものではない。公表されている回線は {official}で、カード裏面の番号と同じ。かけ直す先はない。",
        readDigits: "相手はカード会社ではなかった。番号全桁とセキュリティコードがあればカードは使える—電話だったからこそ、何も破る必要がなかった。",
        lastFourOnly: "たとえ4桁でも、相手はカード会社ではなかった。その4桁が、彼らが本物のカード会社にかけるときにあなたらしく聞こえる材料になる。",
        refuse: "正しい判断。カード会社はすでに番号を持っていて、読み上げさせる必要はない。",
        hangUpAndCallCard: "カード裏面の番号で本物のカードサービスにつながり、停止はないと確認できた。通話の途中で切っても常にかまわない。",
      }
    },
    messengerChats: {
      picnic: {
        opening: "先日のピクニック、思ったより良かったですね。営業チームはまだ綱引きで勝ったと言い回っています。",
        toast: "営業チームはまだ綱引きで勝ったと言っています。",
        ask: "どう返しますか？",
        choices: {
          loved: "良い一日でした",
          missedIt: "行けませんでした",
          photos: "写真について聞く",
        },
        lines: {
          loved: "本当に良い一日でした。久しぶりにあんな日でしたね。",
          missedIt: "あの週は不在で、残念でした。",
          photos: "綱引きの写真、誰か撮っていましたか？",
        },
        closing: "探しておきます。では、仕事に戻りましょう。",
      },
      returnCheckin: {
        opening: "おはようございます。復帰初日の調子はどうですか。受信箱に変なものが届いていたら声をかけてください。",
        toast: "復帰初日の調子はどうですか。",
        ask: "どう返信しますか？",
        choices: {
          fine: "順調です",
          catchingUp: "まだ追いついていません",
          straightIn: "いきなり本番です",
        },
        lines: {
          fine: "今のところ順調です、ありがとうございます。",
          catchingUp: "まだ受信箱を片付けている途中ですが、進んでいます。",
          straightIn: "いきなり本番で、今朝は助走なしです。",
        },
        closing: "よかった。何かあれば声をかけてください。",
      },
      reportNudge: {
        opening: "少しだけ確認です。四半期のまとめは木曜まで待てますか。レビューの日程が動きました。",
        toast: "四半期のまとめは木曜まで待てますか。",
        ask: "どう答えますか？",
        choices: {
          thursday: "木曜で大丈夫",
          needMore: "もう少し時間が欲しい",
          alreadySent: "もう送っています",
        },
        lines: {
          thursday: "木曜で問題ありません。",
          needMore: "金曜まででも大丈夫ですか。木曜は少し厳しいです。",
          alreadySent: "先週送っています。もう一度お送りします。",
        },
        closing: "助かります。またあとで。",
      },
      lunchPlan: {
        opening: "何人かで12時半にお昼に行きます。一緒にどうですか。",
        toast: "何人かで12時半にお昼に行きます。",
        ask: "どう返しますか？",
        choices: {
          in: "参加します",
          out: "今日はやめます",
          whereTo: "行き先を聞く",
        },
        lines: {
          in: "参加します。少し建物の外に出たいところでした。",
          out: "今日はやめておきます。片付けることが多いので。",
          whereTo: "どちらに行くのですか。",
        },
        closing: "了解です。気が変わったら、いつもの店にいます。",
      },
      onboarding: {
        opening: "{first} さん、入社手続きの書類が分かりにくくないか確認だけさせてください。まだ残っているものはありますか。",
        toast: "入社手続きの書類の確認です。",
        ask: "どう答えますか？",
        choices: {
          allGood: "すべて完了",
          haveQuestions: "質問があります",
          laterToday: "今日のうちに",
        },
        lines: {
          allGood: "すべて記入して提出したと思います。",
          haveQuestions: "実は少し質問があります。お送りしてもいいですか。",
          laterToday: "今日のうちに対応します。",
        },
        closing: "急ぎません。いつでも連絡してください。",
      },
    },
    messengerHijack: {
      opening: "いま席にいますか。レビューの件で少し手を貸してほしいかもしれません。",
      toast: "いま席にいますか。",
      firstAsk: "上司が在席か尋ねています。どう答えますか？",
      firstChoices: {
        atDesk: "います",
        inAMeeting: "会議中です",
        whatIsIt: "用件を聞く",
      },
      firstLines: {
        atDesk: "席にいます。何が必要ですか。",
        inAMeeting: "この先30分は会議です。そのあとでどうですか。",
        whatIsIt: "います。どのような用件でしょうか。",
      },
      payload: "経理が、支払処理の締切前に取引先の口座情報を変更する必要があるそうです。このノートPCからはポータルに入れません。",
      pressure: "そちらから変更を確認してもらえますか。新しい口座情報を送りますので、誰かが承認するだけです。",
      payloadToast: "締切前に取引先の口座情報の変更が必要です。",
      secondAsk: "取引先の口座情報の変更を承認するよう求められています。どうしますか？",
      secondChoices: {
        confirm: "承認する",
        callThem: "電話する",
        report: "報告する",
        later: "できないと伝える",
      },
      secondLines: {
        confirm: "送ってください。承認しておきます。",
        callThem: "何かする前に、内線にかけて確認させてください。",
        report: "まずセキュリティ部門に確認します。",
        later: "口座情報の変更は私では承認できません。経理に依頼してください。",
      },
      outcomes: {
        confirm:
          "口座情報の変更は、戻ってこない支払いそのものです。最初の何気ないやりとりがあったからこそ、この依頼が自然な次の一歩に見えました。しかも送信元のアドレスは、上司のものではありませんでした。",
        callThem: "正しい判断です。本人はこの件を何も知らず、手元にあった番号で数秒でつながりました。",
        report: "セキュリティ部門には同じメッセージの報告がすでに2件ありました。動く前に確認することが、その報告を意味あるものにします。",
        later: "断ったことでお金は守られましたが、相手のアカウントはまだ生きています。報告すれば、他の人にも警告できました。",
      },
    },
    coworkerCheckIn: {
      role: "同僚",
      question: "おはよう。今日の調子はどう？",
      choices: {
        fine: "順調です",
        busy: "手一杯です",
        offline: "つながりません",
        wifiPassword: "Wi-Fi のパスワードを聞く"
      },
      says: {
        fine: "「順調です、ありがとう。」",
        busy: "「忙しいです。休んでいる間にいろいろ溜まっていました。」",
        offline: "「あまりよくないです。ネットにつながりません。」",
        wifiPassword: "「大丈夫です。Wi-Fi のパスワードをもう一度教えてもらえますか？」"
      },
      replies: {
        fine: "それはよかった。何かあれば声をかけて。",
        busy: "わかるよ。少しずつ戻していこう。",
        offline: "Wi-Fi の一覧を確認して。正しいネットワークを選ぶように。",
        wifiPassword: "口に出すのは避けたいな。IT に相談して。"
      }
    },
    wifiNotConnected: {
      title: "インターネットに接続されていません",
      body: "ネットワークに接続されていません。Wi-Fi 設定を開いて接続してください。"
    }
  },

  wifi: {
    panelTitle: "Wi-Fi",
    availableNetworks: "利用可能なネットワーク",
    closePanel: "Wi-Fi パネルを閉じる",
    buttonLabel: "Wi-Fi",
    noConnectionLabel: "インターネットに接続されていません",
    connectedLabel: "{ssid} に接続済み",
    secured: "セキュリティ保護あり",
    notSecured: "セキュリティ保護なし",
    connected: "接続済み"
  },

  actions: {
    report: "報告する",
    trust: "信頼する",
    ignore: "無視する"
  },

  feedback: {
    correctReport:
      "よく気づきました。送信元のドメインは {legitimate} ではなく {suspicious} です。",
    riskyTrust:
      "これは危険です。送信者は {legitimate} ではなく {suspicious} を使用しています。",
    ignoredMalicious:
      "無視すればクリックは避けられますが、報告すれば組織全体を守ることにつながります。"
  },

  language: {
    label: "言語"
  }
} as const;
