// Font küçültme önizlemesi: canlı siteyi şimdiki ve küçültülmüş fontla yan yana çeker
import pw from "playwright";
const { chromium, devices } = pw;
const YENI = process.env.YENI_FONT;
const b = await chromium.launch();
for (const [ad, degistir] of [["simdi", false], ["kucuk", true]]) {
  const ctx = await b.newContext({ ...devices["Pixel 7"], locale: "tr-TR", serviceWorkers: "block" });
  await ctx.addInitScript(() => { try { localStorage.setItem("kulis_remote", "0"); localStorage.setItem("kulis_cerez", "0") } catch (e) {} });
  let kb = 0;
  ctx.on("response", async r => { if (/fonts\.gstatic/.test(r.url())) { try { kb += (await r.body()).length / 1024 } catch (e) {} } });
  if (degistir) await ctx.route(/fonts\.googleapis\.com\/css2/, rt => rt.continue({ url: YENI }));
  const p = await ctx.newPage();
  await p.goto("https://kulistr.com/?_=" + Date.now(), { waitUntil: "networkidle" });
  await p.evaluate(() => { const c = document.querySelector("#ckNo"); c && c.click(); state.me = { n: "gecekusu", c: COLORS[3], s: signOf(5, 12), g: "e", age: "25-34", bio: "", b: { d: 12, m: 5, y: 1996 }, ad: "A", soyad: "B", email: "a@b.c", provider: "email" }; save(); document.querySelector("#onb").hidden = true; render(); seedDemo() });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
  await p.screenshot({ path: `font-${ad}-akis.png` });
  await p.evaluate(() => showPost(allPosts()[0].id)); await p.waitForTimeout(1200);
  await p.screenshot({ path: `font-${ad}-detay.png` });
  console.log(ad, "font indirilen KB:", Math.round(kb));
  await ctx.close();
}
await b.close();
