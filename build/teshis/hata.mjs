// Son hatalar: zaman, kaynak, cihaz (uid kısaltılır)
import admin from "firebase-admin";
admin.initializeApp({ projectId: "kulis-1647d" });
const db = admin.firestore();
const s = await db.collection("errors").orderBy("ts", "desc").limit(25).get().catch(async () => db.collection("errors").limit(25).get());
s.docs.forEach(d => { const v = d.data(); const ua = String(v.ua || ""); console.log((v.ts && v.ts.toDate ? v.ts.toDate().toISOString() : "?"), (v.uid || "").slice(0, 5), /iPad/.test(ua) ? "iPad" : /iPhone/.test(ua) ? "iPhone" : /Android/.test(ua) ? "Android" : "masaüstü", v.where, "|", String(v.msg).slice(0, 200)); });
