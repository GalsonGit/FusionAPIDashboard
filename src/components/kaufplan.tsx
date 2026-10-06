import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Unplug,
  X,
} from "lucide-react";
import { loadFusionSnapshot, placeFusionOrders } from "@/lib/fusion.functions";
import { copy, readLang, type Lang } from "@/lib/copy";
import {
  actualHundredths,
  demoSnapshot,
  equalHundredths,
  familyOf,
  feeRateFor,
  formatMoney,
  formatCap,
  formatPrice,
  formatQty,
  formatRate,
  formatShare,
  isFiat,
  num,
  parseDecimal,
  planLegs,
  quoteOptions,
  remainderIndex,
  scaleToFull,
  setNumberLocale,
  sortByShare,
  nudgeShare,
  stepFive,
  type Family,
  type OrderResult,
  type Selection,
  type Snapshot,
} from "@/lib/fusion-model";

const KEY = "kaufplan.key";
const LISTS = "kaufplan.lists";
const LISTS_KEEP = "kaufplan.lists.keep";

type Favorite = {
  id: string;
  name: string;
  quote: string;
  selections: Selection[];
  remainder: boolean;
};

function loadStoredLists(raw: string | null): Favorite[] {
  try {
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const name = String(row.name ?? "").trim().slice(0, 40);
      const quote = String(row.quote ?? "EUR").toUpperCase();
      const selections = Array.isArray(row.selections)
        ? row.selections.flatMap((entry) => {
            if (!entry || typeof entry !== "object") return [];
            const sel = entry as Record<string, unknown>;
            const pair = String(sel.pair ?? "").toUpperCase();
            const hundredths = Number(sel.hundredths);
            if (!/^[A-Z0-9]{1,20}-[A-Z0-9]{1,12}$/.test(pair) || !Number.isFinite(hundredths)) return [];
            return [{ pair, hundredths: Math.max(0, Math.min(10000, Math.round(hundredths))) }];
          })
        : [];
      if (!name || selections.length === 0) return [];
      return [
        {
          id: String(row.id ?? name),
          name,
          quote,
          selections,
          remainder: Boolean(row.remainder),
        },
      ];
    });
  } catch {
    return [];
  }
}

export function Kaufplan() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [remember, setRemember] = useState(false);
  const [rememberLists, setRememberLists] = useState(false);
  const [mode, setMode] = useState<"idle" | "demo" | "live">("idle");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [quote, setQuote] = useState("EUR");
  const [investText, setInvestText] = useState("");
  const [selections, setSelections] = useState<Selection[]>([]);
  const [auto, setAuto] = useState(true);
  const [remainder, setRemainder] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [listName, setListName] = useState("");
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<"alle" | Family>("alle");
  const [draft, setDraft] = useState<{ pair: string; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<OrderResult[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [lang, setLang] = useState<Lang>("de");
  const [leftFiat, setLeftFiat] = useState<number | null>(null);
  const booted = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const explicit = localStorage.getItem(LISTS_KEEP);
    const storedLocal = localStorage.getItem(LISTS);
    const keepLists = explicit === "1" || (explicit == null && Boolean(storedLocal));
    if (keepLists) localStorage.setItem(LISTS_KEEP, "1");
    setRememberLists(keepLists);
    setFavorites(loadStoredLists(keepLists ? storedLocal || sessionStorage.getItem(LISTS) : sessionStorage.getItem(LISTS)));
    const stored = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
    if (!stored) return;
    setApiKey(stored);
    setRemember(localStorage.getItem(KEY) === stored);
    void connect(stored, localStorage.getItem(KEY) === stored);
    // connect is stable enough for the one-shot boot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = readLang();
    setLang(next);
    setNumberLocale(next);
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    setNumberLocale(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (confirmOpen) cancelRef.current?.focus();
  }, [confirmOpen]);

  const types = useMemo(() => {
    const map = new Map<string, string>();
    const quotes = new Set((snapshot?.instruments ?? []).map((item) => item.quote));
    for (const instrument of snapshot?.instruments ?? []) {
      if (!quotes.has(instrument.base)) map.set(instrument.base, instrument.baseType);
    }
    for (const code of quotes) map.set(code, "fiat");
    return map;
  }, [snapshot]);

  const byPair = useMemo(() => {
    const map = new Map<string, NonNullable<Snapshot["instruments"][number]>>();
    for (const instrument of snapshot?.instruments ?? []) map.set(instrument.pair, instrument);
    return map;
  }, [snapshot]);

  const quotes = useMemo(
    () => (snapshot ? quoteOptions(snapshot.instruments) : ["EUR"]),
    [snapshot],
  );

  const catalog = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (snapshot?.instruments ?? [])
      .filter((item) => item.quote === quote || item.quote === "EURCV")
      .filter((item) => (family === "alle" ? true : familyOf(item.baseType) === family))
      .filter((item) => {
        if (!needle) return true;
        return (
          item.base.toLowerCase().includes(needle) ||
          item.name.toLowerCase().includes(needle) ||
          item.pair.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => num(b.volume) - num(a.volume) || a.base.localeCompare(b.base, "de"));
  }, [snapshot, quote, family, query]);

  const families = useMemo(() => {
    const present = new Set<Family>();
    for (const item of snapshot?.instruments ?? []) {
      if (item.quote === quote || item.quote === "EURCV") present.add(familyOf(item.baseType));
    }
    return (["krypto", "aktie", "etf", "rohstoff", "sonstige"] as Family[]).filter((key) => present.has(key));
  }, [snapshot, quote]);

  const balance = snapshot?.balances.find((item) => item.symbol === quote);
  const available = num(balance?.available);
  const locked = num(balance?.locked);
  const invest = parseDecimal(investText);

  function setInvestFromNumber(amount: number) {
    const cap = available > 0 ? available : amount;
    const rounded = Math.max(0, Math.round(Math.min(amount, cap) * 100) / 100);
    const text = rounded.toFixed(2);
    setInvestText(lang === "de" ? text.replace(".", ",") : text);
  }

  function setInvestPercent(percent: number) {
    if (available <= 0) return;
    const snapped = [0, 25, 50, 75, 100].reduce((best, mark) =>
      Math.abs(mark - percent) < Math.abs(best - percent) ? mark : best,
    );
    setInvestFromNumber((available * snapped) / 100);
  }
  const investPct =
    available > 0 && invest != null ? Math.min(100, Math.max(0, (invest / available) * 100)) : 0;
  const t = copy[lang];
  const ordered = useMemo(() => sortByShare(selections), [selections]);
  const shareListRef = useRef<HTMLUListElement>(null);
  const shareTops = useRef<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    const list = shareListRef.current;
    if (!list) return;
    const rows = [...list.querySelectorAll<HTMLElement>("[data-share-pair]")];
    const next = new Map<string, number>();
    for (const row of rows) {
      const pair = row.dataset.sharePair;
      if (pair) next.set(pair, row.offsetTop);
    }
    const prev = shareTops.current;
    const sameSet = prev.size > 0 && prev.size === next.size && [...next.keys()].every((pair) => prev.has(pair));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sameSet && !reduce) {
      for (const row of rows) {
        const pair = row.dataset.sharePair ?? "";
        const before = prev.get(pair);
        const after = next.get(pair);
        if (before == null || after == null || before === after) continue;
        const dy = before - after;
        const run = String(Number(row.dataset.shuffle ?? "0") + 1);
        row.dataset.shuffle = run;
        row.style.zIndex = dy > 0 ? "2" : "1";
        row.style.transition = "none";
        row.style.transform = `translateY(${dy}px)`;
        row.style.backgroundColor =
          dy > 0 ? "color-mix(in srgb, var(--color-brass) 24%, transparent)" : "transparent";
        requestAnimationFrame(() => {
          if (row.dataset.shuffle !== run) return;
          row.style.transition =
            "transform 340ms cubic-bezier(0.22, 1.12, 0.36, 1), background-color 340ms ease";
          row.style.transform = "translateY(0)";
          row.style.backgroundColor = "transparent";
        });
        const clear = (event: TransitionEvent) => {
          if (event.propertyName !== "transform" || row.dataset.shuffle !== run) return;
          row.style.zIndex = "";
          row.style.transition = "";
          row.style.transform = "";
          row.style.backgroundColor = "";
          row.removeEventListener("transitionend", clear);
        };
        row.addEventListener("transitionend", clear);
      }
    }
    shareTops.current = next;
  }, [ordered]);
  const shareSum = ordered.reduce((sum, item) => sum + item.hundredths, 0);
  const restPair = remainder && ordered.length > 0 ? ordered[remainderIndex(ordered)].pair : null;
  const othersSum = ordered.reduce((sum, item) => sum + (item.pair === restPair ? 0 : item.hundredths), 0);
  const { rate } = feeRateFor(mode === "idle" ? null : snapshot?.account ?? null);
  const legs = invest != null && invest > 0 ? planLegs(invest, rate, ordered, byPair, remainder) : [];
  const gross = legs.reduce((sum, leg) => sum + leg.gross, 0);
  const fee = legs.reduce((sum, leg) => sum + leg.fee, 0);
  const net = legs.reduce((sum, leg) => sum + leg.net, 0);
  const isbrLeg = legs.find((leg) => leg.isRemainder) ?? null;
  const leftAfter = new Map<string, number>();
  if (remainder && invest != null && invest > 0) {
    let used = 0;
    for (const leg of legs) {
      if (leg.isRemainder) continue;
      used += leg.gross;
      leftAfter.set(leg.pair, Math.round((invest - used) * 100) / 100);
    }
  }
  const sumOk = remainder ? othersSum <= 10000 && selections.length > 0 : shareSum > 0 && shareSum <= 10000;

  const blockers: string[] = [];
  if (!snapshot) blockers.push(t.needLogin);
  if (invest == null || invest <= 0) blockers.push(t.needAmount);
  if (ordered.length === 0) blockers.push(t.needPair);
  else if (!remainder && !ordered.some((item) => item.hundredths > 0)) blockers.push(t.needShare);
  if (snapshot && !remainder && shareSum > 10000) blockers.push(t.badSum(formatShare(shareSum)));
  if (snapshot && remainder && othersSum > 10000) blockers.push(t.othersHigh);
  if (remainder && legs.some((leg) => leg.isRemainder && leg.net <= 0)) blockers.push(t.noRest);
  if (legs.some((leg) => leg.belowMin)) blockers.push(t.underMin);
  if (legs.some((leg) => leg.aboveMax)) blockers.push(t.overMax);
  if (snapshot && gross > available + 0.009) blockers.push(t.overBalance(quote));

  async function connect(key = apiKey, keep = remember) {
    const trimmed = key.trim();
    setError("");
    setLoading(true);
    try {
      const result = await loadFusionSnapshot({ data: { apiKey: trimmed, lang: readLang() } });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSnapshot(result.snapshot);
      setMode("live");
      setResults([]);
      const options = quoteOptions(result.snapshot.instruments);
      const nextQuote = options.includes(quote) ? quote : options[0] || "EUR";
      setQuote(nextQuote);
      setSelections((prev) =>
        prev.filter((item) =>
          result.snapshot.instruments.some(
            (instrument) => instrument.pair === item.pair && instrument.quote === nextQuote,
          ),
        ),
      );
      sessionStorage.setItem(KEY, trimmed);
      if (keep) localStorage.setItem(KEY, trimmed);
      else localStorage.removeItem(KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy[readLang()].connectFail);
    } finally {
      setLoading(false);
    }
  }

  function openDemo() {
    const demo = demoSnapshot();
    setSnapshot(demo);
    setMode("demo");
    setQuote("EUR");
    setError("");
    setResults([]);
      setSelections((prev) =>
        sortByShare(
          prev.length > 0
            ? prev
            : [
                { pair: "BTC-EUR", hundredths: 7000 },
                { pair: "ETH-EUR", hundredths: 3000 },
              ],
        ),
      );
    setInvestText((prev) => (prev.trim() ? prev : "1000"));
  }

  function disconnect() {
    setSnapshot(null);
    setMode("idle");
    setResults([]);
    setError("");
    sessionStorage.removeItem(KEY);
    if (!remember) localStorage.removeItem(KEY);
  }

  function toggle(pair: string) {
    setDraft(null);
    const pairQuote = byPair.get(pair)?.quote ?? pair.split("-").pop() ?? quote;
    const exists = selections.some((item) => item.pair === pair);
    if (!exists && pairQuote !== quote) setQuote(pairQuote);
    setSelections((prev) => {
      if (prev.some((item) => item.pair === pair)) {
        const next = prev.filter((item) => item.pair !== pair);
        return auto ? scaleToFull(next) : next;
      }
      const base = pairQuote === quote ? prev : prev.filter((item) => item.pair.endsWith(`-${pairQuote}`));
      if (base.length === 0) return [{ pair, hundredths: 10000 }];
      return [...base, { pair, hundredths: 0 }];
    });
  }

  function commitShare(pair: string, raw: string) {
    const parsed = parseDecimal(raw);
    if (parsed == null) return;
    const hundredths = Math.max(0, Math.min(10000, Math.round(parsed * 100)));
    setSelections((prev) => {
      if (auto && prev.length > 1) return nudgeShare(prev, pair, hundredths);
      if (auto && prev.length === 1) return [{ ...prev[0], hundredths: 10000 }];
      return prev.map((item) => (item.pair === pair ? { ...item, hundredths } : item));
    });
  }

  function stepShare(pair: string, delta: number) {
    setDraft(null);
    setSelections((prev) => {
      const current = prev.find((item) => item.pair === pair);
      if (!current || (auto && prev.length < 2)) return prev;
      const next = stepFive(current.hundredths, delta > 0 ? 1 : -1);
      if (auto) return nudgeShare(prev, pair, next);
      return prev.map((item) => (item.pair === pair ? { ...item, hundredths: next } : item));
    });
  }

  function equalize() {
    setDraft(null);
    setSelections((prev) => {
      const parts = equalHundredths(prev.length);
      return prev.map((item, index) => ({ ...item, hundredths: parts[index] ?? 0 }));
    });
  }

  function writeFavorites(next: Favorite[], keep = rememberLists) {
    setFavorites(next);
    const raw = JSON.stringify(next);
    sessionStorage.setItem(LISTS, raw);
    if (keep) localStorage.setItem(LISTS, raw);
    else localStorage.removeItem(LISTS);
  }

  function saveList() {
    const name = listName.trim().slice(0, 40);
    if (!name || selections.length === 0) return;
    const fav: Favorite = {
      id: crypto.randomUUID(),
      name,
      quote,
      selections: ordered,
      remainder,
    };
    const next = [fav, ...favorites.filter((item) => item.name.toLowerCase() !== name.toLowerCase())].slice(0, 20);
    writeFavorites(next);
    setListName("");
  }

  function applyFavorite(fav: Favorite) {
    setQuote(fav.quote);
    setSelections(sortByShare(fav.selections));
    setRemainder(fav.remainder);
    setDraft(null);
  }

  function removeFavorite(id: string) {
    writeFavorites(favorites.filter((item) => item.id !== id));
  }

  async function execute() {
    if (blockers.length > 0 || !snapshot || placing) return;
    setPlacing(true);
    setError("");
    try {
      if (mode === "demo") {
        const next = legs.map((leg) => ({
          pair: leg.pair,
          ok: true,
          message: "",
          id: "",
          status: "filled",
          filledQuantity: leg.qty != null ? String(leg.qty) : "",
          filledAmount: leg.amount,
          spent: leg.amount,
          feeAmount: leg.fee.toFixed(2),
          feeCurrency: quote,
        }));
        setResults(next);
        setLeftFiat(
          Math.round(
            (available - next.reduce((sum, row) => sum + num(row.filledAmount) + num(row.feeAmount), 0)) * 100,
          ) / 100,
        );
        setConfirmOpen(false);
        return;
      }
      const result = await placeFusionOrders({
        data: {
          apiKey: apiKey.trim(),
          lang,
          stake: false,
          orders: legs.map((leg) => ({ pair: leg.pair, amount: leg.amount })),
        },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setResults(result.results);
      setConfirmOpen(false);
      const refreshed = await loadFusionSnapshot({ data: { apiKey: apiKey.trim(), lang } });
      if (refreshed.ok) {
        setSnapshot(refreshed.snapshot);
        const balance = refreshed.snapshot.balances.find((item) => item.symbol === quote);
        setLeftFiat(num(balance?.available));
      } else {
        const spent = result.results
          .filter((row) => row.ok)
          .reduce((sum, row) => sum + (num(row.filledAmount) || num(row.spent)) + num(row.feeAmount), 0);
        setLeftFiat(Math.round((available - spent) * 100) / 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.runFail);
    } finally {
      setPlacing(false);
      setAccepted(false);
    }
  }

  const visible = [
    ...catalog.filter((item) => item.quote !== "EURCV").slice(0, 60),
    ...catalog.filter((item) => item.quote === "EURCV"),
  ];
  const quoteLabel = [quote, ...new Set(catalog.filter((item) => item.quote !== quote).map((item) => item.quote))].join(
    " + ",
  );
  const fiatBalances = [...(snapshot?.balances ?? [])]
    .filter((item) => {
      if (!isFiat(item.symbol, types)) return false;
      if (item.symbol.toUpperCase() !== "EURCV") return true;
      return num(item.available) > 0 || num(item.locked) > 0;
    })
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-8 md:py-10">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-brass">Bitpanda Fusion</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
            <span>{t.byLine}</span>
            <a
              href="https://x.com/GalsonVogerl"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.xProfile}
              className="inline-flex size-11 items-center justify-center rounded-lg text-fg"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </p>
          <p className="flex flex-wrap items-baseline gap-x-1 text-sm text-muted">
            <span>{t.github}</span>
            <a
              href="https://github.com/GalsonGit/FusionAPIDashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-fg underline-offset-2 hover:underline"
            >
              github.com/GalsonGit/FusionAPIDashboard
            </a>
          </p>
        </div>
        <div className="flex rounded-lg border border-line p-1" role="group" aria-label={t.language}>
          {(["de", "en"] as const).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={lang === code}
              onClick={() => {
                setLang(code);
                localStorage.setItem("kaufplan.lang", code);
              }}
              className={`h-10 rounded-md px-3 text-sm font-medium ${lang === code ? "bg-primary text-primary-fg" : "text-muted"}`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <section className="rounded-xl border border-line bg-surface p-3 md:p-4" aria-labelledby="konto">
        <SectionTitle id="konto" step="01" title={t.account} />
        <form
          className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            void connect();
          }}
        >
          <label className="sr-only" htmlFor="api-key">
            {t.key}
          </label>
          <span className="relative min-w-0 flex-1">
            <KeyRound className="pointer-events-none absolute top-3 left-3 size-5 text-muted" />
            <input
              id="api-key"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              type={showKey ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              placeholder={t.key}
              className="h-11 w-full rounded-lg border border-line bg-bg pr-20 pl-10 text-fg"
            />
            {apiKey ? (
              <button
                type="button"
                className="absolute top-1 right-10 inline-flex size-9 items-center justify-center rounded-lg text-muted"
                onClick={() => {
                  setApiKey("");
                  sessionStorage.removeItem(KEY);
                  localStorage.removeItem(KEY);
                }}
                aria-label={t.clearKey}
              >
                <X className="size-4" />
              </button>
            ) : null}
            <button
              type="button"
              className="absolute top-1 right-1 inline-flex size-9 items-center justify-center rounded-lg text-muted"
              onClick={() => setShowKey((value) => !value)}
              aria-label={showKey ? t.hideKey : t.showKey}
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
          <span className="flex gap-2">
            <button
              type="submit"
              disabled={loading || apiKey.trim().length < 8}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-medium text-primary-fg disabled:opacity-50 sm:flex-none"
            >
              {loading ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : null}
              {loading ? t.connecting : t.connect}
            </button>
            <button
              type="button"
              onClick={openDemo}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-line bg-raised px-4 sm:flex-none"
            >
              {t.demo}
            </button>
          </span>
          <label className="flex h-11 items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="size-4 accent-primary"
            />
            {t.remember}
          </label>
        </form>
        {error ? (
          <p className="mt-2 flex items-start gap-2 text-sm text-danger" role="alert">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}
        {mode === "live" ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="inline-flex h-11 items-center rounded-lg border border-line bg-raised px-3 text-sm text-ok">
              {t.live}
            </p>
            <button
              type="button"
              onClick={() => void connect()}
              disabled={loading}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm"
            >
              <RefreshCw className="size-4" />
              {t.refresh}
            </button>
            <button
              type="button"
              onClick={disconnect}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm"
            >
              <Unplug className="size-4" />
              {t.disconnect}
            </button>
          </div>
        ) : null}
        {snapshot?.warning ? <p className="mt-2 text-sm text-brass">{snapshot.warning}</p> : null}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h3 className="text-xs font-medium text-muted">{t.balances}</h3>
          {snapshot ? (
            fiatBalances.length > 0 ? (
              fiatBalances.map((item) => {
                const active = item.symbol === quote;
                return (
                  <p
                    key={item.symbol}
                    className={`inline-flex h-11 items-center gap-2 rounded-lg border px-3 font-mono text-sm ${active ? "border-brass bg-raised" : "border-line"}`}
                  >
                    <span className="text-xs text-muted">{item.symbol}</span>
                    {formatMoney(num(item.available), item.symbol)}
                    {num(item.locked) > 0 ? (
                      <span className="text-xs text-muted">
                        {t.locked} {formatMoney(num(item.locked), item.symbol)}
                      </span>
                    ) : null}
                  </p>
                );
              })
            ) : (
              <p className="text-sm text-muted">{t.noFiat}</p>
            )
          ) : (
            <p className="text-sm text-muted">{t.noProfile}</p>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-2 xl:flex-row xl:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2 text-sm" htmlFor="invest">
            <span className="shrink-0">{t.invest}</span>
            <input
              id="invest"
              inputMode="decimal"
              value={investText}
              onChange={(event) => setInvestText(event.target.value)}
              placeholder={t.investPlaceholder}
              className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 font-mono text-fg"
            />
          </label>
          <label className="flex items-center gap-2 text-sm" htmlFor="quote">
            <span className="shrink-0">{t.currency}</span>
            <select
              id="quote"
              value={quotes.includes(quote) ? quote : quotes[0]}
              onChange={(event) => {
                const next = event.target.value;
                setQuote(next);
                setSelections((prev) => {
                  const kept = prev.filter((item) => item.pair.endsWith(`-${next}`));
                  return sortByShare(auto ? scaleToFull(kept) : kept);
                });
              }}
              className="h-11 rounded-lg border border-line bg-bg px-3 text-fg"
            >
              {(quotes.length ? quotes : ["EUR"]).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              disabled={available <= 0}
              value={investPct}
              onChange={(event) => setInvestPercent(Number(event.target.value))}
              aria-label={t.investPercent}
              className="h-11 min-w-0 flex-1 accent-primary disabled:opacity-40"
            />
            {[0, 25, 50, 75, 100].map((mark) => {
              const active = Math.abs(investPct - mark) < 0.05;
              return (
                <button
                  key={mark}
                  type="button"
                  disabled={available <= 0}
                  onClick={() => setInvestPercent(mark)}
                  className={`h-11 min-w-11 shrink-0 font-mono text-xs disabled:opacity-40 ${active ? "text-brass" : "text-muted"}`}
                >
                  {mark}%
                </button>
              );
            })}
          </div>
        </div>
        {snapshot && balance ? (
          <p className="mt-1 font-mono text-xs text-muted">
            {t.available} {formatMoney(available, quote)}
            {locked > 0 ? ` · ${t.locked} ${formatMoney(locked, quote)}` : ""}
            {invest != null && invest > 0 ? ` · ${t.after} ${formatMoney(available - gross, quote)}` : ""}
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-line bg-surface p-4 md:p-5" aria-labelledby="aufteilung">
        <SectionTitle id="aufteilung" step="02" title={t.pairs} />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="min-w-0">
            <div className="relative">
              <Search className="pointer-events-none absolute top-3 left-3 size-5 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                aria-label={t.searchLabel}
                className="h-11 w-full rounded-lg border border-line bg-bg pr-3 pl-10"
              />
            </div>
            <div className="mt-2 flex min-w-0 gap-2 overflow-x-auto">
              <FilterChip active={family === "alle"} onClick={() => setFamily("alle")}>
                {t.all}
              </FilterChip>
              {families.map((key) => (
                <FilterChip key={key} active={family === key} onClick={() => setFamily(key)}>
                  {t.families[key] ?? key}
                </FilterChip>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {snapshot
                ? `${t.pairCount(catalog.length, quoteLabel)}${catalog.length > visible.length ? ` · ${t.shown(visible.length)}` : ""}`
                : t.noConnection}
            </p>
            <ul className="mt-2 max-h-96 divide-y divide-line overflow-y-auto rounded-lg border border-line">
              {visible.map((item) => {
                const selected = selections.some((entry) => entry.pair === item.pair);
                return (
                  <li key={item.pair}>
                    <button
                      type="button"
                      onClick={() => toggle(item.pair)}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-3 px-3 py-3 text-left ${selected ? "bg-raised" : ""}`}
                    >
                      <span
                        className={`inline-flex size-5 shrink-0 items-center justify-center rounded border ${selected ? "border-primary bg-primary text-primary-fg" : "border-line"}`}
                        aria-hidden="true"
                      >
                        {selected ? <Check className="size-3" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{item.base}</span>
                        <span className="block truncate text-sm text-muted">
                          {item.name} · {item.pair}
                        </span>
                      </span>
                      <span className="shrink-0 text-right font-mono text-sm">
                        {item.price ? formatPrice(num(item.price)) : "—"}
                        <span className="block text-xs text-muted">
                          {t.marketCap} {item.marketCap ? formatCap(num(item.marketCap), item.quote) : "—"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
              {snapshot && visible.length === 0 ? (
                <li className="px-3 py-6 text-sm text-muted">{t.noMatch}</li>
              ) : null}
              {!snapshot ? (
                <li className="px-3 py-6 text-sm text-muted">{t.noConnection}</li>
              ) : null}
            </ul>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm" aria-live="polite">
                {remainder ? t.fixedShares : t.sum}{" "}
                <span className={`font-mono ${sumOk ? "text-ok" : "text-danger"}`}>
                  {formatShare(remainder ? othersSum : shareSum)} %
                </span>
                {remainder && isbrLeg ? (
                  <span className="text-muted">
                    {" "}
                    · {t.restBudget} {formatMoney(isbrLeg.gross, quote)}
                  </span>
                ) : null}
              </p>
              <button
                type="button"
                onClick={equalize}
                disabled={selections.length === 0}
                className="inline-flex h-11 items-center rounded-lg border border-line px-3 text-sm disabled:opacity-50"
              >
                {t.equalize}
              </button>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={auto}
                onChange={(event) => {
                  const next = event.target.checked;
                  setAuto(next);
                  if (next) setSelections((prev) => sortByShare(scaleToFull(prev)));
                }}
                className="size-4 accent-primary"
              />
              {t.auto}
            </label>
            <label className="mt-2 flex items-start gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={remainder}
                onChange={(event) => setRemainder(event.target.checked)}
                className="mt-1 size-4 accent-primary"
              />
              {t.remainder}
            </label>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-raised" aria-hidden="true">
              {remainder && invest != null && invest > 0 ? (
                <div className="flex h-full">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.min(100, ((invest - (isbrLeg?.gross ?? 0)) / invest) * 100)}%` }}
                  />
                  <div
                    className="h-full bg-brass"
                    style={{ width: `${Math.min(100, ((isbrLeg?.gross ?? 0) / invest) * 100)}%` }}
                  />
                </div>
              ) : (
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, shareSum / 100)}%` }} />
              )}
            </div>
            <ul ref={shareListRef} className="mt-2">
              {ordered.map((item) => {
                const instrument = byPair.get(item.pair);
                return (
                  <li
                    key={item.pair}
                    data-share-pair={item.pair}
                    className="relative border-b border-line bg-transparent py-3"
                  >
                    <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {instrument?.base ?? item.pair}
                        {item.pair === restPair ? (
                          <span className="ml-2 font-mono text-xs text-brass">{t.rest}</span>
                        ) : null}
                      </p>
                      <p className="truncate text-sm text-muted">
                        {item.pair} · {t.market}
                        {item.pair === restPair ? ` · ${t.setPct} ${t.ignored}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => stepShare(item.pair, -500)}
                      aria-label={t.stepDown(instrument?.base ?? item.pair)}
                      className="inline-flex h-11 items-center rounded-lg border border-line px-2 font-mono text-sm"
                    >
                      −5 %
                    </button>
                    <label className="sr-only" htmlFor={`share-${item.pair}`}>
                      {t.share(instrument?.base ?? item.pair)}
                    </label>
                    <input
                      id={`share-${item.pair}`}
                      inputMode="decimal"
                      value={draft?.pair === item.pair ? draft.text : formatShare(item.hundredths)}
                      onFocus={() => setDraft({ pair: item.pair, text: formatShare(item.hundredths) })}
                      onChange={(event) => setDraft({ pair: item.pair, text: event.target.value })}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        commitShare(item.pair, event.currentTarget.value);
                        setDraft(null);
                        event.currentTarget.blur();
                      }}
                      onBlur={() => setDraft((prev) => (prev?.pair === item.pair ? null : prev))}
                      className="h-11 w-16 rounded-lg border border-line bg-bg px-2 text-right font-mono"
                    />
                    <span className="text-sm text-muted">%</span>
                    <button
                      type="button"
                      onClick={() => stepShare(item.pair, 500)}
                      aria-label={t.stepUp(instrument?.base ?? item.pair)}
                      className="inline-flex h-11 items-center rounded-lg border border-line px-2 font-mono text-sm"
                    >
                      +5 %
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(item.pair)}
                      aria-label={t.remove(instrument?.base ?? item.pair)}
                      className="inline-flex size-11 items-center justify-center rounded-lg text-muted"
                    >
                      <X className="size-4" />
                    </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <form
              className="mt-4 flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                saveList();
              }}
            >
              <label className="text-sm" htmlFor="list-name">
                {t.saveList}
              </label>
              <div className="flex gap-2">
                <input
                  id="list-name"
                  value={listName}
                  onChange={(event) => setListName(event.target.value)}
                  placeholder={t.listPlaceholder}
                  maxLength={40}
                  className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3"
                />
                <button
                  type="submit"
                  disabled={!listName.trim() || selections.length === 0}
                  className="inline-flex h-11 items-center rounded-lg border border-line px-3 text-sm disabled:opacity-50"
                >
                  {t.save}
                </button>
              </div>
              <label className="flex h-11 items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={rememberLists}
                  onChange={(event) => {
                    const keep = event.target.checked;
                    setRememberLists(keep);
                    if (keep) {
                      localStorage.setItem(LISTS_KEEP, "1");
                      localStorage.setItem(LISTS, JSON.stringify(favorites));
                    } else {
                      localStorage.setItem(LISTS_KEEP, "0");
                      localStorage.removeItem(LISTS);
                    }
                  }}
                  className="size-4 accent-primary"
                />
                {t.rememberLists}
              </label>
            </form>
            {favorites.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2">
                {favorites.map((fav) => (
                  <li key={fav.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => applyFavorite(fav)}
                      className="inline-flex h-11 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-line px-3 text-left text-sm"
                    >
                      <span className="truncate">{fav.name}</span>
                      <span className="shrink-0 text-muted">
                        {t.favMeta(fav.selections.length, fav.remainder)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFavorite(fav.id)}
                      aria-label={t.deleteList(fav.name)}
                      className="inline-flex size-11 items-center justify-center rounded-lg text-muted"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-4 md:p-5" aria-labelledby="ausfuehrung">
        <SectionTitle id="ausfuehrung" step="03" title={t.fees} />
        {snapshot ? (
          <p className="mt-3 font-mono text-sm">
            {t.currentFee} {formatRate(rate)}
            {invest != null && invest > 0 ? ` · ${formatMoney(fee, quote)} ${t.onStake}` : ""}
          </p>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Stat label={t.stake} value={invest != null && invest > 0 ? formatMoney(gross, quote) : "—"} />
          <Stat
            label={t.fee}
            value={invest != null && invest > 0 ? formatMoney(fee, quote) : "—"}
            hint={snapshot ? formatRate(rate) : undefined}
          />
          <Stat
            label={t.value}
            value={invest != null && invest > 0 ? formatMoney(net, quote) : "—"}
            emphasis
          />
        </div>

        <ul className="mt-4">
          {legs.map((leg, index) => (
            <li key={leg.pair} className="flex gap-3 border-t border-line py-3">
              <span className="w-7 shrink-0 font-mono text-sm text-muted">{index + 1}.</span>
              <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">
                  {leg.base}{" "}
                <span className="font-normal text-muted">
                  {leg.pair} · {t.market} · {t.setPct} {formatShare(leg.hundredths)} %
                  {leg.isRemainder ? ` ${t.ignored}` : ""} · {t.actual}{" "}
                  {formatShare(actualHundredths(leg.net, invest ?? 0))} %
                </span>
                </p>
                <p className="font-mono text-brass">{formatMoney(leg.net, quote)}</p>
              </div>
              <p className="text-sm text-muted">
                {t.stake} {formatMoney(leg.gross, quote)} · {t.fee} {formatMoney(leg.fee, quote)}
                {remainder && !leg.isRemainder && leftAfter.has(leg.pair)
                  ? ` · ${t.left} ${formatMoney(leftAfter.get(leg.pair) ?? 0, quote)}`
                  : ""}
                {leg.isRemainder ? ` · ${t.restBudget} ${formatMoney(leg.gross, quote)}` : ""}
                {leg.qty != null && leg.price != null
                  ? ` · ${t.qty} ${formatQty(leg.qty)} ${leg.base}`
                  : ""}
              </p>
              {leg.belowMin ? (
                <p className="text-sm text-danger">{t.belowMin(formatMoney(leg.min, quote))}</p>
              ) : null}
              {leg.aboveMax ? (
                <p className="text-sm text-danger">{t.aboveMax(formatMoney(leg.max, quote))}</p>
              ) : null}
              </div>
            </li>
          ))}
        </ul>

        {results.length > 0 ? (
          <div className="mt-4 rounded-lg border border-line bg-bg p-3">
            <h3 className="text-sm font-medium">{t.lastRun}</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {results.map((result) => {
                const bought = num(result.filledAmount) || num(result.spent);
                return (
                  <li key={result.pair} className="text-sm">
                    <span className={result.ok ? "text-ok" : "text-danger"}>
                      {result.pair} · {result.ok ? t.status[result.status] || result.status || t.status.new : t.notSent}
                    </span>
                    <span className="text-muted">
                      {" "}
                      · {formatMoney(bought, quote)} · {t.actual}{" "}
                      {formatShare(actualHundredths(bought, invest ?? 0))} %
                    </span>
                    {result.feeAmount ? (
                      <span className="text-muted">
                        {" "}
                        · {t.fee} {formatMoney(num(result.feeAmount), result.feeCurrency || quote)}
                      </span>
                    ) : null}
                    {result.filledQuantity ? (
                      <span className="text-muted">
                        {" "}
                        · {t.qty} {formatQty(num(result.filledQuantity))}
                      </span>
                    ) : null}
                    {result.message ? <span className="block text-muted">{result.message}</span> : null}
                    {result.stake === "staked" ? <span className="text-ok"> · {t.staked}</span> : null}
                    {result.stake === "failed" ? (
                      <span className="block text-danger">
                        {t.stakeFail}
                        {result.stakeMessage ? `: ${result.stakeMessage}` : ""}
                      </span>
                    ) : null}
                    {result.id ? <span className="block font-mono text-xs text-muted">{result.id}</span> : null}
                  </li>
                );
              })}
            </ul>
            {results.some((result) => !result.ok) ? <p className="mt-2 text-sm text-brass">{t.stop}</p> : null}
          </div>
        ) : null}

        {blockers.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-1 text-sm text-muted">
            {blockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          disabled={blockers.length > 0 || placing}
          onClick={() => {
            setAccepted(false);
            setConfirmOpen(true);
          }}
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-5 font-medium text-primary-fg disabled:opacity-50 sm:w-auto"
        >
          {mode === "demo" ? t.runDemo : t.runLive}
        </button>
        {snapshot ? (
          <p className="mt-4 border-t border-line pt-3 font-mono text-sm">
            {t.fiatLeft}{" "}
            {formatMoney(
              leftFiat != null ? leftFiat : Math.round((available - (invest != null && invest > 0 ? gross : 0)) * 100) / 100,
              quote,
            )}
          </p>
        ) : null}
      </section>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="max-h-dvh w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-5"
          >
            <h2 id="confirm-title" className="text-xl font-semibold">
              {mode === "demo" ? t.confirmDemo : t.confirmLive}
            </h2>
            <ul className="mt-4 divide-y divide-line">
              {legs.map((leg) => (
                <li key={leg.pair} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                  <span>
                    {leg.base} · {t.marketBuy}
                    <span className="block text-muted">
                      {leg.pair} · {leg.isRemainder ? t.rest : t.setPct}{" "}
                      {leg.isRemainder
                        ? `${formatShare(leg.hundredths)} % ${t.ignored}`
                        : `${formatShare(leg.hundredths)} %`}{" "}
                      · {t.actual} {formatShare(actualHundredths(leg.net, invest ?? 0))} %
                      {leg.isRemainder ? ` · ${t.restBudget} ${formatMoney(leg.gross, quote)}` : ""}
                    </span>
                  </span>
                  <span className="font-mono">{formatMoney(num(leg.amount), quote)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-mono text-sm">
              {t.stakeLine(formatMoney(gross, quote), formatMoney(fee, quote), formatMoney(net, quote))}
            </p>
            <label className="mt-4 flex items-start gap-2 rounded-lg border border-brass px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={false}
                disabled
                className="mt-1 size-4 accent-primary"
              />
              <span>
                {t.stakeBought}
                <span className="mt-0.5 block font-medium text-brass">{t.stakeLater}</span>
              </span>
            </label>
            {mode === "live" ? (
              <label className="mt-4 flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => setAccepted(event.target.checked)}
                  className="mt-1 size-4 accent-primary"
                />
                {t.confirmCheck}
              </label>
            ) : null}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                ref={cancelRef}
                onClick={() => setConfirmOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-line px-4"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={placing || (mode === "live" && !accepted)}
                onClick={() => void execute()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-medium text-primary-fg disabled:opacity-50"
              >
                {placing ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : null}
                {mode === "demo" ? t.simulate : t.buyNow}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SectionTitle({ id, step, title }: { id: string; step: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-xs text-brass">{step}</span>
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-10 shrink-0 items-center rounded-full border px-3 text-sm ${active ? "border-primary bg-primary text-primary-fg" : "border-line text-fg"}`}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`rounded-lg border px-3 py-3 ${emphasis ? "border-brass bg-raised" : "border-line"}`}>
      <p className="text-xs text-muted">
        {label}
        {hint ? ` · ${hint}` : ""}
      </p>
      <p className={`mt-1 font-mono text-lg ${emphasis ? "text-brass" : ""}`}>{value}</p>
    </div>
  );
}
