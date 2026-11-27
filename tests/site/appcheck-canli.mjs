// Canlı sitede App Check zorunluyken Firestore/RTDB isteklerinin geçtiğini kontrol eder.
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const istek = [], hata = [];
p.on("response", r => { const u = r.url(); if (/firestore\.googleapis|firebaseio|firebasedatabase|content-firebaseappcheck|recaptcha\/enterprise/.test(u)) istek.push(r.status() + " " + u.split("?")[0].slice(0, 110)); });
p.on("console", m => { const t = m.text(); if (/app.?check|permission|appCheck|Missing or insufficient/i.test(t)) hata.push(m.type() + ": " + t.slice(0, 250)); });
await p.goto("https://kulistr.com/?_=" + Date.now(), { waitUntil: "domcontentloaded" });
await p.waitForTimeout(15000);
const durum = await p.evaluate(() => ({ remote: typeof REMOTE !== "undefined" ? REMOTE : null, posts: (window.state && state.posts ? state.posts.length : null) }));
const say = {}; istek.forEach(s => { const k = s.split(" ")[0] + " " + (s.match(/https:\/\/([^/]+)/) || [])[1]; say[k] = (say[k] || 0) + 1; });
console.log("Durum:", JSON.stringify(durum)); console.log("İstekler:", JSON.stringify(say, null, 1)); console.log("Hatalar:", hata.length ? hata.join("\n") : "yok");
await b.close();
