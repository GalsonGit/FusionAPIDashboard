import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as readLang, t as copy } from "./copy-CHsjQafh.mjs";
import { a as RefreshCw, c as Eye, i as Search, l as EyeOff, n as Unplug, o as LoaderCircle, r as TriangleAlert, s as KeyRound, t as X, u as Check } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-hPA8AxZp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var FusionError = class extends Error {
	status;
	constructor(status, message) {
		super(message);
		this.status = status;
	}
};
function asLang(value) {
	return value === "en" ? "en" : "de";
}
function cleanKey(input, lang) {
	const apiKey = input?.trim() ?? "";
	if (apiKey.length < 8 || apiKey.length > 500) throw new FusionError(400, copy[lang].badKey);
	return apiKey;
}
var loadFusionSnapshot = createServerFn({ method: "POST" }).validator((input) => {
	const lang = asLang(input?.lang);
	return {
		apiKey: cleanKey(input?.apiKey ?? "", lang),
		lang
	};
}).handler(createSsrRpc("763d57d1fb2c942dccf4c4021382e61cd419f53dfeff1b294f5fcc8a6014f754"));
var PAIR_RE = /^[A-Z0-9]{1,20}-[A-Z0-9]{1,12}$/;
var AMOUNT_RE = /^\d+(\.\d{1,8})?$/;
var placeFusionOrders = createServerFn({ method: "POST" }).validator((input) => {
	const lang = asLang(input?.lang);
	const apiKey = cleanKey(input?.apiKey ?? "", lang);
	const orders = Array.isArray(input?.orders) ? input.orders : [];
	if (orders.length < 1 || orders.length > 25) throw new FusionError(400, copy[lang].orderCount);
	const clean = orders.map((order) => {
		const pair = String(order?.pair ?? "").toUpperCase();
		const amount = String(order?.amount ?? "");
		if (!PAIR_RE.test(pair) || !AMOUNT_RE.test(amount) || Number(amount) <= 0) throw new FusionError(400, copy[lang].badOrder);
		return {
			pair,
			amount
		};
	});
	return {
		apiKey,
		lang,
		stake: input?.stake === true,
		orders: clean
	};
}).handler(createSsrRpc("040a0a76c5ab86e3374c0a49514ab13d456b1d73f335a04154cb146997c2f1d8"));
/** Public Fusion fee ladder (single rate per tier, not maker/taker). */
var FEE_TIERS = [
	{
		level: 1,
		label: "Level 1",
		min: 0,
		max: 1e5,
		fee: .0025,
		volume: "bis 100.000 €"
	},
	{
		level: 2,
		label: "Level 2",
		min: 1e5,
		max: 5e5,
		fee: .0021,
		volume: "bis 500.000 €"
	},
	{
		level: 3,
		label: "Level 3",
		min: 5e5,
		max: 25e5,
		fee: .0017,
		volume: "bis 2,5 Mio. €"
	},
	{
		level: 4,
		label: "Level 4",
		min: 25e5,
		max: 1e7,
		fee: .0013,
		volume: "bis 10 Mio. €"
	},
	{
		level: 5,
		label: "Level 5",
		min: 1e7,
		max: 5e7,
		fee: 8e-4,
		volume: "bis 50 Mio. €"
	},
	{
		level: 6,
		label: "Level 6",
		min: 5e7,
		max: 25e7,
		fee: 5e-4,
		volume: "bis 250 Mio. €"
	},
	{
		level: 7,
		label: "Level 7",
		min: 25e7,
		max: Infinity,
		fee: 2e-4,
		volume: "darüber"
	}
];
var FIAT = [
	"EUR",
	"EURCV",
	"USD",
	"CHF",
	"GBP"
];
function familyOf(type) {
	const t = type.toLowerCase();
	if (t.includes("crypto") || t.includes("coin") || t === "token") return "krypto";
	if (t.includes("etf") || t.includes("etc") || t.includes("etn")) return "etf";
	if (t.includes("equity") || t.includes("stock") || t.includes("share")) return "aktie";
	if (t.includes("metal") || t.includes("commod") || t.includes("gold")) return "rohstoff";
	return "sonstige";
}
function parseDecimal(input) {
	const trimmed = input.trim();
	if (!trimmed) return null;
	let s = trimmed.replace(/\s/g, "");
	if (s.includes(",") && s.includes(".")) {
		if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
		else s = s.replace(/,/g, "");
	} else if (s.includes(",")) s = s.replace(",", ".");
	if (!/^\d+(\.\d+)?$/.test(s)) return null;
	const n = Number(s);
	return Number.isFinite(n) ? n : null;
}
/** Fusion returns the fee as "0.25%", "0.25" (percent) or "0.0025" (ratio). */
function parseFeeRate(raw) {
	if (raw == null || raw === "") return null;
	const s = String(raw).trim().replace(/\s/g, "").replace(",", ".");
	const explicitPercent = s.endsWith("%");
	const n = Number(s.replace("%", ""));
	if (!Number.isFinite(n) || n < 0) return null;
	if (explicitPercent || n > 1 || n >= .01) return n / 100;
	return n;
}
function feeRateFor(account) {
	const parsed = parseFeeRate(account?.currentTier?.fee);
	if (parsed != null) return {
		rate: parsed,
		assumed: false
	};
	return {
		rate: FEE_TIERS[0].fee,
		assumed: true
	};
}
function num(value) {
	if (!value) return 0;
	const n = Number(value);
	return Number.isFinite(n) ? n : 0;
}
var eurFmt = () => new Intl.NumberFormat(numberLocale, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
var numberLocale = "de-DE";
function setNumberLocale(lang) {
	numberLocale = lang === "en" ? "en-GB" : "de-DE";
}
function formatMoney(n, quote = "EUR") {
	const body = eurFmt().format(n);
	if (quote === "EUR") return `${body} €`;
	return `${body} ${quote}`;
}
function formatRate(rate) {
	return `${eurFmt().format(rate * 100)} %`;
}
function formatShare(hundredths) {
	return new Intl.NumberFormat(numberLocale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	}).format(hundredths / 100);
}
function formatCap(n, quote) {
	try {
		return new Intl.NumberFormat(numberLocale, {
			notation: "compact",
			style: "currency",
			currency: quote,
			maximumFractionDigits: 1
		}).format(n);
	} catch {
		return formatCompact(n);
	}
}
function formatQty(n) {
	const digits = n >= 100 ? 4 : n >= 1 ? 6 : 8;
	return new Intl.NumberFormat(numberLocale, { maximumFractionDigits: digits }).format(n);
}
function formatPrice(n) {
	const digits = n >= 100 ? 2 : n >= 1 ? 4 : 6;
	return new Intl.NumberFormat(numberLocale, {
		minimumFractionDigits: 2,
		maximumFractionDigits: digits
	}).format(n);
}
function formatCompact(n) {
	return new Intl.NumberFormat(numberLocale, {
		notation: "compact",
		maximumFractionDigits: 1
	}).format(n);
}
function sortByShare(items) {
	return items.map((item, index) => ({
		item,
		index
	})).sort((a, b) => b.item.hundredths - a.item.hundredths || a.index - b.index).map((row) => row.item);
}
/** Next or previous 5% step. Values already on that grid move by exactly 5 points. */
function stepFive(hundredths, direction) {
	const grid = 500;
	if (direction > 0) return Math.min(1e4, Math.floor(hundredths / grid) * grid + grid);
	return Math.max(0, Math.ceil(hundredths / grid) * grid - grid);
}
/**
* Set one share. The top share — or the one directly under it, when the top share
* itself moves — changes by the same amount in the opposite direction.
* The largest share stays first.
*/
function nudgeShare(items, pair, nextHundredths) {
	const ordered = sortByShare(items);
	const index = ordered.findIndex((item) => item.pair === pair);
	if (index < 0) return ordered;
	if (ordered.length < 2) return [{
		...ordered[0],
		hundredths: Math.max(0, Math.min(1e4, Math.round(nextHundredths)))
	}];
	const current = ordered[index].hundredths;
	let next = Math.max(0, Math.min(1e4, Math.round(nextHundredths)));
	const partnerIndex = index === 0 ? 1 : 0;
	let partnerNext = ordered[partnerIndex].hundredths - (next - current);
	if (partnerNext < 0) {
		next += partnerNext;
		partnerNext = 0;
	} else if (partnerNext > 1e4) {
		next -= partnerNext - 1e4;
		partnerNext = 1e4;
	}
	next = Math.max(0, Math.min(1e4, next));
	return sortByShare(ordered.map((item, i) => {
		if (i === index) return {
			...item,
			hundredths: next
		};
		if (i === partnerIndex) return {
			...item,
			hundredths: partnerNext
		};
		return item;
	}));
}
function actualHundredths(gross, invest) {
	if (!(invest > 0)) return 0;
	return Math.round(gross / invest * 1e4);
}
function equalHundredths(count) {
	if (count <= 0) return [];
	const base = Math.floor(1e4 / count);
	const rem = 1e4 - base * count;
	return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0));
}
function scaleToFull(items) {
	if (items.length === 0) return items;
	const sum = items.reduce((s, item) => s + item.hundredths, 0);
	if (sum === 1e4) return items;
	if (sum <= 0) {
		const parts = equalHundredths(items.length);
		return items.map((item, i) => ({
			...item,
			hundredths: parts[i] ?? 0
		}));
	}
	let used = 0;
	return items.map((item, i) => {
		if (i === items.length - 1) return {
			...item,
			hundredths: 1e4 - used
		};
		const next = Math.floor(item.hundredths * 1e4 / sum);
		used += next;
		return {
			...item,
			hundredths: next
		};
	});
}
function decimalsOf(increment) {
	const i = increment.indexOf(".");
	if (i < 0) return 0;
	return increment.length - i - 1;
}
function amountString(gross, increment) {
	const inc = Number(increment);
	const step = Number.isFinite(inc) && inc > 0 ? inc : .01;
	const digits = Math.min(8, Math.max(2, decimalsOf(step >= 1 ? "0" : increment || "0.01")));
	return (Math.floor(gross / step + 1e-8) * step).toFixed(digits);
}
function remainderIndex(selections) {
	let index = 0;
	for (let i = 1; i < selections.length; i++) if (selections[i].hundredths <= selections[index].hundredths) index = i;
	return index;
}
function feeCentsOf(netCents, rate) {
	return Math.round(netCents * rate);
}
/** Largest buy whose value plus fee still fits in the remaining budget. */
function inclusiveBuy(budgetCents, rate) {
	if (budgetCents <= 0) return {
		netCents: 0,
		feeCents: 0
	};
	const gross = (net) => net + feeCentsOf(net, rate);
	let net = Math.min(budgetCents, Math.max(0, Math.round(budgetCents / (1 + rate))));
	while (net > 0 && gross(net) > budgetCents) net -= 1;
	while (net < budgetCents && gross(net + 1) <= budgetCents) net += 1;
	return {
		netCents: net,
		feeCents: feeCentsOf(net, rate)
	};
}
function planLegs(invest, feeRate, selections, byPair, remainder = false) {
	const totalCents = Math.max(0, Math.round(invest * 100));
	const rows = [];
	if (remainder && selections.length > 0) {
		const restAt = remainderIndex(selections);
		let usedSpend = 0;
		selections.forEach((item, i) => {
			if (i === restAt || item.hundredths <= 0) return;
			const netCents = Math.floor(totalCents * item.hundredths / 1e4);
			usedSpend += netCents + feeCentsOf(netCents, feeRate);
			rows.push({
				item,
				cents: netCents,
				isRemainder: false
			});
		});
		const rest = inclusiveBuy(totalCents - usedSpend, feeRate);
		rows.push({
			item: selections[restAt],
			cents: rest.netCents,
			isRemainder: true
		});
	} else {
		const active = selections.filter((item) => item.hundredths > 0);
		const cents = active.map((item) => Math.floor(totalCents * item.hundredths / 1e4));
		if (active.reduce((sum, item) => sum + item.hundredths, 0) === 1e4) {
			let rem = totalCents - cents.reduce((sum, value) => sum + value, 0);
			const order = active.map((_, i) => i).sort((a, b) => active[b].hundredths - active[a].hundredths || a - b);
			for (const i of order) {
				if (rem <= 0) break;
				cents[i] += 1;
				rem -= 1;
			}
		}
		active.forEach((item, i) => rows.push({
			item,
			cents: cents[i] ?? 0,
			isRemainder: false
		}));
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
			isRemainder
		};
	}).sort((a, b) => b.hundredths - a.hundredths || Number(a.isRemainder) - Number(b.isRemainder) || a.pair.localeCompare(b.pair));
}
function quoteOptions(instruments) {
	const set = new Set(instruments.map((item) => item.quote));
	const preferred = FIAT.filter((code) => set.has(code));
	const rest = [...set].filter((code) => !preferred.includes(code)).sort();
	return [...preferred, ...rest];
}
/** Quote the account holds the most of. Ties keep the option order, so EUR wins equals. */
function richestQuote(options, balances) {
	const choices = options.length > 0 ? options : ["EUR"];
	let best = choices[0];
	let bestAmount = -1;
	for (const code of choices) {
		const row = balances.find((item) => item.symbol.toUpperCase() === code.toUpperCase());
		const amount = num(row?.available) + num(row?.locked);
		if (amount > bestAmount) {
			best = code;
			bestAmount = amount;
		}
	}
	return best;
}
function demoSnapshot() {
	return {
		pricesPartial: false,
		warning: null,
		balances: [
			{
				symbol: "EUR",
				available: "1000.00",
				locked: "0.00"
			},
			{
				symbol: "EURCV",
				available: "1000.00",
				locked: "0.00"
			},
			{
				symbol: "USD",
				available: "1000.00",
				locked: "0.00"
			},
			{
				symbol: "BTC",
				available: "0.0142",
				locked: "0"
			},
			{
				symbol: "ETH",
				available: "0.35",
				locked: "0"
			}
		],
		account: {
			tradedVolume30d: "1840.50",
			currentTier: {
				name: "Level 1",
				fee: "0.25%",
				feeMode: "flat",
				requiredVolume30d: "0"
			},
			nextTier: {
				name: "Level 2",
				fee: "0.21%",
				feeMode: "flat",
				requiredVolume30d: "100000"
			}
		},
		instruments: [
			[
				"BTC",
				"Bitcoin",
				"cryptocoin",
				"61500",
				842e3,
				25,
				121e10
			],
			[
				"ETH",
				"Ethereum",
				"cryptocoin",
				"2480",
				51e4,
				25,
				29e10
			],
			[
				"SOL",
				"Solana",
				"cryptocoin",
				"142.4",
				19e4,
				25,
				68e9
			],
			[
				"XRP",
				"XRP",
				"cryptocoin",
				"0.58",
				12e4,
				25,
				33e9
			],
			[
				"ADA",
				"Cardano",
				"cryptocoin",
				"0.42",
				64e3,
				25,
				15e9
			],
			[
				"LINK",
				"Chainlink",
				"cryptocoin",
				"14.2",
				41e3,
				25,
				9e9
			],
			[
				"AVAX",
				"Avalanche",
				"cryptocoin",
				"27.8",
				38e3,
				25,
				11e9
			],
			[
				"DOT",
				"Polkadot",
				"cryptocoin",
				"4.65",
				22e3,
				25,
				7e9
			],
			[
				"DOGE",
				"Dogecoin",
				"cryptocoin",
				"0.16",
				88e3,
				25,
				23e9
			],
			[
				"UNI",
				"Uniswap",
				"cryptocoin",
				"7.4",
				15e3,
				25,
				45e8
			],
			[
				"ATOM",
				"Cosmos",
				"cryptocoin",
				"5.1",
				9e3,
				25,
				2e9
			],
			[
				"NEAR",
				"NEAR Protocol",
				"cryptocoin",
				"3.35",
				11e3,
				25,
				38e8
			],
			[
				"PAXG",
				"PAX Gold",
				"cryptocoin",
				"2348",
				27e3,
				25,
				62e7
			]
		].flatMap(([base, name, type, price, volume, min, marketCap]) => {
			const row = {
				base,
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
				sizeIncrement: "0.00000001"
			};
			const eur = {
				...row,
				pair: `${base}-EUR`,
				quote: "EUR"
			};
			if (type !== "cryptocoin") return [eur];
			return [eur, {
				...row,
				pair: `${base}-EURCV`,
				quote: "EURCV"
			}];
		})
	};
}
var KEY = "kaufplan.key";
var LISTS = "kaufplan.lists";
var LISTS_KEEP = "kaufplan.lists.keep";
function loadStoredLists(raw) {
	try {
		if (!raw) return [];
		const data = JSON.parse(raw);
		if (!Array.isArray(data)) return [];
		return data.flatMap((item) => {
			if (!item || typeof item !== "object") return [];
			const row = item;
			const name = String(row.name ?? "").trim().slice(0, 40);
			const quote = String(row.quote ?? "EUR").toUpperCase();
			const selections = Array.isArray(row.selections) ? row.selections.flatMap((entry) => {
				if (!entry || typeof entry !== "object") return [];
				const sel = entry;
				const pair = String(sel.pair ?? "").toUpperCase();
				const hundredths = Number(sel.hundredths);
				if (!/^[A-Z0-9]{1,20}-[A-Z0-9]{1,12}$/.test(pair) || !Number.isFinite(hundredths)) return [];
				return [{
					pair,
					hundredths: Math.max(0, Math.min(1e4, Math.round(hundredths)))
				}];
			}) : [];
			if (!name || selections.length === 0) return [];
			return [{
				id: String(row.id ?? name),
				name,
				quote,
				selections,
				remainder: Boolean(row.remainder)
			}];
		});
	} catch {
		return [];
	}
}
function Kaufplan() {
	const [apiKey, setApiKey] = (0, import_react.useState)("");
	const [showKey, setShowKey] = (0, import_react.useState)(false);
	const [remember, setRemember] = (0, import_react.useState)(false);
	const [rememberLists, setRememberLists] = (0, import_react.useState)(false);
	const [mode, setMode] = (0, import_react.useState)("idle");
	const [balanceDraft, setBalanceDraft] = (0, import_react.useState)({});
	const [snapshot, setSnapshot] = (0, import_react.useState)(null);
	const [quote, setQuote] = (0, import_react.useState)("EUR");
	const [investText, setInvestText] = (0, import_react.useState)("");
	const [selections, setSelections] = (0, import_react.useState)([]);
	const [auto, setAuto] = (0, import_react.useState)(true);
	const [remainder, setRemainder] = (0, import_react.useState)(true);
	const [favorites, setFavorites] = (0, import_react.useState)([]);
	const [listName, setListName] = (0, import_react.useState)("");
	const [query, setQuery] = (0, import_react.useState)("");
	const [family, setFamily] = (0, import_react.useState)("alle");
	const [listedQuote, setListedQuote] = (0, import_react.useState)("alle");
	const [draft, setDraft] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [placing, setPlacing] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [results, setResults] = (0, import_react.useState)([]);
	const [confirmOpen, setConfirmOpen] = (0, import_react.useState)(false);
	const [accepted, setAccepted] = (0, import_react.useState)(false);
	const [lang, setLang] = (0, import_react.useState)("de");
	const booted = (0, import_react.useRef)(false);
	const requestGen = (0, import_react.useRef)(0);
	const cancelRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (booted.current) return;
		booted.current = true;
		const explicit = localStorage.getItem(LISTS_KEEP);
		const storedLocal = localStorage.getItem(LISTS);
		const keepLists = explicit === "1" || explicit == null && Boolean(storedLocal);
		if (keepLists) localStorage.setItem(LISTS_KEEP, "1");
		setRememberLists(keepLists);
		setFavorites(loadStoredLists(keepLists ? storedLocal || sessionStorage.getItem(LISTS) : sessionStorage.getItem(LISTS)));
		const stored = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
		if (!stored) return;
		setApiKey(stored);
		setRemember(localStorage.getItem(KEY) === stored);
		connect(stored, localStorage.getItem(KEY) === stored);
	}, []);
	(0, import_react.useEffect)(() => {
		const next = readLang();
		setLang(next);
		setNumberLocale(next);
		document.documentElement.lang = next;
	}, []);
	(0, import_react.useEffect)(() => {
		setNumberLocale(lang);
		document.documentElement.lang = lang;
	}, [lang]);
	(0, import_react.useEffect)(() => {
		if (confirmOpen) cancelRef.current?.focus();
	}, [confirmOpen]);
	const byPair = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const instrument of snapshot?.instruments ?? []) map.set(instrument.pair, instrument);
		return map;
	}, [snapshot]);
	const quotes = (0, import_react.useMemo)(() => snapshot ? quoteOptions(snapshot.instruments) : ["EUR"], [snapshot]);
	const catalog = (0, import_react.useMemo)(() => {
		const needle = query.trim().toLowerCase();
		return (snapshot?.instruments ?? []).filter((item) => listedQuote === "alle" ? item.quote === quote || item.quote === "EURCV" : item.quote === listedQuote).filter((item) => family === "alle" ? true : familyOf(item.baseType) === family).filter((item) => {
			if (!needle) return true;
			return item.base.toLowerCase().includes(needle) || item.name.toLowerCase().includes(needle) || item.pair.toLowerCase().includes(needle);
		}).sort((a, b) => num(b.volume) - num(a.volume) || a.base.localeCompare(b.base, "de"));
	}, [
		snapshot,
		quote,
		family,
		query,
		listedQuote
	]);
	const families = (0, import_react.useMemo)(() => {
		const present = /* @__PURE__ */ new Set();
		for (const item of snapshot?.instruments ?? []) if (listedQuote === "alle" ? item.quote === quote || item.quote === "EURCV" : item.quote === listedQuote) present.add(familyOf(item.baseType));
		return [
			"aktie",
			"etf",
			"rohstoff",
			"sonstige"
		].filter((key) => present.has(key));
	}, [
		snapshot,
		quote,
		listedQuote
	]);
	const balance = snapshot?.balances.find((item) => item.symbol === quote);
	const available = mode === "demo" && balanceDraft[quote] !== void 0 ? parseDecimal(balanceDraft[quote]) ?? 0 : num(balance?.available);
	const locked = num(balance?.locked);
	const invest = parseDecimal(investText);
	function setInvestFromNumber(amount) {
		const text = Math.max(0, Math.round(Math.min(amount, available > 0 ? available : amount) * 100) / 100).toFixed(2);
		setInvestText(lang === "de" ? text.replace(".", ",") : text);
	}
	function setInvestPercent(percent) {
		if (available <= 0) return;
		const snapped = [
			0,
			25,
			50,
			75,
			100
		].reduce((best, mark) => Math.abs(mark - percent) < Math.abs(best - percent) ? mark : best);
		setInvestFromNumber(available * snapped / 100);
	}
	const investPct = available > 0 && invest != null ? Math.min(100, Math.max(0, invest / available * 100)) : 0;
	const t = copy[lang];
	const ordered = (0, import_react.useMemo)(() => sortByShare(selections), [selections]);
	const shareListRef = (0, import_react.useRef)(null);
	const shareTops = (0, import_react.useRef)(/* @__PURE__ */ new Map());
	(0, import_react.useLayoutEffect)(() => {
		const list = shareListRef.current;
		if (!list) return;
		const rows = [...list.querySelectorAll("[data-share-pair]")];
		const next = /* @__PURE__ */ new Map();
		for (const row of rows) {
			const pair = row.dataset.sharePair;
			if (pair) next.set(pair, row.offsetTop);
		}
		const prev = shareTops.current;
		const sameSet = prev.size > 0 && prev.size === next.size && [...next.keys()].every((pair) => prev.has(pair));
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (sameSet && !reduce) for (const row of rows) {
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
			row.style.backgroundColor = dy > 0 ? "color-mix(in srgb, var(--color-brass) 24%, transparent)" : "transparent";
			requestAnimationFrame(() => {
				if (row.dataset.shuffle !== run) return;
				row.style.transition = "transform 340ms cubic-bezier(0.22, 1.12, 0.36, 1), background-color 340ms ease";
				row.style.transform = "translateY(0)";
				row.style.backgroundColor = "transparent";
			});
			const clear = (event) => {
				if (event.propertyName !== "transform" || row.dataset.shuffle !== run) return;
				row.style.zIndex = "";
				row.style.transition = "";
				row.style.transform = "";
				row.style.backgroundColor = "";
				row.removeEventListener("transitionend", clear);
			};
			row.addEventListener("transitionend", clear);
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
	const leftAfter = /* @__PURE__ */ new Map();
	if (remainder && invest != null && invest > 0) {
		let used = 0;
		for (const leg of legs) {
			if (leg.isRemainder) continue;
			used += leg.gross;
			leftAfter.set(leg.pair, Math.round((invest - used) * 100) / 100);
		}
	}
	const sumOk = remainder ? othersSum <= 1e4 && selections.length > 0 : shareSum > 0 && shareSum <= 1e4;
	const blockers = [];
	if (!snapshot) blockers.push(t.needLogin);
	if (invest == null || invest <= 0) blockers.push(t.needAmount);
	if (ordered.length === 0) blockers.push(t.needPair);
	else if (!remainder && !ordered.some((item) => item.hundredths > 0)) blockers.push(t.needShare);
	if (snapshot && !remainder && shareSum > 1e4) blockers.push(t.badSum(formatShare(shareSum)));
	if (snapshot && remainder && othersSum > 1e4) blockers.push(t.othersHigh);
	if (remainder && legs.some((leg) => leg.isRemainder && leg.net <= 0)) blockers.push(t.noRest);
	if (legs.some((leg) => leg.belowMin)) blockers.push(t.underMin);
	if (legs.some((leg) => leg.aboveMax)) blockers.push(t.overMax);
	if (snapshot && gross > available + .009) blockers.push(t.overBalance(quote));
	async function connect(key = apiKey, keep = remember) {
		const trimmed = key.trim();
		const gen = ++requestGen.current;
		setError("");
		setLoading(true);
		try {
			const result = await loadFusionSnapshot({ data: {
				apiKey: trimmed,
				lang: readLang()
			} });
			if (gen !== requestGen.current) return;
			if (!result.ok) {
				setError(result.message);
				return;
			}
			setSnapshot(result.snapshot);
			setMode("live");
			setBalanceDraft({});
			setResults([]);
			const options = quoteOptions(result.snapshot.instruments);
			const nextQuote = mode === "live" && options.includes(quote) ? quote : richestQuote(options, result.snapshot.balances);
			setQuote(nextQuote);
			setSelections((prev) => prev.filter((item) => result.snapshot.instruments.some((instrument) => instrument.pair === item.pair && instrument.quote === nextQuote)));
			sessionStorage.setItem(KEY, trimmed);
			if (keep) localStorage.setItem(KEY, trimmed);
			else localStorage.removeItem(KEY);
		} catch (err) {
			if (gen !== requestGen.current) return;
			setError(err instanceof Error ? err.message : copy[readLang()].connectFail);
		} finally {
			if (gen === requestGen.current) setLoading(false);
		}
	}
	function openDemo() {
		requestGen.current += 1;
		setLoading(false);
		const demo = demoSnapshot();
		const nextQuote = richestQuote(quoteOptions(demo.instruments), demo.balances);
		setSnapshot(demo);
		setMode("demo");
		setBalanceDraft({
			EUR: "1000",
			EURCV: "1000",
			USD: "1000"
		});
		setQuote(nextQuote);
		setError("");
		setResults([]);
		setSelections((prev) => {
			const kept = prev.filter((item) => item.pair.endsWith(`-${nextQuote}`));
			if (kept.length > 0) return sortByShare(kept);
			if (nextQuote === "EUR") return sortByShare([{
				pair: "BTC-EUR",
				hundredths: 7e3
			}, {
				pair: "ETH-EUR",
				hundredths: 3e3
			}]);
			const first = demo.instruments.find((item) => item.quote === nextQuote);
			return first ? [{
				pair: first.pair,
				hundredths: 1e4
			}] : [];
		});
		setInvestText((prev) => prev.trim() ? prev : "1000");
	}
	function closeDemo() {
		requestGen.current += 1;
		setLoading(false);
		setMode("idle");
		setSnapshot(null);
		setBalanceDraft({});
		setError("");
		setResults([]);
		setSelections([]);
		setConfirmOpen(false);
		setDraft(null);
	}
	function setDemoBalance(symbol, raw) {
		setBalanceDraft((prev) => ({
			...prev,
			[symbol]: raw
		}));
		const parsed = parseDecimal(raw);
		const next = parsed == null ? "0" : parsed.toFixed(2);
		setSnapshot((prev) => {
			if (!prev) return prev;
			const balances = prev.balances.some((item) => item.symbol === symbol) ? prev.balances.map((item) => item.symbol === symbol ? {
				...item,
				available: next
			} : item) : [...prev.balances, {
				symbol,
				available: next,
				locked: "0"
			}];
			return {
				...prev,
				balances
			};
		});
	}
	function changeQuote(next) {
		setQuote(next);
		setSelections((prev) => {
			const kept = prev.filter((item) => item.pair.endsWith(`-${next}`));
			return sortByShare(auto ? scaleToFull(kept) : kept);
		});
	}
	function disconnect() {
		setSnapshot(null);
		setMode("idle");
		setBalanceDraft({});
		setResults([]);
		setError("");
		sessionStorage.removeItem(KEY);
		if (!remember) localStorage.removeItem(KEY);
	}
	function toggle(pair) {
		setDraft(null);
		const pairQuote = byPair.get(pair)?.quote ?? pair.split("-").pop() ?? quote;
		if (!selections.some((item) => item.pair === pair) && pairQuote !== quote) setQuote(pairQuote);
		setSelections((prev) => {
			if (prev.some((item) => item.pair === pair)) {
				const next = prev.filter((item) => item.pair !== pair);
				return auto ? scaleToFull(next) : next;
			}
			const base = pairQuote === quote ? prev : prev.filter((item) => item.pair.endsWith(`-${pairQuote}`));
			if (base.length === 0) return [{
				pair,
				hundredths: 1e4
			}];
			return [...base, {
				pair,
				hundredths: 0
			}];
		});
	}
	function commitShare(pair, raw) {
		const parsed = parseDecimal(raw);
		if (parsed == null) return;
		const hundredths = Math.max(0, Math.min(1e4, Math.round(parsed * 100)));
		setSelections((prev) => {
			if (auto && prev.length > 1) return nudgeShare(prev, pair, hundredths);
			if (auto && prev.length === 1) return [{
				...prev[0],
				hundredths: 1e4
			}];
			return prev.map((item) => item.pair === pair ? {
				...item,
				hundredths
			} : item);
		});
	}
	function stepShare(pair, delta) {
		setDraft(null);
		setSelections((prev) => {
			const current = prev.find((item) => item.pair === pair);
			if (!current || auto && prev.length < 2) return prev;
			const next = stepFive(current.hundredths, delta > 0 ? 1 : -1);
			if (auto) return nudgeShare(prev, pair, next);
			return prev.map((item) => item.pair === pair ? {
				...item,
				hundredths: next
			} : item);
		});
	}
	function equalize() {
		setDraft(null);
		setSelections((prev) => {
			const parts = equalHundredths(prev.length);
			return prev.map((item, index) => ({
				...item,
				hundredths: parts[index] ?? 0
			}));
		});
	}
	function writeFavorites(next, keep = rememberLists) {
		setFavorites(next);
		const raw = JSON.stringify(next);
		sessionStorage.setItem(LISTS, raw);
		if (keep) localStorage.setItem(LISTS, raw);
		else localStorage.removeItem(LISTS);
	}
	function saveList() {
		const name = listName.trim().slice(0, 40);
		if (!name || selections.length === 0) return;
		writeFavorites([{
			id: crypto.randomUUID(),
			name,
			quote,
			selections: ordered,
			remainder
		}, ...favorites.filter((item) => item.name.toLowerCase() !== name.toLowerCase())].slice(0, 20));
		setListName("");
	}
	function applyFavorite(fav) {
		setQuote(fav.quote);
		setSelections(sortByShare(fav.selections));
		setRemainder(fav.remainder);
		setDraft(null);
	}
	function removeFavorite(id) {
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
					feeCurrency: quote
				}));
				setResults(next);
				setConfirmOpen(false);
				return;
			}
			const result = await placeFusionOrders({ data: {
				apiKey: apiKey.trim(),
				lang,
				stake: false,
				orders: legs.map((leg) => ({
					pair: leg.pair,
					amount: leg.amount
				}))
			} });
			if (!result.ok) {
				setError(result.message);
				return;
			}
			setResults(result.results);
			setConfirmOpen(false);
			const refreshed = await loadFusionSnapshot({ data: {
				apiKey: apiKey.trim(),
				lang
			} });
			if (refreshed.ok) setSnapshot(refreshed.snapshot);
		} catch (err) {
			setError(err instanceof Error ? err.message : t.runFail);
		} finally {
			setPlacing(false);
			setAccepted(false);
		}
	}
	const visible = [...catalog.filter((item) => item.quote !== "EURCV").slice(0, 60), ...catalog.filter((item) => item.quote === "EURCV")];
	const presentQuotes = [...new Set(catalog.map((item) => item.quote))];
	const quoteLabel = (presentQuotes.includes(quote) ? [quote, ...presentQuotes.filter((code) => code !== quote)] : presentQuotes).join(" + ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 px-4 py-6 md:px-8 md:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xs text-brass",
							children: "Bitpanda Fusion"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-2xl font-semibold tracking-tight sm:text-3xl",
							children: t.title
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex rounded-lg border border-line p-1",
						role: "group",
						"aria-label": t.language,
						children: ["de", "en"].map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": lang === code,
							onClick: () => {
								setLang(code);
								localStorage.setItem("kaufplan.lang", code);
							},
							className: `h-10 rounded-md px-3 text-sm font-medium ${lang === code ? "bg-primary text-primary-fg" : "text-muted"}`,
							children: code.toUpperCase()
						}, code))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex flex-wrap items-center gap-x-2 text-sm text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.byLine }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "https://x.com/GalsonVogerl",
							target: "_blank",
							rel: "noopener noreferrer",
							"aria-label": t.xProfile,
							className: "inline-flex size-11 items-center justify-center rounded-lg text-fg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
								viewBox: "0 0 24 24",
								"aria-hidden": "true",
								className: "size-4 fill-current",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t.github }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "https://github.com/GalsonGit/FusionAPIDashboard",
							target: "_blank",
							rel: "noopener noreferrer",
							className: "text-fg underline-offset-2 hover:underline",
							children: "github.com/GalsonGit/FusionAPIDashboard"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-line bg-surface p-3 md:p-4",
				"aria-labelledby": "konto",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
						id: "konto",
						step: "01",
						title: t.account
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-3 flex flex-col gap-2 lg:flex-row lg:items-center",
						onSubmit: (event) => {
							event.preventDefault();
							connect();
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "sr-only",
								htmlFor: "api-key",
								children: t.key
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "relative min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "pointer-events-none absolute top-3 left-3 size-5 text-muted" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "api-key",
										value: apiKey,
										onChange: (event) => {
											const next = event.target.value;
											const inserted = next.trim().length - apiKey.trim().length >= 8;
											setApiKey(next);
											if (inserted && next.trim().length >= 8) connect(next, remember);
										},
										onPaste: (event) => {
											const input = event.currentTarget;
											const pasted = event.clipboardData.getData("text");
											if (!pasted) return;
											const start = input.selectionStart ?? input.value.length;
											const end = input.selectionEnd ?? start;
											const next = input.value.slice(0, start) + pasted + input.value.slice(end);
											if (next.trim().length < 8) return;
											event.preventDefault();
											setApiKey(next);
											connect(next, remember);
										},
										type: showKey ? "text" : "password",
										autoComplete: "off",
										spellCheck: false,
										placeholder: t.key,
										className: "h-11 w-full rounded-lg border border-line bg-bg pr-20 pl-10 text-fg"
									}),
									apiKey ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "absolute top-1 right-10 inline-flex size-9 items-center justify-center rounded-lg text-muted",
										onClick: () => {
											setApiKey("");
											sessionStorage.removeItem(KEY);
											localStorage.removeItem(KEY);
										},
										"aria-label": t.clearKey,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "absolute top-1 right-1 inline-flex size-9 items-center justify-center rounded-lg text-muted",
										onClick: () => setShowKey((value) => !value),
										"aria-label": showKey ? t.hideKey : t.showKey,
										children: showKey ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" })
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "submit",
									"aria-pressed": mode === "live",
									disabled: loading || apiKey.trim().length < 8,
									className: `inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-4 font-medium disabled:opacity-50 sm:flex-none ${mode === "live" ? "border-primary bg-primary text-primary-fg" : "border-line bg-bg text-fg"}`,
									children: [loading && mode !== "live" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin motion-reduce:animate-none" }) : null, loading && mode !== "live" ? t.connecting : mode === "live" ? t.connected : t.connect]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": mode === "demo",
									onClick: () => mode === "demo" ? closeDemo() : openDemo(),
									className: `inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-4 font-medium sm:flex-none ${mode === "demo" ? "border-primary bg-primary text-primary-fg" : "border-line bg-bg text-fg"}`,
									children: t.demo
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex h-11 items-center gap-2 text-sm text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: remember,
									onChange: (event) => setRemember(event.target.checked),
									className: "size-4 accent-primary"
								}), t.remember]
							})
						]
					}),
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 flex items-start gap-2 text-sm text-danger",
						role: "alert",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-4 shrink-0" }), error]
					}) : null,
					mode === "live" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => void connect(),
							disabled: loading,
							className: "inline-flex h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), t.refresh]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: disconnect,
							className: "inline-flex h-11 items-center gap-2 rounded-lg border border-line px-3 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Unplug, { className: "size-4" }), t.disconnect]
						})]
					}) : null,
					snapshot?.warning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-brass",
						children: snapshot.warning
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row sm:items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm sm:w-44 sm:shrink-0",
								children: t.balances
							}), snapshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex min-w-0 items-center gap-2 sm:contents",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex min-w-0 flex-1 gap-2 sm:w-[16.5rem] sm:flex-none",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "sr-only",
											htmlFor: "quote",
											children: t.currency
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											id: "quote",
											value: quotes.includes(quote) ? quote : quotes[0],
											onChange: (event) => changeQuote(event.target.value),
											className: "h-11 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-fg",
											children: (quotes.length ? quotes : ["EUR"]).map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: code,
												children: code
											}, code))
										}),
										mode === "demo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "balance",
											inputMode: "decimal",
											"aria-label": `${t.balanceAmount} ${quote}`,
											value: balanceDraft[quote] ?? balance?.available ?? "0",
											onChange: (event) => setDemoBalance(quote, event.target.value),
											className: "h-11 w-36 shrink-0 rounded-lg border border-line bg-bg px-3 font-mono text-fg"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "inline-flex h-11 w-36 shrink-0 items-center rounded-lg border border-line px-3 font-mono text-sm",
											children: formatMoney(available, quote)
										})
									]
								}), locked > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted",
									children: [
										t.locked,
										" ",
										formatMoney(locked, quote)
									]
								}) : null]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: t.noProfile
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 sm:flex-row sm:items-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-sm sm:flex sm:h-11 sm:w-44 sm:shrink-0 sm:items-center",
									htmlFor: "invest",
									children: t.invest
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "invest",
									inputMode: "decimal",
									value: investText,
									onChange: (event) => setInvestText(event.target.value),
									placeholder: t.investPlaceholder,
									className: "h-11 w-full rounded-lg border border-line bg-bg px-3 font-mono text-fg sm:w-[16.5rem] sm:shrink-0"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex h-11 min-w-0 flex-1 items-center justify-between gap-1",
									children: [
										0,
										25,
										50,
										75,
										100
									].map((mark) => {
										const active = Math.abs(investPct - mark) < .05;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											disabled: available <= 0,
											onClick: () => setInvestPercent(mark),
											className: `h-11 min-w-11 flex-1 rounded-lg border font-mono text-sm font-medium disabled:opacity-40 ${active ? "border-primary bg-primary text-primary-fg" : "border-line bg-bg text-fg"}`,
											children: [mark, "%"]
										}, mark);
									})
								})
							]
						})]
					}),
					snapshot && balance ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 font-mono text-xs text-muted",
						children: [
							t.available,
							" ",
							formatMoney(available, quote),
							locked > 0 ? ` · ${t.locked} ${formatMoney(locked, quote)}` : "",
							invest != null && invest > 0 ? ` · ${t.after} ${formatMoney(available - gross, quote)}` : ""
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-line bg-surface p-4 md:p-5",
				"aria-labelledby": "aufteilung",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
					id: "aufteilung",
					step: "02",
					title: t.pairs
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid gap-4 lg:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-3 left-3 size-5 text-muted" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: query,
									onChange: (event) => setQuery(event.target.value),
									placeholder: t.search,
									"aria-label": t.searchLabel,
									className: "h-11 w-full rounded-lg border border-line bg-bg pr-3 pl-10"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex min-w-0 gap-2 overflow-x-auto",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
										active: family === "alle" && listedQuote === "alle",
										onClick: () => {
											setFamily("alle");
											setListedQuote("alle");
										},
										children: t.all
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
										active: listedQuote === "EUR",
										onClick: () => setListedQuote((prev) => prev === "EUR" ? "alle" : "EUR"),
										children: "EUR"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
										active: listedQuote === "EURCV",
										onClick: () => setListedQuote((prev) => prev === "EURCV" ? "alle" : "EURCV"),
										children: "EURCV"
									}),
									families.map((key) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
										active: family === key,
										onClick: () => setFamily(key),
										children: t.families[key] ?? key
									}, key))
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-xs text-muted",
								children: snapshot ? `${t.pairCount(catalog.length, quoteLabel)}${catalog.length > visible.length ? ` · ${t.shown(visible.length)}` : ""}` : t.noConnection
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
								className: "mt-2 max-h-96 divide-y divide-line overflow-y-auto rounded-lg border border-line bg-bg",
								children: [
									visible.map((item) => {
										const selected = selections.some((entry) => entry.pair === item.pair);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => toggle(item.pair),
											"aria-pressed": selected,
											className: `flex w-full items-center gap-3 px-3 py-3 text-left ${selected ? "bg-raised" : ""}`,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: `inline-flex size-5 shrink-0 items-center justify-center rounded border ${selected ? "border-primary bg-primary text-primary-fg" : "border-line"}`,
													"aria-hidden": "true",
													children: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3" }) : null
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "min-w-0 flex-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "block font-medium",
														children: item.base
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "block truncate text-sm text-muted",
														children: [
															item.name,
															" · ",
															item.pair
														]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "shrink-0 text-right font-mono text-sm",
													children: [item.price ? formatPrice(num(item.price)) : "—", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "block text-xs text-muted",
														children: [
															t.marketCap,
															" ",
															item.marketCap ? formatCap(num(item.marketCap), item.quote) : "—"
														]
													})]
												})
											]
										}) }, item.pair);
									}),
									snapshot && visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "px-3 py-6 text-sm text-muted",
										children: t.noMatch
									}) : null,
									!snapshot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										className: "px-3 py-6 text-sm text-muted",
										children: t.noConnection
									}) : null
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm",
									"aria-live": "polite",
									children: [
										remainder ? t.fixedShares : t.sum,
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `font-mono ${sumOk ? "text-ok" : "text-danger"}`,
											children: [formatShare(remainder ? othersSum : shareSum), " %"]
										}),
										remainder && isbrLeg ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted",
											children: [
												" ",
												"· ",
												t.restBudget,
												" ",
												formatMoney(isbrLeg.gross, quote)
											]
										}) : null
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: equalize,
									disabled: selections.length === 0,
									className: "inline-flex h-11 items-center rounded-lg border border-line px-3 text-sm disabled:opacity-50",
									children: t.equalize
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-2 flex items-center gap-2 text-sm text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: auto,
									onChange: (event) => {
										const next = event.target.checked;
										setAuto(next);
										if (next) setSelections((prev) => sortByShare(scaleToFull(prev)));
									},
									className: "size-4 accent-primary"
								}), t.auto]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "mt-2 flex items-start gap-2 text-sm text-muted",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: remainder,
									onChange: (event) => setRemainder(event.target.checked),
									className: "mt-1 size-4 accent-primary"
								}), t.remainder]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 h-2 overflow-hidden rounded-full bg-raised",
								"aria-hidden": "true",
								children: remainder && invest != null && invest > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex h-full",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full bg-primary",
										style: { width: `${Math.min(100, (invest - (isbrLeg?.gross ?? 0)) / invest * 100)}%` }
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full bg-brass",
										style: { width: `${Math.min(100, (isbrLeg?.gross ?? 0) / invest * 100)}%` }
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-primary",
									style: { width: `${Math.min(100, shareSum / 100)}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								ref: shareListRef,
								className: "mt-2",
								children: ordered.map((item) => {
									const instrument = byPair.get(item.pair);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
										"data-share-pair": item.pair,
										className: "relative border-b border-line bg-transparent py-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0 flex-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "font-medium",
														children: [instrument?.base ?? item.pair, item.pair === restPair ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "ml-2 font-mono text-xs text-brass",
															children: t.rest
														}) : null]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "truncate text-sm text-muted",
														children: [
															item.pair,
															" · ",
															t.market,
															item.pair === restPair ? ` · ${t.setPct} ${t.ignored}` : ""
														]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => stepShare(item.pair, -500),
													"aria-label": t.stepDown(instrument?.base ?? item.pair),
													className: "inline-flex h-11 items-center rounded-lg border border-line px-2 font-mono text-sm",
													children: "−5 %"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "sr-only",
													htmlFor: `share-${item.pair}`,
													children: t.share(instrument?.base ?? item.pair)
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													id: `share-${item.pair}`,
													inputMode: "decimal",
													value: draft?.pair === item.pair ? draft.text : formatShare(item.hundredths),
													onFocus: () => setDraft({
														pair: item.pair,
														text: formatShare(item.hundredths)
													}),
													onChange: (event) => setDraft({
														pair: item.pair,
														text: event.target.value
													}),
													onKeyDown: (event) => {
														if (event.key !== "Enter") return;
														event.preventDefault();
														commitShare(item.pair, event.currentTarget.value);
														setDraft(null);
														event.currentTarget.blur();
													},
													onBlur: () => setDraft((prev) => prev?.pair === item.pair ? null : prev),
													className: "h-11 w-16 rounded-lg border border-line bg-bg px-2 text-right font-mono"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm text-muted",
													children: "%"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => stepShare(item.pair, 500),
													"aria-label": t.stepUp(instrument?.base ?? item.pair),
													className: "inline-flex h-11 items-center rounded-lg border border-line px-2 font-mono text-sm",
													children: "+5 %"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => toggle(item.pair),
													"aria-label": t.remove(instrument?.base ?? item.pair),
													className: "inline-flex size-11 items-center justify-center rounded-lg text-muted",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
												})
											]
										})
									}, item.pair);
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "mt-4 flex flex-col gap-2",
								onSubmit: (event) => {
									event.preventDefault();
									saveList();
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-sm",
										htmlFor: "list-name",
										children: t.saveList
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "list-name",
											value: listName,
											onChange: (event) => setListName(event.target.value),
											placeholder: t.listPlaceholder,
											maxLength: 40,
											className: "h-11 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "submit",
											disabled: !listName.trim() || selections.length === 0,
											className: "inline-flex h-11 items-center rounded-lg border border-line px-3 text-sm disabled:opacity-50",
											children: t.save
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex h-11 items-center gap-2 text-sm text-muted",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: rememberLists,
											onChange: (event) => {
												const keep = event.target.checked;
												setRememberLists(keep);
												if (keep) {
													localStorage.setItem(LISTS_KEEP, "1");
													localStorage.setItem(LISTS, JSON.stringify(favorites));
												} else {
													localStorage.setItem(LISTS_KEEP, "0");
													localStorage.removeItem(LISTS);
												}
											},
											className: "size-4 accent-primary"
										}), t.rememberLists]
									})
								]
							}),
							favorites.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 flex flex-col gap-2",
								children: favorites.map((fav) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => applyFavorite(fav),
										className: "inline-flex h-11 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-line px-3 text-left text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "truncate",
											children: fav.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "shrink-0 text-muted",
											children: t.favMeta(fav.selections.length, fav.remainder)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => removeFavorite(fav.id),
										"aria-label": t.deleteList(fav.name),
										className: "inline-flex size-11 items-center justify-center rounded-lg text-muted",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
									})]
								}, fav.id))
							}) : null
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-line bg-surface p-4 md:p-5",
				"aria-labelledby": "ausfuehrung",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
						id: "ausfuehrung",
						step: "03",
						title: t.fees
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid gap-3 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: t.stake,
								value: invest != null && invest > 0 ? formatMoney(gross, quote) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: t.currentFee,
								value: invest != null && invest > 0 ? formatMoney(fee, quote) : "—",
								hint: snapshot ? formatRate(rate) : void 0
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
								label: t.value,
								value: invest != null && invest > 0 ? formatMoney(net, quote) : "—",
								emphasis: true
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4",
						children: legs.map((leg, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-3 border-t border-line py-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "w-7 shrink-0 font-mono text-sm text-muted",
								children: [index + 1, "."]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "font-medium",
											children: [
												leg.base,
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-normal text-muted",
													children: [
														leg.pair,
														" · ",
														t.market,
														" · ",
														t.setPct,
														" ",
														formatShare(leg.hundredths),
														" %",
														leg.isRemainder ? ` ${t.ignored}` : "",
														" · ",
														t.actual,
														" ",
														formatShare(actualHundredths(leg.net, invest ?? 0)),
														" %"
													]
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-mono text-brass",
											children: formatMoney(leg.net, quote)
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-muted",
										children: [
											t.stake,
											" ",
											formatMoney(leg.gross, quote),
											" · ",
											t.fee,
											" ",
											formatMoney(leg.fee, quote),
											remainder && !leg.isRemainder && leftAfter.has(leg.pair) ? ` · ${t.left} ${formatMoney(leftAfter.get(leg.pair) ?? 0, quote)}` : "",
											leg.isRemainder ? ` · ${t.restBudget} ${formatMoney(leg.gross, quote)}` : "",
											leg.qty != null && leg.price != null ? ` · ${t.qty} ${formatQty(leg.qty)} ${leg.base}` : ""
										]
									}),
									leg.belowMin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-danger",
										children: t.belowMin(formatMoney(leg.min, quote))
									}) : null,
									leg.aboveMax ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-danger",
										children: t.aboveMax(formatMoney(leg.max, quote))
									}) : null
								]
							})]
						}, leg.pair))
					}),
					results.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-lg border border-line bg-bg p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-sm font-medium",
								children: t.lastRun
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-2 flex flex-col gap-2",
								children: results.map((result) => {
									const bought = num(result.filledAmount) || num(result.spent);
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
										className: "text-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: result.ok ? "text-ok" : "text-danger",
												children: [
													result.pair,
													" · ",
													result.ok ? t.status[result.status] || result.status || t.status.new : t.notSent
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-muted",
												children: [
													" ",
													"· ",
													formatMoney(bought, quote),
													" · ",
													t.actual,
													" ",
													formatShare(actualHundredths(bought, invest ?? 0)),
													" %"
												]
											}),
											result.feeAmount ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-muted",
												children: [
													" ",
													"· ",
													t.fee,
													" ",
													formatMoney(num(result.feeAmount), result.feeCurrency || quote)
												]
											}) : null,
											result.filledQuantity ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-muted",
												children: [
													" ",
													"· ",
													t.qty,
													" ",
													formatQty(num(result.filledQuantity))
												]
											}) : null,
											result.message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block text-muted",
												children: result.message
											}) : null,
											result.stake === "staked" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-ok",
												children: [" · ", t.staked]
											}) : null,
											result.stake === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "block text-danger",
												children: [t.stakeFail, result.stakeMessage ? `: ${result.stakeMessage}` : ""]
											}) : null,
											result.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "block font-mono text-xs text-muted",
												children: result.id
											}) : null
										]
									}, result.pair);
								})
							}),
							results.some((result) => !result.ok) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-brass",
								children: t.stop
							}) : null
						]
					}) : null,
					blockers.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 flex flex-col gap-1 text-sm text-muted",
						children: blockers.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: item }, item))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: blockers.length > 0 || placing,
						onClick: () => {
							setAccepted(false);
							setConfirmOpen(true);
						},
						className: "mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-5 font-medium text-primary-fg disabled:opacity-50 sm:w-auto",
						children: mode === "demo" ? t.runDemo : t.runLive
					})
				]
			}),
			confirmOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-4 sm:items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "confirm-title",
					className: "max-h-dvh w-full max-w-lg overflow-y-auto rounded-xl border border-line bg-surface p-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "confirm-title",
							className: "text-xl font-semibold",
							children: mode === "demo" ? t.confirmDemo : t.confirmLive
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 divide-y divide-line",
							children: legs.map((leg) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-baseline justify-between gap-3 py-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									leg.base,
									" · ",
									t.marketBuy,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "block text-muted",
										children: [
											leg.pair,
											" · ",
											leg.isRemainder ? t.rest : t.setPct,
											" ",
											leg.isRemainder ? `${formatShare(leg.hundredths)} % ${t.ignored}` : `${formatShare(leg.hundredths)} %`,
											" ",
											"· ",
											t.actual,
											" ",
											formatShare(actualHundredths(leg.net, invest ?? 0)),
											" %",
											leg.isRemainder ? ` · ${t.restBudget} ${formatMoney(leg.gross, quote)}` : ""
										]
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono",
									children: formatMoney(num(leg.amount), quote)
								})]
							}, leg.pair))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 font-mono text-sm",
							children: t.stakeLine(formatMoney(gross, quote), formatMoney(fee, quote), formatMoney(net, quote))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-4 flex items-start gap-2 rounded-lg border border-brass px-3 py-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: false,
								disabled: true,
								className: "mt-1 size-4 accent-primary"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [t.stakeBought, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 block font-medium text-brass",
								children: t.stakeLater
							})] })]
						}),
						mode === "live" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "mt-4 flex items-start gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: accepted,
								onChange: (event) => setAccepted(event.target.checked),
								className: "mt-1 size-4 accent-primary"
							}), t.confirmCheck]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								ref: cancelRef,
								onClick: () => setConfirmOpen(false),
								className: "inline-flex h-11 items-center justify-center rounded-lg border border-line px-4",
								children: t.cancel
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: placing || mode === "live" && !accepted,
								onClick: () => void execute(),
								className: "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-medium text-primary-fg disabled:opacity-50",
								children: [placing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin motion-reduce:animate-none" }) : null, mode === "demo" ? t.simulate : t.buyNow]
							})]
						})
					]
				})
			}) : null
		]
	});
}
function SectionTitle({ id, step, title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-baseline gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-xs text-brass",
			children: step
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			id,
			className: "text-lg font-semibold",
			children: title
		})]
	});
}
function FilterChip({ active, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		"aria-pressed": active,
		className: `inline-flex h-10 shrink-0 items-center rounded-full border px-3 text-sm ${active ? "border-primary bg-primary text-primary-fg" : "border-line text-fg"}`,
		children
	});
}
function Stat({ label, value, hint, emphasis }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `rounded-lg border bg-bg px-3 py-3 ${emphasis ? "border-brass" : "border-line"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-xs text-muted",
			children: [label, hint ? ` · ${hint}` : ""]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: `mt-1 font-mono text-lg ${emphasis ? "text-brass" : ""}`,
			children: value
		})]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kaufplan, {});
}
//#endregion
export { Home as component };
