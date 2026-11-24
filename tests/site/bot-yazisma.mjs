// İki bot hesabıyla uçtan uca sohbet testi: yazıyor, durunca kaybolma, mesaj, görüldü, anlık çevrimiçi / çevrimdışı.
// Firebase emülatörlerinde (gerçeğiyle aynı güvenlik kuralları) ve sitenin derlenmiş kopyasında çalışır; canlı veriye dokunmaz.
// Kullanım (CI): firebase emulators:exec --only auth,firestore,database --project kulis-1647d "node tests/site/bot-yazisma.mjs"
import admin from "firebase-admin";
import pw from "playwright";
const { chromium, devices } = pw;
const SITE = process.env.SITE || "http://localhost:8765/";
const VIDEO = process.env.VIDEO_DIR || "bot-video";

admin.initializeApp({ projectId: "kulis-1647d", databaseURL: "http://localhost:9000/?ns=kulis-1647d-default-rtdb" });
const fs = admin.firestore(), now = admin.firestore.FieldValue.serverTimestamp();
const BOTLAR = [
  { uid: "botAyse000000000000000000001", n: "bot_ayse", g: "Kadın", s: "yengec", c: "#FF8A65", cihaz: devices["Pixel 7"] },
  { uid: "botMert000000000000000000002", n: "bot_mert", g: "Erkek", s: "akrep", c: "#7CC4FF", cihaz: { viewport: { width: 412, height: 860 } } }
];
const [A, B] = BOTLAR, CID = [A.uid, B.uid].sort().join("_");
for (const b of BOTLAR) {
  await admin.auth().createUser({ uid: b.uid, email: b.n + "@bot.kulis.test", emailVerified: true, displayName: b.n });
  await fs.doc("users/" + b.uid).set({ n: b.n, c: b.c, s: b.s, g: b.g, age: "25-29", bio: "Ben bir test botuyum.", createdAt: now, lastSeen: now });
  await fs.doc(`users/${b.uid}/private/info`).set({ ad: "Bot", soyad: b.n, email: b.n + "@bot.kulis.test", b: { d: 1, m: 7, y: 1998 }, provider: "google" });
  await fs.doc("nicks/" + b.n).set({ uid: b.uid });
  b.token = await admin.auth().createCustomToken(b.uid);
}
await fs.doc("chats/" + CID).set({ members: [A.uid, B.uid].sort(), reqBy: A.uid, status: "open", match: false, from: null, last: "selam", lastBy: A.uid, lastAt: now, n: 1 });
await fs.collection(`chats/${CID}/m`).add({ by: A.uid, t: "selam", ts: now });
console.log("Botlar hazır:", A.n, B.n);

const browser = await chromium.launch();
const sonuc = [];
const kaydet = (ad, ok, not = "") => { sonuc.push({ ad, ok, not }); console.log(`${ok ? "✅" : "❌"} ${ad}${not ? " — " + not : ""}`); };
async function botAc(b) {
  const ctx = await browser.newContext({ ...b.cihaz, locale: "tr-TR", serviceWorkers: "block", recordVideo: { dir: VIDEO + "/" + b.n, size: { width: 412, height: 860 } } });
  await ctx.addInitScript(() => { try { localStorage.setItem("kulis_cerez", "0") } catch (e) {} });
  const p = await ctx.newPage(); p._hata = [];
  p.on("pageerror", e => p._hata.push(String(e).slice(0, 200)));
  p.on("console", m => { if (m.type() === "error" && !/misafirAkis|ERR_|favicon|messaging|push/i.test(m.text())) p._hata.push("konsol: " + m.text().slice(0, 200)) });
  await p.goto(SITE + "?emu=1");
  await p.waitForFunction(() => window.KDB && window.__emuGiris, null, { timeout: 20000 });
  await p.evaluate(t => window.__emuGiris(t), b.token);
  await p.waitForFunction(() => window.state && state.me && state.chats && state.chats.length > 0, null, { timeout: 25000 });
  await p.evaluate(() => { const c = document.querySelector("#ckb"); c && c.remove(); state.tab = "mesajlar"; render(); openChat(0) });
  await p.waitForSelector("#chat.open #mIn", { timeout: 10000 });
  return { ctx, p };
}
const bekleKosul = async (p, fn, ms) => { const t0 = Date.now(); try { await p.waitForFunction(fn, null, { timeout: ms, polling: 100 }); return Date.now() - t0 } catch (e) { return -1 } };
const baslik = p => p.evaluate(() => (document.querySelector("#chatIn .chat-h .who small") || {}).textContent || "");

const a = await botAc(A), b = await botAc(B);
kaydet("İki bot da giriş yaptı ve sohbeti açtı", true);
await b.p.waitForTimeout(2500);

// 1) çevrimiçi
let s = await bekleKosul(b.p, () => /çevrimiçi/.test((document.querySelector("#chatIn .chat-h .who small") || {}).textContent || ""), 8000);
kaydet("Mert, Ayşe'yi çevrimiçi görüyor", s >= 0, s >= 0 ? `${s} ms` : "başlık: " + await baslik(b.p));

// 2) yazıyor başlıyor
await a.p.click("#mIn");
const t0 = Date.now();
await a.p.keyboard.type("Naber nasılsın, bugün çok yoruldum valla", { delay: 90 });
s = await bekleKosul(b.p, () => !!document.querySelector("#sdTy"), 6000);
kaydet("Ayşe yazarken Mert'te \"yazıyor…\" çıkıyor", s >= 0, s >= 0 ? `yazmaya başladıktan ${Math.max(0, Date.now() - t0 - 0)} ms içinde göründü` : "çıkmadı");

// 3) yazmayı bırakınca kayboluyor (3 sn bekleme + iletim)
const dur0 = Date.now();
s = await bekleKosul(b.p, () => !document.querySelector("#sdTy"), 9000);
kaydet("Ayşe durunca \"yazıyor…\" kayboluyor", s >= 0, s >= 0 ? `${Date.now() - dur0} ms sonra kayboldu` : "kaybolmadı");

// 4) tekrar yazıp gönderince gösterge hemen kalkıyor, mesaj karşıya düşüyor
await a.p.keyboard.type(" ", { delay: 50 });
await bekleKosul(b.p, () => !!document.querySelector("#sdTy"), 5000);
const g0 = Date.now();
await a.p.keyboard.press("Enter");
s = await bekleKosul(b.p, () => [...document.querySelectorAll("#msgs .m, #msgs > div")].some(e => /bugün çok yoruldum/.test(e.textContent)), 8000);
kaydet("Mesaj Mert'e ulaştı", s >= 0, s >= 0 ? `${Date.now() - g0} ms` : "gelmedi");
s = await bekleKosul(b.p, () => !document.querySelector("#sdTy"), 4000);
kaydet("Mesaj gidince \"yazıyor…\" hemen kalkıyor", s >= 0, s >= 0 ? `${Date.now() - g0} ms` : "kalmaya devam etti");

// 5) görüldü
s = await bekleKosul(a.p, () => !!document.querySelector("#sdSeen"), 8000);
kaydet("Ayşe'nin ekranında \"Görüldü\" çıkıyor", s >= 0, s >= 0 ? `${s} ms` : "çıkmadı");

// 6) Mert cevap yazıyor
await b.p.click("#mIn");
await b.p.keyboard.type("İyiyim ya sen? Gel kahve içelim", { delay: 80 });
s = await bekleKosul(a.p, () => !!document.querySelector("#sdTy"), 6000);
kaydet("Mert yazarken Ayşe'de \"yazıyor…\" çıkıyor", s >= 0, s >= 0 ? `${s} ms` : "çıkmadı");
await b.p.keyboard.press("Enter");
s = await bekleKosul(a.p, () => [...document.querySelectorAll("#msgs > div")].some(e => /kahve içelim/.test(e.textContent)), 8000);
kaydet("Cevap Ayşe'ye ulaştı", s >= 0, s >= 0 ? `${s} ms` : "gelmedi");
await a.p.waitForTimeout(1500); await b.p.waitForTimeout(1500);

// 7) Ayşe uygulamayı kapatıyor: Mert'te anında "az önce görüldü"
const k0 = Date.now();
await a.p.waitForTimeout(800);
const aHata = [...a.p._hata];
await a.ctx.close();
s = await bekleKosul(b.p, () => /görüldü/.test((document.querySelector("#chatIn .chat-h .who small") || {}).textContent || ""), 20000);
kaydet("Ayşe çıkınca Mert'te \"az önce görüldü\" oluyor", s >= 0, s >= 0 ? `${Date.now() - k0} ms sonra: "${await baslik(b.p)}"` : "başlık: " + await baslik(b.p));
await b.p.waitForTimeout(2500);

kaydet("Ayşe'nin sayfasında hata yok", !aHata.length, aHata.join(" | "));
kaydet("Mert'in sayfasında hata yok", !b.p._hata.length, b.p._hata.join(" | "));
await b.ctx.close(); await browser.close();
const kotu = sonuc.filter(x => !x.ok);
console.log(`\n${sonuc.length - kotu.length}/${sonuc.length} bot kontrolü geçti`);
process.exit(kotu.length ? 1 : 0);
