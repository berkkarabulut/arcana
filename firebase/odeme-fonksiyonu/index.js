// Kulis — Google Play satın alma doğrulaması
// Uygulama, Google Play'den aldığı satın alma bilgisini (purchaseToken) buraya yollar.
// Bu fonksiyon token'ı doğrudan Google'a sorar; gerçekse onaylar ve kullanıcının premium bitiş tarihini yazar.
// Premium bilgisini sadece bu fonksiyon yazabilir; kullanıcı kendine premium veremez (Firestore kuralları kapalı).
//
// Kurulum: Google Cloud > Cloud Run functions, Node.js 22, giriş noktası: verifyPurchase, bölge: europe-west1
// Çalışan hesabın Play Console'da "Finansal verileri görüntüleme + Siparişleri ve abonelikleri yönetme" izni olmalı.

const functions = require("@google-cloud/functions-framework");
const admin = require("firebase-admin");
const { google } = require("googleapis");

admin.initializeApp();
const db = admin.firestore();

const PACKAGE = "com.kulistr.app";
// 3 seviye (sohbet, ses, tam) x 3 süre (haftalik, aylik, yillik)
const PRODUCTS = ["sohbet", "ses", "tam"].flatMap(t => ["haftalik", "aylik", "yillik"].map(p => `kulis_${t}_${p}`));
const tierOf = id => (String(id).split("_")[1]) || "tam";
const ORIGINS = ["https://kulistr.com", "https://www.kulistr.com"];

const publisher = google.androidpublisher({
  version: "v3",
  auth: new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/androidpublisher"] })
});

functions.http("verifyPurchase", async (req, res) => {
  const origin = req.get("origin") || "";
  if (ORIGINS.includes(origin)) res.set("Access-Control-Allow-Origin", origin);
  res.set("Vary", "Origin");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }
  if (req.method !== "POST") return res.status(405).json({ error: "method" });

  try {
    // 1) Kim istiyor? Firebase giriş anahtarını doğrula
    const m = (req.get("authorization") || "").match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ error: "giris" });
    const user = await admin.auth().verifyIdToken(m[1]);
    if (!user.email_verified) return res.status(403).json({ error: "dogrulanmamis" });
    const uid = user.uid;

    // 2) Ne aldı?
    const { productId, purchaseToken } = req.body || {};
    if (!PRODUCTS.includes(productId) || typeof purchaseToken !== "string" || purchaseToken.length < 10 || purchaseToken.length > 4096)
      return res.status(400).json({ error: "gecersiz" });

    // 3) Aynı satın alma başka hesaba bağlanmasın
    const tokenRef = db.collection("purchases").doc(require("crypto").createHash("sha256").update(purchaseToken).digest("hex"));
    const prev = await tokenRef.get();
    if (prev.exists && prev.data().uid !== uid) return res.status(409).json({ error: "baska_hesap" });

    // 4) Google'a sor
    const { data: sub } = await publisher.purchases.subscriptionsv2.get({ packageName: PACKAGE, token: purchaseToken });
    const item = (sub.lineItems || []).find(li => li.productId === productId) || (sub.lineItems || [])[0];
    const until = item && item.expiryTime ? Date.parse(item.expiryTime) : 0;
    const active = ["SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD", "SUBSCRIPTION_STATE_CANCELED"].includes(sub.subscriptionState) && until > Date.now();

    // 5) Onaylanmamışsa onayla (3 gün içinde onaylanmayan satın alma Google tarafından iade edilir)
    if (sub.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING" && active) {
      await publisher.purchases.subscriptions.acknowledge({ packageName: PACKAGE, subscriptionId: item.productId, token: purchaseToken, requestBody: {} });
    }

    // 6) Kaydet
    const now = admin.firestore.FieldValue.serverTimestamp();
    await tokenRef.set({ uid, productId: item ? item.productId : productId, state: sub.subscriptionState, until, updatedAt: now }, { merge: true });
    await db.doc(`users/${uid}/private/premium`).set({
      active, until, productId: item ? item.productId : productId, tier: tierOf(item ? item.productId : productId), state: sub.subscriptionState, updatedAt: now
    });
    await db.doc(`users/${uid}`).set({ prem: active }, { merge: true });

    return res.json({ active, until });
  } catch (e) {
    console.error(e);
    const code = e && e.code === 404 ? 404 : 500;
    return res.status(code).json({ error: code === 404 ? "bulunamadi" : "sunucu" });
  }
});
