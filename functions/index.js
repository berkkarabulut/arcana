// Kulis sunucu fonksiyonları (Firebase Cloud Functions, 2. nesil, europe-west1)
// - bildirimTelefona: yeni bildirim gelince kullanıcının telefonuna/tarayıcısına anlık bildirim (FCM) yollar
// - anonimItiraf: takma ad bile görünmeden itiraf; yazarın kimliği sadece sunucuda tutulur
// - davetOdulu: davet linkiyle gelen her 3 yeni üye için davet edene 1 hafta Premium
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions, logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const FV = admin.firestore.FieldValue;
setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

const SITE = "https://kulistr.com/";
const TITLES = { cm: "Yeni yorum", react: "İtirafına tepki", req: "Mesaj isteği", dm: "Yeni mesaj", match: "Eşleştiniz", like: "Biri seni beğendi" };

// ---------------- Telefona bildirim ----------------
exports.bildirimTelefona = onDocumentCreated("users/{uid}/notifs/{nid}", async (event) => {
  const n = event.data && event.data.data();
  if (!n) return;
  const uid = event.params.uid;
  const toks = await db.collection(`users/${uid}/push`).get();
  if (toks.empty) return;
  let who = "Biri";
  if (n.from) {
    const f = await db.doc(`users/${n.from}`).get().catch(() => null);
    if (f && f.exists && f.data().n) who = f.data().n;
  }
  const tokens = toks.docs.map(d => d.id);
  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    data: { title: TITLES[n.type] || "Kulis", body: `${who} ${n.text || ""}`.slice(0, 180), link: SITE, tag: n.type || "kulis" },
    webpush: { headers: { Urgency: "high", TTL: "86400" } },
    android: { priority: "high" }
  });
  // geçersiz olmuş anahtarları temizle
  const dead = [];
  res.responses.forEach((r, i) => {
    const c = r.error && r.error.code;
    if (c === "messaging/registration-token-not-registered" || c === "messaging/invalid-registration-token" || c === "messaging/invalid-argument") dead.push(tokens[i]);
  });
  await Promise.all(dead.map(t => db.doc(`users/${uid}/push/${t}`).delete().catch(() => {})));
  logger.info("push", { uid, sent: res.successCount, failed: res.failureCount });
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
