import admin from "firebase-admin";
admin.initializeApp({ projectId: "kulis-1647d" });
const U = "https://europe-west1-kulis-1647d.cloudfunctions.net/misafirAkis";
const cid = "testkontrol" + Date.now().toString(36);
const g = new Date(Date.now() + 3 * 36e5).toISOString().slice(0, 10), ref = admin.firestore().doc("istatistik/" + g);
const once = (await ref.get()).data()?.misafir_t || 0;
for (let i = 0; i < 3; i++) await fetch(U, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: { cid } }) });
await new Promise(r => setTimeout(r, 2000));
const sonra = (await ref.get()).data()?.misafir_t || 0;
console.log("TEKİL TEST: 3 açılış ->", sonra - once, "kişi sayıldı (1 olmalı)");
await ref.set({ misafir_t: admin.firestore.FieldValue.increment(-1) }, { merge: true }); // test kaydını geri al
