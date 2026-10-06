export type Balance = {
  symbol: string;
  available: string;
  locked: string;
};

export type Tier = {
  name: string;
  fee: string;
  feeMode: string;
  requiredVolume30d: string;
};

export type Account = {
  tradedVolume30d: string;
  currentTier: Tier | null;
  nextTier: Tier | null;
};

export type Instrument = {
  pair: string;
  base: string;
  quote: string;
  baseType: string;
  name: string;
  price: string | null;
  marketCap: string | null;
  high: string | null;
  low: string | null;
  volume: string | null;
  minOrderAmount: string;
  maxOrderAmount: string;
  amountIncrement: string;
  sizeIncrement: string;
};

export type Snapshot = {
  balances: Balance[];
  account: Account;
  instruments: Instrument[];
  pricesPartial: boolean;
  warning: string | null;
};

export type OrderResult = {
  pair: string;
  ok: boolean;
  message: string;
  id: string;
  status: string;
  filledQuantity: string;
  filledAmount: string;
  spent: string;
  feeAmount: string;
  feeCurrency: string;
  stake?: "staked" | "failed";
  stakeMessage?: string;
};

export type FeeTier = {
  level: number;
  label: string;
  min: number;
  max: number;
  fee: number;
  volume: string;
};

/** Public Fusion fee ladder (single rate per tier, not maker/taker). */
export const FEE_TIERS: FeeTier[] = [
  { level: 1, label: "Level 1", min: 0, max: 100_000, fee: 0.0025, volume: "bis 100.000 €" },
  { level: 2, label: "Level 2", min: 100_000, max: 500_000, fee: 0.0021, volume: "bis 500.000 €" },
  { level: 3, label: "Level 3", min: 500_000, max: 2_500_000, fee: 0.0017, volume: "bis 2,5 Mio. €" },
  { level: 4, label: "Level 4", min: 2_500_000, max: 10_000_000, fee: 0.0013, volume: "bis 10 Mio. €" },
  { level: 5, label: "Level 5", min: 10_000_000, max: 50_000_000, fee: 0.0008, volume: "bis 50 Mio. €" },
  { level: 6, label: "Level 6", min: 50_000_000, max: 250_000_000, fee: 0.0005, volume: "bis 250 Mio. €" },
  { level: 7, label: "Level 7", min: 250_000_000, max: Infinity, fee: 0.0002, volume: "darüber" },
];

const FIAT = ["EUR", "USD", "CHF", "GBP"];

export type Family = "krypto" | "aktie" | "etf" | "rohstoff" | "sonstige";

export function familyOf(type: string): Family {
  const t = type.toLowerCase();
  if (t.includes("crypto") || t.includes("coin") || t === "token") return "krypto";
  if (t.includes("etf") || t.includes("etc") || t.includes("etn")) return "etf";
  if (t.includes("equity") || t.includes("stock") || t.includes("share")) return "aktie";
  if (t.includes("metal") || t.includes("commod") || t.includes("gold")) return "rohstoff";
  return "sonstige";
}

export const FAMILY_LABEL: Record<Family, string> = {
  krypto: "Krypto",
  aktie: "Aktien",
  etf: "ETF",
  rohstoff: "Rohstoffe",
  sonstige: "Weitere",
};

export function parseDecimal(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let s = trimmed.replace(/\s/g, "");
  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Fusion returns the fee as "0.25%", "0.25" (percent) or "0.0025" (ratio). */
export function parseFeeRate(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  const explicitPercent = s.endsWith("%");
  const n = Number(s.replace("%", ""));
  if (!Number.isFinite(n) || n < 0) return null;
  if (explicitPercent || n > 1 || n >= 0.01) return n / 100;
  return n;
}

export function feeRateFor(account: Account | null): { rate: number; assumed: boolean } {
  const parsed = parseFeeRate(account?.currentTier?.fee);
  if (parsed != null) return { rate: parsed, assumed: false };
  return { rate: FEE_TIERS[0].fee, assumed: true };
}

export function activeLevel(account: Account | null): number | null {
  if (!account) return null;
  const named = account.currentTier?.name?.match(/(\d+)/);
  if (named) {
    const level = Number(named[1]);
    if (FEE_TIERS.some((t) => t.level === level)) return level;
  }
  const rate = parseFeeRate(account.currentTier?.fee);
  if (rate != null) {
    const hit = FEE_TIERS.find((t) => Math.abs(t.fee - rate) < 1e-6);
    if (hit) return hit.level;
  }
  const vol = Number(account.tradedVolume30d);
  if (Number.isFinite(vol)) {
    const hit = FEE_TIERS.find((t) => vol >= t.min && vol < t.max);
    if (hit) return hit.level;
  }
  return null;
}

export function isFiat(symbol: string, types: Map<string, string>): boolean {
  if (FIAT.includes(symbol)) return true;
  return types.get(symbol)?.toLowerCase() === "fiat";
}

export function num(value: string | null | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const eurFmt = () =>
  new Intl.NumberFormat(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

let numberLocale = "de-DE";

export function setNumberLocale(lang: "de" | "en") {
  numberLocale = lang === "en" ? "en-GB" : "de-DE";
}

export function formatMoney(n: number, quote = "EUR"): string {
  const body = eurFmt().format(n);
  if (quote === "EUR") return `${body} €`;
  return `${body} ${quote}`;
}

export function formatRate(rate: number): string {
  return `${eurFmt().format(rate * 100)} %`;
}

export function formatShare(hundredths: number): string {
  return new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(hundredths / 100);
}

export function formatCap(n: number, quote: string): string {
  try {
    return new Intl.NumberFormat(numberLocale, {
      notation: "compact",
      style: "currency",
      currency: quote,
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return formatCompact(n);
  }
}

export function formatQty(n: number): string {
  const digits = n >= 100 ? 4 : n >= 1 ? 6 : 8;
  return new Intl.NumberFormat(numberLocale, { maximumFractionDigits: digits }).format(n);
}

export function formatPrice(n: number): string {
  const digits = n >= 100 ? 2 : n >= 1 ? 4 : 6;
  return new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat(numberLocale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export type Selection = { pair: string; hundredths: number };

export function sortByShare(items: Selection[]): Selection[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.hundredths - a.item.hundredths || a.index - b.index)
    .map((row) => row.item);
}

/** Next or previous 5% step. Values already on that grid move by exactly 5 points. */
export function stepFive(hundredths: number, direction: 1 | -1): number {
  const grid = 500;
  if (direction > 0) return Math.min(10000, Math.floor(hundredths / grid) * grid + grid);
  return Math.max(0, Math.ceil(hundredths / grid) * grid - grid);
}

/**
 * Set one share. The top share — or the one directly under it, when the top share
 * itself moves — changes by the same amount in the opposite direction.
 * The largest share stays first.
 */
export function nudgeShare(items: Selection[], pair: string, nextHundredths: number): Selection[] {
  const ordered = sortByShare(items);
  const index = ordered.findIndex((item) => item.pair === pair);
  if (index < 0) return ordered;
  if (ordered.length < 2) {
    return [{ ...ordered[0], hundredths: Math.max(0, Math.min(10000, Math.round(nextHundredths))) }];
  }
  const current = ordered[index].hundredths;
  let next = Math.max(0, Math.min(10000, Math.round(nextHundredths)));
  const partnerIndex = index === 0 ? 1 : 0;
  let partnerNext = ordered[partnerIndex].hundredths - (next - current);
  if (partnerNext < 0) {
    next += partnerNext;
    partnerNext = 0;
  } else if (partnerNext > 10000) {
    next -= partnerNext - 10000;
    partnerNext = 10000;
  }
  next = Math.max(0, Math.min(10000, next));
  const updated = ordered.map((item, i) => {
    if (i === index) return { ...item, hundredths: next };
    if (i === partnerIndex) return { ...item, hundredths: partnerNext };
    return item;
  });
  return sortByShare(updated);
}

export function actualHundredths(gross: number, invest: number): number {
  if (!(invest > 0)) return 0;
  return Math.round((gross / invest) * 10000);
}

export function equalHundredths(count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(10000 / count);
  const rem = 10000 - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0));
}

export function scaleToFull(items: Selection[]): Selection[] {
  if (items.length === 0) return items;
  const sum = items.reduce((s, item) => s + item.hundredths, 0);
  if (sum === 10000) return items;
  if (sum <= 0) {
    const parts = equalHundredths(items.length);
    return items.map((item, i) => ({ ...item, hundredths: parts[i] ?? 0 }));
  }
  let used = 0;
  return items.map((item, i) => {
    if (i === items.length - 1) return { ...item, hundredths: 10000 - used };
    const next = Math.floor((item.hundredths * 10000) / sum);
    used += next;
    return { ...item, hundredths: next };
  });
}

/** Keep the edited share and rescale every other row so the total stays 100%. */
export function applyShare(items: Selection[], pair: string, hundredths: number): Selection[] {
  const clamped = Math.max(0, Math.min(10000, Math.round(hundredths)));
  const index = items.findIndex((item) => item.pair === pair);
  if (index < 0) return items;
  if (items.length === 1) return [{ ...items[0], hundredths: 10000 }];
  const others = items.filter((_, i) => i !== index);
  const rest = Math.max(0, 10000 - clamped);
  const otherSum = others.reduce((sum, item) => sum + item.hundredths, 0);
  const parts = others.map((item) => {
    const exact = otherSum <= 0 ? rest / others.length : (rest * item.hundredths) / otherSum;
    const base = Math.floor(exact);
    return { pair: item.pair, base, frac: exact - base };
  });
  let leftover = rest - parts.reduce((sum, item) => sum + item.base, 0);
  const order = parts
    .map((item, i) => i)
    .sort((a, b) => parts[b].frac - parts[a].frac || a - b);
  for (const i of order) {
    if (leftover <= 0) break;
    parts[i].base += 1;
    leftover -= 1;
  }
  const next = new Map(parts.map((item) => [item.pair, item.base]));
  return items.map((item) =>
    item.pair === pair ? { ...item, hundredths: clamped } : { ...item, hundredths: next.get(item.pair) ?? 0 },
  );
}

export type LegPlan = {
  pair: string;
  base: string;
  name: string;
  hundredths: number;
  gross: number;
  fee: number;
  net: number;
  price: number | null;
  qty: number | null;
  min: number;
  max: number;
  amount: string;
  belowMin: boolean;
  aboveMax: boolean;
  isRemainder: boolean;
};

function decimalsOf(increment: string): number {
  const i = increment.indexOf(".");
  if (i < 0) return 0;
  return increment.length - i - 1;
}

export function amountString(gross: number, increment: string): string {
  const inc = Number(increment);
  const step = Number.isFinite(inc) && inc > 0 ? inc : 0.01;
  const digits = Math.min(8, Math.max(2, decimalsOf(step >= 1 ? "0" : increment || "0.01")));
  const floored = Math.floor(gross / step + 1e-8) * step;
  return floored.toFixed(digits);
}

export function remainderIndex(selections: Selection[]): number {
  let index = 0;
  for (let i = 1; i < selections.length; i++) {
    if (selections[i].hundredths <= selections[index].hundredths) index = i;
  }
  return index;
}

function feeCentsOf(netCents: number, rate: number): number {
  return Math.round(netCents * rate);
}

/** Largest buy whose value plus fee still fits in the remaining budget. */
function inclusiveBuy(budgetCents: number, rate: number): { netCents: number; feeCents: number } {
  if (budgetCents <= 0) return { netCents: 0, feeCents: 0 };
  const gross = (net: number) => net + feeCentsOf(net, rate);
  let net = Math.min(budgetCents, Math.max(0, Math.round(budgetCents / (1 + rate))));
  while (net > 0 && gross(net) > budgetCents) net -= 1;
  while (net < budgetCents && gross(net + 1) <= budgetCents) net += 1;
  return { netCents: net, feeCents: feeCentsOf(net, rate) };
}

export function planLegs(
  invest: number,
  feeRate: number,
  selections: Selection[],
  byPair: Map<string, Instrument>,
  remainder = false,
): LegPlan[] {
  const totalCents = Math.max(0, Math.round(invest * 100));
  const rows: { item: Selection; cents: number; isRemainder: boolean }[] = [];

  if (remainder && selections.length > 0) {
    const restAt = remainderIndex(selections);
    let usedSpend = 0;
    selections.forEach((item, i) => {
      if (i === restAt || item.hundredths <= 0) return;
      const netCents = Math.floor((totalCents * item.hundredths) / 10000);
      usedSpend += netCents + feeCentsOf(netCents, feeRate);
      rows.push({ item, cents: netCents, isRemainder: false });
    });
    const rest = inclusiveBuy(totalCents - usedSpend, feeRate);
    rows.push({ item: selections[restAt], cents: rest.netCents, isRemainder: true });
  } else {
    const active = selections.filter((item) => item.hundredths > 0);
    const cents = active.map((item) => Math.floor((totalCents * item.hundredths) / 10000));
    const shareSum = active.reduce((sum, item) => sum + item.hundredths, 0);
    if (shareSum === 10000) {
      let rem = totalCents - cents.reduce((sum, value) => sum + value, 0);
      const order = active
        .map((_, i) => i)
        .sort((a, b) => active[b].hundredths - active[a].hundredths || a - b);
      for (const i of order) {
        if (rem <= 0) break;
        cents[i] += 1;
        rem -= 1;
      }
    }
    active.forEach((item, i) => rows.push({ item, cents: cents[i] ?? 0, isRemainder: false }));
  }

  return rows.map(({ item, cents, isRemainder }) => {
    const instrument = byPair.get(item.pair);
    const amount = amountString(cents / 100, instrument?.amountIncrement || "0.01");
    const net = num(amount);
    const fee = Math.round(net * feeRate * 100) / 100;
    const gross = Math.round((net + fee) * 100) / 100;
    const price = instrument?.price ? num(instrument.price) : 0;
    const min = instrument ? num(instrument.minOrderAmount) : 0;
    const max = instrument ? num(instrument.maxOrderAmount) : 0;
    return {
      pair: item.pair,
      base: instrument?.base ?? item.pair.split("-")[0] ?? item.pair,
      name: instrument?.name || instrument?.base || item.pair,
      hundredths: item.hundredths,
      gross,
      fee,
      net,
      price: price > 0 ? price : null,
      qty: price > 0 ? net / price : null,
      min,
      max,
      amount,
      belowMin: min > 0 && net + 1e-9 < min,
      aboveMax: max > 0 && net > max + 1e-9,
      isRemainder,
    };
  }).sort(
    (a, b) =>
      b.hundredths - a.hundredths || Number(a.isRemainder) - Number(b.isRemainder) || a.pair.localeCompare(b.pair),
  );
}

export function quoteOptions(instruments: Instrument[]): string[] {
  const set = new Set(instruments.map((item) => item.quote));
  const preferred = FIAT.filter((code) => set.has(code));
  const rest = [...set].filter((code) => !preferred.includes(code)).sort();
  return [...preferred, ...rest];
}

export function demoSnapshot(): Snapshot {
  const rows: Array<[string, string, string, string, number, number, number]> = [
    ["BTC", "Bitcoin", "cryptocoin", "61500", 842000, 25, 1_210_000_000_000],
    ["ETH", "Ethereum", "cryptocoin", "2480", 510000, 25, 290_000_000_000],
    ["SOL", "Solana", "cryptocoin", "142.4", 190000, 25, 68_000_000_000],
    ["XRP", "XRP", "cryptocoin", "0.58", 120000, 25, 33_000_000_000],
    ["ADA", "Cardano", "cryptocoin", "0.42", 64000, 25, 15_000_000_000],
    ["LINK", "Chainlink", "cryptocoin", "14.2", 41000, 25, 9_000_000_000],
    ["AVAX", "Avalanche", "cryptocoin", "27.8", 38000, 25, 11_000_000_000],
    ["DOT", "Polkadot", "cryptocoin", "4.65", 22000, 25, 7_000_000_000],
    ["DOGE", "Dogecoin", "cryptocoin", "0.16", 88000, 25, 23_000_000_000],
    ["UNI", "Uniswap", "cryptocoin", "7.4", 15000, 25, 4_500_000_000],
    ["ATOM", "Cosmos", "cryptocoin", "5.1", 9000, 25, 2_000_000_000],
    ["NEAR", "NEAR Protocol", "cryptocoin", "3.35", 11000, 25, 3_800_000_000],
    ["PAXG", "PAX Gold", "commodity", "2348", 27000, 25, 620_000_000],
    ["AAPL", "Apple", "equity_security", "198.4", 54000, 25, 3_000_000_000_000],
    ["ASML", "ASML Holding", "equity_security", "742", 31000, 50, 290_000_000_000],
    ["VWCE", "Vanguard FTSE All-World", "etf", "128.6", 18000, 25, 18_000_000_000],
  ];
  return {
    pricesPartial: false,
    warning: null,
    balances: [
      { symbol: "EUR", available: "2500.00", locked: "0.00" },
      { symbol: "USD", available: "120.40", locked: "0.00" },
      { symbol: "BTC", available: "0.0142", locked: "0" },
      { symbol: "ETH", available: "0.35", locked: "0" },
    ],
    account: {
      tradedVolume30d: "1840.50",
      currentTier: {
        name: "Level 1",
        fee: "0.25%",
        feeMode: "flat",
        requiredVolume30d: "0",
      },
      nextTier: {
        name: "Level 2",
        fee: "0.21%",
        feeMode: "flat",
        requiredVolume30d: "100000",
      },
    },
    instruments: rows.map(([base, name, type, price, volume, min, marketCap]) => ({
      pair: `${base}-EUR`,
      base,
      quote: "EUR",
      baseType: type,
      name,
      price,
      marketCap: String(marketCap),
      high: null,
      low: null,
      volume: String(volume),
      minOrderAmount: min.toFixed(2),
      maxOrderAmount: "250000.00",
      amountIncrement: "0.01",
      sizeIncrement: "0.00000001",
    })),
  };
}
