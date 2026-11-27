/* ============ SENİ BEĞENENLER ============
   Keşfet'teki "N kişi seni beğendi" şeridine dokununca açılan tam liste.
   Premium (Kulis Tam) değilse: kişi sayısı ve bulanık kartlar, bilgi görünmez; Premium'a yönlendirir.
   Premium ise: her kişinin takma adı, burcu, yaşı, hangi itirafını beğendiği; "Geri beğen" ile eşleşme ve sohbet. */
let BEGENENLER=[];// [{from,pid,ts}] — 38-perde.js'teki dinleyici doldurur
const begenGorur=()=>REMOTE?hasFeat("tam"):state.premium;
function begenenler(){
  const tg=swTarget();
  const src=REMOTE?BEGENENLER:[...LIKED_ME].map((k,i)=>({from:k,pid:null,ts:Date.now()-i*36e5}));
  const gor=new Set();
  return src.filter(l=>{if(gor.has(l.from)||sw.matched.has(l.from))return false;gor.add(l.from);const u=U[l.from];return !u||!tg||u.g===tg})
    .sort((a,b)=>(b.ts||0)-(a.ts||0));
}
async function begenenYukle(liste){
  if(!REMOTE)return;
  const eksik=liste.filter(l=>!U[l.from]).slice(0,30);
  await Promise.all(eksik.map(async l=>{const d=await KDB.userPub(l.from);if(d)putUser(l.from,d)}));
}
function begenenSatir(l){
  const u=U[l.from];if(!u)return "";
  const p=l.pid&&(state.myPosts||[]).find(x=>x.id===l.pid);
  return `<li class="bg-s"><button class="bg-av" data-bgp="${l.from}" aria-label="${esc(u.n)} profiline bak">${av(l.from,52,true)}</button>
    <div class="bg-m"><b>${esc(u.n)}</b><small>${Z[u.s]?Z[u.s].n:""}${u.age?", "+esc(u.age):""}${l.ts?", "+agoOf(l.ts):""}</small>
    ${p?`<q>${esc(p.t.slice(0,80))}${p.t.length>80?"…":""}</q>`:""}</div>
    <button class="btn sm" data-bgy="${l.from}">Geri beğen</button></li>`;
}
async function showBegenenler(){
  const liste=begenenler();
  if(!begenGorur()){
    const n=liste.length;
    openSheet(`<div class="sheet-head"><h2>Seni beğenenler</h2></div>
      <p class="muted" style="margin:-4px 0 14px">${n?`<b>${n} kişi</b> itirafına dokunup seni beğendi.`:"Henüz seni beğenen yok. İtiraf yazdıkça artacak."}</p>
      ${n?`<div class="bg-kilit" aria-hidden="true">${Array.from({length:Math.min(n,6)},(_,i)=>`<span class="bg-bulanik" style="--h:${(i*57)%360}"></span>`).join("")}</div>
      <button class="btn gold wide" id="bgPrem">Kim olduklarını gör</button>
      <p class="hint" style="text-align:center;margin-top:10px">Kulis Tam ile seni beğenenleri görür, birine geri beğeni gönderip hemen eşleşirsin.</p>`:""}`);
    const b=$("#bgPrem");if(b)b.onclick=()=>{track("begenen_premium");closeSheet();showPremiumRemote?showPremiumRemote("begenenler"):showPremium()};
    return;
  }
  openSheet(`<div class="sheet-head"><h2>Seni beğenenler</h2></div><p class="muted" id="bgYuk">Yükleniyor…</p>`);
  await begenenYukle(liste);
  const ciz=()=>{const l=begenenler();
    openSheet(`<div class="sheet-head"><h2>Seni beğenenler</h2></div>
      ${l.length?`<p class="muted" style="margin:-4px 0 10px">${l.length} kişi. Geri beğenirsen eşleşirsiniz ve sohbet açılır.</p><ul class="bg-liste">${l.map(begenenSatir).join("")}</ul>`
        :bosHTML(PK_IC.begenen,"","Şu an bekleyen beğeni yok. Yeni biri seni beğenince burada görünecek.")}`,true);
    $("#sheet").querySelectorAll("[data-bgp]").forEach(b=>b.onclick=()=>showProfile(b.dataset.bgp));
    $("#sheet").querySelectorAll("[data-bgy]").forEach(b=>b.onclick=async()=>{
      const k=b.dataset.bgy;b.disabled=true;b.textContent="…";track("begenen_geri");
      if(!REMOTE){sw.matched.add(k);toast(`${U[k].n} ile eşleştin`);ciz();return}
      try{const cid=await KDB.like(k,null);
        if(cid){sw.matched.add(k);KDB.notify(k,"match","ile eşleştin",{chat:R.uid,kesfet:1});toast(`${U[k].n} ile eşleştin. Sohbet açıldı.`);ciz()}
        else{b.disabled=false;b.textContent="Geri beğen";toast("Olmadı, birazdan tekrar dene")}}
      catch(e){b.disabled=false;b.textContent="Geri beğen";toast("Gönderilemedi: "+(e.code||e.message))}});
  };
  ciz();
}
