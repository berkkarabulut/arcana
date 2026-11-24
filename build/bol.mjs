// TEK SEFERLİK: eski tek dosyalık index.html'i src/ altında düzenli parçalara böler.
// Parçalar sırayla birleştirilince orijinal dosyanın birebir aynısı çıkar (kontrol en sonda).
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
const SRC = process.argv[2], OUT = process.argv[3] || "src";
const html = readFileSync(SRC, "utf8");
const tr = s => s.toLocaleLowerCase("tr").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "parca";

// 1) bölgeleri bul: ana <style>, ana klasik <script>, Firebase modül satırı
const sOpen = html.indexOf("<style>"), sClose = html.indexOf("</style>", sOpen);
const css = html.slice(sOpen + 7, sClose);
const mainTag = "\n<script>\n", jOpen = html.lastIndexOf(mainTag, html.indexOf('<script type="module">'));
const jStart = jOpen + mainTag.length, jEnd = html.indexOf("</script>", jStart);
const js = html.slice(jStart, jEnd);
const modLine = html.match(/<script type="module">if\(REMOTE\)import\("\.\/kulis-db\.js\?v=\d+"\)<\/script>/)[0];

// 2) parçalara böl (işaret satırlarından)
function split(text, re) {
  const lines = text.split("\n"), parts = []; let cur = { name: "giris", lines: [] };
  for (const l of lines) {
    const m = l.match(re);
    if (m && cur.lines.length) { parts.push(cur); cur = { name: tr(m[1]), lines: [] }; }
    else if (m) cur.name = tr(m[1]);
    cur.lines.push(l);
  }
  parts.push(cur);
  return parts;
}
const cssParts = split(css, /^\/\* =+ (.+?) =+ \*\/$/);
const jsParts = split(js, /^\/\* =+ (.+?) =+ \*\/$/);
rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/css`, { recursive: true }); mkdirSync(`${OUT}/js`, { recursive: true });
const write = (dir, parts, ext) => parts.map((p, i) => {
  const f = `${String(i + 1).padStart(2, "0")}-${p.name}.${ext}`;
  // her parça satır listesidir; birleştirirken aralarına "\n" konur
  writeFileSync(`${OUT}/${dir}/${f}`, p.lines.join("\n"));
  return f;
});
const cssFiles = write("css", cssParts, "css"), jsFiles = write("js", jsParts, "js");

// 3) şablon: geri kalan her şey, yer tutucularla
let tpl = html.slice(0, sOpen) + "<style>{{CSS}}</style>" + html.slice(sClose + 8, jOpen) + "\n<script src=\"{{APP_JS}}\"></script>" + html.slice(jEnd + 9);
tpl = tpl.replace(modLine, '<script type="module">if(REMOTE)import("{{DB_JS}}")</script>');
tpl = tpl.replace(/<link rel="modulepreload" href="kulis-db\.js\?v=\d+">/, '<link rel="modulepreload" href="{{DB_JS}}">');
tpl = tpl.replace("<head>", '<head>\n<meta name="kulis-ver" content="{{VER}}">');
writeFileSync(`${OUT}/index.html`, tpl);
writeFileSync(`${OUT}/sira.json`, JSON.stringify({ css: cssFiles, js: jsFiles }, null, 1));

// 4) KONTROL: parçalar birleşince orijinalle birebir aynı mı
const back = f => readFileSync(f, "utf8");
const cssBack = cssFiles.map(f => back(`${OUT}/css/${f}`)).join("\n"), jsBack = jsFiles.map(f => back(`${OUT}/js/${f}`)).join("\n");
if (cssBack !== css) throw new Error("CSS birebir değil!");
if (jsBack !== js) throw new Error("JS birebir değil!");
console.log(`Tamam: ${cssFiles.length} stil parçası, ${jsFiles.length} kod parçası. Birleşimleri orijinalle birebir aynı.`);
console.log("CSS:", cssFiles.join(", ")); console.log("JS:", jsFiles.join(", "));
