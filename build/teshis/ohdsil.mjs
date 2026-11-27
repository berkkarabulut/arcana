// "ohd" takma adlı üyenin itiraflarını (kendi adıyla ve anonim) alt koleksiyonlarıyla siler
import admin from "firebase-admin";
admin.initializeApp({ projectId: "kulis-1647d" });
const db = admin.firestore();
const us = await db.collection("users").get();
const hedef = us.docs.filter(d => String(d.data().n || "").toLocaleLowerCase("tr") === "ohd");
let sil = 0;
for (const u of hedef) {
  const ids = (await db.collection("posts").where("uid", "==", u.id).get()).docs.map(d => d.id);
  (await db.collection(`users/${u.id}/anon`).get()).docs.forEach(d => ids.push(d.id));
  for (const id of ids) {
    const r = db.doc(`posts/${id}`);
    if (!(await r.get()).exists) continue;
    await db.recursiveDelete(r);
    await db.doc(`anonOwners/${id}`).delete().catch(() => {});
    await db.doc(`users/${u.id}/anon/${id}`).delete().catch(() => {});
    console.log("silindi:", id); sil++;
  }
}
console.log("Toplam silinen:", sil, "| sitede kalan itiraf:", (await db.collection("posts").count().get()).data().count);
