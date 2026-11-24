// Kulis canlı site testi: gerçek Chrome ile telefon ekranında açar, hata/ölçüm toplar
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";
const SITE = "https://kulistr.com";
const out = { sayfalar: [], hatalar: [], uyarilar: [] };
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["Pixel 7"], locale: "tr-TR" });

async function ac(path, fn) {
  const page = await ctx.newPage();
  const kayit = { path, konsolHata: [], basarisizIstek: [], sayfaHatasi: [] };
  page.on("console", m => { if (m.type() === "error") kayit.konsolHata.push(m.text().slice(0, 300)); });
  page.on("pageerror", e => kayit.sayfaHatasi.push(String(e).slice(0, 300)));
  page.on("requestfailed", r => kayit.basarisizIstek.push(r.url().slice(0, 160) + " :: " + (r.failure() && r.failure().errorText)));
  page.on("response", r => { if (r.status() >= 400) kayit.basarisizIstek.push(r.status() + " " + r.url().slice(0, 160)); });
  const t0 = Date.now();
  const res = await page.goto(SITE + path, { waitUntil: "load", timeout: 45000 });
  kayit.durum = res && res.status();
  kayit.yuklemeMs = Date.now() - t0;
  await page.waitForTimeout(2500);
  kayit.olcum = await page.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0] || {};
    const fcp = performance.getEntriesByName("first-contentful-paint")[0];
    return { ttfb: Math.round(n.responseStart || 0), domHazir: Math.round(n.domContentLoadedEventEnd || 0), yuklendi: Math.round(n.loadEventEnd || 0),
      fcp: fcp ? Math.round(fcp.startTime) : null, htmlKB: Math.round((n.transferSize || 0) / 1024), istekSayisi: performance.getEntriesByType("resource").length,
      toplamKB: Math.round(performance.getEntriesByType("resource").reduce((a, r) => a + (r.transferSize || 0), 0) / 1024) };
  });
  if (fn) { try { kayit.ek = await fn(page); } catch (e) { kayit.ek = { hata: String(e).slice(0, 300) }; } }
  out.sayfalar.push(kayit);
  await page.close();
}

// Ana sayfa: giriş ekranı, yatay taşma, erişilebilirlik kontrolleri, aşağı çekip yenileme öğeleri
await ac("/", async page => {
  const r = await page.evaluate(() => {
    const vis = e => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && b.width > 0 && b.height > 0; };
    const btns = [...document.querySelectorAll("button,a[href],[role=button]")].filter(vis);
    const etiketsiz = btns.filter(b => !(b.innerText || "").trim() && !b.getAttribute("aria-label") && !b.getAttribute("title")).map(b => b.outerHTML.slice(0, 120));
    const kucuk = btns.filter(b => { const r = b.getBoundingClientRect(); return r.width < 32 || r.height < 32; }).map(b => (b.innerText || b.getAttribute("aria-label") || b.outerHTML).slice(0, 60));
    const imgs = [...document.images].filter(i => !i.hasAttribute("alt")).map(i => i.src.slice(0, 100));
    const ids = {}; document.querySelectorAll("[id]").forEach(e => ids[e.id] = (ids[e.id] || 0) + 1);
    return { baslik: document.title, dil: document.documentElement.lang, yatayTasma: document.documentElement.scrollWidth > innerWidth + 1,
      gorunurMetin: document.body.innerText.slice(0, 400), etiketsizButon: etiketsiz.slice(0, 15), kucukDokunmaHedefi: kucuk.slice(0, 15), altsizGorsel: imgs,
      tekrarEdenId: Object.entries(ids).filter(([k, v]) => v > 1), ptrVar: !!document.getElementById("ptr"), swKayitli: !!navigator.serviceWorker && !!navigator.serviceWorker.controller,
      manifest: !!document.querySelector('link[rel=manifest]'), metaAciklama: (document.querySelector('meta[name=description]') || {}).content || null,
      ogGorsel: (document.querySelector('meta[property="og:image"]') || {}).content || null, kanonik: (document.querySelector('link[rel=canonical]') || {}).href || null };
  });
  await page.screenshot({ path: "ekran-anasayfa.png" });
  return r;
});
// tekrar ziyaret: service worker devrede mi, önbellekten hız
await ac("/", async page => ({ tekrarZiyaret: true, swKontrol: await page.evaluate(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller)) }));
for (const p of ["/gizlilik.html", "/kosullar.html", "/kurallar.html", "/cocuk-guvenligi.html", "/hesap-silme.html"]) {
  await ac(p, async page => page.evaluate(() => ({ baslik: document.title, uzunluk: document.body.innerText.length, yatayTasma: document.documentElement.scrollWidth > innerWidth + 1 })));
}
// beta: arama motorundan gizli mi
await ac("/beta/", async page => page.evaluate(() => ({ noindex: !!document.querySelector('meta[name=robots][content*=noindex]') })));

// statik dosyalar
const api = await ctx.request;
for (const p of ["/.well-known/assetlinks.json", "/manifest.webmanifest", "/sw.js", "/kulis-db.js", "/robots.txt", "/sitemap.xml", "/og.jpg", "/icons/icon-192.png", "/icons/icon-512.png"]) {
  const r = await api.get(SITE + p);
  const k = { path: p, durum: r.status(), tur: r.headers()["content-type"], boyutKB: Math.round((await r.body()).length / 1024) };
  if (p.endsWith("assetlinks.json")) { try { const j = await r.json(); k.paket = j.map(x => x.target && x.target.package_name); k.parmakIzi = j.map(x => (x.target.sha256_cert_fingerprints || []).length); } catch (e) { k.hata = "JSON okunamadı"; } }
  if (p.endsWith("manifest.webmanifest")) { try { const j = await r.json(); k.ozet = { name: j.name, start_url: j.start_url, display: j.display, ikonlar: (j.icons || []).map(i => i.sizes + (i.purpose ? "/" + i.purpose : "")) }; } catch (e) { k.hata = "JSON okunamadı"; } }
  out.sayfalar.push(k);
}
// güvenlik başlıkları
const h = (await api.get(SITE + "/")).headers();
out.basliklar = Object.fromEntries(["strict-transport-security", "content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy", "cache-control", "server"].map(k => [k, h[k] || null]));
await browser.close();
writeFileSync("tarayici-sonuc.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
