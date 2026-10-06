import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { t as copy } from "./copy-CywItsl6.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fusion.functions-C28cIm3-.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var ORIGIN = "https://api.fusion.bitpanda.com";
var PUBLIC_ORIGIN = "https://api.public.bitpanda.com";
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
function messageFrom(body, fallback) {
	if (body && typeof body === "object") {
		const record = body;
		const nested = record.error;
		if (nested && typeof nested === "object") {
			const inner = nested.message;
			if (typeof inner === "string" && inner.trim()) return inner.trim();
		}
		for (const key of [
			"message",
			"error",
			"detail"
		]) {
			const value = record[key];
			if (typeof value === "string" && value.trim()) return value.trim().slice(0, 400);
		}
	}
	if (typeof body === "string" && body.trim()) return body.trim().slice(0, 400);
	return fallback.slice(0, 400);
}
function friendly(status, message, lang) {
	const text = copy[lang];
	if (status === 401) return text.denied;
	if (status === 403) return text.forbidden;
	if (status === 429) return text.rate;
	if (status === 409) return message || text.conflict;
	return message || text.statusHttp(status);
}
async function fusion(apiKey, method, path, lang, json, origin = ORIGIN) {
	let response;
	try {
		response = await fetch(`${origin}${path}`, {
			method,
			headers: {
				"X-Api-Key": apiKey,
				Accept: "application/json",
				"X-Client-Origin": "fusion-kaufplan",
				...json ? { "Content-Type": "application/json" } : {}
			},
			body: json ? JSON.stringify(json) : void 0,
			signal: AbortSignal.timeout(25e3)
		});
	} catch {
		throw new FusionError(0, copy[lang].unreachable);
	}
	const text = await response.text();
	let body = null;
	if (text) try {
		body = JSON.parse(text);
	} catch {
		body = text;
	}
	if (!response.ok) throw new FusionError(response.status, friendly(response.status, messageFrom(body, text), lang));
	return body;
}
async function publicApi(apiKey, method, path, lang, json) {
	return fusion(apiKey, method, path, lang, json, PUBLIC_ORIGIN);
}
function asArray(body) {
	if (Array.isArray(body)) return body;
	if (body && typeof body === "object" && Array.isArray(body.data)) return body.data;
	return [];
}
function asRecord(body) {
	if (!body || typeof body !== "object" || Array.isArray(body)) return null;
	const record = body;
	if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) return record.data;
	return record;
}
function str(value) {
	if (value == null) return "";
	return String(value);
}
function tier(value) {
	if (!value || typeof value !== "object") return null;
	const record = value;
	return {
		name: str(record.name),
		fee: str(record.fee),
		feeMode: str(record.feeMode),
		requiredVolume30d: str(record.requiredVolume30d)
	};
}
function loadAccount(body) {
	const record = asRecord(body) ?? {};
	return {
		tradedVolume30d: str(record.tradedVolume30d),
		currentTier: tier(record.currentTier),
		nextTier: tier(record.nextTier)
	};
}
function loadBalances(body) {
	return asArray(body).map((item) => {
		const record = item ?? {};
		return {
			symbol: str(record.symbol),
			available: str(record.available || "0"),
			locked: str(record.locked || "0")
		};
	});
}
var loadFusionSnapshot_createServerFn_handler = createServerRpc({
	id: "763d57d1fb2c942dccf4c4021382e61cd419f53dfeff1b294f5fcc8a6014f754",
	name: "loadFusionSnapshot",
	filename: "src/lib/fusion.functions.ts"
}, (opts) => loadFusionSnapshot.__executeServer(opts));
var loadFusionSnapshot = createServerFn({ method: "POST" }).validator((input) => {
	const lang = asLang(input?.lang);
	return {
		apiKey: cleanKey(input?.apiKey ?? "", lang),
		lang
	};
}).handler(loadFusionSnapshot_createServerFn_handler, async ({ data }) => {
	const text = copy[data.lang];
	try {
		const [balanceRes, accountRes, pairRes, assetRes, tickerRes] = await Promise.allSettled([
			fusion(data.apiKey, "GET", "/v1/account/balances", data.lang),
			fusion(data.apiKey, "GET", "/v1/account", data.lang),
			fusion(data.apiKey, "GET", "/v1/pairs", data.lang),
			fusion(data.apiKey, "GET", "/v1/assets", data.lang),
			fusion(data.apiKey, "GET", "/v1/tickers", data.lang)
		]);
		if (balanceRes.status === "rejected") return {
			ok: false,
			message: balanceRes.reason instanceof Error ? balanceRes.reason.message : "Guthaben konnte nicht geladen werden."
		};
		const names = /* @__PURE__ */ new Map();
		if (assetRes.status === "fulfilled") for (const item of asArray(assetRes.value)) {
			const record = item ?? {};
			const symbol = str(record.symbol);
			if (!symbol) continue;
			names.set(symbol, {
				name: str(record.name) || symbol,
				type: str(record.type),
				cap: readCap(record)
			});
		}
		const tickers = /* @__PURE__ */ new Map();
		if (tickerRes.status === "fulfilled") for (const item of asArray(tickerRes.value)) {
			const record = item ?? {};
			const pair = str(record.pair);
			if (pair) tickers.set(pair, record);
		}
		const instruments = pairRes.status === "fulfilled" ? asArray(pairRes.value).flatMap((item) => {
			const record = item ?? {};
			const pair = str(record.pair);
			const base = str(record.baseAsset);
			const quote = str(record.quoteAsset);
			if (!pair || !base || !quote) return [];
			const ticker = tickers.get(pair);
			const meta = names.get(base);
			return [{
				pair,
				base,
				quote,
				baseType: str(record.baseAssetType) || meta?.type || "",
				name: meta?.name || base,
				price: ticker ? str(ticker.price) || null : null,
				marketCap: (ticker ? readCap(ticker) : null) ?? meta?.cap ?? null,
				high: ticker ? str(ticker.high) || null : null,
				low: ticker ? str(ticker.low) || null : null,
				volume: ticker ? str(ticker.volume) || null : null,
				minOrderAmount: str(record.minOrderAmount || "0"),
				maxOrderAmount: str(record.maxOrderAmount || "0"),
				amountIncrement: str(record.amountIncrement || "0.01"),
				sizeIncrement: str(record.sizeIncrement || "0.00000001")
			}];
		}) : [];
		await fillMarketCaps(instruments);
		const warnings = [];
		if (pairRes.status === "rejected") warnings.push(text.pairsFail);
		if (tickerRes.status === "rejected") warnings.push(text.pricesFail);
		if (accountRes.status === "rejected") warnings.push(text.feeFail);
		return {
			ok: true,
			snapshot: {
				balances: loadBalances(balanceRes.value),
				account: accountRes.status === "fulfilled" ? loadAccount(accountRes.value) : {
					tradedVolume30d: "",
					currentTier: null,
					nextTier: null
				},
				instruments,
				pricesPartial: tickerRes.status !== "fulfilled",
				warning: warnings.length ? warnings.join(" ") : null
			}
		};
	} catch (error) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : text.loadFail
		};
	}
});
function readCap(record) {
	if (!record) return null;
	for (const key of [
		"marketCap",
		"market_cap",
		"marketcap"
	]) {
		const raw = record[key];
		if (raw == null || raw === "") continue;
		const n = Number(raw);
		if (Number.isFinite(n) && n > 0) return String(n);
	}
	return null;
}
var CAP_QUOTES = [
	"eur",
	"usd",
	"chf",
	"gbp"
];
var capCache = null;
async function loadMarketCaps() {
	if (capCache && Date.now() - capCache.at < 6e5) return capCache.rows;
	const rows = /* @__PURE__ */ new Map();
	await Promise.all(CAP_QUOTES.map(async (currency) => {
		try {
			const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=250&page=1&sparkline=false`, {
				headers: { Accept: "application/json" },
				signal: AbortSignal.timeout(8e3)
			});
			if (!response.ok) return;
			const body = await response.json();
			if (!Array.isArray(body)) return;
			for (const item of body) {
				const record = item ?? {};
				const symbol = str(record.symbol).toUpperCase();
				const cap = Number(record.market_cap);
				if (!symbol || !(cap > 0)) continue;
				const row = rows.get(symbol) ?? {};
				if (row[currency] == null) row[currency] = cap;
				rows.set(symbol, row);
			}
		} catch {}
	}));
	if (rows.size > 0) capCache = {
		at: Date.now(),
		rows
	};
	return rows;
}
async function fillMarketCaps(instruments) {
	if (!instruments.some((item) => !item.marketCap)) return;
	const caps = await loadMarketCaps();
	for (const item of instruments) {
		if (item.marketCap) continue;
		const cap = caps.get(item.base.toUpperCase())?.[item.quote.toLowerCase()];
		if (cap && cap > 0) item.marketCap = String(Math.round(cap));
	}
}
var PAIR_RE = /^[A-Z0-9]{1,20}-[A-Z0-9]{1,12}$/;
var AMOUNT_RE = /^\d+(\.\d{1,8})?$/;
function loadOrder(pair, body, ok, spent, message = "") {
	const record = asRecord(body) ?? {};
	const fee = record.fee && typeof record.fee === "object" ? record.fee : {};
	return {
		pair,
		ok,
		message,
		id: str(record.id),
		status: str(record.status),
		filledQuantity: str(record.filledQuantity),
		filledAmount: str(record.filledAmount),
		spent,
		feeAmount: str(fee.amount),
		feeCurrency: str(fee.currency || fee.symbol)
	};
}
function qtyText(raw) {
	const n = Number(raw);
	if (!Number.isFinite(n) || n <= 0) return null;
	const text = n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
	return /^\d+(\.\d{1,8})?$/.test(text) ? text : null;
}
async function stakeFilled(apiKey, symbol, amount, lang) {
	const text = copy[lang];
	const assetId = str(asRecord(asArray(await publicApi(apiKey, "GET", `/v1/assets?symbol=${encodeURIComponent(symbol)}&page_size=10`, lang)).find((item) => str(asRecord(item)?.symbol).toUpperCase() === symbol))?.id);
	if (!assetId) throw new FusionError(404, text.stakeNone);
	const configId = str(asArray(await publicApi(apiKey, "GET", `/v1/earn/configs?assetId=${encodeURIComponent(assetId)}&mode=STAKING_EARN&type=FLEXIBLE&page_size=20`, lang)).map((item) => asRecord(item)).find((row) => row && row.enabled !== false && row.soldout !== true && str(row.id))?.id);
	if (!configId) throw new FusionError(404, text.stakeNone);
	await publicApi(apiKey, "POST", "/v1/earn/actions/stake", lang, {
		config_id: configId,
		asset_amount: amount
	});
}
var placeFusionOrders_createServerFn_handler = createServerRpc({
	id: "040a0a76c5ab86e3374c0a49514ab13d456b1d73f335a04154cb146997c2f1d8",
	name: "placeFusionOrders",
	filename: "src/lib/fusion.functions.ts"
}, (opts) => placeFusionOrders.__executeServer(opts));
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
}).handler(placeFusionOrders_createServerFn_handler, async ({ data }) => {
	const text = copy[data.lang];
	const results = [];
	try {
		for (const order of data.orders) try {
			const created = await fusion(data.apiKey, "POST", "/v1/account/orders", data.lang, {
				pair: order.pair,
				side: "Buy",
				type: "Market",
				amount: order.amount
			});
			let row = loadOrder(order.pair, created, true, order.amount);
			if (data.stake && row.ok && !qtyText(row.filledQuantity) && row.id) try {
				const fetched = await fusion(data.apiKey, "GET", `/v1/account/orders/${encodeURIComponent(row.id)}`, data.lang);
				const next = loadOrder(order.pair, fetched, true, order.amount);
				row = {
					...row,
					filledQuantity: next.filledQuantity || row.filledQuantity,
					status: next.status || row.status
				};
			} catch {}
			if (data.stake && row.ok) {
				const amount = qtyText(row.filledQuantity);
				const symbol = order.pair.split("-")[0] ?? "";
				if (!amount) row = {
					...row,
					stake: "failed",
					stakeMessage: text.stakeNone
				};
				else try {
					await stakeFilled(data.apiKey, symbol, amount, data.lang);
					row = {
						...row,
						stake: "staked"
					};
				} catch (error) {
					const message = error instanceof Error ? error.message : text.stakeFail;
					row = {
						...row,
						stake: "failed",
						stakeMessage: message
					};
				}
			}
			results.push(row);
		} catch (error) {
			const message = error instanceof Error ? error.message : text.orderFail;
			results.push(loadOrder(order.pair, null, false, order.amount, message));
			break;
		}
		return {
			ok: true,
			results
		};
	} catch (error) {
		return {
			ok: false,
			message: error instanceof Error ? error.message : text.orderFail
		};
	}
});
//#endregion
export { loadFusionSnapshot_createServerFn_handler, placeFusionOrders_createServerFn_handler };
