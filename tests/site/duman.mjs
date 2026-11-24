// Derleme sonrası duman testi: sayfa açılıyor mu, hata var mı, temel işlevler yerinde mi
import { chromium, devices } from "playwright";
const URL = process.env.HEDEF_URL || "https://kulistr.com/beta/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["Pixel 7"], locale: "tr-TR" });
const page = await ctx.newPage();
const pe = [], ce = [], fail = [];
page.on("pageerror", e => pe.push(String(e).slice(0, 300)));
page.on("console", m => { if (m.type() === "error") ce.push(m.text().slice(0, 200)); });
page.on("response", r => { if (r.status() >= 400 && r.url().includes("kulistr.com")) fail.push(r.status() + " " + r.url()); });
await page.goto(URL + "?_=" + Date.now(), { waitUntil: "load" });
await page.waitForTimeout(6000);
const r = await page.evaluate(() => ({
  surum: (document.querySelector('meta[name="kulis-ver"]') || {}).content,
  firebase: typeof window.KDB === "object",
  REMOTE: typeof REMOTE !== "undefined" && REMOTE,
  fonksiyonlar: ["render", "openAdminRemote", "playPerde", "softRefresh", "showEditProfile", "drawChat", "openEkip", "showChatReport", "startCallRemote", "showPremium"].filter(f => typeof window[f] !== "function"),
  metin: document.body.innerText.replace(/\s+/g, " ").slice(0, 200),
  stil: [...document.styleSheets].reduce((a, s) => { try { return a + s.cssRules.length } catch (e) { return a } }, 0)
}));
await page.screenshot({ path: "duman.png" });
await browser.close();
console.log(JSON.stringify({ ...r, sayfaHatasi: pe, konsolHatasi: ce, basarisiz: fail }, null, 1));
const sorun = [];
if (pe.length) sorun.push("sayfa hatası: " + pe.join(" | "));
if (fail.length) sorun.push("yüklenemeyen dosya: " + fail.join(" | "));
if (!r.firebase) sorun.push("Firebase bağlantısı (KDB) yüklenmedi");
if (r.fonksiyonlar.length) sorun.push("eksik fonksiyon: " + r.fonksiyonlar.join(", "));
if (r.stil < 700) sorun.push("stil kuralları eksik: " + r.stil);
if (sorun.length) { console.error("❌ DUMAN TESTİ BAŞARISIZ:\n - " + sorun.join("\n - ")); process.exit(1); }
console.log("✅ Duman testi geçti");
