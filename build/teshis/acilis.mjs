// Açılış dönemi anahtarını değiştirir: node acilis.mjs ac|kapat|durum
import admin from "firebase-admin";
admin.initializeApp({ projectId: "kulis-1647d" });
const db = admin.firestore(), ref = db.doc("config/genel"), islem = process.argv[2] || "durum";
if (islem === "ac") await ref.set({ acilis: true, acilisBas: Date.now(), updatedAt: Date.now() }, { merge: true });
if (islem === "kapat") await ref.set({ acilis: false, updatedAt: Date.now() }, { merge: true });
const d = (await ref.get()).data() || {};
console.log("Açılış dönemi:", d.acilis ? "AÇIK" : "kapalı", d.acilisBas ? "(başlangıç " + new Date(d.acilisBas).toISOString() + ")" : "");
