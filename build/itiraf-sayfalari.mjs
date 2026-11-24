// Herkese açık itiraf sayfaları: her gün GitHub Actions'ta çalışır, kulistr.com/itiraf/ altını baştan üretir.
// Yayınlanan: en az 3 tepki almış, anonim OLMAYAN, yazarı "Google'da çıkabilsin" ayarını kapatmamış, banlı olmayan itirafların
// yalnızca metni, kategorisi, tepki sayıları ve ayı. (Ayarlarda kapatma seçeneği yok; eski "seo:false" kaydı varsa yine uyulur.) Takma ad, burç, fotoğraf, yorum, hesap kimliği ASLA yazılmaz.
// Kullanım: node build/itiraf-sayfalari.mjs [--deneme veri.json]   (çıktı: itiraf/ klasörü ve sitemap.xml)
import fs from "node:fs";
import path from "node:path";

const SITE = "https://kulistr.com";
const KOK = process.cwd();
const ESIK = 3, EN_AZ_HARF = 40, EN_FAZLA = 1500;
const KAT = { soru: "Günün sorusu", ask: "Aşk", is: "İş", aile: "Aile", arkadas: "Arkadaşlık", kimse: "Kimseye söylemedim" };
const AY = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

async function veriAl() {
  const i = process.argv.indexOf("--deneme");
  if (i > 0) return JSON.parse(fs.readFileSync(process.argv[i + 1], "utf8"));
  const admin = (await import("firebase-admin")).default;
  admin.initializeApp({ projectId: "kulis-1647d" });
  const db = admin.firestore();
  const ps = await db.collection("posts").orderBy("ts", "desc").limit(3000).get();
  const bans = new Set((await db.collection("bans").get()).docs.map(d => d.id));
  const adaylar = ps.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => !p.anon && p.uid && p.uid !== "anon");
  const uids = [...new Set(adaylar.map(p => p.uid))];
  const kapali = new Set(), var_ = new Set();
  for (let k = 0; k < uids.length; k += 100) {
    const parca = uids.slice(k, k + 100);
    const [st, us] = await Promise.all([db.getAll(...parca.map(u => db.doc(`users/${u}/settings/main`))), db.getAll(...parca.map(u => db.doc(`users/${u}`)))]);
    st.forEach((s, j) => { if (s.exists && s.data().seo === false) kapali.add(parca[j]) });
    us.forEach((s, j) => { if (s.exists) var_.add(parca[j]) });
  }
  return adaylar.filter(p => var_.has(p.uid) && !kapali.has(p.uid) && !bans.has(p.uid))
    .map(p => ({ id: p.id, t: p.t, cat: p.cat, r: p.r || {}, cm: p.cm || 0, ts: p.ts && p.ts.toMillis ? p.ts.toMillis() : Date.now() }));
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tr = s => s.toLocaleLowerCase("tr").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u").replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u");
const slug = p => { const k = tr(p.t).replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(Boolean).slice(0, 8).join("-").slice(0, 60).replace(/-+$/, ""); return (k || "itiraf") + "-" + p.id.slice(0, 6).toLowerCase(); };
const top = p => ["bende", "saril", "yok"].reduce((a, k) => a + (+p.r[k] || 0), 0);
const baslik = p => { const t = p.t.replace(/\s+/g, " ").trim(); const c = t.split(/(?<=[.!?…])\s/)[0]; const b = c.length <= 75 ? c : t.slice(0, 72).replace(/\s\S*$/, "") + "…"; return b; };
const ayYil = ms => { const d = new Date(ms + 3 * 36e5); return `${AY[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

const CSS = `:root{--z:#F4F7F6;--k:#13201C;--s:#5B6B66;--y:#fff;--c:#DCE6E2;--a:#C8432A;--v:#1C9C7C}
@media(prefers-color-scheme:dark){:root{--z:#0E1715;--k:#EAF2EF;--s:#9FB2AC;--y:#16221F;--c:#24332F;--a:#FF8A65;--v:#2FBF97}.btn{color:#13201C!important}}
*{box-sizing:border-box;margin:0}body{background:var(--z);color:var(--k);font:17px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.k{max-width:680px;margin:0 auto;padding:20px 18px 60px}a{color:inherit}
.ust{display:flex;align-items:center;gap:10px;text-decoration:none;margin-bottom:26px}.ust img{border-radius:10px}.ust b{font:italic 600 26px/1 Georgia,serif}.ust span{font-size:13px;color:var(--s)}
.etk{font-size:13px;font-weight:700;color:var(--v);text-transform:none;letter-spacing:.2px}
h1{font:600 30px/1.2 Georgia,"Times New Roman",serif;margin:6px 0 16px}
blockquote{background:var(--y);border:1px solid var(--c);border-radius:20px;padding:20px 22px;font-size:19px;line-height:1.6;white-space:pre-wrap}
.bil{display:flex;flex-wrap:wrap;gap:8px 16px;font-size:14px;color:var(--s);margin:12px 4px 26px}
.cta{background:var(--k);color:var(--z);border-radius:20px;padding:22px;margin:0 0 30px}.cta h2{font:600 22px/1.25 Georgia,serif;margin-bottom:6px}.cta p{font-size:15px;opacity:.8;margin-bottom:14px}
.btn{display:inline-block;background:var(--a);color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:14px}
h3{font-size:16px;margin:0 0 10px}.lis{list-style:none;padding:0;display:grid;gap:10px}.lis a{display:block;background:var(--y);border:1px solid var(--c);border-radius:16px;padding:12px 15px;text-decoration:none;font-size:15px;line-height:1.45}
.lis small{display:block;color:var(--s);font-size:12.5px;margin-top:3px}
.alt{margin-top:34px;font-size:13px;color:var(--s);line-height:1.5}.alt a{color:var(--s)}`;

function sayfa({ baslik: b, aciklama, yol, govde, jsonld }) {
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(b)} | Kulis</title><meta name="description" content="${esc(aciklama)}"><link rel="canonical" href="${SITE}${yol}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(b)}"><meta property="og:description" content="${esc(aciklama)}"><meta property="og:url" content="${SITE}${yol}"><meta property="og:image" content="${SITE}/icons/icon-512.png"><meta property="og:locale" content="tr_TR">
<link rel="icon" href="/icons/icon-192.png">${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>` : ""}<style>${CSS}</style></head>
<body><main class="k"><a class="ust" href="/?utm_source=itiraf&utm_medium=seo"><img src="/icons/icon-192.png" alt="" width="40" height="40"><span><b>Kulis.</b><br><span>İtiraf &amp; Sohbet</span></span></a>
${govde}
<p class="alt">Kulis'te herkes takma adla yazar. Bu sayfada yazarın takma adı ya da başka bir bilgisi gösterilmez. Yazarı itirafını sildiğinde bu sayfa da kaldırılır. <a href="/kurallar.html">Topluluk kuralları</a> · <a href="/gizlilik.html">Gizlilik</a></p></main></body></html>`;
}

const liste = await veriAl();
const yay = liste.filter(p => typeof p.t === "string" && p.t.trim().length >= EN_AZ_HARF && top(p) >= ESIK && KAT[p.cat])
  .sort((a, b) => top(b) - top(a) || b.ts - a.ts).slice(0, EN_FAZLA)
  .map(p => ({ ...p, s: slug(p), b: baslik(p), n: top(p) }));

const DIZ = path.join(KOK, "itiraf");
fs.rmSync(DIZ, { recursive: true, force: true });
fs.mkdirSync(DIZ, { recursive: true });
const CTA = `<section class="cta"><h2>Yorumları oku, sen de anlat</h2><p>Kulis'te insanlar takma adla itiraf ediyor, birbirine destek oluyor ve yeni insanlarla tanışıyor. Üyelik ücretsiz, 30 saniye sürer.</p><a class="btn" href="/?utm_source=itiraf&utm_medium=seo">Kulis'e katıl</a></section>`;
for (const p of yay) {
  const benzer = yay.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, 6);
  const yol = `/itiraf/${p.s}/`;
  const govde = `<span class="etk">${esc(KAT[p.cat])} itirafı</span><h1>${esc(p.b)}</h1>
<blockquote>${esc(p.t.trim())}</blockquote>
<div class="bil"><span>${p.r.bende || 0} kişi “bende de oldu” dedi</span><span>${p.r.saril || 0} kişi sarıldı</span>${p.cm ? `<span>${p.cm} yorum</span>` : ""}<span>${ayYil(p.ts)}</span></div>
${CTA}
${benzer.length ? `<h3>Benzer itiraflar</h3><ul class="lis">${benzer.map(x => `<li><a href="/itiraf/${x.s}/">${esc(x.b)}<small>${x.n} tepki</small></a></li>`).join("")}</ul>` : ""}
<p style="margin-top:18px"><a href="/itiraf/">Tüm itiraflar</a></p>`;
  const jsonld = { "@context": "https://schema.org", "@type": "Article", headline: p.b.slice(0, 110), articleBody: p.t.trim(), datePublished: new Date(p.ts).toISOString(), inLanguage: "tr", articleSection: KAT[p.cat],
    publisher: { "@type": "Organization", name: "Kulis", url: SITE + "/", logo: { "@type": "ImageObject", url: SITE + "/icons/icon-512.png" } }, mainEntityOfPage: SITE + yol };
  fs.mkdirSync(path.join(DIZ, p.s), { recursive: true });
  fs.writeFileSync(path.join(DIZ, p.s, "index.html"), sayfa({ baslik: p.b, aciklama: p.t.trim().replace(/\s+/g, " ").slice(0, 155), yol, govde, jsonld }));
}
// liste sayfası
const gruplar = Object.keys(KAT).map(k => [k, yay.filter(p => p.cat === k)]).filter(([, l]) => l.length);
fs.writeFileSync(path.join(DIZ, "index.html"), sayfa({
  baslik: "İtiraflar: aşk, aile, iş ve arkadaşlık üzerine gerçek hikâyeler", aciklama: "Kulis'te en çok ilgi gören, takma adla yazılmış itiraflar. Aşk, aile, iş ve arkadaşlık üzerine gerçek hikâyeleri oku.", yol: "/itiraf/",
  govde: `<h1>En çok konuşulan itiraflar</h1>${yay.length ? gruplar.map(([k, l]) => `<h3 style="margin-top:22px">${esc(KAT[k])}</h3><ul class="lis">${l.map(x => `<li><a href="/itiraf/${x.s}/">${esc(x.b)}<small>${x.n} tepki</small></a></li>`).join("")}</ul>`).join("") : `<p>Henüz herkese açık itiraf yok.</p>`}<div style="margin-top:26px">${CTA}</div>`
}));
// site haritası
const sabit = [["/", "daily", "1.0"], ["/itiraf/", "daily", "0.8"], ["/kurallar.html", "monthly"], ["/kosullar.html", "monthly"], ["/gizlilik.html", "monthly"], ["/cocuk-guvenligi.html", "monthly"], ["/hesap-silme.html", "monthly"]];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sabit.map(([u, f, pr]) => `  <url><loc>${SITE}${u}</loc><changefreq>${f}</changefreq>${pr ? `<priority>${pr}</priority>` : ""}</url>`).join("\n")}\n${yay.map(p => `  <url><loc>${SITE}/itiraf/${p.s}/</loc><lastmod>${new Date(p.ts).toISOString().slice(0, 10)}</lastmod><changefreq>weekly</changefreq></url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(KOK, "sitemap.xml"), xml);
console.log(`Herkese açık itiraf sayfası: ${yay.length} (aday ${liste.length})`);
