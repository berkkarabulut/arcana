// Huni istatistiği sorgusu canlıda çalışıyor mu
import admin from "firebase-admin";
admin.initializeApp({ projectId: "kulis-1647d" });
const db = admin.firestore();
const hepsi = await db.collection("istatistik").get();
console.log("istatistik belge sayısı:", hepsi.size, hepsi.docs.slice(-3).map(d => d.id + " " + JSON.stringify(d.data())).join(" | "));
try { const s = await db.collection("istatistik").orderBy(admin.firestore.FieldPath.documentId(), "desc").limit(90).get(); console.log("azalan sorgu OK:", s.size); }
catch (e) { console.log("azalan sorgu HATA:", e.code, String(e.message).slice(0, 300)); }
const a = await db.doc("config/admins").get(); console.log("yönetici sayısı:", (a.data()?.uids || []).length);
