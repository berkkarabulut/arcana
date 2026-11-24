// Anlık durum (çevrimiçi / yazıyor) kuralları testi: Realtime Database emülatöründe çalışır; tutmazsa yükleme durur.
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { ref, set, get, remove, serverTimestamp } from "firebase/database";

const env = await initializeTestEnvironment({ projectId: "demo-kulis", database: { rules: readFileSync("firebase/database.rules.json", "utf8") } });
const db = (uid, ver = true) => env.authenticatedContext(uid, { email_verified: ver }).database();
const A = db("ua"), B = db("ub"), C = db("uc"), X = db("ux", false), Z = env.unauthenticatedContext().database();
let fail = 0;
async function t(name, fn, ok) {
  try { await (ok ? assertSucceeds(fn()) : assertFails(fn())); console.log("OK   " + name); }
  catch (e) { fail++; console.log("HATA " + name + " -> " + (e && e.message)); }
}
// çevrimiçi durumu
await t("Kendi durumunu yazar", () => set(ref(A, "durum/ua"), { on: true, ts: serverTimestamp() }), true);
await t("Başkasının durumunu yazamaz", () => set(ref(B, "durum/ua"), { on: false, ts: serverTimestamp() }), false);
await t("Doğrulanmamış hesap yazamaz", () => set(ref(X, "durum/ux"), { on: true, ts: serverTimestamp() }), false);
await t("Fazladan alan reddedilir", () => set(ref(A, "durum/ua"), { on: true, ts: serverTimestamp(), ip: "1.2.3.4" }), false);
await t("on doğru/yanlış olmalı", () => set(ref(A, "durum/ua"), { on: "evet", ts: serverTimestamp() }), false);
await t("Gelecek tarihli zaman reddedilir", () => set(ref(A, "durum/ua"), { on: true, ts: Date.now() + 864e5 }), false);
await t("Üye başkasının durumunu okur", () => get(ref(B, "durum/ua")), true);
await t("Giriş yapmamış kimse durumu okuyamaz", () => get(ref(Z, "durum/ua")), false);
await t("Bütün durum listesi okunamaz", () => get(ref(B, "durum")), false);
await t("Durumunu gizlemek için siler", () => remove(ref(A, "durum/ua")), true);
// yazıyor
await t("Kendi sohbetinde yazıyor işareti koyar", () => set(ref(A, "yaz/ua_ub/ua"), serverTimestamp()), true);
await t("Karşı taraf yazıyor bilgisini okur", () => get(ref(B, "yaz/ua_ub")), true);
await t("Sohbet dışından okunamaz", () => get(ref(C, "yaz/ua_ub")), false);
await t("Başkası adına yazıyor konamaz", () => set(ref(B, "yaz/ua_ub/ua"), serverTimestamp()), false);
await t("Dahil olmadığı sohbete yazıyor konamaz", () => set(ref(C, "yaz/ua_ub/uc"), serverTimestamp()), false);
await t("Yazıyor işareti kaldırılır", () => remove(ref(A, "yaz/ua_ub/ua")), true);
await t("Kök okunamaz", () => get(ref(A, "/")), false);

await env.cleanup();
console.log(fail ? `\n${fail} durum senaryosu TUTMADI, yükleme durduruldu.` : "\nTüm durum senaryoları tamam.");
process.exit(fail ? 1 : 0);
