// Belirtilen en üst seviye tanımları bir dosyadan diğerine BİREBİR metinle taşır.
// node build/tasi.cjs <kaynak.js> <hedef.js> ad1 ad2 ...
const ust = require("./ust.cjs"), fs = require("fs");
const [src, dst, ...names] = process.argv.slice(2);
const want = new Set(names), st = ust(src), text = fs.readFileSync(src, "utf8");
const moved = st.filter(s => s.names.some(n => want.has(n)));
const found = new Set(moved.flatMap(s => s.names));
const miss = names.filter(n => !found.has(n)); if (miss.length) { console.error("Bulunamadı:", miss); process.exit(1); }
let keep = "", last = 0;
for (const s of moved) { keep += text.slice(last, s.start); last = s.end; }
keep += text.slice(last);
const add = moved.map(s => s.text.replace(/^\n+/, "")).join("\n");
fs.writeFileSync(src, keep);
fs.writeFileSync(dst, (fs.existsSync(dst) ? fs.readFileSync(dst, "utf8") + "\n" : "") + add);
console.log(`${src} -> ${dst}: ${moved.length} tanım taşındı (${add.length} karakter)`);
