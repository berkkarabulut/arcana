// Bildirim teşhisi: kaç üyenin telefon token'ı var, son duyurular, ayarlar. Kişisel bilgi yazmaz (uid kısaltılır).
import admin from "firebase-admin";
admin.initializeApp({ projectId: "kulis-1647d" });
const db = admin.firestore();
const us = await db.collection("users").get();
let tokenli = 0, kapali = 0, sessiz = 0; const satir = [];
for (const u of us.docs) {
  const p = await db.collection(`users/${u.id}/push`).get();
  const st = (await db.doc(`users/${u.id}/settings/main`).get().catch(() => null))?.data() || {};
  const son = await db.collection(`users/${u.id}/notifs`).orderBy("ts", "desc").limit(1).get();
  const sonN = son.docs[0]?.data();
  if (!p.empty) tokenli++;
  if (st.n && st.n.duyuru === false) kapali++;
  if (st.quiet) sessiz++;
  satir.push(`${u.id.slice(0, 6)}… token:${p.size} ${p.docs.map(d => (d.data().ua || "").match(/Android|iPhone|Windows|Mac/)?.[0] || "?").join(",")} duyuruAyar:${st.n ? st.n.duyuru : "-"} sessiz:${st.quiet ? st.qFrom + "-" + st.qTo : "-"} sonBildirim:${sonN ? sonN.type + "@" + (sonN.ts?.toDate?.().toISOString() || "") : "-"}`);
}
console.log(`Üye: ${us.size} | telefon token'ı olan: ${tokenli} | duyuruyu kapatan: ${kapali} | sessiz saat ayarlı: ${sessiz}`);
satir.forEach(s => console.log(s));
const d = await db.collection("duyurular").orderBy("ts", "desc").limit(5).get();
console.log("Son duyurular:"); d.docs.forEach(x => { const v = x.data(); console.log(` ${v.ts?.toDate?.().toISOString()} kişi:${v.kisi} "${String(v.metin).slice(0, 60)}"`); });
