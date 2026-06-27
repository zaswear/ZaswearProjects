// Sincroniza portal/projects.json con los repos que tienen web desplegada.
//
// Fuentes: Vercel (prioritaria) y GitHub Pages. Añade automáticamente una
// tarjeta por cada repo con web que aún no esté en el portal, sin tocar las
// tarjetas curadas a mano. Las tarjetas auto llevan `"auto": true`; si un repo
// deja de tener web, su tarjeta auto desaparece en la siguiente ejecución.
//
//   VERCEL_TOKEN=... node scripts/sync-projects.mjs            (escribe)
//   VERCEL_TOKEN=... node scripts/sync-projects.mjs --dry-run  (solo muestra)
//
// Variables: VERCEL_TOKEN (req), VERCEL_TEAM_ID (def: zaswears-projects),
//            GITHUB_TOKEN/GH_PAT (opcional, evita rate-limit), GH_USER (def: zaswear).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "portal/projects.json");
const DRY = process.argv.includes("--dry-run");

const VT = process.env.VERCEL_TOKEN;
const TEAM = process.env.VERCEL_TEAM_ID || "team_ugGRA7XgtQmfoR2cFWmNcFO2";
const GH = process.env.GITHUB_TOKEN || process.env.GH_PAT || "";
const GH_USER = process.env.GH_USER || "zaswear";
const SELF = `${GH_USER}/zaswear-nexus`.toLowerCase();

const PALETTE = ["#d08a55", "#46e0b0", "#6c8cff", "#e0617f", "#b58bd6", "#5bb3c9", "#e0a93e", "#7bbf86"];
const hash = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const prettify = (n) => /[-_]/.test(n) ? n.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : n;
const host = (u) => { try { return new URL(u).host.replace(/^www\./, ""); } catch { return ""; } };

async function vercelCandidates() {
  if (!VT) throw new Error("Falta VERCEL_TOKEN");
  const res = await fetch(`https://api.vercel.com/v9/projects?teamId=${TEAM}&limit=100`, {
    headers: { Authorization: `Bearer ${VT}` },
  });
  if (!res.ok) throw new Error(`Vercel ${res.status}`);
  const { projects = [] } = await res.json();
  const out = [];
  for (const p of projects) {
    if (!p.link || !p.link.repo) continue;
    const alias = p.targets?.production?.alias || [];
    if (!alias.length) continue;
    out.push({
      repoFull: `${p.link.org}/${p.link.repo}`,
      name: p.link.repo,
      url: `https://${alias[0]}`,
      source: "vercel",
    });
  }
  return out;
}

async function pagesCandidates() {
  const headers = { "User-Agent": "zaswear-nexus-sync", ...(GH ? { Authorization: `Bearer ${GH}` } : {}) };
  const res = await fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&type=owner&sort=updated`, { headers });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const repos = await res.json();
  return repos
    .filter((r) => r.has_pages)
    .map((r) => ({
      repoFull: r.full_name,
      name: r.name,
      url: r.homepage || `https://${GH_USER}.github.io/${r.name}/`,
      source: "pages",
    }));
}

async function reachable(url) {
  try {
    const ctrl = AbortSignal.timeout(9000);
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl });
    if (res.status === 405 || res.status === 501) res = await fetch(url, { redirect: "follow", signal: ctrl });
    return res.status < 500; // 2xx/3xx/4xx live; 401/403 = protegido pero vivo
  } catch { return false; }
}

async function main() {
  const existing = JSON.parse(readFileSync(FILE, "utf8"));
  const manual = existing.filter((e) => !e.auto);
  const autoById = new Map(existing.filter((e) => e.auto).map((e) => [e.id, e]));

  // Claves ya representadas por tarjetas manuales (repo, id o host de la url)
  const manualKeys = new Set();
  for (const e of manual) {
    if (e.repo) manualKeys.add(e.repo.toLowerCase());
    manualKeys.add(e.id.toLowerCase());
    if (e.url) manualKeys.add("host:" + host(e.url));
  }

  // Merge de candidatos (Vercel prioritaria)
  const byKey = new Map();
  for (const c of await vercelCandidates()) byKey.set(c.repoFull.toLowerCase(), c);
  for (const c of await pagesCandidates()) if (!byKey.has(c.repoFull.toLowerCase())) byKey.set(c.repoFull.toLowerCase(), c);

  const autos = [];
  for (const c of byKey.values()) {
    const key = c.repoFull.toLowerCase();
    if (key === SELF) continue;
    const repoName = c.name.toLowerCase();
    if (manualKeys.has(key) || manualKeys.has(repoName) || manualKeys.has("host:" + host(c.url))) continue;
    if (!(await reachable(c.url))) { console.warn(`· descartado (no responde): ${c.repoFull} ${c.url}`); continue; }

    const prev = autoById.get(repoName);
    autos.push({
      id: repoName,
      name: prev?.name || prettify(c.name),
      icon: prev?.icon || (c.source === "vercel" ? "▲" : "🌐"),
      url: c.url,
      color: prev?.color || PALETTE[hash(repoName) % PALETTE.length],
      tag: prev?.tag || (c.source === "vercel" ? "▲ auto · vercel" : "auto · pages"),
      category: prev?.category || "auto",
      type: "project",
      size: prev?.size || "sm",
      repo: c.repoFull,
      source: c.source,
      auto: true,
    });
  }
  autos.sort((a, b) => a.name.localeCompare(b.name, "es"));

  const result = [...manual, ...autos];
  const added = autos.map((a) => `${a.name} (${a.source})`);
  console.log(`Manuales: ${manual.length} · Auto: ${autos.length}${added.length ? " → " + added.join(", ") : ""}`);

  if (DRY) { console.log("(--dry-run: no se escribió.)"); return; }
  writeFileSync(FILE, JSON.stringify(result, null, 2) + "\n");
  console.log(`✅ portal/projects.json: ${result.length} tarjetas.`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
