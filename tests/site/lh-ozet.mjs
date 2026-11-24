// Lighthouse raporlarını özetle: puanlar, ana ölçümler, en çok puan kaybettiren maddeler
import { readFileSync, readdirSync } from "node:fs";
for (const f of readdirSync(".").filter(x => x.startsWith("lh-") && x.endsWith(".json"))) {
  const j = JSON.parse(readFileSync(f, "utf8"));
  const c = j.categories, a = j.audits;
  console.log(`\n===== ${f} (${j.finalDisplayedUrl}) =====`);
  console.log("PUANLAR:", Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Math.round((v.score || 0) * 100)])));
  console.log("ÖLÇÜMLER:", ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index", "interactive"].map(k => `${k}=${a[k] && a[k].displayValue}`).join(" | "));
  for (const [cat, v] of Object.entries(c)) {
    const bad = v.auditRefs.filter(r => r.weight > 0 && a[r.id] && a[r.id].score !== null && a[r.id].score < 0.9).sort((x, y) => y.weight - x.weight).slice(0, 8);
    if (bad.length) console.log(`  [${cat}] düşük maddeler:`, bad.map(r => `${a[r.id].title} (${a[r.id].displayValue || Math.round(a[r.id].score * 100)})`).join(" ; "));
  }
  const opp = Object.values(a).filter(x => x.details && x.details.type === "opportunity" && x.details.overallSavingsMs > 100).sort((x, y) => y.details.overallSavingsMs - x.details.overallSavingsMs).slice(0, 6);
  if (opp.length) console.log("  FIRSATLAR:", opp.map(x => `${x.title} (~${Math.round(x.details.overallSavingsMs)} ms)`).join(" ; "));
}
