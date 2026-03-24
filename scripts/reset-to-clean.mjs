/**
 * reset-to-clean.mjs
 * ─────────────────────────────────────────────────────────────
 * Clears all transactional/test data from the database.
 * Does NOT touch profiles or auth users — handle those manually.
 *
 * Tables wiped:
 *   quiz_attempts, lesson_progress, enrolments, payments,
 *   walk_in_payments, bookings, members, courses (+ lessons/quizzes),
 *   pending_registrations, password_reset_requests, invite_tokens
 *
 * Tables left untouched:
 *   profiles, spaces (and all auth users)
 *
 * Usage:
 *   npm run reset
 *
 * Reads credentials from .env.local automatically.
 */

import { createClient }   from "@supabase/supabase-js";
import { readFileSync }   from "fs";
import { createInterface } from "readline";
import { resolve, dirname } from "path";
import { fileURLToPath }  from "url";

// ── Load .env.local ───────────────────────────────────────────
const __dir  = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env.local");

function loadEnv(path) {
  try {
    const lines = readFileSync(path, "utf8").split("\n");
    const out = {};
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      out[key] = val;
    }
    return out;
  } catch {
    console.error("Could not read .env.local");
    process.exit(1);
  }
}

const env    = loadEnv(envPath);
const URL    = env["NEXT_PUBLIC_SUPABASE_URL"];
const SVCKEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!URL || !SVCKEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(URL, SVCKEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Colours ───────────────────────────────────────────────────
const R = "\x1b[0m", RED = "\x1b[31m", YEL = "\x1b[33m",
      GRN = "\x1b[32m", CYN = "\x1b[36m", BOLD = "\x1b[1m";
const log = (c, m) => console.log(`${c}${m}${R}`);

async function ask(q) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(q, a => { rl.close(); res(a.trim()); }));
}

// Tables to wipe, in FK-safe order (children before parents)
const TABLES = [
  "quiz_attempts",
  "lesson_progress",
  "enrolments",
  "payments",
  "walk_in_payments",
  "bookings",
  "members",
  "pending_registrations",
  "password_reset_requests",
  "invite_tokens",
  "courses",           // lessons + quizzes cascade from courses
];

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(`\n${BOLD}${RED}╔══════════════════════════════════════════╗`);
  console.log(`║     ONTIME — CLEAN TRANSACTION DATA     ║`);
  console.log(`╚══════════════════════════════════════════╝${R}\n`);

  log(YEL, "Profiles and auth users will NOT be touched.\n");

  // ── Count rows before ─────────────────────────────────────
  log(CYN, "Counting rows...\n");

  let totalRows = 0;
  const counts = {};
  for (const t of TABLES) {
    const { count } = await db.from(t).select("*", { count: "exact", head: true });
    counts[t] = count ?? 0;
    totalRows += counts[t];
    const label = t === "courses" ? "courses (+ lessons, quizzes)" : t;
    const color = counts[t] > 0 ? RED : R;
    log(color, `  ${counts[t].toString().padStart(4)}  rows  →  ${label}`);
  }

  if (totalRows === 0) {
    log(GRN, "\nDatabase is already clean. Nothing to delete.");
    process.exit(0);
  }

  // ── Confirm ───────────────────────────────────────────────
  console.log("");
  log(BOLD + RED, `Total: ${totalRows} rows will be deleted.`);
  log(BOLD + RED, 'Type  RESET  to confirm, anything else to abort:');
  const answer = await ask("> ");

  if (answer !== "RESET") {
    log(YEL, "\nAborted. Nothing was deleted.");
    process.exit(0);
  }

  // ── Delete ────────────────────────────────────────────────
  console.log("");
  log(CYN, "Deleting...\n");

  for (const t of TABLES) {
    if (counts[t] === 0) {
      log(R, `  —  ${t}  (empty, skipped)`);
      continue;
    }
    const { error, count } = await db
      .from(t)
      .delete({ count: "exact" })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      log(RED, `  ✗  ${t}  ERROR: ${error.message}`);
    } else {
      const label = t === "courses" ? "courses (+ lessons, quizzes cascade)" : t;
      log(GRN, `  ✓  ${label}  (${count ?? 0} deleted)`);
    }
  }

  // ── Done ──────────────────────────────────────────────────
  console.log(`\n${BOLD}${GRN}══════════════════════════════════════════`);
  log(BOLD + GRN, "  Done. All transaction data cleared.");
  log(GRN,        "  Profiles and spaces are untouched.");
  console.log(`${BOLD}${GRN}══════════════════════════════════════════${R}\n`);
}

main().catch(err => { log(RED, "\nError: " + err.message); process.exit(1); });
