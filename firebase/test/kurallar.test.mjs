// Kulis güvenlik kuralları testi: yükleme öncesi Firestore emülatöründe çalışır; bir senaryo bile tutmazsa yükleme durur.
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, setDoc, getDoc, updateDoc, addDoc, collection, writeBatch, serverTimestamp, query, where, getDocs } from "firebase/firestore";

const env = await initializeTestEnvironment({ projectId: "demo-kulis", firestore: { rules: readFileSync("firebase/firestore.rules", "utf8") } });
const ctx = uid => env.authenticatedContext(uid, { email_verified: true }).firestore();
const A = ctx("ua"), B = ctx("ub"), C = ctx("uc"), D = ctx("ud");
const anon = env.authenticatedContext("ux", { email_verified: false }).firestore();

await env.withSecurityRulesDisabled(async c => {
  const d = c.firestore();
  for (const [u, g] of [["ua", "Kadın"], ["ub", "Erkek"], ["uc", "Erkek"], ["ud", "Erkek"]]) await setDoc(doc(d, "users", u), { n: "test" + u, g });
  await setDoc(doc(d, "chats/ua_ub"), { members: ["ua", "ub"], status: "open", reqBy: "ua" });
  await setDoc(doc(d, "chats/ua_uc"), { members: ["ua", "uc"], status: "wait", reqBy: "ua" });
  await setDoc(doc(d, "chats/ua_ud"), { members: ["ua", "ud"], status: "open", reqBy: "ua" });
  await setDoc(doc(d, "users/ud/blocks/ua"), { ts: 1 });
  await setDoc(doc(d, "users/ub/settings/main"), { callVideo: false });
  await setDoc(doc(d, "accessLogs/x"), { uid: "ua", ip: "1.2.3.4" });
  await setDoc(doc(d, "config/admins"), { uids: ["uadmin"] });
});

const rl = (d, uid) => doc(d, "users", uid, "meta", "rl");
async function callAs(d, from, to, type = "voice", extra = {}) {
  const ref = doc(collection(d, "calls")), b = writeBatch(d);
  b.set(ref, { from, to, members: [from, to], type, status: "ring", offer: { type: "offer", sdp: "v=0" }, ts: serverTimestamp(), ...extra });
  b.set(rl(d, from), { callAt: serverTimestamp() }, { merge: true });
  await b.commit();
  return ref;
}
let fail = 0;
async function t(name, fn, ok) {
  try { await (ok ? assertSucceeds(fn()) : assertFails(fn())); console.log("OK   " + name); }
  catch (e) { fail++; console.log("HATA " + name + " -> " + (e && e.message)); }
}

// ---- Arama ----
await t("Kabul edilmemiş sohbette arama reddedilir", () => callAs(A, "ua", "uc"), false);
await t("Engelleyen kişiyi arama reddedilir", () => callAs(A, "ua", "ud"), false);
await t("Görüntülüyü kapatmış kişiyi görüntülü arama reddedilir", () => callAs(A, "ua", "ub", "video"), false);
await t("Başkası adına arama reddedilir", () => callAs(C, "ua", "ub"), false);
await t("Doğrulanmamış hesap arayamaz", () => callAs(anon, "ux", "ub"), false);
await t("Fazladan alan reddedilir", () => callAs(A, "ua", "ub", "voice", { hack: 1 }), false);
let ref;
await t("Açık sohbette sesli arama başlar", async () => { ref = await callAs(A, "ua", "ub"); }, true);
await t("10 saniye dolmadan yeni arama reddedilir", () => callAs(A, "ua", "ub"), false);
await t("Arayan aramayı okur", () => getDoc(doc(A, "calls", ref.id)), true);
await t("Aranan aramayı okur", () => getDoc(doc(B, "calls", ref.id)), true);
await t("Üçüncü kişi aramayı okuyamaz", () => getDoc(doc(C, "calls", ref.id)), false);
await t("Aranan gelen aramaları listeler", () => getDocs(query(collection(B, "calls"), where("to", "==", "ub"), where("status", "==", "ring"))), true);
await t("Başkasının gelen aramaları listelenemez", () => getDocs(query(collection(C, "calls"), where("to", "==", "ub"))), false);
await t("Arayan kendi aramasını 'kabul' edemez", () => updateDoc(doc(A, "calls", ref.id), { status: "accept" }), false);
await t("Arayan cevap (answer) yazamaz", () => updateDoc(doc(A, "calls", ref.id), { answer: { type: "answer", sdp: "x" } }), false);
await t("Aranan 'cevapsız' işaretleyemez", () => updateDoc(doc(B, "calls", ref.id), { status: "miss" }), false);
await t("Arama türü sonradan değiştirilemez", () => updateDoc(doc(B, "calls", ref.id), { type: "video" }), false);
await t("Arayan bağlantı adayı (fc) ekler", () => addDoc(collection(A, "calls", ref.id, "fc"), { c: "{\"candidate\":\"x\"}" }), true);
await t("Arayan aranan tarafın adaylarına (tc) yazamaz", () => addDoc(collection(A, "calls", ref.id, "tc"), { c: "{}x" }), false);
await t("Üçüncü kişi aday ekleyemez", () => addDoc(collection(C, "calls", ref.id, "fc"), { c: "{}x" }), false);
await t("Aranan cevap verip kabul eder", () => updateDoc(doc(B, "calls", ref.id), { status: "accept", answer: { type: "answer", sdp: "x" } }), true);
await t("Aranan bağlantı adayı (tc) ekler", () => addDoc(collection(B, "calls", ref.id, "tc"), { c: "{\"candidate\":\"y\"}" }), true);
await t("Üçüncü kişi adayları okuyamaz", () => getDocs(collection(C, "calls", ref.id, "fc")), false);
await t("Aranan adayları okur", () => getDocs(collection(B, "calls", ref.id, "fc")), true);
await t("İki taraftan biri aramayı bitirir", () => updateDoc(doc(A, "calls", ref.id), { status: "end" }), true);
await t("Arama silinemez", async () => { const { deleteDoc } = await import("firebase/firestore"); return deleteDoc(doc(A, "calls", ref.id)); }, false);

// ---- Ayarlar ----
await t("Kendi ayarlarını kaydeder", () => setDoc(doc(A, "users/ua/settings/main"), { n: { dm: false, call: true }, quiet: true, qFrom: 23, qTo: 8, callVoice: false, updatedAt: serverTimestamp() }, { merge: true }), true);
await t("Başkasının ayarlarını değiştiremez", () => setDoc(doc(C, "users/ua/settings/main"), { callVoice: true }, { merge: true }), false);
await t("Ayarlara bilinmeyen alan yazılamaz", () => setDoc(doc(A, "users/ua/settings/main"), { admin: true }, { merge: true }), false);
await t("Sessiz saat 0-23 dışında olamaz", () => setDoc(doc(A, "users/ua/settings/main"), { qFrom: 30 }, { merge: true }), false);
await t("Arayan taraf karşının arama iznini okuyabilir", () => getDoc(doc(B, "users/ua/settings/main")), true);
await t("Sesli aramayı kapatan kişi sesli aranamaz", () => callAs(B, "ub", "ua"), false);

// ---- Bildirim, kayıt ----
await t("Cevapsız arama bildirimi bırakılabilir", () => {
  const b = writeBatch(A);
  b.set(doc(collection(A, "users/ub/notifs")), { from: "ua", type: "call", text: "seni sesli aradı", go: null, read: false, ts: serverTimestamp() });
  b.set(rl(A, "ua"), { ntAt: serverTimestamp() }, { merge: true });
  return b.commit();
}, true);
await t("Bilinmeyen bildirim türü reddedilir", () => {
  const b = writeBatch(A);
  b.set(doc(collection(A, "users/ub/notifs")), { from: "ua", type: "hack", text: "x", go: null, read: false, ts: serverTimestamp() });
  b.set(rl(A, "ua"), { ntAt: serverTimestamp() }, { merge: true });
  return b.commit();
}, false);
await t("5651 erişim kayıtları okunamaz", () => getDoc(doc(A, "accessLogs/x")), false);
await t("5651 erişim kaydı elle yazılamaz", () => setDoc(doc(A, "accessLogs/y"), { uid: "ua" }), false);
await t("Premium kendine verilemez", () => setDoc(doc(A, "users/ua/private/premium"), { active: true, until: 9e15 }), false);
await t("Öne çıkarma sıradan üyede reddedilir", async () => {
  await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), "posts/p1"), { uid: "ua", t: "deneme itirafı uzun metin", cat: "kimse" }));
  return updateDoc(doc(A, "posts/p1"), { feat: Date.now() + 864e5 });
}, false);

// ---- Fotoğraf / sesli mesaj ve profil görselleri ----
const ST = "https://firebasestorage.googleapis.com/v0/b/kulis-1647d.firebasestorage.app/o/";
const stu = (dir, uid) => `${ST}${dir}%2F${uid}%2Fabc123.jpg?alt=media&token=0f3a9c1e-1111-4a2b-9c3d-abcdef012345`;
const wait = ms => new Promise(r => setTimeout(r, ms));
async function msgAs(d, uid, cid, data) {
  const b = writeBatch(d);
  b.set(doc(collection(d, "chats", cid, "messages")), { uid, ts: serverTimestamp(), ...data });
  b.set(rl(d, uid), { msgAt: serverTimestamp() }, { merge: true });
  await b.commit();
}
await wait(1200);
await t("Yazılı mesaj gönderilir", () => msgAs(A, "ua", "ua_ub", { t: "selam" }), true);
await wait(1200);
await t("Fotoğraflı mesaj gönderilir", () => msgAs(A, "ua", "ua_ub", { t: "", img: stu("m", "ua") }), true);
await wait(1200);
await t("Sesli mesaj gönderilir", () => msgAs(A, "ua", "ua_ub", { t: "", aud: stu("m", "ua"), dur: 7 }), true);
await wait(1200);
await t("Boş mesaj reddedilir", () => msgAs(A, "ua", "ua_ub", { t: "" }), false);
await t("Başka sitedeki görsel reddedilir", () => msgAs(A, "ua", "ua_ub", { t: "", img: "https://kotu.site/x.jpg" }), false);
await t("Başkasının klasöründeki dosya reddedilir", () => msgAs(A, "ua", "ua_ub", { t: "", img: stu("m", "ub") }), false);
await t("2 dakikadan uzun ses reddedilir", () => msgAs(A, "ua", "ua_ub", { t: "", aud: stu("m", "ua"), dur: 500 }), false);
await t("Mesaja bilinmeyen alan eklenemez", () => msgAs(A, "ua", "ua_ub", { t: "x", hack: 1 }), false);
await t("Kendi yüklediği profil fotoğrafını kaydeder", () => updateDoc(doc(A, "users/ua"), { av: stu("p", "ua") }), true);
await t("Hazır avatar ve kapak kaydedilir", () => updateDoc(doc(A, "users/ua"), { av: "preset:k1", banner: "preset:b2" }), true);
await t("Dışarıdan görsel bağlantısı profil fotoğrafı olamaz", () => updateDoc(doc(A, "users/ua"), { av: "https://kotu.site/x.jpg" }), false);
await t("Başkasının dosyası kapak olamaz", () => updateDoc(doc(A, "users/ua"), { banner: stu("p", "ub") }), false);
await t("Profil görseli kaldırılabilir", () => updateDoc(doc(A, "users/ua"), { av: null }), true);

await env.cleanup();
console.log(fail ? `\n${fail} senaryo TUTMADI, yükleme durduruldu.` : "\nTüm senaryolar tamam.");
process.exit(fail ? 1 : 0);
