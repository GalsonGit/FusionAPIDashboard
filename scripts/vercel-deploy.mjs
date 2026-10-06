#!/usr/bin/env node
/**
 * Deploy this app to Vercel.
 *
 * Nitro's `vercel` preset is built by `npm run build` on Vercel's builders,
 * including `db:migrate` when the project has DATABASE_URL. This script only
 * uploads the repo and lets that remote build run.
 *
 *   npm run deploy
 *   npm run deploy:prod
 *
 * First time: `npx vercel login`, then run the script and confirm the project
 * link. In CI set VERCEL_TOKEN, VERCEL_ORG_ID and VERCEL_PROJECT_ID.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);

if (argv.includes("--help") || argv.includes("-h")) {
  console.log(`Usage: node scripts/vercel-deploy.mjs [--prod] [vercel flags]

  npm run deploy         preview deployment
  npm run deploy:prod    production deployment

Builds on Vercel via npm run build. Requires \`npx vercel login\`
or VERCEL_TOKEN plus VERCEL_ORG_ID and VERCEL_PROJECT_ID.`);
  process.exit(0);
}

const prod = argv.includes("--prod");
const pass = argv.filter((arg) => arg !== "--prod");
const args = ["--yes", "vercel", "deploy", "--yes", ...pass];
if (prod) args.push("--prod");

console.log(prod ? "[deploy] Produktions-Deploy zu Vercel…" : "[deploy] Preview-Deploy zu Vercel…");

const child = spawn("npx", args, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("error", (error) => {
  console.error(`[deploy] Vercel CLI konnte nicht gestartet werden: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`[deploy] abgebrochen (${signal})`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
