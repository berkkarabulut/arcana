// Kulis sunucu fonksiyonları (Firebase Cloud Functions, 2. nesil, europe-west1)
// - bildirimTelefona: yeni bildirim gelince kullanıcının telefonuna/tarayıcısına anlık bildirim (FCM) yollar
// - anonimItiraf: takma ad bile görünmeden itiraf; yazarın kimliği sadece sunucuda tutulur
// - davetOdulu: davet linkiyle gelen her 3 yeni üye için davet edene 1 hafta Premium
// - aramaBildirimi: gelen sesli/görüntülü aramayı telefona bildirir
// - erisimKaydi: 5651 için IP + zaman kaydı (2 yıl)
// - verifyPurchase: Google Play abonelik doğrulaması
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions, logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const FV = admin.firestore.FieldValue;
setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

const SITE = "https://kulistr.com/";
const TITLES = { cm: "Yeni yorum", react: "İtirafına tepki", req: "Mesaj isteği", dm: "Yeni mesaj", match: "Eşleştiniz", like: "Biri seni beğendi", call: "Cevapsız arama", perde: "Perde" };

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
  if (st.n && st.n[n.type] === false) return; // bu türü kapatmış
  if (inQuiet(st)) return;                     // sessiz saatler
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
