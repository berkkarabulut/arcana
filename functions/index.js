// Kulis sunucu fonksiyonları (Firebase Cloud Functions, 2. nesil, europe-west1)
// - bildirimTelefona: yeni bildirim gelince kullanıcının telefonuna/tarayıcısına anlık bildirim (FCM) yollar
// - anonimItiraf: takma ad bile görünmeden itiraf; yazarın kimliği sadece sunucuda tutulur
// - davetOdulu: davet linkiyle gelen her 3 yeni üye için davet edene 1 hafta Premium
// - aramaBildirimi: gelen sesli/görüntülü aramayı telefona bildirir
// - erisimKaydi: 5651 için IP + zaman kaydı (2 yıl)
// - verifyPurchase: Google Play abonelik doğrulaması
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions, logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const FV = admin.firestore.FieldValue;
setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

const SITE = "https://kulistr.com/";
const TITLES = { soru: "Yeni anonim soru", super: "Süper beğeni", dogrula: "Profil doğrulama", seri: "Serin bozulmasın", cm: "Yeni yorum", react: "İtirafına tepki", req: "Mesaj isteği", dm: "Yeni mesaj", match: "Eşleştiniz", like: "Biri seni beğendi", call: "Cevapsız arama", perde: "Perde", rapor: "Şikâyetin sonuçlandı", kilometre: "İtirafın ilgi görüyor", duyuru: "Kulis", hatirla: "Kulis'te seni bekleyenler var" };
// bazı bildirim türleri ayarlarda başka bir anahtarla açılıp kapanır
const TUR_AYAR = { kilometre: "react", super: "like", seri: "hatirla" };

// ---------------- Kullanıcı ayarları ----------------
// users/{uid}/settings/main: n (bildirim türü -> açık/kapalı), quiet + qFrom/qTo (Türkiye saatiyle sessiz saatler)
async function settingsOf(uid) {
  const s = await db.doc(`users/${uid}/settings/main`).get().catch(() => null);
  return s && s.exists ? s.data() : {};
}
function inQuiet(st) {
  if (!st.quiet) return false;
  const f = Number.isInteger(st.qFrom) ? st.qFrom : 0, t = Number.isInteger(st.qTo) ? st.qTo : 8;
  const h = (new Date().getUTCHours() + 3) % 24; // Türkiye UTC+3
  return f === t ? false : f < t ? (h >= f && h < t) : (h >= f || h < t);
}
async function sendPush(uid, data, ttlSec) {
  const toks = await db.collection(`users/${uid}/push`).get();
  if (toks.empty) return;
  const tokens = toks.docs.map(d => d.id);
  const res = await admin.messaging().sendEachForMulticast({
    tokens, data,
    webpush: { headers: { Urgency: "high", TTL: String(ttlSec || 86400) } },
    android: { priority: "high", ttl: (ttlSec || 86400) * 1000 }
  });
  const dead = [];
  res.responses.forEach((r, i) => {
    const c = r.error && r.error.code;
    if (c === "messaging/registration-token-not-registered" || c === "messaging/invalid-registration-token" || c === "messaging/invalid-argument") dead.push(tokens[i]);
  });
  await Promise.all(dead.map(t => db.doc(`users/${uid}/push/${t}`).delete().catch(() => {})));
  logger.info("push", { uid, tag: data.tag, sent: res.successCount, failed: res.failureCount });
}

// ---------------- Telefona bildirim ----------------
exports.bildirimTelefona = onDocumentCreated("users/{uid}/notifs/{nid}", async (event) => {
  const n = event.data && event.data.data();
  if (!n) return;
  const uid = event.params.uid;
  const st = await settingsOf(uid);
  if (st.n && st.n[TUR_AYAR[n.type] || n.type] === false) return; // bu türü kapatmış
  if (inQuiet(st)) return;                     // sessiz saatler
  // sistem bildirimleri (kimden geldiği olmayan): metin olduğu gibi gider
  if (!n.from) { await sendPush(uid, { title: TITLES[n.type] || "Kulis", body: String(n.text || "").slice(0, 180), link: SITE, tag: n.type || "kulis" }); return; }
  let who = "Biri";
  if (n.from) {
    const f = await db.doc(`users/${n.from}`).get().catch(() => null);
    if (f && f.exists && f.data().n) who = f.data().n;
  }
  await sendPush(uid, { title: TITLES[n.type] || "Kulis", body: `${who} ${n.text || ""}`.slice(0, 180), link: SITE, tag: n.type || "kulis" });
});

// ---------------- Gelen arama bildirimi ----------------
exports.aramaBildirimi = onDocumentCreated("calls/{id}", async (event) => {
  const c = event.data && event.data.data();
  if (!c || c.status !== "ring") return;
  const st = await settingsOf(c.to);
  if (st.n && st.n.call === false) return;
  if (inQuiet(st)) return;
  const f = await db.doc(`users/${c.from}`).get().catch(() => null);
  const who = f && f.exists && f.data().n ? f.data().n : "Biri";
  await sendPush(c.to, {
    title: c.type === "video" ? "Görüntülü arama" : "Sesli arama",
    body: `${who} seni arıyor`, link: SITE + "?call=" + event.params.id, tag: "call", call: event.params.id
  }, 45);
});

// ---------------- 5651 erişim kaydı ----------------
// Giriş ve paylaşımlarda IP adresi + zaman sunucuda tutulur; kimse okuyamaz (kurallar kapalı), 2 yıl sonra silinir.
const KAYIT_GUN = 730;
const ACTS = ["giris", "itiraf", "yorum", "mesaj", "arama"];
exports.erisimKaydi = onCall({ enforceAppCheck: false }, async (req) => {
  const a = req.auth;
  if (!a) throw new HttpsError("unauthenticated", "giris");
  const act = ACTS.includes(req.data && req.data.act) ? req.data.act : "giris";
  const r = req.rawRequest;
  const fwd = String(r.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = fwd || r.ip || "";
  const port = String(r.headers["x-forwarded-port"] || "");
  const now = Date.now();
  await db.collection("accessLogs").add({
    uid: a.uid, act, ip, port, ua: String(r.headers["user-agent"] || "").slice(0, 300),
    ts: FV.serverTimestamp(), del: admin.firestore.Timestamp.fromMillis(now + KAYIT_GUN * 864e5)
  });
  // süresi dolanları ara ara temizle (ayrı zamanlayıcıya gerek kalmasın)
  if (Math.random() < 0.02) {
    const old = await db.collection("accessLogs").where("del", "<", admin.firestore.Timestamp.now()).limit(300).get();
    if (!old.empty) { const b = db.batch(); old.docs.forEach(d => b.delete(d.ref)); await b.commit(); }
  }
  return { ok: true };
});

// ---------------- Google Play satın alma doğrulaması ----------------
// Uygulama, Play'den aldığı purchaseToken'ı buraya yollar; token Google'a sorulur, gerçekse onaylanır ve premium yazılır.
// Çalışan servis hesabının Play Console'da "Finansal verileri görüntüleme + Siparişleri ve abonelikleri yönetme" izni olmalı.
const PACKAGE = "com.kulistr.app";
const PRODUCTS = ["sohbet", "ses", "tam"].flatMap(t => ["haftalik", "aylik", "yillik"].map(p => `kulis_${t}_${p}`));
const tierOf = id => (String(id).split("_")[1]) || "tam";
let publisher = null;
function playApi() {
  if (!publisher) {
    const ap = require("@googleapis/androidpublisher");
    publisher = ap.androidpublisher({ version: "v3", auth: new ap.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/androidpublisher"] }) });
  }
  return publisher;
}
exports.verifyPurchase = onRequest({ cors: ["https://kulistr.com", "https://www.kulistr.com"] }, async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  try {
    const m = (req.get("authorization") || "").match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ error: "giris" });
    const user = await admin.auth().verifyIdToken(m[1]);
    if (!user.email_verified) return res.status(403).json({ error: "dogrulanmamis" });
    const uid = user.uid;
    const { productId, purchaseToken } = req.body || {};
    if (!PRODUCTS.includes(productId) || typeof purchaseToken !== "string" || purchaseToken.length < 10 || purchaseToken.length > 4096)
      return res.status(400).json({ error: "gecersiz" });
    const tokenRef = db.collection("purchases").doc(require("crypto").createHash("sha256").update(purchaseToken).digest("hex"));
    const prev = await tokenRef.get();
    if (prev.exists && prev.data().uid !== uid) return res.status(409).json({ error: "baska_hesap" });
    const api = playApi();
    const { data: sub } = await api.purchases.subscriptionsv2.get({ packageName: PACKAGE, token: purchaseToken });
    const item = (sub.lineItems || []).find(li => li.productId === productId) || (sub.lineItems || [])[0];
    const until = item && item.expiryTime ? Date.parse(item.expiryTime) : 0;
    const active = ["SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD", "SUBSCRIPTION_STATE_CANCELED"].includes(sub.subscriptionState) && until > Date.now();
    if (sub.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING" && active) {
      await api.purchases.subscriptions.acknowledge({ packageName: PACKAGE, subscriptionId: item.productId, token: purchaseToken, requestBody: {} });
    }
    const pid = item ? item.productId : productId;
    const now = FV.serverTimestamp();
    await tokenRef.set({ uid, productId: pid, state: sub.subscriptionState, until, updatedAt: now }, { merge: true });
    await db.doc(`users/${uid}/private/premium`).set({ active, until, productId: pid, tier: tierOf(pid), state: sub.subscriptionState, updatedAt: now });
    await db.doc(`users/${uid}`).set({ prem: active }, { merge: true });
    return res.json({ active, until, tier: tierOf(pid) });
  } catch (e) {
    logger.error("verifyPurchase", e);
    const code = e && e.code === 404 ? 404 : 500;
    return res.status(code).json({ error: code === 404 ? "bulunamadi" : "sunucu" });
  }
});

// ---------------- Anonim itiraf ----------------
const CATS = ["ask", "aile", "arkadas", "is", "okul", "kimse"];
exports.anonimItiraf = onCall({ enforceAppCheck: false }, async (req) => {
  const a = req.auth;
  if (!a || !a.token.email_verified) throw new HttpsError("unauthenticated", "giris");
  const uid = a.uid;
  const t = String((req.data && req.data.t) || "").trim();
  const cat = String((req.data && req.data.cat) || "kimse");
  if (t.length < 15 || t.length > 500) throw new HttpsError("invalid-argument", "uzunluk");
  if (!CATS.includes(cat)) throw new HttpsError("invalid-argument", "kategori");
  const me = await db.doc(`users/${uid}`).get();
  if (!me.exists) throw new HttpsError("failed-precondition", "profil");
  // yasaklı kelime (sitedeki kuralla aynı liste)
  const mod = await db.doc("config/moderation").get();
  const re = mod.exists ? mod.data().re : "";
  if (re && new RegExp(re, "s").test(t.toLocaleLowerCase("tr"))) throw new HttpsError("permission-denied", "kelime");
  const rlRef = db.doc(`users/${uid}/meta/rl`), postRef = db.collection("posts").doc();
  await db.runTransaction(async tx => {
    const rl = await tx.get(rlRef);
    const last = rl.exists && rl.data().postAt ? rl.data().postAt.toMillis() : 0;
    if (Date.now() - last < 15 * 60e3) throw new HttpsError("resource-exhausted", "hiz");
    tx.set(rlRef, { postAt: FV.serverTimestamp() }, { merge: true });
    tx.set(postRef, {
      uid: "anon", anon: true, t, cat, r: { bende: 0, saril: 0, yok: 0 }, cm: 0, ts: FV.serverTimestamp(),
      a: { n: "Anonim", g: me.data().g || null } // cinsiyet sadece akış filtresi için
    });
    tx.set(db.doc(`anonOwners/${postRef.id}`), { uid, ts: FV.serverTimestamp() });
    tx.set(db.doc(`users/${uid}/anon/${postRef.id}`), { ts: FV.serverTimestamp() });
  });
  return { id: postRef.id };
});

// ---------------- Şikâyet sonucu ----------------
// Yönetici/moderatör bir şikâyeti sonuçlandırınca şikâyet eden kişiye kısa bir bildirim gider (kimin ne yaptığı söylenmez).
exports.sikayetSonucu = onDocumentUpdated("reports/{rid}", async (event) => {
  const a = event.data.before.data() || {}, b = event.data.after.data() || {};
  if (a.status !== "bekliyor" || !b.status || b.status === "bekliyor" || !b.by) return;
  const text = {
    kaldirildi: "Şikâyetini inceledik, içerik kaldırıldı. Kulis'i güvenli tuttuğun için teşekkürler.",
    banlandi: "Şikâyetini inceledik, ilgili hesap uzaklaştırıldı. Teşekkürler.",
    yoksayildi: "Şikâyetini inceledik, kurallara aykırı bir şey bulamadık. Yine de bildirdiğin için teşekkürler."
  }[b.status];
  if (!text) return;
  await db.collection(`users/${b.by}/notifs`).add({ type: "rapor", text, go: null, ts: admin.firestore.FieldValue.serverTimestamp(), read: false });
});

// Misafirin huni adımları: üyelik penceresini gördü (duvar), kayıt ekranını açtı (kayitAc). Sadece bu iki sayı artırılabilir.
exports.misafirOlay = onCall({ enforceAppCheck: false, maxInstances: 5 }, async (req) => {
  const o = req.data && req.data.olay;
  if (["duvar", "kayitAc", "ilkTepki", "ilkItiraf", "ilkBegeni", "ilkBitti"].includes(o)) await say(o);
  return { ok: true };
});

// ---------------- Tepki rekorları ----------------
// Bir itirafın toplam tepkisi 5, 10, 25, 50, 100, 250'yi geçince yazara bir kez haber verilir (anonim itiraflarda da).
const ESIKLER = [5, 10, 25, 50, 100, 250];
exports.tepkiRekoru = onDocumentUpdated("posts/{pid}", async (event) => {
  const a = event.data.before.data() || {}, b = event.data.after.data() || {};
  const top = r => Object.values(r || {}).reduce((x, y) => x + (+y || 0), 0);
  const once = top(a.r), simdi = top(b.r);
  const esik = ESIKLER.filter(e => once < e && simdi >= e).pop();
  if (!esik) return;
  let uid = b.uid;
  if (b.anon) { const o = await db.doc(`anonOwners/${event.params.pid}`).get().catch(() => null); uid = o && o.exists ? o.data().uid : null; }
  if (!uid || uid === "anon") return;
  await db.collection(`users/${uid}/notifs`).add({ type: "kilometre", text: `İtirafına ${esik} kişi tepki verdi 🎉 Yorumlara bir bak.`, go: { post: event.params.pid }, ts: FV.serverTimestamp(), read: false });
});

// ---------------- Sen yokken: geri çağırma ----------------
// Her akşam 19:40 (Türkiye): 2-6 gündür girmeyen ve okumadığı bildirimi olan ya da akışta yeni itiraf birikmiş kişilere
// tek bir hatırlatma gider. Aynı kişiye en fazla 5 günde bir. Ayarlardan "Hatırlatmalar" kapatılabilir; sessiz saatlere uyar.
exports.senYokken = onSchedule({ schedule: "40 19 * * *", timeZone: "Europe/Istanbul", region: "europe-west1", timeoutSeconds: 300 }, async () => {
  const simdi = Date.now(), G = 864e5;
  const us = await db.collection("users")
    .where("lastSeen", "<=", admin.firestore.Timestamp.fromMillis(simdi - 2 * G))
    .where("lastSeen", ">=", admin.firestore.Timestamp.fromMillis(simdi - 6 * G)).limit(500).get();
  const yeniItiraf = (await db.collection("posts").where("ts", ">=", admin.firestore.Timestamp.fromMillis(simdi - 2 * G)).count().get()).data().count;
  let gitti = 0;
  for (const u of us.docs) {
    const uid = u.id;
    const st = await settingsOf(uid);
    if (st.songor === false) continue;                 // son görülmesini gizleyenin "girmedi" bilgisi güvenilmez
    if (st.n && st.n.hatirla === false) continue;
    if (inQuiet(st)) continue;
    const m = await db.doc(`users/${uid}/meta/hatirla`).get();
    if (m.exists && m.data().at && simdi - m.data().at.toMillis() < 5 * G) continue;
    const ok = (await db.collection(`users/${uid}/notifs`).where("read", "==", false).count().get()).data().count;
    let body;
    if (ok > 0) body = `Sen yokken ${ok} yeni bildirimin oldu. Kim ne demiş, gel bir bak 👀`;
    else if (yeniItiraf >= 3) body = `Son iki günde ${yeniItiraf} yeni itiraf yazıldı. Kim neler anlatmış, gel bak.`;
    else continue;
    const toks = await db.collection(`users/${uid}/push`).limit(1).get();
    if (toks.empty) continue;
    await sendPush(uid, { title: TITLES.hatirla, body, link: SITE, tag: "hatirla" }, 6 * 3600);
    await db.doc(`users/${uid}/meta/hatirla`).set({ at: FV.serverTimestamp() });
    gitti++;
  }
  // Günlük seri: dün de bir şey yapmış ama bugün henüz yapmamış, serisi en az 3 gün olanlara akşam hatırlatma
  let seriGitti = 0;
  try {
    const dun = new Date(simdi + 3 * 36e5 - G).toISOString().slice(0, 10);
    const ss = await db.collection("seriler").where("gun", "==", dun).limit(500).get();
    for (const d of ss.docs) {
      const n = d.data().n || 0;
      if (n < 3) continue;
      const st = await settingsOf(d.id);
      if (st.n && st.n.hatirla === false) continue;
      if (inQuiet(st)) continue;
      const toks = await db.collection(`users/${d.id}/push`).limit(1).get();
      if (toks.empty) continue;
      await sendPush(d.id, { title: TITLES.seri, body: `${n} günlük serin bu gece bitiyor 🔥 Bir itirafa tepki bırakman yeter.`, link: SITE, tag: "seri" }, 5 * 3600);
      seriGitti++;
    }
  } catch (e) { logger.warn("seri", String(e && e.message)); }
  logger.info("senYokken", { aday: us.size, gitti, seriGitti });
});

// ---------------- Misafir vitrini ----------------
// Üye olmayan ziyaretçiye en çok tepki alan 5 itiraf. Yazarın hesap kimliği (uid) asla gönderilmez.
let VITRIN = { at: 0, list: [] };
// günlük sayaç (kişisel bilgi yok, sadece sayı): istatistik/YYYY-AA-GG
const gunId = () => new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 10); // Türkiye günü
const say = (alan) => db.doc(`istatistik/${gunId()}`).set({ [alan]: FV.increment(1) }, { merge: true }).catch(() => {});
exports.misafirAkis = onCall({ enforceAppCheck: false, maxInstances: 5 }, async () => {
  say("misafir");
  if (Date.now() - VITRIN.at < 5 * 60e3 && VITRIN.list.length) return { list: VITRIN.list };
  const s = await db.collection("posts").orderBy("ts", "desc").limit(150).get();
  const sum = r => Object.values(r || {}).reduce((a, b) => a + (+b || 0), 0);
  const list = s.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(p => typeof p.t === "string" && p.t.length >= 15 && p.cat !== "soru")
    .sort((a, b) => (sum(b.r) * 2 + (b.cm || 0)) - (sum(a.r) * 2 + (a.cm || 0)) || ((b.ts && b.ts.toMillis()) || 0) - ((a.ts && a.ts.toMillis()) || 0))
    .slice(0, 5)
    .map((p, i) => {
      const a = p.a || {};
      return {
        id: p.id, k: p.anon ? "anon" : "m" + (i + 1), anon: !!p.anon, t: p.t, cat: p.cat, cm: p.cm || 0,
        r: { bende: (p.r && p.r.bende) || 0, saril: (p.r && p.r.saril) || 0, yok: (p.r && p.r.yok) || 0 },
        ts: (p.ts && p.ts.toMillis && p.ts.toMillis()) || Date.now(),
        a: p.anon ? { g: a.g || null } : { n: a.n || "", c: a.c || "#FF8A65", s: a.s || "koc", g: a.g || null, age: a.age || "", av: (a.av && String(a.av).startsWith("preset:")) ? a.av : null }
      };
    });
  VITRIN = { at: Date.now(), list };
  return { list };
});

// ---------------- Davet ödülü ----------------
const DAVET_ESIK = 3, ODUL_GUN = 7;
exports.davetOdulu = onDocumentCreated("users/{uid}/private/info", async (event) => {
  const d = event.data && event.data.data();
  const uid = event.params.uid;
  const ref = d && typeof d.ref === "string" ? d.ref.trim() : "";
  if (!ref || ref === uid || ref.length > 64) return;
  const refUser = await db.doc(`users/${ref}`).get();
  if (!refUser.exists) return;
  const cntRef = db.doc(`users/${ref}/private/ref`), premRef = db.doc(`users/${ref}/private/premium`);
  let rewarded = false;
  await db.runTransaction(async tx => {
    const c = await tx.get(cntRef), p = await tx.get(premRef);
    const list = c.exists ? (c.data().uids || []) : [];
    if (list.includes(uid)) return;
    list.push(uid);
    const count = list.length;
    tx.set(cntRef, { uids: list.slice(-500), count, updatedAt: FV.serverTimestamp() }, { merge: true });
    if (count % DAVET_ESIK === 0) {
      const cur = p.exists && p.data().until > Date.now() ? p.data().until : Date.now();
      const until = cur + ODUL_GUN * 864e5;
      tx.set(premRef, { active: true, until, productId: p.exists && p.data().productId && p.data().productId !== "davet" ? p.data().productId : "davet", state: "DAVET_ODULU", updatedAt: FV.serverTimestamp() }, { merge: true });
      tx.set(db.doc(`users/${ref}`), { prem: true }, { merge: true });
      rewarded = true;
    }
  });
  await db.collection(`users/${ref}/notifs`).add({
    from: uid, type: "like",
    text: rewarded ? `davetinle katıldı. ${DAVET_ESIK} kişi tamam, 1 hafta Premium kazandın!` : "davetinle Kulis'e katıldı",
    go: null, read: false, ts: FV.serverTimestamp()
  });
});

// ---------------- Perde ----------------
// Perde arkasındaki gerçek fotoğraf ve kapağı sadece perdesi açık olan kişiye (ya da sahibine) verir.
// Dosyalar herkese açık bağlantıyla değil, buradan veri olarak gönderilir; böylece bağlantı sızsa bile açılamaz.
const BUCKET = "kulis-1647d.firebasestorage.app";
exports.perdeFoto = onCall({ enforceAppCheck: false, memory: "256MiB" }, async (req) => {
  const me = req.auth && req.auth.uid;
  if (!me || !(req.auth.token && req.auth.token.email_verified)) throw new HttpsError("unauthenticated", "giris");
  const other = String((req.data && req.data.uid) || "");
  if (!/^[A-Za-z0-9]{10,40}$/.test(other)) throw new HttpsError("invalid-argument", "uid");
  if (other !== me) {
    const pid = me < other ? me + "_" + other : other + "_" + me;
    const p = await db.doc(`perde/${pid}`).get();
    if (!p.exists || p.data().status !== "acik") throw new HttpsError("permission-denied", "perde kapali");
  }
  const g = await db.doc(`users/${other}/gizli/foto`).get();
  if (!g.exists) return {};
  const bucket = admin.storage().bucket(BUCKET), out = {};
  for (const k of ["av", "banner"]) {
    const path = g.data()[k];
    if (typeof path !== "string" || !path.startsWith(`r/${other}/`)) continue;
    try {
      const f = bucket.file(path);
      const [[buf], [md]] = await Promise.all([f.download(), f.getMetadata()]);
      if (buf.length > 2 * 1024 * 1024) continue;
      out[k] = `data:${md.contentType || "image/jpeg"};base64,${buf.toString("base64")}`;
    } catch (e) { logger.warn("perdeFoto", { other, k, err: String(e && e.message) }); }
  }
  return out;
});

// ---------------- Ban ----------------
// Moderatör ve yöneticiler kural ihlali yapan kişiyi banlar: hesap kapatılır (giriş yapamaz),
// açık oturumları sonlandırılır, bans/{uid} kaydı açılır (kurallar banlı hesabın her işlemini reddeder).
async function rolesOf(uid) {
  const [a, m] = await Promise.all([db.doc("config/admins").get(), db.doc("config/mods").get()]);
  const admins = (a.exists && a.data().uids) || [], mods = (m.exists && m.data().uids) || [];
  return { admin: admins.includes(uid), mod: admins.includes(uid) || mods.includes(uid) };
}
exports.banla = onCall({ enforceAppCheck: false }, async (req) => {
  const me = req.auth && req.auth.uid;
  if (!me) throw new HttpsError("unauthenticated", "giris");
  if (!(await rolesOf(me)).mod) throw new HttpsError("permission-denied", "yetki");
  const uid = String((req.data && req.data.uid) || ""), reason = String((req.data && req.data.reason) || "Kurallara aykırılık").slice(0, 80);
  if (!/^[A-Za-z0-9]{10,40}$/.test(uid) || uid === me) throw new HttpsError("invalid-argument", "uid");
  if ((await rolesOf(uid)).mod) throw new HttpsError("failed-precondition", "yonetici banlanamaz");
  const u = await db.doc(`users/${uid}`).get();
  await db.doc(`bans/${uid}`).set({ by: me, reason, n: u.exists ? (u.data().n || "") : "", ts: FV.serverTimestamp() });
  try { await admin.auth().updateUser(uid, { disabled: true }); await admin.auth().revokeRefreshTokens(uid); } catch (e) { logger.warn("banla auth", { uid, err: String(e && e.message) }); }
  const toks = await db.collection(`users/${uid}/push`).get();
  await Promise.all(toks.docs.map(d => d.ref.delete().catch(() => {})));
  logger.info("banla", { uid, by: me, reason });
  return { ok: true };
});
exports.banKaldir = onCall({ enforceAppCheck: false }, async (req) => {
  const me = req.auth && req.auth.uid;
  if (!me) throw new HttpsError("unauthenticated", "giris");
  if (!(await rolesOf(me)).admin) throw new HttpsError("permission-denied", "yetki");
  const uid = String((req.data && req.data.uid) || "");
  if (!/^[A-Za-z0-9]{10,40}$/.test(uid)) throw new HttpsError("invalid-argument", "uid");
  await db.doc(`bans/${uid}`).delete();
  try { await admin.auth().updateUser(uid, { disabled: false }); } catch (e) { logger.warn("banKaldir auth", { uid, err: String(e && e.message) }); }
  return { ok: true };
});

// ---------------- Kulis Ekibi mesajı ----------------
// Ekipten (yönetici/moderatör) kullanıcıya mesaj gelince telefonuna bildirim gönder
exports.ekipMesaji = onDocumentCreated("ekip/{uid}/m/{mid}", async (event) => {
  const m = event.data && event.data.data();
  if (!m || !m.staff) return;
  const uid = event.params.uid;
  await sendPush(uid, { title: "Kulis Ekibi", body: String(m.t || "").slice(0, 160), link: SITE + "?ekip=1", tag: "ekip" });
});

// ---------------- Dosya temizliği ----------------
// Silinen ya da kaldırılan içeriğin dosyaları depoda kalmasın (KVKK: "silinir" dediğimiz şey gerçekten silinsin)
const pathOfUrl = (u) => {
  const m = String(u || "").match(/\/o\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};
async function delPath(p) {
  if (!p || !/^(m|p|r)\/[A-Za-z0-9]+\/[A-Za-z0-9._-]+$/.test(p)) return;
  try { await admin.storage().bucket(BUCKET).file(p).delete({ ignoreNotFound: true }); } catch (e) { logger.warn("delPath", { p, err: String(e && e.message) }); }
}
// moderatör bildirilen fotoğraflı/sesli mesajı kaldırınca dosyası da silinir
exports.mesajDosyaTemizle = onDocumentUpdated("chats/{cid}/messages/{mid}", async (event) => {
  const b = event.data.before.data() || {}, a = event.data.after.data() || {};
  if (!a.mod) return;
  await Promise.all([b.img, b.aud].filter(Boolean).map(u => delPath(pathOfUrl(u))));
});
// perde fotoğrafı değişince ya da kaldırılınca eskisi silinir
exports.perdeDosyaTemizle = onDocumentWritten("users/{uid}/gizli/foto", async (event) => {
  const b = (event.data.before && event.data.before.data()) || {}, a = (event.data.after && event.data.after.data()) || {};
  const keep = new Set([a.av, a.banner].filter(Boolean));
  await Promise.all([b.av, b.banner].filter(p => p && !keep.has(p)).map(delPath));
});
// hesap silinince kullanıcının bütün dosyaları silinir
exports.hesapDosyaTemizle = onDocumentDeleted("users/{uid}", async (event) => {
  const uid = event.params.uid;
  if (!/^[A-Za-z0-9]{10,40}$/.test(uid)) return;
  const bucket = admin.storage().bucket(BUCKET);
  for (const dir of ["m", "p", "r"]) {
    try { await bucket.deleteFiles({ prefix: `${dir}/${uid}/`, force: true }); } catch (e) { logger.warn("hesapDosyaTemizle", { uid, dir, err: String(e && e.message) }); }
  }
  logger.info("hesapDosyaTemizle", { uid });
});

// ---------------- Yöneticiden duyuru (toplu bildirim) ----------------
// Sadece yönetici. "deneme": yalnızca gönderene; "herkes": bütün üyelere. Her kişiye bir bildirim kaydı yazılır,
// telefona gönderimi bildirimTelefona yapar (kişinin "Kulis duyuruları" ayarına ve sessiz saatlerine uyar).
exports.duyuruGonder = onCall({ enforceAppCheck: false, timeoutSeconds: 300 }, async (req) => {
  const me = req.auth && req.auth.uid;
  if (!me) throw new HttpsError("unauthenticated", "giris");
  if (!(await rolesOf(me)).admin) throw new HttpsError("permission-denied", "yetki");
  const metin = String((req.data && req.data.metin) || "").trim().slice(0, 180), hedef = req.data && req.data.hedef;
  if (metin.length < 3) throw new HttpsError("invalid-argument", "metin");
  const kayit = { type: "duyuru", text: metin, go: null, ts: FV.serverTimestamp(), read: false };
  if (hedef === "deneme") { await db.collection(`users/${me}/notifs`).add(kayit); return { gitti: 1 }; }
  if (hedef === "kisi") {
    const uid = String((req.data && req.data.uid) || "");
    if (!/^[A-Za-z0-9]{10,64}$/.test(uid)) throw new HttpsError("invalid-argument", "kisi");
    const u = await db.doc(`users/${uid}`).get();
    if (!u.exists) throw new HttpsError("not-found", "kisi");
    await db.collection(`users/${uid}/notifs`).add(kayit);
    const tel = !(await db.collection(`users/${uid}/push`).limit(1).get()).empty;
    await db.collection("duyurular").add({ metin, by: me, kisi: 1, hedef: uid, hedefN: u.data().n || "", ts: FV.serverTimestamp() });
    logger.info("duyuru-kisi", { telefon: tel });
    return { gitti: 1, telefon: tel };
  }
  if (hedef !== "herkes") throw new HttpsError("invalid-argument", "hedef");
  const us = await db.collection("users").select().get();
  let b = db.batch(), n = 0, top = 0;
  for (const u of us.docs) {
    if (await db.doc(`bans/${u.id}`).get().then(x => x.exists)) continue;
    b.set(db.collection(`users/${u.id}/notifs`).doc(), kayit); n++; top++;
    if (n >= 400) { await b.commit(); b = db.batch(); n = 0; }
  }
  if (n) await b.commit();
  await db.collection("duyurular").add({ metin, by: me, kisi: top, ts: FV.serverTimestamp() });
  logger.info("duyuru", { kisi: top });
  return { gitti: top };
});



// ---------------- Anonim soru linki ----------------
// kulistr.com/?soru=takmaad: üye olmayan biri de o kişiye anonim soru sorabilir. Soran kişinin kimliği tutulmaz;
// kötüye kullanıma karşı IP'nin tek yönlü özeti ile saatlik sınır uygulanır (IP'nin kendisi saklanmaz).
exports.anonimSoru = onCall({ enforceAppCheck: false, maxInstances: 5 }, async (req) => {
  const nick = String((req.data && req.data.n) || "").trim().slice(0, 20);
  const t = String((req.data && req.data.t) || "").trim().replace(/\s+/g, " ");
  if (t.length < 3 || t.length > 300) throw new HttpsError("invalid-argument", "uzunluk");
  if (/https?:\/\/|www\./i.test(t)) throw new HttpsError("invalid-argument", "baglanti");
  const nk = await db.doc(`nicks/${nick}`).get();
  if (!nk.exists || !nk.data().uid) throw new HttpsError("not-found", "kisi");
  const uid = nk.data().uid;
  if (await db.doc(`bans/${uid}`).get().then(x => x.exists)) throw new HttpsError("not-found", "kisi");
  const st = await settingsOf(uid);
  if (st.soru === false) throw new HttpsError("failed-precondition", "kapali");
  const mod = await db.doc("config/moderation").get();
  const re = mod.exists ? mod.data().re : "";
  if (re && new RegExp(re, "s").test(t.toLocaleLowerCase("tr"))) throw new HttpsError("permission-denied", "kelime");
  const ip = String((req.rawRequest && (req.rawRequest.headers["x-forwarded-for"] || req.rawRequest.ip)) || "").split(",")[0].trim();
  const h = require("crypto").createHash("sha256").update("kulis-soru:" + ip).digest("hex").slice(0, 32);
  const saat = new Date().toISOString().slice(0, 13);
  const rl = db.doc(`hiz/soru_${h}_${saat}`), hedef = db.doc(`hiz/soruHedef_${uid}_${gunId()}`);
  await db.runTransaction(async tx => {
    const [a, b] = await Promise.all([tx.get(rl), tx.get(hedef)]);
    if ((a.exists ? a.data().n : 0) >= 8) throw new HttpsError("resource-exhausted", "hiz");
    if ((b.exists ? b.data().n : 0) >= 200) throw new HttpsError("resource-exhausted", "hedef");
    tx.set(rl, { n: FV.increment(1), sil: admin.firestore.Timestamp.fromMillis(Date.now() + 2 * 864e5) }, { merge: true });
    tx.set(hedef, { n: FV.increment(1), sil: admin.firestore.Timestamp.fromMillis(Date.now() + 2 * 864e5) }, { merge: true });
    tx.set(db.collection(`users/${uid}/sorular`).doc(), { t, ts: FV.serverTimestamp() });
    tx.set(db.collection(`users/${uid}/notifs`).doc(), { type: "soru", text: "Biri sana anonim bir soru sordu. Cevapla, istersen hikâyende paylaş.", go: { tab: "ben", soru: 1 }, ts: FV.serverTimestamp(), read: false });
  });
  await say("soru");
  return { ok: true };
});

// ---------------- Krediler: öne çıkarma ve süper beğeni ----------------
// users/{uid}/private/kredi: { oneCikar, superBegeni, sonBoost, sonSuper } — sadece sunucu yazar.
// Premium üyeye her 24 saatte 1 öne çıkarma ve 1 süper beğeni ücretsiz; fazlası satın alınan krediden düşer.
async function acilisAcik() {
  const g = await db.doc("config/genel").get().catch(() => null);
  return !!(g && g.exists && g.data().acilis === true);
}
async function premiumMu(uid) {
  if (await acilisAcik()) return true; // açılış döneminde herkes Kulis Tam
  const p = await db.doc(`users/${uid}/private/premium`).get();
  return p.exists && p.data().active === true && (p.data().until || 0) > Date.now();
}
async function krediHarca(uid, alan, sonAlan) {
  const ref = db.doc(`users/${uid}/private/kredi`), prem = await premiumMu(uid);
  return db.runTransaction(async tx => {
    const k = await tx.get(ref), d = k.exists ? k.data() : {};
    const son = d[sonAlan] ? d[sonAlan].toMillis() : 0;
    if (prem && Date.now() - son > 864e5) { tx.set(ref, { [sonAlan]: FV.serverTimestamp() }, { merge: true }); return "premium"; }
    if ((d[alan] || 0) < 1) throw new HttpsError("failed-precondition", "kredi");
    tx.set(ref, { [alan]: FV.increment(-1) }, { merge: true });
    return "kredi";
  });
}
exports.oneCikar = onCall({ enforceAppCheck: false }, async (req) => {
  const me = req.auth && req.auth.uid;
  if (!me || !req.auth.token.email_verified) throw new HttpsError("unauthenticated", "giris");
  const pid = String((req.data && req.data.pid) || "");
  if (!/^[A-Za-z0-9]{10,40}$/.test(pid)) throw new HttpsError("invalid-argument", "pid");
  const p = await db.doc(`posts/${pid}`).get();
  if (!p.exists) throw new HttpsError("not-found", "itiraf");
  let sahip = p.data().uid === me;
  if (!sahip && p.data().anon) { const o = await db.doc(`anonOwners/${pid}`).get(); sahip = o.exists && o.data().uid === me; }
  if (!sahip) throw new HttpsError("permission-denied", "sahip");
  if ((p.data().feat || 0) > Date.now()) return { feat: p.data().feat, zaten: true };
  const kaynak = await krediHarca(me, "oneCikar", "sonBoost");
  const feat = Date.now() + 864e5;
  await p.ref.update({ feat });
  await say("oneCikar_" + kaynak);
  return { feat, kaynak };
});
exports.superBegen = onCall({ enforceAppCheck: false }, async (req) => {
  const me = req.auth && req.auth.uid;
  if (!me || !req.auth.token.email_verified) throw new HttpsError("unauthenticated", "giris");
  const to = String((req.data && req.data.to) || ""), pid = req.data && req.data.pid ? String(req.data.pid).slice(0, 40) : null;
  if (!/^[A-Za-z0-9]{10,40}$/.test(to) || to === me) throw new HttpsError("invalid-argument", "kisi");
  if (await db.doc(`users/${to}/blocks/${me}`).get().then(x => x.exists)) throw new HttpsError("permission-denied", "engel");
  const kaynak = await krediHarca(me, "superBegeni", "sonSuper");
  await db.doc(`likes/${me}_${to}`).set({ from: me, to, pid, super: true, ts: FV.serverTimestamp() });
  await db.collection(`users/${to}/notifs`).add({ type: "super", from: me, text: "sana süper beğeni gönderdi ⭐ İtirafın ona çok dokunmuş.", go: { tab: "kesfet" }, ts: FV.serverTimestamp(), read: false });
  let cid = null;
  const back = await db.doc(`likes/${to}_${me}`).get();
  if (back.exists) {
    cid = me < to ? me + "_" + to : to + "_" + me;
    const c = db.doc(`chats/${cid}`);
    if (!(await c.get()).exists) await c.set({ members: [me, to].sort(), reqBy: me, status: "open", match: true, from: null, last: null, lastBy: me, lastAt: FV.serverTimestamp() });
  }
  await say("super_" + kaynak);
  return { cid, kaynak };
});
// Tek seferlik ürünler (Google Play): satın alma doğrulanır, kredi eklenir, ürün tüketilir (tekrar alınabilsin diye)
const KREDI_URUN = { kulis_one_cikar_1: { oneCikar: 1 }, kulis_one_cikar_3: { oneCikar: 3 }, kulis_super_begeni_5: { superBegeni: 5 } };
exports.verifyProduct = onRequest({ cors: ["https://kulistr.com", "https://www.kulistr.com"] }, async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  try {
    const m = (req.get("authorization") || "").match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ error: "giris" });
    const user = await admin.auth().verifyIdToken(m[1]);
    if (!user.email_verified) return res.status(403).json({ error: "dogrulanmamis" });
    const uid = user.uid, { productId, purchaseToken } = req.body || {};
    if (!KREDI_URUN[productId] || typeof purchaseToken !== "string" || purchaseToken.length < 10 || purchaseToken.length > 4096) return res.status(400).json({ error: "gecersiz" });
    const api = playApi();
    const { data: p } = await api.purchases.products.get({ packageName: PACKAGE, productId, token: purchaseToken });
    if (p.purchaseState !== 0) return res.status(402).json({ error: "odenmedi" });
    const tokenRef = db.collection("purchases").doc(require("crypto").createHash("sha256").update(purchaseToken).digest("hex"));
    const eklendi = await db.runTransaction(async tx => {
      const t = await tx.get(tokenRef);
      if (t.exists && t.data().credited) { if (t.data().uid !== uid) throw Object.assign(new Error("baska_hesap"), { kod: 409 }); return false; }
      const inc = {}; for (const [k, v] of Object.entries(KREDI_URUN[productId])) inc[k] = FV.increment(v);
      tx.set(db.doc(`users/${uid}/private/kredi`), inc, { merge: true });
      tx.set(tokenRef, { uid, productId, credited: true, orderId: p.orderId || null, updatedAt: FV.serverTimestamp() }, { merge: true });
      return true;
    });
    if (p.consumptionState === 0) await api.purchases.products.consume({ packageName: PACKAGE, productId, token: purchaseToken }).catch(e => logger.warn("consume", String(e && e.message)));
    if (eklendi) await say("urun_" + productId);
    const k = await db.doc(`users/${uid}/private/kredi`).get();
    return res.json({ eklendi, kredi: k.exists ? { oneCikar: k.data().oneCikar || 0, superBegeni: k.data().superBegeni || 0 } : {} });
  } catch (e) {
    if (e && e.kod === 409) return res.status(409).json({ error: "baska_hesap" });
    logger.error("verifyProduct", e);
    return res.status(e && e.code === 404 ? 404 : 500).json({ error: "sunucu" });
  }
});

// ---------------- Selfie ile profil doğrulama ----------------
// Kullanıcı uygulama içinden o an çekilmiş bir selfie gönderir (v/{uid}/...). Selfie herkese açık olmaz;
// moderatör, selfie ile kişinin perde arkasındaki fotoğrafını yan yana görüp onaylar ya da reddeder.
exports.dogrulamaFoto = onCall({ enforceAppCheck: false, memory: "256MiB" }, async (req) => {
  const me = req.auth && req.auth.uid;
  if (!me || !(await rolesOf(me)).mod) throw new HttpsError("permission-denied", "yetki");
  const uid = String((req.data && req.data.uid) || "");
  if (!/^[A-Za-z0-9]{10,40}$/.test(uid)) throw new HttpsError("invalid-argument", "uid");
  const d = await db.doc(`dogrulama/${uid}`).get();
  if (!d.exists) return {};
  const bucket = admin.storage().bucket(BUCKET), out = { poz: d.data().poz || null };
  const oku = async (path, k) => {
    if (typeof path !== "string") return;
    try { const f = bucket.file(path); const [[buf], [md]] = await Promise.all([f.download(), f.getMetadata()]);
      if (buf.length <= 3 * 1024 * 1024) out[k] = `data:${md.contentType || "image/jpeg"};base64,${buf.toString("base64")}`; } catch (e) { logger.warn("dogrulamaFoto", { uid, k }); }
  };
  const g = await db.doc(`users/${uid}/gizli/foto`).get();
  await Promise.all([oku(d.data().path && d.data().path.startsWith(`v/${uid}/`) ? d.data().path : null, "selfie"), oku(g.exists && String(g.data().av || "").startsWith(`r/${uid}/`) ? g.data().av : null, "profil")]);
  return out;
});
exports.dogrulamaSonuc = onDocumentUpdated("dogrulama/{uid}", async (event) => {
  const once = event.data.before.data() || {}, sonra = event.data.after.data() || {};
  if (once.durum === sonra.durum || !["onay", "ret"].includes(sonra.durum)) return;
  const uid = event.params.uid;
  const text = sonra.durum === "onay" ? "Profilin doğrulandı ✔ Artık adının yanında doğrulanmış rozeti var." : "Selfie'n doğrulanamadı. Yüzünün net göründüğü, istenen pozu verdiğin yeni bir selfie ile tekrar deneyebilirsin.";
  await db.collection(`users/${uid}/notifs`).add({ type: "dogrula", text, go: { tab: "ben" }, ts: FV.serverTimestamp(), read: false });
  if (typeof sonra.path === "string" && sonra.path.startsWith(`v/${uid}/`)) await admin.storage().bucket(BUCKET).file(sonra.path).delete().catch(() => {});
});

// ---------------- GIF arama (GIPHY) ----------------
// Anahtar GitHub secret'ından (GIPHY_KEY) yüklemede functions/.env'e yazılır.
// Beta anahtar saatte 100 istekle sınırlı: sonuçlar Firestore'da önbelleğe alınır (arama 6 saat, popüler 1 saat),
// kişi başı saatte 60 arama. İstemciye yalnızca GIF kimlikleri gider, adres istemcide kurulur.
exports.gifAra = onCall({ enforceAppCheck: false, maxInstances: 5 }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "giris");
  const KEY = process.env.GIPHY_KEY;
  if (!KEY) throw new HttpsError("failed-precondition", "anahtar");
  const q = String((req.data && req.data.q) || "").trim().toLocaleLowerCase("tr").replace(/\s+/g, " ").slice(0, 50);
  const saat = new Date().toISOString().slice(0, 13);
  const rl = db.doc(`hiz/gif_${req.auth.uid}_${saat}`);
  await db.runTransaction(async tx => {
    const s = await tx.get(rl), v = s.exists ? s.data().n : 0;
    if (v >= 60) throw new HttpsError("resource-exhausted", "hiz");
    tx.set(rl, { n: FV.increment(1), sil: admin.firestore.Timestamp.fromMillis(Date.now() + 864e5) }, { merge: true });
  });
  const anahtar = q ? "q_" + require("crypto").createHash("sha1").update(q).digest("hex").slice(0, 24) : "populer";
  const ref = db.doc(`gifOnbellek/${anahtar}`), omur = q ? 6 * 36e5 : 36e5;
  const eski = await ref.get();
  if (eski.exists && Date.now() - eski.data().ts < omur) return { r: eski.data().r };
  const u = q
    ? `https://api.giphy.com/v1/gifs/search?api_key=${KEY}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13&lang=tr`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${KEY}&limit=24&rating=pg-13`;
  let r;
  try {
    const res = await fetch(u);
    if (!res.ok) throw new Error("giphy " + res.status);
    const j = await res.json();
    r = (j.data || []).map(g => {
      const f = (g.images && g.images.fixed_width) || {};
      return { id: g.id, w: +f.width || 200, h: +f.height || 200 };
    }).filter(g => /^[A-Za-z0-9]{4,40}$/.test(g.id));
  } catch (e) {
    logger.warn("gifAra", e.message);
    if (eski.exists) return { r: eski.data().r }; // kota dolduysa eski sonuç
    throw new HttpsError("unavailable", "giphy");
  }
  await ref.set({ r, ts: Date.now(), q }).catch(() => {});
  return { r };
});
