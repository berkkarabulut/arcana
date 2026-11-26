// Kulis güvenlik kuralları testi: yükleme öncesi Firestore emülatöründe çalışır; bir senaryo bile tutmazsa yükleme durur.
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, setDoc, getDoc, updateDoc, addDoc, collection, writeBatch, serverTimestamp, query, where, getDocs, increment } from "firebase/firestore";

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
  // ua: Kulis Tam (her şey açık); diğerleri ücretsiz
  await setDoc(doc(d, "users/ua/private/premium"), { active: true, until: Date.now() + 864e5 * 30, tier: "tam" });
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
async function msgAs(d, uid, cid, data, noCount) {
  const b = writeBatch(d);
  b.set(doc(collection(d, "chats", cid, "messages")), { uid, ts: serverTimestamp(), ...data });
  if (!noCount) b.update(doc(d, "chats", cid), { last: "x", lastBy: uid, lastAt: serverTimestamp(), n: increment(1) });
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
await t("Yüklenen gerçek fotoğraf herkese açık profile konamaz (perde arkasında durur)", () => updateDoc(doc(A, "users/ua"), { av: stu("p", "ua") }), false);
await t("Hazır avatar ve kapak kaydedilir", () => updateDoc(doc(A, "users/ua"), { av: "preset:k1", banner: "preset:b2" }), true);
await t("Dışarıdan görsel bağlantısı profil fotoğrafı olamaz", () => updateDoc(doc(A, "users/ua"), { av: "https://kotu.site/x.jpg" }), false);
await t("Başkasının dosyası kapak olamaz", () => updateDoc(doc(A, "users/ua"), { banner: stu("p", "ub") }), false);
await t("Profil görseli kaldırılabilir", () => updateDoc(doc(A, "users/ua"), { av: null }), true);

// ---- Perde ----
const { deleteDoc } = await import("firebase/firestore");
const pd = (d, id) => doc(d, "perde", id);
const perdeNew = (d, by, members, id) => setDoc(pd(d, id || members.join("_")), { members, by, status: "istek", ts: serverTimestamp() });
await t("Açık sohbette perde isteği gönderilir", () => perdeNew(A, "ua", ["ua", "ub"]), true);
await t("Üçüncü kişi perdeyi okuyamaz", () => getDoc(pd(C, "ua_ub")), false);
await t("Karşı taraf perde isteğini okur", () => getDoc(pd(B, "ua_ub")), true);
await t("İsteyen kendi isteğini kabul edemez", () => updateDoc(pd(A, "ua_ub"), { status: "acik", ts: serverTimestamp() }), false);
await t("Üçüncü kişi isteği kabul edemez", () => updateDoc(pd(C, "ua_ub"), { status: "acik", ts: serverTimestamp() }), false);
await t("Karşı taraf perdeyi açar", () => updateDoc(pd(B, "ua_ub"), { status: "acik", ts: serverTimestamp() }), true);
await t("Açık perdede üye listesi değiştirilemez", () => updateDoc(pd(A, "ua_ub"), { members: ["ua", "uc"] }), false);
await t("Kabul edilmemiş sohbette perde isteği reddedilir", () => perdeNew(A, "ua", ["ua", "uc"]), false);
await t("Engelleyen kişiye perde isteği reddedilir", () => perdeNew(A, "ua", ["ua", "ud"]), false);
await t("Başkası adına perde isteği reddedilir", () => setDoc(pd(C, "ua_ub2"), { members: ["ua", "ub"], by: "ua", status: "istek", ts: serverTimestamp() }), false);
await t("Doğrudan açık perde oluşturulamaz", () => setDoc(pd(A, "ua_ux"), { members: ["ua", "ux"], by: "ua", status: "acik", ts: serverTimestamp() }), false);
await t("Üçüncü kişi perdeyi kapatamaz", () => deleteDoc(pd(C, "ua_ub")), false);
await t("Taraflardan biri perdeyi kapatır", () => deleteDoc(pd(B, "ua_ub")), true);
await t("Gerçek fotoğraf yolunu kaydeder", () => setDoc(doc(A, "users/ua/gizli/foto"), { av: "r/ua/abc.jpg", banner: null, ts: serverTimestamp() }), true);
await t("Başkası gerçek fotoğraf yolunu okuyamaz", () => getDoc(doc(B, "users/ua/gizli/foto")), false);
await t("Başkasının klasörü gerçek fotoğraf olamaz", () => setDoc(doc(A, "users/ua/gizli/foto"), { av: "r/ub/abc.jpg" }), false);
await t("Başkası gerçek fotoğraf kaydını değiştiremez", () => setDoc(doc(B, "users/ua/gizli/foto"), { av: null }), false);
await t("Perde bildirimi bırakılabilir", () => {
  const b = writeBatch(B);
  b.set(doc(B, "users/ua/notifs/pn1"), { from: "ub", type: "perde", text: "seninle perdeyi açmak istiyor", ts: serverTimestamp() });
  b.set(rl(B, "ub"), { ntAt: serverTimestamp() }, { merge: true });
  return b.commit();
}, true);

// ---- Moderasyon: konuşma şikâyeti, mesaj silme, ban ----
const { deleteField } = await import("firebase/firestore");
await env.withSecurityRulesDisabled(async c => {
  const d = c.firestore();
  await setDoc(doc(d, "config/mods"), { uids: ["umod"] });
  await setDoc(doc(d, "chats/ua_ub/messages/m1"), { uid: "ub", t: "kötü bir mesaj", ts: 1 });
  await setDoc(doc(d, "chats/ua_ub/messages/m2"), { uid: "ub", t: "", img: "https://x/y.jpg", ts: 2 });
  await setDoc(doc(d, "users/uban"), { n: "banli", g: "Erkek" });
  await setDoc(doc(d, "bans/uban"), { by: "umod", reason: "taciz", ts: 1 });
});
const MOD = ctx("umod"), BAN = ctx("uban");
const modDel = { t: "", mod: true, img: deleteField(), aud: deleteField(), dur: deleteField() };
await t("Konuşma şikâyeti sohbet ve mesaj bilgisiyle gönderilir", () => addDoc(collection(A, "reports"), { by: "ua", key: "k:ub", reason: "Tehdit veya şantaj", preview: "x", status: "bekliyor", ts: serverTimestamp(), target: "ub", cid: "ua_ub", mids: ["m1", "m2"], msgs: [{ w: "b", t: "selam", ts: 1 }, { w: "k", t: "kötü", ts: 2, id: "m1" }, { w: "k", t: "", img: "https://x/y.jpg", ts: 3, id: "m2" }] }), true);
await t("Şikâyette 30'dan fazla mesaj kaydı reddedilir", () => addDoc(collection(A, "reports"), { by: "ua", key: "k:ub", reason: "Diğer", status: "bekliyor", ts: serverTimestamp(), msgs: Array.from({ length: 31 }, (_, i) => ({ w: "k", t: "m" + i })) }), false);
await t("Şikâyete bilinmeyen alan eklenemez", () => addDoc(collection(A, "reports"), { by: "ua", key: "k:ub", reason: "Diğer", status: "bekliyor", ts: serverTimestamp(), hack: 1 }), false);
await t("Şikâyet sonuçlanmış olarak gönderilemez", () => addDoc(collection(A, "reports"), { by: "ua", key: "k:ub", reason: "Diğer", status: "kaldirildi", ts: serverTimestamp() }), false);
let rep; await env.withSecurityRulesDisabled(async c => { rep = await addDoc(collection(c.firestore(), "reports"), { by: "ua", key: "k:ub", reason: "Diğer", status: "bekliyor", ts: 1 }); });
await t("Sıradan üye şikâyetleri okuyamaz", () => getDocs(collection(A, "reports")), false);
await t("Moderatör şikâyetleri okur", () => getDocs(collection(MOD, "reports")), true);
await t("Sıradan üye şikâyeti sonuçlandıramaz", () => updateDoc(doc(A, "reports", rep.id), { status: "yoksayildi" }), false);
await t("Moderatör şikâyeti sonuçlandırır", () => updateDoc(doc(MOD, "reports", rep.id), { status: "banlandi", doneBy: "umod", doneAt: serverTimestamp() }), true);
await t("Sıradan üye mesajı 'moderatör sildi' yapamaz", () => updateDoc(doc(A, "chats/ua_ub/messages/m1"), modDel), false);
await t("Moderatör mesaj metnini başka bir şeyle değiştiremez", () => updateDoc(doc(MOD, "chats/ua_ub/messages/m1"), { t: "değiştirildi", mod: true }), false);
await t("Moderatör bildirilen yazılı mesajı siler", () => updateDoc(doc(MOD, "chats/ua_ub/messages/m1"), modDel), true);
await t("Moderatör bildirilen fotoğraflı mesajı siler", () => updateDoc(doc(MOD, "chats/ua_ub/messages/m2"), modDel), true);
await t("Mesaj tamamen silinemez", () => deleteDoc(doc(MOD, "chats/ua_ub/messages/m1")), false);
await t("Kimse ban kaydını elle yazamaz (moderatör de)", () => setDoc(doc(MOD, "bans/ub"), { by: "umod" }), false);
await t("Kendini bandan çıkaramaz", () => deleteDoc(doc(BAN, "bans/uban")), false);
await t("Banlı kişi kendi ban kaydını görür", () => getDoc(doc(BAN, "bans/uban")), true);
await t("Banlı kişi profilleri okuyamaz", () => getDoc(doc(BAN, "users/ua")), false);
await t("Banlı kişi ayar bile yazamaz", () => setDoc(doc(BAN, "users/uban/settings/main"), { quiet: true }, { merge: true }), false);
await t("Banlı kişi şikâyet gönderemez", () => addDoc(collection(BAN, "reports"), { by: "uban", key: "u:ua", reason: "Diğer", status: "bekliyor", ts: serverTimestamp() }), false);
await t("Moderatör ban listesini görür", () => getDocs(collection(MOD, "bans")), true);
await t("Sıradan üye ban listesini göremez", () => getDocs(collection(A, "bans")), false);

// ---- Kulis Ekibi yazışması ----
const ADM_ = ctx("uadmin");
const ekipYaz = (d, from, uid, staff, role, t = "Merhaba, şikâyetin hakkında yazıyoruz") => {
  const b = writeBatch(d), m = { from, staff, t, ts: serverTimestamp() }; if (role) m.role = role;
  b.set(doc(collection(d, "ekip", uid, "m")), m);
  b.set(doc(d, "ekip", uid), { uid, last: t.slice(0, 120), lastAt: serverTimestamp(), lastBy: from, lastStaff: staff, staffUnread: !staff, userUnread: staff }, { merge: true });
  if (!staff) b.set(rl(d, from), { msgAt: serverTimestamp() }, { merge: true });
  return b.commit();
};
await t("Kullanıcı ekip yazışmasını kendisi başlatamaz", () => ekipYaz(C, "uc", "uc", false), false);
await t("Sıradan üye başkasına ekip olarak yazamaz", () => ekipYaz(C, "uc", "ub", true, "Moderatör"), false);
await t("Moderatör kendini yönetici gösteremez", () => ekipYaz(MOD, "umod", "ub", true, "Yönetici"), false);
await t("Moderatör kullanıcıya ekip mesajı atar", () => ekipYaz(MOD, "umod", "ub", true, "Moderatör"), true);
await t("Yönetici kullanıcıya ekip mesajı atar", () => ekipYaz(ADM_, "uadmin", "uc", true, "Yönetici"), true);
await t("Kullanıcı kendi ekip yazışmasını okur", () => getDocs(collection(B, "ekip/ub/m")), true);
await t("Başkası ekip yazışmasını okuyamaz", () => getDocs(collection(C, "ekip/ub/m")), false);
await wait(1200);
await t("Kullanıcı ekibe cevap verir", () => ekipYaz(B, "ub", "ub", false), true);
await wait(1200);
await t("Kullanıcı cevabını ekip mesajı gibi gösteremez", () => ekipYaz(B, "ub", "ub", true, "Moderatör"), false);
await t("Ekip mesajı sonradan değiştirilemez", async () => { const l = await getDocs(collection(MOD, "ekip/ub/m")); return updateDoc(l.docs[0].ref, { t: "değişti" }); }, false);
await t("Moderatör bütün yazışmaları listeler", () => getDocs(collection(MOD, "ekip")), true);
await t("Sıradan üye yazışma listesini göremez", () => getDocs(collection(A, "ekip")), false);
await t("Kullanıcı okundu işaretler", () => updateDoc(doc(B, "ekip/ub"), { userUnread: false }), true);

// ---- Premium sunucuda: mesaj sınırı ve arama paketleri ----
const E = ctx("ue"), F = ctx("uf");
await env.withSecurityRulesDisabled(async c => {
  const d = c.firestore();
  await setDoc(doc(d, "users/ue"), { n: "teste", g: "Erkek" }); await setDoc(doc(d, "users/uf"), { n: "testf", g: "Kadın" });
  await setDoc(doc(d, "chats/ue_uf"), { members: ["ue", "uf"], status: "open", reqBy: "ue", n: 19 });
  await setDoc(doc(d, "chats/ua_ue"), { members: ["ua", "ue"], status: "open", reqBy: "ua", n: 40 });
});
await t("Ücretsiz üye 20. mesajını gönderir", () => msgAs(E, "ue", "ue_uf", { t: "20. mesaj" }), true);
await wait(1200);
await t("Ücretsiz üye 21. mesajı gönderemez (premium gerekir)", () => msgAs(E, "ue", "ue_uf", { t: "21. mesaj" }), false);
await t("Sayaç artırmadan mesaj atılamaz (sınırı atlatma denemesi)", () => msgAs(E, "ue", "ue_uf", { t: "hile" }, true), false);
await t("Sayaç geri alınamaz", () => updateDoc(doc(E, "chats/ue_uf"), { n: 0 }), false);
await wait(1200);
await t("Premium üye 41. mesajı da gönderir", () => msgAs(A, "ua", "ua_ue", { t: "premium mesaj" }), true);
await t("Ücretsiz üye sesli arama başlatamaz", () => callAs(E, "ue", "uf"), false);
await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), "users/ue/private/premium"), { active: true, until: Date.now() + 864e5, tier: "sohbet" }); });
await t("Sohbet paketi sesli arama başlatamaz", () => callAs(E, "ue", "uf"), false);
await wait(1200);
await t("Sohbet paketi 21. mesajı gönderir", () => msgAs(E, "ue", "ue_uf", { t: "artık premium" }), true);
await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), "users/ue/private/premium"), { active: true, until: Date.now() + 864e5, tier: "ses" }); });
await t("Ses paketi görüntülü arama başlatamaz", () => callAs(E, "ue", "uf", "video"), false);
await t("Ses paketi sesli arama başlatır", () => callAs(E, "ue", "uf"), true);
await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), "users/uf/private/premium"), { active: true, until: Date.now() - 1000, tier: "tam" }); });
await t("Süresi dolmuş premium arama başlatamaz", () => callAs(F, "uf", "ue"), false);
await t("Kullanıcı kendine premium yazamaz", () => setDoc(doc(F, "users/uf/private/premium"), { active: true, until: Date.now() + 864e5, tier: "tam" }), false);

// ---- Yeni: kimler yazabilir, yazıyor/görüldü, yoruma cevap, kaydetme, doğrulama rozeti ----
const G = ctx("ug"), H = ctx("uh"), I = ctx("ui");
await env.withSecurityRulesDisabled(async c => { const d = c.firestore();
  for (const u of ["ug", "uh", "ui"]) await setDoc(doc(d, "users", u), { n: "test" + u, g: "Erkek" });
  await setDoc(doc(d, "users/uh/settings/main"), { dm: "kimse" });
  await setDoc(doc(d, "users/ui/settings/main"), { dm: "eslesme" });
  await setDoc(doc(d, "chats/ug_ui"), { members: ["ug", "ui"], status: "open", reqBy: "ug" });
  await setDoc(doc(d, "posts/pz"), { uid: "ug", t: "deneme itirafı uzun uzun", cat: "ask", r: { bende: 0, saril: 0, yok: 0 }, cm: 0 });
});
async function istek(d, from, to) {
  const cid = [from, to].sort().join("_"), b = writeBatch(d);
  b.set(doc(d, "chats", cid), { members: [from, to].sort(), reqBy: from, status: "wait", match: false, from: null, last: "selam", lastBy: from, lastAt: serverTimestamp() });
  b.set(rl(d, from), { chAt: serverTimestamp(), msgAt: serverTimestamp() }, { merge: true });
  return b.commit();
}
await t("Mesaj kabul etmeyen (kimse) kişiye istek reddedilir", () => istek(G, "ug", "uh"), false);
await env.withSecurityRulesDisabled(async c => { await setDoc(doc(c.firestore(), "users/ug/meta/rl"), {}); });
await t("Sadece eşleşmelere açık kişiye istek reddedilir", () => istek(H, "uh", "ui"), false);
await t("Ayar: dm değeri sadece herkes/eslesme/kimse olabilir", () => setDoc(doc(G, "users/ug/settings/main"), { dm: "bazen" }, { merge: true }), false);
await t("Ayar: kimler yazabilir kaydedilir", () => setDoc(doc(G, "users/ug/settings/main"), { dm: "eslesme", okundu: false, yaziyor: true }, { merge: true }), true);
await t("Ayar: itiraflar Google'da çıkmasın seçilebilir", () => setDoc(doc(G, "users/ug/settings/main"), { seo: false }, { merge: true }), true);
await t("Ayar: son görülme gizlenebilir", () => setDoc(doc(G, "users/ug/settings/main"), { songor: false }, { merge: true }), true);
await t("Ayar: son görülme sadece doğru/yanlış olabilir", () => setDoc(doc(G, "users/ug/settings/main"), { songor: "gizli" }, { merge: true }), false);
await t("Ayar: okundu sadece doğru/yanlış olabilir", () => setDoc(doc(G, "users/ug/settings/main"), { okundu: "evet" }, { merge: true }), false);
await t("Yazıyor: kendi alanını yazar", () => updateDoc(doc(G, "chats/ug_ui"), { "ty.ug": Date.now() }), true);
await t("Görüldü: kendi alanını yazar", () => updateDoc(doc(I, "chats/ug_ui"), { "seen.ui": Date.now() }), true);
await t("Görüldü: karşı tarafın alanını yazamaz", () => updateDoc(doc(G, "chats/ug_ui"), { "seen.ui": Date.now() }), false);
await t("Yazıyor: sayı olmayan değer reddedilir", () => updateDoc(doc(G, "chats/ug_ui"), { "ty.ug": "x" }), false);
await t("Sohbet dışından yazıyor yazılamaz", () => updateDoc(doc(H, "chats/ug_ui"), { "ty.uh": Date.now() }), false);
async function yorumAs(d, uid, extra) {
  const b = writeBatch(d);
  b.set(doc(collection(d, "posts/pz/comments")), { uid, t: "cevap yorumu", ts: serverTimestamp(), ...extra });
  b.set(rl(d, uid), { cmAt: serverTimestamp() }, { merge: true });
  return b.commit();
}
await t("Yoruma cevap verilir", () => yorumAs(H, "uh", { re: { id: "c1", n: "testug" } }), true);
await t("Cevapta fazladan alan reddedilir", () => yorumAs(I, "ui", { re: { id: "c1", n: "testug", uid: "ug" } }), false);
await t("İtiraf kaydedilir", () => setDoc(doc(G, "users/ug/kayit/pz"), { ts: serverTimestamp() }), true);
await t("Kayıtlı itiraflar okunur", () => getDoc(doc(G, "users/ug/kayit/pz")), true);
await t("Başkasının kayıtlarını okuyamaz", () => getDoc(doc(H, "users/ug/kayit/pz")), false);
await t("Başkası adına kayıt eklenemez", () => setDoc(doc(H, "users/ug/kayit/pz"), { ts: serverTimestamp() }), false);
await t("Üye günlük istatistiği okuyamaz", () => getDoc(doc(G, "istatistik/2026-11-24")), false);
await t("Kimse istatistik yazamaz", () => setDoc(doc(G, "istatistik/2026-11-24"), { misafir: 999 }), false);
await t("Kullanıcı kendine doğrulama rozeti veremez", () => updateDoc(doc(G, "users/ug"), { dg: true }), false);
await t("Moderatör doğrulama rozeti verir", () => updateDoc(doc(ctx("umod"), "users/ug"), { dg: true }), true);
await t("Moderatör rozetle birlikte başka alan değiştiremez", () => updateDoc(doc(ctx("umod"), "users/ug"), { dg: false, n: "hacklendi" }), false);

// ---- Yeni özellikler: ziyaret, anonim soru, seri, doğrulama, mesaj tepkisi/alıntısı, kredi ----
await env.withSecurityRulesDisabled(async c => {
  const d = c.firestore();
  await setDoc(doc(d, "users/ub/sorular/s1"), { t: "en sevdiğin şarkı?", ts: 1 });
  await setDoc(doc(d, "chats/ua_ub/messages/mt"), { uid: "ub", t: "tepki bekleyen", ts: 3 });
  await setDoc(doc(d, "dogrulama/uc"), { path: "v/uc/a.jpg", poz: "iki parmak", ts: 1, durum: "bekliyor" });
});
await t("Profil ziyareti iz bırakır", () => setDoc(doc(A, "users/ub/ziyaret/ua"), { ts: serverTimestamp() }), true);
await t("Profil sahibi ziyaretçilerini okur", () => getDoc(doc(B, "users/ub/ziyaret/ua")), true);
await t("Başkasının ziyaretçileri okunamaz", () => getDoc(doc(C, "users/ub/ziyaret/ua")), false);
await t("Başkası adına ziyaret yazılamaz", () => setDoc(doc(C, "users/ub/ziyaret/ua"), { ts: serverTimestamp() }), false);
await t("Ziyarete fazladan bilgi eklenemez", () => setDoc(doc(C, "users/ub/ziyaret/uc"), { ts: serverTimestamp(), n: "sahte" }), false);
await t("Engelleyenin profiline iz bırakılamaz", () => setDoc(doc(A, "users/ud/ziyaret/ua"), { ts: serverTimestamp() }), false);
await t("Ziyaret ayarı (iz) kaydedilir", () => setDoc(doc(A, "users/ua/settings/main"), { iz: false, soru: true }, { merge: true }), true);
await t("Kimse başkasına elle anonim soru yazamaz", () => setDoc(doc(A, "users/ub/sorular/s2"), { t: "sahte", ts: 1 }), false);
await t("Soru sahibi sorularını okur", () => getDoc(doc(B, "users/ub/sorular/s1")), true);
await t("Başkası soruları okuyamaz", () => getDoc(doc(A, "users/ub/sorular/s1")), false);
await t("Soru sahibi cevaplandı işaretler", () => updateDoc(doc(B, "users/ub/sorular/s1"), { cevap: true, pid: "abcdefghij12" }), true);
await t("Soru metni sonradan değiştirilemez", () => updateDoc(doc(B, "users/ub/sorular/s1"), { t: "değişti" }), false);
const bugun = new Date().toISOString().slice(0, 10);
await t("Seri kaydedilir", () => setDoc(doc(A, "seriler/ua"), { gun: bugun, n: 3, en: 5, ts: serverTimestamp() }), true);
await t("Başkasının serisi yazılamaz", () => setDoc(doc(C, "seriler/ua"), { gun: bugun, n: 99, en: 99, ts: serverTimestamp() }), false);
await t("Seri en uzun seriden büyük olamaz", () => setDoc(doc(A, "seriler/ua"), { gun: bugun, n: 9, en: 5, ts: serverTimestamp() }), false);
await t("Doğrulama başvurusu açılır", () => setDoc(doc(A, "dogrulama/ua"), { path: "v/ua/s.jpg", poz: "başparmak yukarı", ts: serverTimestamp(), durum: "bekliyor" }), true);
await t("Kişi kendi başvurusunu onaylayamaz", () => updateDoc(doc(A, "dogrulama/ua"), { durum: "onay", by: "ua", sts: serverTimestamp() }), false);
await t("Başkasının selfie yolu reddedilir", () => setDoc(doc(B, "dogrulama/ub"), { path: "v/ua/s.jpg", poz: "x yap", ts: serverTimestamp(), durum: "bekliyor" }), false);
await t("Moderatör başvuruları okur", () => getDoc(doc(MOD, "dogrulama/uc")), true);
await t("Başkası başvuruyu okuyamaz", () => getDoc(doc(B, "dogrulama/uc")), false);
await t("Moderatör başvuruyu onaylar", () => updateDoc(doc(MOD, "dogrulama/uc"), { durum: "onay", by: "umod", sts: serverTimestamp() }), true);
await t("Mesaja emoji tepkisi konur", () => updateDoc(doc(A, "chats/ua_ub/messages/mt"), { "tp.ua": "❤️" }), true);
await t("Listede olmayan tepki reddedilir", () => updateDoc(doc(A, "chats/ua_ub/messages/mt"), { "tp.ua": "💩" }), false);
await t("Başkası adına tepki konamaz", () => updateDoc(doc(A, "chats/ua_ub/messages/mt"), { "tp.ub": "😂" }), false);
await t("Tepkiyle birlikte metin değiştirilemez", () => updateDoc(doc(A, "chats/ua_ub/messages/mt"), { "tp.ua": "😂", t: "değişti" }), false);
await t("Sohbet dışındaki kişi tepki koyamaz", () => updateDoc(doc(C, "chats/ua_ub/messages/mt"), { "tp.uc": "😂" }), false);
await wait(1300);
await t("Alıntılı cevap gönderilir", () => msgAs(B, "ub", "ua_ub", { t: "aynen", re: { id: "mt", t: "tepki bekleyen", u: "ub" } }), true);
await wait(1300);
await t("Alıntıda fazladan alan reddedilir", () => msgAs(B, "ub", "ua_ub", { t: "x", re: { id: "mt", t: "y", u: "ub", hack: 1 } }), false);
await t("GIF mesajı gönderilir", () => msgAs(B, "ub", "ua_ub", { t: "", g: "l0MYt5jPR6QX5pnqM" }), true);
await t("Geçersiz GIF kimliği reddedilir", () => msgAs(B, "ub", "ua_ub", { t: "", g: "../evil.gif" }), false);
await t("GIF kimliği adres olamaz", () => msgAs(B, "ub", "ua_ub", { t: "", g: "https://x.com/a" }), false);
await t("Kişi kendine kredi yazamaz", () => setDoc(doc(A, "users/ua/private/kredi"), { oneCikar: 99 }), false);
await t("Kişi kendi kredisini okur", () => getDoc(doc(A, "users/ua/private/kredi")), true);
await t("Üye itirafını kendisi öne çıkaramaz (sunucu yapar)", () => updateDoc(doc(A, "posts/pz"), { feat: Date.now() + 864e5 }), false);

await env.cleanup();
console.log(fail ? `\n${fail} senaryo TUTMADI, yükleme durduruldu.` : "\nTüm senaryolar tamam.");
process.exit(fail ? 1 : 0);
