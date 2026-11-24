// Yatırımcı sunumu için ekran görüntüleri: emülatörde demo botlar, itiraflar, yorumlar ve bir sohbet kurulur,
// sitenin derlenmiş kopyası telefon boyutunda açılıp ekranlar çekilir. Canlı veriye dokunmaz.
// Kullanım (CI): firebase emulators:exec --only auth,firestore,database --project kulis-1647d "node tests/site/sunum-ekranlari.mjs"
import pw from "playwright";
import fs from "node:fs";
const { chromium } = pw;
const SITE = process.env.SITE || "http://localhost:8765/";
const OUT = process.env.OUT_DIR || "/tmp/ekran";
fs.mkdirSync(OUT, { recursive: true });
const P = "kulis-1647d", AUTH = "http://127.0.0.1:9099", FS = "http://127.0.0.1:8080";
const OWNER = { Authorization: "Bearer owner", "Content-Type": "application/json" };
const val = v => v === null ? { nullValue: null } : v instanceof Date ? { timestampValue: v.toISOString() } : typeof v === "boolean" ? { booleanValue: v }
  : typeof v === "number" ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === "string" ? { stringValue: v }
  : Array.isArray(v) ? { arrayValue: { values: v.map(val) } } : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, val(x)])) } };
async function yaz(yol, veri) {
  const r = await fetch(`${FS}/v1/projects/${P}/databases/(default)/documents/${yol}`, { method: "PATCH", headers: OWNER, body: JSON.stringify({ fields: val(veri).mapValue.fields }) });
  if (!r.ok) throw new Error(yol + " yazılamadı: " + r.status + " " + await r.text());
}
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const anahtar = uid => { const t = Math.floor(Date.now() / 1000);
  return b64({ alg: "none", typ: "JWT" }) + "." + b64({ iss: "bot@kulis.test", sub: "bot@kulis.test", aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit", iat: t, exp: t + 3600, uid }) + "."; };
const once = dk => new Date(Date.now() - dk * 60000);

// Demo kullanıcılar (src/js/02-veri.js'teki örneklerle aynı)
const K = {
  gecekusu: { av: "preset:k1", banner: "preset:b1", n: "gecekuşu", s: "akrep", age: "25-29", g: "Kadın", c: "#C79AF2", bio: "Gece 3'ten sonra dürüst olurum." },
  sessizlimon: { av: "preset:k4", banner: "preset:b5", n: "sessizlimon", s: "terazi", age: "20-24", g: "Kadın", c: "#E9B96E", bio: "Kararsızım ama bu konuda değil." },
  kirmiziceket: { n: "kırmızıceket", s: "koc", age: "20-24", g: "Kadın", c: "#E8505B", bio: "Önce yaparım, sonra itiraf ederim." },
  kumsaati: { av: "preset:k5", n: "kumsaati", s: "yengec", age: "30-34", g: "Kadın", c: "#86A8F0", bio: "Annemle aramdaki her şey burada." },
  kedikahve: { av: "preset:k3", banner: "preset:b2", n: "kedikahve", s: "yay", age: "25-29", g: "Kadın", c: "#7CC6A4", bio: "Plansız biletler, uzun mesajlar." },
  mavimerdiven: { banner: "preset:b4", n: "mavimerdiven", s: "basak", age: "25-29", g: "Erkek", c: "#86A8F0", bio: "Her şeyi planlarım, kalbim hariç." },
  yorgunkaptan: { av: "preset:e2", banner: "preset:b3", n: "yorgunkaptan", s: "oglak", age: "30-34", g: "Erkek", c: "#7CC6A4", bio: "Plazada çalışıyorum, ruhum Kaş'ta." },
  eskiplak: { av: "preset:e4", banner: "preset:b6", n: "eskiplak", s: "balik", age: "25-29", g: "Erkek", c: "#F29A7C", bio: "Hâlâ 2016'dayım bazı konularda." },
  dumanli: { av: "preset:e5", n: "dumanlı", s: "kova", age: "30-34", g: "Erkek", c: "#E9B96E", bio: "Kimseyi kırmadan dürüst olmayı deniyorum." },
};
const ben = { uid: "sunumIzleyici0000000000000001", n: "derinmavi", s: "kova", age: "25-29", g: "Erkek", c: "#7CC4FF", av: "preset:e2", bio: "Az konuşur, çok dinlerim." };
const uidOf = k => ("demo_" + k + "_000000000000000000").slice(0, 28);
const yazar = k => { const u = K[k]; return { n: u.n, c: u.c, s: u.s, g: u.g, age: u.age, av: u.av || null }; };

const ITIRAFLAR = [
  { id: "p1", u: "gecekusu", cat: "ask", dk: 18, t: "Üç yıldır en yakın arkadaşımın sevgilisine aşığım. İkisinin düğününde nedime olacağım. Kimse bilmiyor, o bile.", r: { bende: 214, saril: 388, yok: 96 },
    cm: [["eskiplak", "Bunu taşımak çok ağır. Düğünden sonra biraz uzaklaşmak sana iyi gelebilir.", 12], ["sessizlimon", "Ben de benzerini yaşadım. Zaman gerçekten geçiriyor, söz.", 9], ["dumanli", "Nedimeliği bırakmak bir seçenek mi? Kendini korumak bencillik değil.", 4]] },
  { id: "p3", u: "kumsaati", cat: "aile", dk: 60, t: "Annemin aradığını görünce telefonu sessize alıyorum. Sonra bütün gece suçluluk duyuyorum.", r: { bende: 640, saril: 410, yok: 12 },
    cm: [["yorgunkaptan", "Bu itirafı okuyan herkes kendini gördü.", 50]] },
  { id: "p4", u: "kirmiziceket", cat: "arkadas", dk: 120, t: "Arkadaş grubunda doğum günümü kimse hatırlamadı. Ben de söylemedim. Hâlâ söylemedim.", r: { bende: 188, saril: 502, yok: 73 },
    cm: [["gecekusu", "Söyle. Unutmaları senin değersiz olduğun anlamına gelmiyor.", 70], ["dumanli", "Geç kalmış doğum günü kutlaması da kutlamadır.", 65]] },
  { id: "p7", u: "sessizlimon", cat: "ask", dk: 360, t: "Sevgilim beni Terazi diye kararsız sanıyor. Aslında üç aydır ayrılmaya karar vermiş durumdayım, sadece söyleyemiyorum.", r: { bende: 233, saril: 301, yok: 140 }, cm: [] },
  { id: "p8", u: "kedikahve", cat: "kimse", dk: 1500, t: "Annemlere iş gezisi dedim, tek başıma Mardin'e gittim. Hayatımın en iyi üç günüydü.", r: { bende: 310, saril: 84, yok: 52 },
    cm: [["mavimerdiven", "Yalan ama güzel yalan.", 1400]] },
  { id: "p2", u: "yorgunkaptan", cat: "is", dk: 42, t: "İşyerinde herkes beni çok çalışkan sanıyor. Aslında iki aydır her gün öğle arasında arabada uyuyorum.", r: { bende: 520, saril: 61, yok: 44 }, cm: [] },
  { id: "p6", u: "eskiplak", cat: "ask", dk: 300, t: "Eski sevgilimin Spotify çalma listesini hâlâ takip ediyorum. Yeni şarkı ekleyince kime eklediğini düşünüyorum.", r: { bende: 702, saril: 120, yok: 88 }, cm: [] },
];
const SOHBET = [
  ["o", "Mardin itirafın sen miydin? Ben de geçen yaz tek başıma gittim.", 26],
  ["ben", "Evet benim 😄 Dara'ya da gittin mi?", 25],
  ["o", "Gittim! Gün batımında bütün kalıntılar turuncuya dönüyor.", 24],
  ["ben", "Ben de onu görmek için ikinci gün tekrar çıktım.", 22],
  ["o", "Annemler hâlâ iş gezisi sanıyor bu arada.", 20],
  ["ben", "Sır bende kalır. Bir dahaki plansız bilet nereye?", 18],
  ["o", "Kars olabilir. Kışın gitmek istiyorum.", 15],
];

for (const [k, u] of Object.entries(K)) {
  const uid = uidOf(k);
  await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${P}/accounts`, { method: "POST", headers: OWNER, body: JSON.stringify({ localId: uid, email: k + "@demo.kulis.test", emailVerified: true, displayName: u.n }) });
  await yaz("users/" + uid, { ...u, createdAt: once(60 * 24 * 40), lastSeen: once(3) });
  await yaz("nicks/" + u.n, { uid });
}
{ const r = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/projects/${P}/accounts`, { method: "POST", headers: OWNER, body: JSON.stringify({ localId: ben.uid, email: "izleyici@demo.kulis.test", emailVerified: true, displayName: ben.n }) });
  if (!r.ok) throw new Error("izleyici açılamadı: " + await r.text()); }
const { uid: _u, ...benPub } = ben;
await yaz("users/" + ben.uid, { ...benPub, createdAt: once(60 * 24 * 20), lastSeen: once(0) });
await yaz(`users/${ben.uid}/private/info`, { ad: "Demo", soyad: "İzleyici", email: "izleyici@demo.kulis.test", b: { d: 3, m: 2, y: 1999 }, provider: "google" });
await yaz(`users/${ben.uid}/private/premium`, { active: true, until: Date.now() + 30 * 864e5, tier: "tam", productId: "kulis_tam_aylik", state: "DEMO" });
await yaz("nicks/" + ben.n, { uid: ben.uid });
for (const p of ITIRAFLAR) {
  await yaz("posts/" + p.id, { uid: uidOf(p.u), t: p.t, cat: p.cat, r: p.r, cm: p.cm.length, ts: once(p.dk), a: yazar(p.u) });
  let i = 0;
  for (const [k, t, dk] of p.cm) await yaz(`posts/${p.id}/comments/c${i++}`, { uid: uidOf(k), t, ts: once(dk), a: yazar(k) });
}
const o = uidOf("kedikahve"), CID = [ben.uid, o].sort().join("_");
const son = SOHBET[SOHBET.length - 1];
await yaz("chats/" + CID, { members: [ben.uid, o].sort(), reqBy: o, status: "open", match: true, from: "Annemlere iş gezisi dedim, tek başıma Mardin'e gittim.", last: son[1], lastBy: o, lastAt: once(son[2]), n: SOHBET.length });
let i = 0;
for (const [kim, t, dk] of SOHBET) await yaz(`chats/${CID}/messages/m${String(i++).padStart(2, "0")}`, { uid: kim === "ben" ? ben.uid : o, t, ts: once(dk) });
console.log("Demo veri hazır");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "tr-TR", colorScheme: "dark", serviceWorkers: "block" });
await ctx.addInitScript(() => { try { localStorage.setItem("kulis_cerez", "0") } catch (e) {} });
const p = await ctx.newPage();
const log = []; p.on("console", m => log.push(m.type() + ": " + m.text().slice(0, 200))); p.on("pageerror", e => log.push("HATA " + e));
await p.goto(SITE + "?emu=1");
await p.waitForFunction(() => window.KDB && window.__emuGiris, null, { timeout: 20000 });
await p.evaluate(async t => { const c = await window.__emuGiris(t); await remoteAfterAuth(c.user, "google"); }, anahtar(ben.uid));
try { await p.waitForFunction(() => typeof state !== "undefined" && state.me && state.chats && state.chats.length > 0, null, { timeout: 25000 }); }
catch (e) { console.log(log.slice(-40).join("\n")); throw e; }
await p.waitForTimeout(3000);
console.log("TEŞHİS", JSON.stringify(await p.evaluate(() => ({ posts: R.posts && R.posts.length, mapped: R.mapped && R.mapped.length, all: allPosts().length, me: state.me.g, cat: state.cat, sort: state.sort, U: Object.keys(U).length, ornek: R.mapped && R.mapped[0] && { u: R.mapped[0].u, g: U[R.mapped[0].u] && U[R.mapped[0].u].g } }))));
const temizle = () => p.evaluate(() => { document.querySelectorAll("#ckb,.toast,#toast").forEach(e => e.remove()); });
async function cek(ad, hazirla, bekle = 1500) {
  try {
    await p.evaluate(hazirla); await p.waitForTimeout(bekle); await temizle();
    await p.screenshot({ path: `${OUT}/${ad}.png` }); console.log("📸 " + ad);
  } catch (e) { console.log("❌ " + ad + ": " + String(e).slice(0, 200)); }
}
const kapat = () => p.evaluate(() => { try { closeSheet && closeSheet() } catch (e) {} try { closeChat && closeChat() } catch (e) {} document.querySelectorAll(".sheet.open,.ov.open").forEach(e => e.classList.remove("open")); });

await cek("01-akis", () => { state.tab = "akis"; state.sort = "populer"; render(); scrollTo(0, 0); });
await cek("02-itiraf-detay", () => { showPost("p1"); }, 2500); await kapat();
await cek("03-kesfet", () => { state.tab = "kesfet"; render(); scrollTo(0, 0); }, 2500);
await cek("04-mesajlar", () => { state.tab = "mesajlar"; render(); scrollTo(0, 0); });
await cek("05-sohbet", () => { openChat(0); }, 2500); await kapat();
await cek("06-profil", () => { state.tab = "ben"; render(); scrollTo(0, 0); }, 2000);
await cek("07-premium", () => { showPremiumRemote("sunum"); }, 2000); await kapat();
await cek("08-ayarlar", () => { showSettings(); }, 2000); await kapat();
await browser.close();
console.log(log.filter(l => /HATA|error/i.test(l)).slice(0, 15).join("\n"));
