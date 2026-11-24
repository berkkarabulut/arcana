// Kulis derleyici: src/ altındaki parçaları birleştirir, kontrol eder, sıkıştırır, dist/ klasörüne yazar.
// Kullanım: node build/derle.mjs [--out dist] [--min]
// --min: esbuild varsa kodu sıkıştırır (CI'da kurulu). Yoksa sıkıştırmadan derler.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const OUT = arg("--out") || "dist", MIN = process.argv.includes("--min");
const S = "src", rd = f => readFileSync(f, "utf8");
const sira = JSON.parse(rd(`${S}/sira.json`));
const hatalar = [];

// 1) birleştir (sıra önemli: eski tek dosyadaki sırayla aynı)
const css = sira.css.map(f => rd(`${S}/css/${f}`)).join("\n");
const js = sira.js.map(f => rd(`${S}/js/${f}`)).join("\n");
const db = rd(`${S}/kulis-db.js`);
// geç yüklenen parçalar: sadece gerekince indirilir (yönetici paneli, yasal metinler…)
const gec = Object.fromEntries(Object.entries(sira.gec || {}).map(([k, fs]) => [k, fs.map(f => rd(`${S}/js/${f}`)).join("\n")]));

// 2) BEKÇİLER: yayına hatalı kod çıkmasın
// 2a) sözdizimi
try { new vm.Script(js, { filename: "app.js" }); } catch (e) { hatalar.push("JS sözdizimi hatası: " + e.message); }
try { new vm.SourceTextModule ? 0 : 0; } catch (e) {}
// 2b) aynı isimli iki fonksiyon (sonradan gelen öncekini sessizce ezer)
const izin = existsSync("build/bekci-izin.json") ? JSON.parse(rd("build/bekci-izin.json")) : { fonksiyon: [], sinif: [], id: [] };
const fn = {};
sira.js.forEach(f => rd(`${S}/js/${f}`).split("\n").forEach((l, i) => { const m = l.match(/^(?:async )?function ([A-Za-z0-9_$]+)\s*\(/); if (m) (fn[m[1]] = fn[m[1]] || []).push(`${f}:${i + 1}`); }));
Object.entries(fn).filter(([k, v]) => v.length > 1 && !izin.fonksiyon.includes(k)).forEach(([k, v]) => hatalar.push(`Aynı isimli fonksiyon iki kez tanımlı: ${k} (${v.join(", ")})`));
// 2b2) geç parçalar: ana kod onların SADECE fonksiyonlarını çağırabilir (köprüyle); sabit/değişkenlerine erişemez,
//      ve parça yüklenirken kendiliğinden çalışan kod içeremez
const ust = (await import("./ust.cjs")).default;
const kopru = {};
for (const [k, files] of Object.entries(sira.gec || {})) {
  try { new vm.Script(gec[k], { filename: k + ".js" }); } catch (e) { hatalar.push(`Geç parça ${k} sözdizimi: ${e.message}`); continue; }
  kopru[k] = [];
  for (const f of files) for (const st of ust(`${S}/js/${f}`)) {
    if (!st.names.length) { hatalar.push(`Geç parça ${k} (${f}) yüklenirken kendiliğinden çalışan kod içeriyor: ${st.text.trim().slice(0, 60)}`); continue; }
    for (const n of st.names) {
      if (fn[n]) hatalar.push(`"${n}" hem ana kodda hem geç parça ${k} içinde tanımlı`);
      const used = new RegExp("(?<![A-Za-z0-9_$.])" + n.replace(/\$/g, "\\$") + "(?![A-Za-z0-9_$])").test(js);
      if (!used) continue;
      if (st.kind === "FunctionDeclaration") kopru[k].push(n);
      else hatalar.push(`Ana kod, geç parça "${k}" içindeki "${n}" sabitini kullanıyor. Onu ana koda geri al.`);
    }
  }
}
// 2c) stil çakışması: kısa bir sınıf hem tek başına genel kural, hem başka bir bileşende ek sınıf olarak kullanılıyorsa
const standalone = new Set(), modifier = {};
for (const sel of css.replace(/\/\*[\s\S]*?\*\//g, "").match(/[^{}]+(?=\{)/g) || []) for (let part of sel.split(",")) {
  part = part.trim(); if (!part || part.startsWith("@")) continue;
  const m = part.match(/^\.([A-Za-z0-9_-]+)(:[a-z-]+(\([^)]*\))?)*$/); if (m) standalone.add(m[1]);
  for (const comp of part.match(/(?:\.[A-Za-z0-9_-]+){2,}/g) || []) { const cl = comp.slice(1).split("."); cl.slice(1).forEach(c => (modifier[c] = modifier[c] || new Set()).add(cl[0])); }
}
Object.entries(modifier).filter(([c]) => standalone.has(c) && c.length <= 4 && !izin.sinif.includes(c)).forEach(([c, v]) => hatalar.push(`Stil çakışması riski: ".${c}" hem genel kural hem de şunlarla ek sınıf: ${[...v].join(", ")}. Daha özgün bir ad kullan.`));
// 2d) kodda aranan ama sayfada hiç olmayan id
const all = rd(`${S}/index.html`) + js;
const used = new Set([...js.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g), ...js.matchAll(/getElementById\("([A-Za-z0-9_-]+)"\)/g)].map(m => m[1]));
const defd = new Set([...all.matchAll(/id="([A-Za-z0-9_-]+)"/g), ...js.matchAll(/\.id\s*=\s*["']([A-Za-z0-9_-]+)["']/g)].map(m => m[1]));
[...used].filter(x => !defd.has(x) && !izin.id.includes(x)).forEach(x => hatalar.push(`Kodda aranan ama hiçbir yerde olmayan id: #${x}`));

if (hatalar.length) { console.error("\n❌ DERLEME DURDU:\n - " + hatalar.join("\n - ")); process.exit(1); }

// 3) sıkıştır
let cssO = css, jsO = js, dbO = db;
if (MIN) {
  const esb = await import("esbuild");
  cssO = (await esb.transform(css, { loader: "css", minify: true })).code;
  jsO = (await esb.transform(js, { loader: "js", minifyWhitespace: true, minifySyntax: true, target: "es2020", legalComments: "none" })).code;
  dbO = (await esb.transform(db, { loader: "js", format: "esm", minify: true, target: "es2020" })).code;
}
// 4) sürüm kodu: içerik değişince değişir (önbellek kendiliğinden yenilenir)
const gecO = {};
for (const [k, t] of Object.entries(gec)) gecO[k] = MIN ? (await (await import("esbuild")).transform(t, { loader: "js", minifyWhitespace: true, minifySyntax: true, target: "es2020", legalComments: "none" })).code : t;
const gecAd = Object.fromEntries(Object.entries(gecO).map(([k, t]) => [k, `assets/gec-${k}.${createHash("sha256").update(t).digest("hex").slice(0, 10)}.js`]));
// köprüler: ana kod bir geç fonksiyonu çağırınca önce parçayı indirir, sonra asıl fonksiyonu çalıştırır
const yukleyici = `
var __GEC=${JSON.stringify(gecAd)},__gecP={},__ilk={};
function __yukle(k){return __gecP[k]||(__gecP[k]=new Promise(function(ok,no){var s=document.createElement("script");s.src=__GEC[k];s.async=true;s.onload=ok;s.onerror=function(){delete __gecP[k];no(new Error("parça yüklenemedi"))};document.head.appendChild(s)}))}
` + Object.entries(kopru).flatMap(([k, ns]) => ns.map(n => `function ${n}(){var a=arguments,t=this;return __yukle(${JSON.stringify(k)}).then(function(){if(window.${n}===__ilk.${n})throw new Error("${n} yüklenmedi");return window.${n}.apply(t,a)}).catch(function(e){console.error(e);try{toast("Bağlantı sorunu, tekrar dene.")}catch(x){}})}\n__ilk.${n}=${n};`)).join("\n");
jsO = jsO + "\n" + yukleyici;
const VER = createHash("sha256").update(cssO + jsO + dbO + Object.values(gecO).join("") + rd(`${S}/index.html`) + rd(`${S}/sw.js`)).digest("hex").slice(0, 10);
rmSync(OUT, { recursive: true, force: true }); mkdirSync(`${OUT}/assets`, { recursive: true });
for (const [k, t] of Object.entries(gecO)) writeFileSync(`${OUT}/${gecAd[k]}`, t);
const APP = `assets/app.${VER}.js`, DB = `./assets/kulis-db.${VER}.js`;
writeFileSync(`${OUT}/${APP}`, jsO); writeFileSync(`${OUT}/assets/kulis-db.${VER}.js`, dbO);
const html = rd(`${S}/index.html`).split("{{CSS}}").join(cssO).split("{{APP_JS}}").join(APP).split("{{DB_JS}}").join(DB).split("{{VER}}").join(VER);
if (/\{\{[A-Z_]+\}\}/.test(html)) { console.error("❌ Şablonda doldurulmamış yer tutucu kaldı"); process.exit(1); }
writeFileSync(`${OUT}/index.html`, html);
writeFileSync(`${OUT}/sw.js`, rd(`${S}/sw.js`).split("{{VER}}").join(VER));
const kb = s => (Buffer.byteLength(s) / 1024).toFixed(1) + " KB";
console.log(`✅ Derlendi (${MIN ? "sıkıştırılmış" : "sıkıştırmasız"}) sürüm ${VER}\n   index.html ${kb(html)} | app.js ${kb(jsO)} (ham ${kb(js)}) | kulis-db ${kb(dbO)} | stil ${kb(cssO)} (ham ${kb(css)})`);
console.log("   geç parçalar:", Object.entries(gecO).map(([k, t]) => `${k} ${kb(t)} (köprü: ${kopru[k].join(", ") || "yok"})`).join(" | "));
