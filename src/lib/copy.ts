export type Lang = "de" | "en";

export const LANG_KEY = "kaufplan.lang";

export function readLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "de";
  } catch {
    return "de";
  }
}

type Copy = {
  title: string;
  account: string;
  language: string;
  byLine: string;
  xProfile: string;
  github: string;
  key: string;
  keyPlaceholder: string;
  showKey: string;
  hideKey: string;
  clearKey: string;
  connect: string;
  connecting: string;
  demo: string;
  remember: string;
  rememberLists: string;
  refresh: string;
  disconnect: string;
  live: string;
  balances: string;
  noFiat: string;
  noProfile: string;
  locked: string;
  invest: string;
  investPlaceholder: string;
  investPercent: string;
  currency: string;
  available: string;
  after: string;
  pairs: string;
  search: string;
  searchLabel: string;
  all: string;
  families: Record<string, string>;
  pairCount: (n: number, quote: string) => string;
  shown: (n: number) => string;
  noMatch: string;
  noConnection: string;
  sum: string;
  withoutRest: string;
  equalize: string;
  auto: string;
  remainder: string;
  rest: string;
  fixedShares: string;
  restBudget: string;
  ignored: string;
  left: string;
  market: string;
  share: (name: string) => string;
  stepDown: (name: string) => string;
  stepUp: (name: string) => string;
  remove: (name: string) => string;
  saveList: string;
  listPlaceholder: string;
  save: string;
  favMeta: (n: number, rest: boolean) => string;
  deleteList: (name: string) => string;
  fees: string;
  currentFee: string;
  onStake: string;
  stake: string;
  fee: string;
  value: string;
  setPct: string;
  actual: string;
  belowMin: (amount: string) => string;
  aboveMax: (amount: string) => string;
  lastRun: string;
  qty: string;
  notSent: string;
  fiatLeft: string;
  stop: string;
  runDemo: string;
  runLive: string;
  confirmDemo: string;
  confirmLive: string;
  marketBuy: string;
  stakeLine: (stake: string, fee: string, net: string) => string;
  confirmCheck: string;
  stakeBought: string;
  stakeLater: string;
  staked: string;
  stakeFail: string;
  stakeNone: string;
  cancel: string;
  simulate: string;
  buyNow: string;
  needLogin: string;
  needAmount: string;
  needPair: string;
  needShare: string;
  badSum: (share: string) => string;
  othersHigh: string;
  noRest: string;
  underMin: string;
  overMax: string;
  overBalance: (quote: string) => string;
  connectFail: string;
  runFail: string;
  status: Record<string, string>;
  badKey: string;
  unreachable: string;
  denied: string;
  forbidden: string;
  rate: string;
  conflict: string;
  statusHttp: (n: number) => string;
  pairsFail: string;
  pricesFail: string;
  marketCap: string;
  feeFail: string;
  orderCount: string;
  badOrder: string;
  loadFail: string;
  orderFail: string;
};

export const copy: Record<Lang, Copy> = {
  de: {
    title: "API-Trading Dashboard",
    account: "Konto",
    language: "Sprache",
    byLine: "Erstellt von Galson",
    xProfile: "Galson auf X",
    github: "Github:",
    key: "Fusion-API-Schlüssel",
    keyPlaceholder: "Fusion-Schlüssel",
    showKey: "Schlüssel zeigen",
    hideKey: "Schlüssel verbergen",
    clearKey: "Schlüssel leeren",
    connect: "Verbinden",
    connecting: "Verbinde",
    demo: "Demo",
    remember: "Schlüssel auf diesem Gerät merken",
    rememberLists: "Listen auf diesem Gerät merken",
    refresh: "Aktualisieren",
    disconnect: "Trennen",
    live: "Live",
    balances: "Profilguthaben",
    noFiat: "Keine Fiat-Währung.",
    noProfile: "Noch kein Profil.",
    locked: "gesperrt",
    invest: "Gesamt investieren",
    investPlaceholder: "1000",
    investPercent: "Prozent vom Guthaben",
    currency: "Währung",
    available: "Verfügbar",
    after: "danach",
    pairs: "Fusion-Paare",
    search: "Name oder Kürzel",
    searchLabel: "Paare suchen",
    all: "Alle",
    families: { krypto: "Krypto", aktie: "Aktien", etf: "ETF", rohstoff: "Rohstoffe", sonstige: "Weitere" },
    pairCount: (n, quote) => `${n} Paare · ${quote}`,
    shown: (n) => `${n} gezeigt`,
    noMatch: "Nichts passt.",
    noConnection: "Nicht verbunden.",
    sum: "Summe",
    withoutRest: "ohne ISBR",
    equalize: "Gleich verteilen",
    auto: "Auf 100 % ausgleichen",
    remainder: "ISBR - Ignore Share, Buy Rest",
    rest: "ISBR",
    fixedShares: "Feste Anteile",
    restBudget: "Restbudget",
    ignored: "ignoriert",
    left: "übrig",
    market: "Market",
    share: (name) => `Anteil ${name}`,
    stepDown: (name) => `${name} um 5 % senken`,
    stepUp: (name) => `${name} um 5 % erhöhen`,
    remove: (name) => `${name} entfernen`,
    saveList: "Liste speichern",
    listPlaceholder: "Name",
    save: "Speichern",
    favMeta: (n, rest) => `${n}${rest ? " · ISBR" : ""}`,
    deleteList: (name) => `${name} löschen`,
    fees: "Gebühren und Kaufwert",
    currentFee: "Aktuelle Gebühr",
    onStake: "auf diesen Einsatz",
    stake: "Einsatz",
    fee: "Gebühr",
    value: "Kaufwert",
    setPct: "Soll",
    actual: "Ist",
    belowMin: (amount) => `Unter Minimum ${amount}`,
    aboveMax: (amount) => `Über Maximum ${amount}`,
    lastRun: "Letzte Ausführung",
    qty: "Menge",
    notSent: "nicht gesendet",
    fiatLeft: "Rest-Fiat",
    stop: "Stopp nach dem ersten Fehler. Gesendete Orders bleiben.",
    runDemo: "Demo ausführen",
    runLive: "Market-Käufe ausführen",
    confirmDemo: "Demo",
    confirmLive: "Market-Käufe",
    marketBuy: "Market-Kauf",
    stakeLine: (stake, fee, net) => `Einsatz ${stake} · Gebühr ${fee} · Kaufwert ${net}`,
    confirmCheck: "Diese Käufe jetzt ausführen.",
    stakeBought: "Gekaufte Assets zu 100 % staken",
    stakeLater: "In späteren Updates möglich!",
    staked: "Gestakt",
    stakeFail: "Stake fehlgeschlagen",
    stakeNone: "Kein Staking für dieses Asset",
    cancel: "Abbrechen",
    simulate: "Simulation starten",
    buyNow: "Jetzt kaufen",
    needLogin: "Zuerst verbinden oder Demo öffnen.",
    needAmount: "Investitionsbetrag fehlt.",
    needPair: "Mindestens ein Fusion-Paar wählen.",
    needShare: "Mindestens ein Anteil über 0 %.",
    badSum: (share) => `Anteile ${share} % statt 100 %.`,
    othersHigh: "Übrige Anteile über 100 %.",
    noRest: "Kein Restbetrag für ISBR.",
    underMin: "Unter dem Mindestbetrag.",
    overMax: "Über dem Höchstbetrag.",
    overBalance: (quote) => `Über dem verfügbaren ${quote}-Guthaben.`,
    connectFail: "Verbindung fehlgeschlagen.",
    runFail: "Ausführung fehlgeschlagen.",
    status: {
      filled: "ausgeführt",
      new: "angenommen",
      "partially-filled": "teilweise",
      rejected: "abgelehnt",
      canceled: "storniert",
      open: "offen",
    },
    badKey: "Der API-Schlüssel sieht ungültig aus.",
    unreachable: "Bitpanda Fusion ist gerade nicht erreichbar.",
    denied: "Schlüssel abgelehnt. Fusion-Schlüssel (v2) mit Read und Trade nötig.",
    forbidden: "Diesem Schlüssel fehlt Read oder Trade.",
    rate: "Bitpanda begrenzt gerade die Anfragen.",
    conflict: "Order abgelehnt.",
    statusHttp: (n) => `Bitpanda antwortet mit Status ${n}.`,
    pairsFail: "Paare konnten nicht geladen werden.",
    pricesFail: "Kurse fehlen.",
    marketCap: "Marketcap",
    feeFail: "Kontogebühr nicht lesbar. Annahme 0,25 %.",
    orderCount: "Es sind 1 bis 25 Käufe möglich.",
    badOrder: "Eine Order ist ungültig und wurde nicht gesendet.",
    loadFail: "Fusion-Daten konnten nicht geladen werden.",
    orderFail: "Order fehlgeschlagen.",
  },
  en: {
    title: "API-Trading Dashboard",
    account: "Account",
    language: "Language",
    byLine: "Created by Galson",
    xProfile: "Galson on X",
    github: "Github:",
    key: "Fusion API key",
    keyPlaceholder: "Fusion key",
    showKey: "Show key",
    hideKey: "Hide key",
    clearKey: "Clear key",
    connect: "Connect",
    connecting: "Connecting",
    demo: "Demo",
    remember: "Remember key on this device",
    rememberLists: "Remember lists on this device",
    refresh: "Refresh",
    disconnect: "Disconnect",
    live: "Live",
    balances: "Fiat balances",
    noFiat: "No fiat balance.",
    noProfile: "No profile yet.",
    locked: "locked",
    invest: "Total to invest",
    investPlaceholder: "1000",
    investPercent: "Percent of balance",
    currency: "Currency",
    available: "Available",
    after: "after",
    pairs: "Fusion pairs",
    search: "Name or ticker",
    searchLabel: "Search pairs",
    all: "All",
    families: { krypto: "Crypto", aktie: "Stocks", etf: "ETF", rohstoff: "Commodities", sonstige: "Other" },
    pairCount: (n, quote) => `${n} pairs · ${quote}`,
    shown: (n) => `${n} shown`,
    noMatch: "No match.",
    noConnection: "Not connected.",
    sum: "Total",
    withoutRest: "excluding ISBR",
    equalize: "Split equally",
    auto: "Balance to 100%",
    remainder: "ISBR - Ignore Share, Buy Rest",
    rest: "ISBR",
    fixedShares: "Fixed shares",
    restBudget: "Rest budget",
    ignored: "ignored",
    left: "left",
    market: "Market",
    share: (name) => `${name} share`,
    stepDown: (name) => `Lower ${name} by 5%`,
    stepUp: (name) => `Raise ${name} by 5%`,
    remove: (name) => `Remove ${name}`,
    saveList: "Save list",
    listPlaceholder: "Name",
    save: "Save",
    favMeta: (n, rest) => `${n}${rest ? " · ISBR" : ""}`,
    deleteList: (name) => `Delete ${name}`,
    fees: "Fees and value",
    currentFee: "Current fee",
    onStake: "on this amount",
    stake: "Spend",
    fee: "Fee",
    value: "Net value",
    setPct: "Set",
    actual: "Actual",
    belowMin: (amount) => `Below minimum ${amount}`,
    aboveMax: (amount) => `Above maximum ${amount}`,
    lastRun: "Last run",
    qty: "Quantity",
    notSent: "not sent",
    fiatLeft: "Fiat left",
    stop: "Stopped after the first error. Sent orders stay.",
    runDemo: "Run demo",
    runLive: "Place market buys",
    confirmDemo: "Demo",
    confirmLive: "Market buys",
    marketBuy: "Market buy",
    stakeLine: (stake, fee, net) => `Spend ${stake} · Fee ${fee} · Net ${net}`,
    confirmCheck: "Place these buys now.",
    stakeBought: "Stake 100% of the bought assets",
    stakeLater: "Available in a later update!",
    staked: "Staked",
    stakeFail: "Stake failed",
    stakeNone: "No staking for this asset",
    cancel: "Cancel",
    simulate: "Start simulation",
    buyNow: "Buy now",
    needLogin: "Connect or open the demo first.",
    needAmount: "Enter an amount.",
    needPair: "Pick at least one Fusion pair.",
    needShare: "At least one share must be above 0%.",
    badSum: (share) => `Shares are ${share}% instead of 100%.`,
    othersHigh: "Shares other than ISBR exceed 100%.",
    noRest: "Nothing left for ISBR.",
    underMin: "Below the minimum order.",
    overMax: "Above the maximum order.",
    overBalance: (quote) => `Above the available ${quote} balance.`,
    connectFail: "Connection failed.",
    runFail: "Execution failed.",
    status: {
      filled: "filled",
      new: "accepted",
      "partially-filled": "partial",
      rejected: "rejected",
      canceled: "canceled",
      open: "open",
    },
    badKey: "The API key looks invalid.",
    unreachable: "Bitpanda Fusion is unreachable.",
    denied: "Key rejected. A Fusion v2 key with Read and Trade is required.",
    forbidden: "This key is missing Read or Trade.",
    rate: "Bitpanda is rate-limiting requests.",
    conflict: "Order rejected.",
    statusHttp: (n) => `Bitpanda responded with status ${n}.`,
    pairsFail: "Pairs could not be loaded.",
    pricesFail: "Prices are missing.",
    marketCap: "Market cap",
    feeFail: "Account fee unreadable. Assuming 0.25%.",
    orderCount: "1 to 25 buys per run.",
    badOrder: "One order is invalid and was not sent.",
    loadFail: "Fusion data could not be loaded.",
    orderFail: "Order failed.",
  },
};
