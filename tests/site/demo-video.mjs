// Misafir modu demo videosu: canlı sitede üye olmayan biri gibi gezer, dokunuşları ekranda gösterir
import pw from "playwright";
const { chromium, devices } = pw;
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices["Pixel 7"], locale: "tr-TR", serviceWorkers: "block", recordVideo: { dir: "video", size: { width: 412, height: 839 } } });
await ctx.addInitScript(() => {
  addEventListener("DOMContentLoaded", () => {
    const st = document.createElement("style");
    st.textContent = ".dokun{position:fixed;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,138,101,.45);border:3px solid rgba(255,138,101,.9);pointer-events:none;z-index:99999;animation:dk .7s ease-out forwards}@keyframes dk{from{transform:scale(.4);opacity:1}to{transform:scale(1.3);opacity:0}}";
    document.head.appendChild(st);
  });
  addEventListener("pointerdown", e => { const d = document.createElement("div"); d.className = "dokun"; d.style.left = e.clientX + "px"; d.style.top = e.clientY + "px"; document.body.appendChild(d); setTimeout(() => d.remove(), 800) }, true);
});
const p = await ctx.newPage();
const bekle = ms => p.waitForTimeout(ms);
const kaydir = async (y, adim = 12) => { for (let i = 0; i < adim; i++) { await p.mouse.wheel(0, y / adim); await bekle(60) } };
const dokun = async sel => { const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); const r = await el.boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await bekle(350); await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2) };
await p.goto("https://kulistr.com/?_=" + Date.now());
await p.waitForSelector("#msfSon"); await bekle(2200);
if (await p.locator("#ckNo").count()) { await dokun("#ckNo"); await bekle(900) }
const kapat = async () => { if (await p.locator("#msfDuvar").count()) { await dokun("#msfDuvar .msf-x"); await bekle(1000) } };
await kaydir(140); await bekle(1400); await kaydir(-140); await bekle(700);
await kapat();
await dokun("article.it [data-react]"); await bekle(2600); await kapat();
await dokun("article.it button[data-open]"); await bekle(2400); await kapat();
await dokun('.nb[data-tab="mesajlar"]'); await bekle(2400); await kapat();
await dokun("#confessBtn"); await bekle(2400); await kapat();
await p.evaluate(() => { MSF.gozuktu = false });
await kaydir(1600, 30); await bekle(2800);
if (!(await p.locator("#msfDuvar").count())) { await p.evaluate(() => misafirDuvar("kaydirma")); await bekle(2000) }
await dokun('#msfDuvar [data-msf="kayit"]'); await bekle(2800);
await dokun("#msfGeri"); await bekle(2000);
await ctx.close(); await b.close();
