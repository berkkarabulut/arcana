// "ohd" takma adlı üyenin itiraflarını listeler (silmez)
import admin from "firebase-admin";
admin.initializeApp({ projectId: "kulis-1647d" });
const db = admin.firestore();
const us = await db.collection("users").get();
const hedef = us.docs.filter(d => String(d.data().n || "").toLocaleLowerCase("tr") === "ohd");
console.log("ohd hesabı:", hedef.length);
for (const u of hedef) {
  const p = await db.collection("posts").where("uid", "==", u.id).get();
  const a = await db.collection(`users/${u.id}/anon`).get();
  console.log(`uid ${u.id.slice(0, 6)}… | kendi adıyla ${p.size} itiraf | anonim ${a.size} itiraf`);
  p.docs.forEach(d => { const v = d.data(); console.log(" -", d.id, v.ts && v.ts.toDate().toISOString().slice(0, 16), "|", String(v.t || "").replace(/\s+/g, " ").slice(0, 70)); });
  for (const x of a.docs) { const d = await db.doc(`posts/${x.id}`).get(); if (d.exists) { const v = d.data(); console.log(" - (anonim)", d.id, v.ts && v.ts.toDate().toISOString().slice(0, 16), "|", String(v.t || "").replace(/\s+/g, " ").slice(0, 70)); } }
}
const toplam = await db.collection("posts").count().get();
console.log("Sitedeki toplam itiraf:", toplam.data().count);
