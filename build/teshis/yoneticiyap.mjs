// "theprofessi0nal" takma adlı üyeyi yönetici yapar (tek eşleşme varsa)
import admin from "firebase-admin";
admin.initializeApp({ projectId: "kulis-1647d" });
const db = admin.firestore();
const AD = "theprofessi0nal";
const us = await db.collection("users").get();
const hedef = us.docs.filter(d => String(d.data().n || "").trim().toLocaleLowerCase("tr") === AD);
const benzer = us.docs.filter(d => String(d.data().n || "").toLocaleLowerCase("tr").includes("profess")).map(d => d.data().n);
console.log("tam eşleşme:", hedef.length, "| benzer adlar:", JSON.stringify(benzer));
if (hedef.length !== 1) { console.log("YAPILMADI: tek bir hesap bulunamadı"); process.exit(0); }
const uid = hedef[0].id;
await db.doc("config/admins").set({ uids: admin.firestore.FieldValue.arrayUnion(uid) }, { merge: true });
const a = (await db.doc("config/admins").get()).data().uids || [];
console.log("YAPILDI:", AD, "yönetici oldu | toplam yönetici:", a.length, "| listede:", a.includes(uid));
