// Detaylı site testi: her ekranı gerçek tarayıcıda açar, tıklar, yazar; hata, taşma ve eksik ekran arar.
// Kullanım: HEDEF_URL=https://kulistr.com/beta/ node detayli.mjs   (yerelde: CHROME=/usr/bin/google-chrome YEREL=1)
import pw from "playwright";
const { chromium, devices } = pw;
const URL = process.env.HEDEF_URL || "https://kulistr.com/beta/";
const YEREL = !!process.env.YEREL;
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const sonuc = [], sorun = [];
const kaydet = (cihaz, ad, ok, not = "") => { sonuc.push({ cihaz, ad, ok, not }); if (!ok) sorun.push(`[${cihaz}] ${ad}: ${not}`); };

async function yeniSayfa(cihaz, demo) {
  const ctx = await browser.newContext({ ...cihaz.ayar, locale: "tr-TR", serviceWorkers: "block" });
  if (demo) await ctx.addInitScript(() => { try { localStorage.setItem("kulis_remote", "0") } catch (e) {} });
  const page = await ctx.newPage();
  page._hata = []; page._dosya = [];
  page.on("pageerror", e => { const m = String(e).slice(0, 300); if (!(YEREL && /kulis-db/.test(m))) page._hata.push(m) });
  page.on("response", r => { if (r.status() >= 400 && !(YEREL && /icons\//.test(r.url())) && new globalThis.URL(r.url()).origin === new globalThis.URL(URL).origin) page._dosya.push(r.status() + " " + r.url()); });
  return { ctx, page };
}
// her adım: işlemi yap, bekle, yeni sayfa hatası / yatay taşma / beklenen sonucu kontrol et
async function adim(page, cihaz, ad, fn, kontrol, arg) {
  const once = page._hata.length;
  let not = "";
  try { await fn(); await page.waitForTimeout(450); } catch (e) { not = "işlem hatası: " + String(e.message || e).replace(/\s+/g, " ").slice(0, 600); }
  const yeni = page._hata.slice(once);
  if (yeni.length) not += " sayfa hatası: " + yeni.join(" | ");
  const tasma = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth).catch(() => 0);
  if (tasma > 2) not += ` yatay taşma ${tasma}px`;
  if (!not && kontrol) { try { const k = await page.evaluate(kontrol, arg); if (k !== true) not = "beklenen olmadı: " + k } catch (e) { not = "kontrol hatası: " + e.message } }
  kaydet(cihaz.ad, ad, !not, not.trim());
}
const kapat = page => page.evaluate(() => { try { closeSheet() } catch (e) {} });

const CIHAZLAR = [
  { ad: "Android telefon", ayar: devices["Pixel 7"] },
  { ad: "iPhone", ayar: devices["iPhone 13"] },
  { ad: "Bilgisayar", ayar: { viewport: { width: 1366, height: 800 } } }
];

for (const cihaz of CIHAZLAR) {
  // ---------- 1) Gerçek sunucu modu: üye olmayan yeni ziyaretçi (misafir) ----------
  {
    const { ctx, page } = await yeniSayfa(cihaz, false);
    if (YEREL) await ctx.route(/misafirAkis/, rt => rt.fulfill({ contentType: "application/json", body: JSON.stringify({ result: { list: Array.from({ length: 7 }, (_, i) => ({ id: "p" + i, k: "m" + i, anon: i === 2, t: "Yerel test itirafı numara " + i + ", sadece deneme amaçlı yazıldı.", cat: "ask", cm: i, r: { bende: i, saril: 2 * i, yok: 0 }, ts: Date.now() - i * 36e5, a: i === 2 ? { g: null } : { n: "kisi" + i, c: "#7CC4FF", s: "koc", g: "Kadın", age: "25-34", av: null } })) } }) }));
    const t0 = Date.now();
    await page.goto(URL + "?_=" + Date.now(), { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#msfSon", { timeout: 15000 }).catch(() => {});
    const sure = Date.now() - t0;
    await page.waitForSelector("#ckYes", { timeout: 5000 }).catch(() => {});
    const m = await page.evaluate(() => ({
      son: !!document.querySelector("#msfSon"), onbGizli: document.querySelector("#onb").hidden,
      itiraf: document.querySelectorAll("#view article.it, main article.it, article.it").length,
      ver: (document.querySelector('meta[name="kulis-ver"]') || {}).content || "", cerez: !!document.querySelector("#ckYes")
    }));
    kaydet(cihaz.ad, "Misafir: kayıt ekranı yerine itiraflar açılıyor", m.son && m.onbGizli, m.son ? `${sure} ms` : "misafir akışı gelmedi");
    kaydet(cihaz.ad, "Misafir: en fazla 5 itiraf görünüyor", m.itiraf >= 1 && m.itiraf <= 5, m.itiraf + " itiraf");
    kaydet(cihaz.ad, "Sürüm kodu sayfada", /^[0-9a-f]{10}$/.test(m.ver), m.ver);
    kaydet(cihaz.ad, "Çerez onayı çıkıyor", m.cerez);
    page._ust = await page.evaluate(() => { const b = document.querySelector("#ckNo"); if (!b) return "yok"; const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return e === b || b.contains(e) ? "" : (e ? e.tagName + "#" + e.id + "." + e.className : "boş") });
    if (page._ust) kaydet(cihaz.ad, "Çerez butonunun üstünü kapatan bir şey yok", false, page._ust);
    await adim(page, cihaz, "Çerez: Sadece gerekli", () => page.click("#ckNo", { timeout: 5000 }), () => !document.querySelector("#ckb:not([hidden])") || "çerez bandı kapanmadı");
    const duvar = async (ad, tikla, beklenen) => {
      await adim(page, cihaz, "Misafir duvarı: " + ad, tikla, b => { const d = document.querySelector("#msfDuvar"); return (!!d && (!b || d.innerText.includes(b))) || "üyelik penceresi çıkmadı" }, beklenen);
      await page.evaluate(() => { const d = document.querySelector("#msfDuvar"); d && d.remove() });
    };
    await page.evaluate(() => { const d = document.querySelector("#msfDuvar"); d && d.remove(); scrollTo(0, 0) });
    await duvar("tepki verince", () => page.locator("article.it [data-react]").first().click(), "Tepki");
    await duvar("yorumlara basınca", () => page.locator("article.it button[data-open]").first().click(), "Yorum");
    await duvar("Mesajlar sekmesi", () => page.locator('.nb[data-tab="mesajlar"]').click());
    await duvar("Profilim sekmesi", () => page.locator('.nb[data-tab="ben"]').click());
    await duvar("İtiraf et", () => page.click("#confessBtn"), "İtiraf");
    await duvar("bildirim zili", () => page.click("#topBell"));
    await adim(page, cihaz, "Misafir: sekmeye basınca ekran değişmedi", () => page.waitForTimeout(50), () => state.tab === "akis" || "sekme değişti: " + state.tab);
    kaydet(cihaz.ad, "Misafir: sayfa açılınca pencere kendiliğinden fırlamıyor", !(await page.evaluate(() => !!document.querySelector("#msfDuvar"))));
    const kayar = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight > 120);
    if (kayar) await adim(page, cihaz, "Misafir: sona kaydırınca pencere kendiliğinden çıkıyor", async () => { await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(1200) }, () => !!document.querySelector("#msfDuvar") || "çıkmadı");
    else await adim(page, cihaz, "Misafir: üyelik penceresi açılıyor", () => page.evaluate(() => misafirDuvar("kaydirma")), () => !!document.querySelector("#msfDuvar") || "çıkmadı");
    await adim(page, cihaz, "Misafir: pencereden kayıt ekranına geçiş", () => page.click('#msfDuvar [data-msf="kayit"]'), () => (!document.querySelector("#onb").hidden && [...document.querySelectorAll("#onb button")].some(b => /Google/.test(b.innerText))) || "kayıt ekranı açılmadı");
    await adim(page, cihaz, "Misafir: kayıt ekranından çarpıyla geri dönme", () => page.click("#msfGeri"), () => (document.querySelector("#onb").hidden && !!document.querySelector("#msfSon")) || "akışa dönülmedi");
    for (const id of ["kosullar", "kvkk", "kurallar"])
      await adim(page, cihaz, `Yasal metin (sonradan yüklenen): ${id}`, async () => { await page.evaluate(i => showLegal(i), id); await page.waitForTimeout(1200) },
        () => { const t = document.body.innerText; return (t.length > 1500 && /KVKK|Kulis/.test(t)) || "metin görünmedi" });
    await kapat(page);
    if (!YEREL) kaydet(cihaz.ad, "Sunucu bağlantısı (Firebase) yüklendi", await page.evaluate(() => typeof window.KDB === "object"));
    kaydet(cihaz.ad, "Tüm dosyalar yüklendi", !page._dosya.length, page._dosya.join(" | "));
    kaydet(cihaz.ad, "Misafir modunda sayfa hatası yok", !page._hata.length, page._hata.join(" | "));
    await ctx.close();
  }

  // ---------- 2) Demo modu: üye olmuş biri gibi bütün ekranlar ----------
  {
    const { ctx, page } = await yeniSayfa(cihaz, true);
    await page.goto(URL + "?_=" + Date.now(), { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = document.querySelector("#ckNo"); b && b.click() });
    await adim(page, cihaz, "Kayıt adımları (demo)", async () => {
      await page.evaluate(() => {
        state.me = { n: "testci", c: COLORS[1], s: signOf(5, 12), g: "e", age: "25-34", bio: "", b: { d: 12, m: 5, y: 1996 }, ad: "Test", soyad: "Kişi", email: "t@ornek.com", provider: "email" };
        save(); document.querySelector("#onb").hidden = true; render(); seedDemo();
      });
    }, () => !!state.me && document.querySelector("#onb").hidden || "üye girişi olmadı");

    for (const [yazi, tab] of [["Keşfet", "kesfet"], ["Mesajlar", "mesajlar"], ["Profilim", "ben"], ["Akış", "akis"]])
      await adim(page, cihaz, `Alt menü: ${yazi}`, () => page.locator(".nav button, .nav a", { hasText: yazi }).first().click(),
        t => (state.tab === t && document.body.innerText.length > 200) || "sekme: " + state.tab, tab);

    await adim(page, cihaz, "İtiraf detayı açılıyor", () => page.evaluate(() => showPost(allPosts()[0].id)), () => /Yorum|yorum|Tepki|Mesaj/.test(document.body.innerText) || "detay açılmadı");
    await kapat(page);
    await adim(page, cihaz, "İtiraf yazma ekranı + paylaş", async () => {
      await page.evaluate(() => showConfess());
      await page.fill("#cfIn", "Bu bir otomatik test itirafıdır, gerçek değil. Kimseyi incitmeyen sıradan bir cümle.");
      const once = await page.evaluate(() => allPosts().length);
      await page.click("#cfGo");
      await page.waitForTimeout(600);
      page._itirafArtti = (await page.evaluate(() => allPosts().length)) > once;
    }, () => true);
    kaydet(cihaz.ad, "Yazılan itiraf akışa düştü", !!page._itirafArtti);
    await kapat(page);

    await adim(page, cihaz, "Sohbet açılıyor", () => page.evaluate(() => { state.tab = "mesajlar"; render(); openChat(0) }), () => document.querySelector("#chat").classList.contains("open") || "sohbet açılmadı");
    await adim(page, cihaz, "Mesaj yaz, Enter ile gönder", async () => {
      page._msgOnce = await page.evaluate(() => state.chats[0].msgs.length);
      await page.fill("#mIn", "otomatik test mesajı");
      await page.press("#mIn", "Enter");
    }, () => true);
    const sonra = await page.evaluate(() => state.chats[0].msgs.length);
    kaydet(cihaz.ad, "Enter ile mesaj gitti", sonra > page._msgOnce, `${page._msgOnce} → ${sonra}`);
    await adim(page, cihaz, "Mesajlar üst üste binmiyor", () => page.waitForTimeout(100), () => {
      const m = [...document.querySelectorAll("#msgs > *")].filter(e => e.offsetHeight).map(e => e.getBoundingClientRect());
      for (let i = 1; i < m.length; i++) if (m[i].top < m[i - 1].bottom - 2) return `#${i}. mesaj öncekinin üstüne biniyor`;
      return m.length > 2 || "mesaj yok";
    });
    await adim(page, cihaz, "Konuşmayı bildir ekranı", () => page.evaluate(() => showChatReport(state.chats[0])), () => /bildir|Bildir|şikâyet|Şikâyet/.test(document.body.innerText) || "bildir ekranı yok");
    await kapat(page);
    await adim(page, cihaz, "Perde kartı çiziliyor", () => page.evaluate(() => { const h = perdeCard(); if (typeof h !== "string" && h !== undefined) throw new Error("perdeCard " + typeof h) }));
    await adim(page, cihaz, "Perde açılma animasyonu", async () => { await page.evaluate(() => { try { playPerde(state.chats[0].u) } catch (e) { if (!/KDB|REMOTE|uid/.test(e.message)) throw e } }); await page.waitForTimeout(1500) });
    await adim(page, cihaz, "Sohbette ekran görüntüsü uyarısı var", () => page.waitForTimeout(50), () => !!document.querySelector("#sdUy") || "uyarı yok");
    await adim(page, cihaz, "Sohbetten çık", () => page.evaluate(() => closeChat()), () => !document.querySelector("#chat").classList.contains("open") || "sohbet kapanmadı");

    const ekranlar = [
      ["Profil düzenle", "showEditProfile()"], ["Başkasının profili", "showProfile('kedikahve')"], ["Ayarlar", "showSettings()"],
      ["Premium", "showPremium('test')"], ["Bildirimler", "showNotifs()"], ["Günlük burç", "showDaily(state.me.s)"],
      ["İtirafı şikâyet et", "showReport(allPosts()[0].id)"], ["Hikâyede paylaş", "showShare(allPosts()[0].id)"], ["Arkadaş davet", "showInvite()"]
    ];
    for (const [ad, kod] of ekranlar) { await adim(page, cihaz, `Ekran: ${ad}`, () => page.evaluate(k => (0, eval)(k), kod), () => document.body.innerText.length > 100 || "boş"); await kapat(page); }
    for (const [t, a] of [["acik", "light"], ["koyu", undefined]]) await adim(page, cihaz, `Tema: ${t}`, () => page.evaluate(x => setTheme(x), t), x => document.documentElement.dataset.theme === (x || undefined) || "tema: " + document.documentElement.dataset.theme, a || "");

    // ---- yeni özellikler ----
    await adim(page, cihaz, "Yoruma cevap verme", async () => {
      await page.evaluate(() => { state.premium = true; const p = allPosts().find(x => x.cm.some(c => c.u !== "me")); window.__cp = p.id; showPost(p.id) });
      await page.click("[data-yan]");
      await page.fill("#cmIn", "otomatik test cevabı");
      await page.click("#cmGo");
      await page.waitForTimeout(300);
    }, () => { const p = allPosts().find(x => x.id === window.__cp); const c = p.cm[p.cm.length - 1]; return (c.re && c.re.n && !!document.querySelector(".cm-re .cm-to")) || "cevap bağlantısı yok" });
    await kapat(page);
    await adim(page, cihaz, "İtiraf kaydetme (… menüsü)", async () => { await page.evaluate(() => showMore(allPosts()[1].id)); await page.click("#mKy") }, () => R.kayit.has(allPosts()[1].id) || "kaydedilmedi");
    await adim(page, cihaz, "Profilim > Kaydettiklerim listesi", async () => { await page.evaluate(() => { state.tab = "ben"; render() }); await page.click("#kyTab"); await page.waitForTimeout(300) },
      () => { const t = allPosts()[1].t.slice(0, 20); return document.querySelector("#kyIc").innerText.includes(t) || "listede yok" });
    await adim(page, cihaz, "Kaydı kaldırma", () => page.click("[data-kyx]"), () => !R.kayit.has(allPosts()[1].id) || "kaldırılmadı");
    await kapat(page);
    await adim(page, cihaz, "Yaş filtresi (Uyumlu kişiler)", async () => { await page.evaluate(() => { state.tab = "kesfet"; sw.mode = "uyum"; render() }); await page.click('[data-yas="18-24"]') },
      () => { const r = [...document.querySelectorAll("#ksBody [data-prof]")].map(b => parseInt(U[b.dataset.prof].age)); return (r.every(n => n < 25)) || "yaş dışı kişi var: " + r.join(",") });
    await adim(page, cihaz, "Yaş filtresi sıfırlama", () => page.click('[data-yas="hepsi"]'), () => state.yasF === "hepsi" || "sıfırlanmadı");
    await adim(page, cihaz, "Doğrulanmış profil rozeti görünüyor", async () => { await page.evaluate(() => { const k = allPosts().find(p => p.u !== "me" && !p.anon).u; U[k].dg = true; state.tab = "akis"; render() }) }, () => !!document.querySelector(".who .dg") || "rozet yok");
    await adim(page, cihaz, "Popüler: yeni itiraf ilk saatlerde öne çıkıyor", async () => {
      await page.evaluate(() => { const k = allPosts().find(p => p.u !== "me" && !p.anon).u;
        POSTS.push({ id: "tz1", u: k, cat: "ask", t: "Bu yepyeni bir test itirafı, daha kimse tepki vermedi.", r: { bende: 0, saril: 0, yok: 0 }, cm: [], ago: "Şimdi", ts: Date.now() });
        POSTS.push({ id: "tz2", u: k, cat: "ask", t: "Bu eski bir test itirafı, üç gün önce yazılmış.", r: { bende: 1, saril: 2, yok: 0 }, cm: [], ago: "3 gün", ts: Date.now() - 3 * 864e5 });
        state.sort = "populer"; state.cat = "hepsi"; render() });
    }, () => { const ids = [...document.querySelectorAll("[data-more]")].map(b => b.dataset.more); const a = ids.indexOf("tz1"), b = ids.indexOf("tz2"); return (a >= 0 && b >= 0 && a < b) || `sıra: yeni ${a}, eski ${b}` });
    await page.evaluate(() => { for (const id of ["tz1", "tz2"]) { const i = POSTS.findIndex(p => p.id === id); if (i >= 0) POSTS.splice(i, 1) } render() });
    // Ayarlar sunucu modunda çalışır; burada sunucu bağlantısı taklit edilerek ekran denenir
    await adim(page, cihaz, "Ayarlar: kimler bana yazabilir", async () => {
      await page.evaluate(() => { window.__kayit = []; window.KDB = { saveSettings: d => { window.__kayit.push(d); return Promise.resolve() }, userPub: async () => null, unblock: () => Promise.resolve() };
        R.settings = {}; R.blocks = [allPosts().find(p => p.u !== "me" && !p.anon).u]; showSettings() });
      await page.click('[data-dm-set="eslesme"]');
    }, () => (window.__kayit.some(d => d.dm === "eslesme") && document.querySelector('[data-dm-set="eslesme"]').getAttribute("aria-checked") === "true" && /Eşleş/.test(document.querySelector("#dmAc").textContent)) || "ayar kaydedilmedi");
    await adim(page, cihaz, "Ayarlar: yazıyor ve okundu düğmeleri", async () => { await page.click('[data-set="yaziyor"]'); await page.click('[data-set="okundu"]') },
      () => (window.__kayit.some(d => d.yaziyor === false) && window.__kayit.some(d => d.okundu === false)) || "kaydedilmedi");
    await adim(page, cihaz, "Ayarlar: abonelik iptal bağlantısı", () => page.waitForTimeout(10), () => [...document.querySelectorAll("#sheet a")].some(a => a.href.includes("play.google.com/store/account/subscriptions")) || "bağlantı yok");
    await adim(page, cihaz, "Engellediklerim: liste ve engeli kaldırma", async () => { await page.click("#engList"); await page.waitForSelector(".eng-row"); await page.click("[data-unb]"); await page.waitForTimeout(300) },
      () => (!document.querySelector(".eng-row") && /kalmadı/.test(document.querySelector("#engIc").innerText)) || "engel kaldırılamadı");
    await page.evaluate(() => { delete window.KDB; closeSheet() });

    await adim(page, cihaz, "Yönetici paneli (sonradan yüklenen)", async () => { await page.evaluate(() => openAdmin()); await page.waitForTimeout(1500) },
      () => /Yönetici|Şikâyet|Kullanıcı|İstatistik/.test(document.body.innerText) || "panel açılmadı");
    await adim(page, cihaz, "Yönetici paneli kapanıyor", () => page.evaluate(() => closeAdmin()));

    await adim(page, cihaz, "Aşağı çekip yenileme: aynı ekranda kalıyor", async () => {
      await page.evaluate(() => { state.tab = "mesajlar"; render() });
      await page.evaluate(() => softRefresh());
      await page.waitForTimeout(800);
    }, () => state.tab === "mesajlar" || "ekran değişti: " + state.tab);

    await adim(page, cihaz, "Sayfa yenilenince üyelik duruyor", async () => { await page.reload({ waitUntil: "load" }); await page.waitForTimeout(1500) },
      () => !!state.me && state.me.n === "testci" || "üyelik kayboldu");
    await page.screenshot({ path: `detay-${cihaz.ad.replace(/\s/g, "-")}.png` });
    kaydet(cihaz.ad, "Demo modunda toplam sayfa hatası yok", !page._hata.length, page._hata.join(" | "));
    await ctx.close();
  }
}
await browser.close();
const gecen = sonuc.filter(s => s.ok).length;
for (const s of sonuc) console.log(`${s.ok ? "✅" : "❌"} [${s.cihaz}] ${s.ad}${s.not ? " — " + s.not : ""}`);
console.log(`\n${gecen}/${sonuc.length} kontrol geçti`);
if (sorun.length) { console.error("❌ DETAYLI TEST BAŞARISIZ:\n - " + sorun.join("\n - ")); process.exit(1); }
console.log("✅ Detaylı test geçti");
