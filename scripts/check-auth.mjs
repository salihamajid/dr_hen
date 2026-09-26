// Static guard for the auth rules in AGENTS.md. Run: node scripts/check-auth.mjs
// It can't prove the app is secure, but it fails loudly when a new handler or page forgets its
// session check, reads a farmer id from a request, or looks up a farmer-owned record by id alone.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const norm = (p) => relative(root, p).split(sep).join("/");
const problems = [];
const fail = (file, msg) => problems.push(`${file}: ${msg}`);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const read = (p) => readFileSync(p, "utf8");
const all = walk(join(root, "src"));

// --- API route handlers
const routes = all.filter((p) => p.endsWith("route.ts")).map(norm);
const PUBLIC_ROUTES = [/^src\/app\/api\/auth\//, /^src\/app\/api\/whatsapp\/webhook\//];
for (const f of routes) {
  const src = read(f);
  if (PUBLIC_ROUTES.some((re) => re.test(f))) continue;
  if (f.startsWith("src/app/api/farmer/")) {
    if (!src.includes("requireFarmerApi(")) fail(f, "farmer API route without requireFarmerApi()");
    if (/body\.data\.farmerId|body\.farmerId|searchParams\.get\(["']farmerId["']\)|\.farmerId\s*=\s*await\s+req/.test(src)) fail(f, "reads farmerId from the request");
    if (/export async function (POST|PATCH|PUT)/.test(src) && !/parseJsonBody|safeParse/.test(src)) fail(f, "write handler without a zod schema");
  } else if (!src.includes("requireAdminApi(")) {
    fail(f, "admin API route without requireAdminApi()");
  }
  const handlers = (src.match(/export async function (GET|POST|PUT|PATCH|DELETE)/g) ?? []).length;
  const guards = (src.match(/require(Admin|Farmer)Api\(\)/g) ?? []).length;
  if (handlers > guards) fail(f, `${handlers} handlers but only ${guards} session checks`);
}

// --- pages
const pages = all.filter((p) => /[\\/]page\.tsx$/.test(p)).map(norm);
const PUBLIC_PAGES = [/^src\/app\/page\.tsx$/, /^src\/app\/\(auth\)\//, /^src\/app\/farmer\/\(auth\)\//];
const STATIC_ADMIN_PAGES = [/^src\/app\/\(dashboard\)\/disease-guide\//, /^src\/app\/\(dashboard\)\/farmers\/new\//];
for (const f of pages) {
  if (PUBLIC_PAGES.some((re) => re.test(f))) continue;
  const src = read(f);
  if (f.startsWith("src/app/farmer/")) {
    if (!src.includes("requireFarmer(")) fail(f, "farmer page without requireFarmer()");
  } else if (f.startsWith("src/app/(dashboard)/")) {
    if (!STATIC_ADMIN_PAGES.some((re) => re.test(f)) && !src.includes("requireAdmin(")) fail(f, "admin page without requireAdmin()");
  }
}

// --- farmer code must not look up farmer-owned records by id alone
const OWNED = "flock|dailyReport|alert|message|treatment|vaccination|vetEscalation";
const byIdOnly = new RegExp(`prisma\\.(${OWNED})\\.(findUnique|findUniqueOrThrow|update|delete)\\(\\s*\\{\\s*where:\\s*\\{\\s*id\\b`);
for (const f of all.map(norm)) {
  const farmerCode = /^src\/app\/(farmer|api\/farmer)\//.test(f) || /^src\/lib\/(reports|alerts)\//.test(f);
  if (farmerCode && byIdOnly.test(read(join(root, f)))) fail(f, "looks up a farmer-owned record by id alone (use findFirst/updateMany with farmerId)");
}

// --- secrets in tracked files
try {
  const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
  const secret = /AIza[0-9A-Za-z_-]{20,}|AQ\.Ab[0-9A-Za-z_-]{20,}|EAA[A-Za-z0-9]{40,}|npg_[A-Za-z0-9]{10,}|sk-[A-Za-z0-9]{20,}|BEGIN (RSA |EC )?PRIVATE KEY/;
  for (const f of tracked) {
    if (/\.(png|jpe?g|mp4|apk|jar|so|ico|woff2?|lock)$/i.test(f) || f.startsWith("android/")) continue;
    let text;
    try { text = readFileSync(join(root, f), "utf8"); } catch { continue; }
    if (secret.test(text)) fail(f, "looks like a committed secret");
  }
} catch {
  console.log("(skipped secret scan: git not available)");
}

if (problems.length) {
  console.error(`check-auth: ${problems.length} problem(s)\n` + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log(`check-auth: OK (${routes.length} route files, ${pages.length} pages checked)`);
