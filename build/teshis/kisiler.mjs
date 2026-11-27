// Gerçek kişi sayıları: üyeler gün gün, bugün aktif olanlar, itiraf yazanlar (kişisel bilgi basmaz)
import admin from "firebase-admin";
admin.initializeApp({ projectId: "kulis-1647d" });
const db = admin.firestore();
const gun = ms => new Date(ms + 3 * 3600e3).toISOString().slice(0, 10);
const bugun = gun(Date.now());
const U = (await db.collection("users").get()).docs.filter(d => d.id !== "kulismoderator").map(d => d.data());
const k = {}; U.forEach(u => { const g = u.createdAt ? gun(u.createdAt.toMillis()) : "?"; k[g] = (k[g] || 0) + 1; });
console.log("TOPLAM ÜYE:", U.length, "| kadın:", U.filter(u => u.g === "k").length, "| erkek:", U.filter(u => u.g === "e").length);
console.log("GÜN GÜN YENİ ÜYE:", Object.entries(k).sort().slice(-7).map(([g, n]) => g + ": " + n).join(" | "));
console.log("BUGÜN SİTEYE GİREN ÜYE:", U.filter(u => u.lastSeen && gun(u.lastSeen.toMillis()) === bugun).length, "| son 1 saatte:", U.filter(u => u.lastSeen && Date.now() - u.lastSeen.toMillis() < 3600e3).length);
const P = (await db.collection("posts").get()).docs.map(d => d.data()).filter(p => p.uid !== "kulismoderator");
console.log("ÜYE İTİRAFI:", P.length, "| yazan kişi:", new Set(P.map(p => p.uid)).size);
const C = await db.collection("chats").get(); console.log("SOHBET SAYISI:", C.size);
