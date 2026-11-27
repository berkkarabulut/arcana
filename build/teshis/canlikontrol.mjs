// Canlı site kontrolü: misafir akışı ne dönüyor, sitede yeni kod var mı
const r = await fetch("https://europe-west1-kulis-1647d.cloudfunctions.net/misafirAkis", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"data":{}}' });
const j = await r.json(); const L = (j.result && (j.result.posts || j.result)) || [];
console.log("misafirAkis:", r.status, "itiraf sayısı:", Array.isArray(L) ? L.length : JSON.stringify(j).slice(0, 200));
if (Array.isArray(L)) L.forEach(p => console.log(" -", (p.a && p.a.n) || p.n, "|", String(p.t).slice(0, 50)));
const h = await (await fetch("https://kulistr.com/?t=" + Date.now())).text();
const js = [...h.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(m => m[1]); let kod = h;
for (const s of js) kod += await (await fetch(new URL(s, "https://kulistr.com/"))).text();
console.log("canlı kodda geri tuşu:", kod.includes("kg:1"), "| moderatör hesabı:", kod.includes("kulismoderator"));
