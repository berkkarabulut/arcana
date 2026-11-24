/* ============ İTİRAF ET ============ */
// İtiraf sınırı: günlük sınır şimdilik kapalı, iki itiraf arası 15 dk. POST_LIMIT_ON=true yapınca normal üye günde 1, Premium sınırsız.
const POST_LIMIT_ON=false, POST_GAP_MS=15*60e3;
function showConfess(opt={}){
  const QM=!!opt.q;
  const today=state.myPosts.filter(p=>p.today&&p.cat!=="soru").length, limit=!POST_LIMIT_ON||state.premium?Infinity:1;
  if(QM&&state.myPosts.some(p=>p.cat==="soru"&&p.q===opt.q)){toast("Bugünün sorusunu zaten cevapladın");return}
  // iki itiraf arasında 15 dakika (sunucu da aynı kuralı uygular)
  const lastTs=Math.max(0,...state.myPosts.map(p=>p.ts||0)),wait=POST_GAP_MS-(Date.now()-lastTs);
  if(REMOTE&&lastTs&&wait>0){toast(`15 dakikada bir itiraf atabilirsin. ${Math.ceil(wait/60000)} dakika sonra tekrar dene.`);return}
  if(!QM&&today>=limit){openSheet(`<h2>Bugünlük bu kadar</h2><p class="muted" style="margin:8px 0 16px">Yeni itiraf için yarını bekle ya da Premium ile hemen yaz.</p>${state.premium?"":`<button class="btn gold wide" id="gp">Premium ile hemen yaz</button>`}`);const g=$("#gp");if(g)g.onclick=()=>showPremium("itiraf");return}
  let cat=QM?"soru":"ask";const MIN=QM?3:15;
  openSheet(`<h2>${QM?"Günün sorusu":"İtiraf et"}</h2>${QM?`<p style="font-family:var(--display);font-style:italic;font-size:19px;margin:8px 0 6px">“${esc(opt.q)}”</p>`:""}<p class="muted" style="font-size:14px;margin:6px 0 12px">Takma adınla görünür: ${esc(state.me.n)}, ${Z[state.me.s].n}. Gerçek adın hiçbir yerde görünmez.</p>
   ${QM?"":`<div class="cats" style="margin:0 -18px;padding:0 18px 12px">${CATS.filter(c=>c[0]!=="hepsi"&&c[0]!=="soru").map(([k,l])=>`<button class="c" data-pc="${k}" aria-pressed="${cat===k}">${l}</button>`).join("")}</div>`}
   <div class="box big"><textarea id="cfIn" maxlength="500" placeholder="${QM?"Cevabın…":"Kimseye söyleyemediğin şey…"}"></textarea></div>
   <div class="row" style="border:0;padding:6px 2px 0"><span class="hint" style="margin:0" id="cnt">0 / 500</span></div>
   ${REMOTE&&!QM?`<label class="anon-sw"><input type="checkbox" id="cfAnon"><span><b>Anonim paylaş</b><small>Takma adın bile görünmez, kimse sana yazamaz. Silmek istersen sadece sen silebilirsin.</small></span></label>`:""}
   <div id="cfWarn"></div>
   <button class="btn wide" id="cfGo" disabled style="margin-top:12px">${QM?"Cevabı paylaş":"İtirafı paylaş"}</button>`);
  const t=$("#cfIn"),g=$("#cfGo");
  $("#sheet").querySelectorAll("[data-pc]").forEach(b=>b.onclick=()=>{cat=b.dataset.pc;$("#sheet").querySelectorAll("[data-pc]").forEach(x=>x.setAttribute("aria-pressed",x===b))});
  t.oninput=()=>{$("#cnt").textContent=`${t.value.length} / 500`;g.disabled=t.value.trim().length<MIN;$("#cfWarn").innerHTML=""};
  setTimeout(()=>t.focus(),250);
  g.onclick=()=>{const v=t.value.trim(),bad=contactBlock(v);if(bad){$("#cfWarn").innerHTML=`<p class="warn">İtiraflarda ${bad} paylaşılamaz.</p>`;return}
    const mc=modCheck(v,"itiraf");if(mc){$("#cfWarn").innerHTML=`<p class="warn">${mc}</p>`;return}
    const anonOn=!!($("#cfAnon")&&$("#cfAnon").checked);
    if(REMOTE&&anonOn){g.disabled=true;KDB.anonPost(v,cat).then(()=>{closeSheet();askPushOnce("itiraf");state.tab="akis";state.cat="hepsi";state.sort="yeni";render();scrollTo(0,0);toast("Anonim itirafın akışta");track("itiraf_yazildi",{kategori:cat,anonim:1})}).catch(e=>{g.disabled=false;const m=String(e&&e.message||"");toast(/hiz/.test(m)?"İki itiraf arasında en az 15 dakika olmalı.":/kelime/.test(m)?"İtirafında yasaklı bir kelime var.":"Anonim itiraf gönderilemedi: "+(e.code||m))});return}
    if(REMOTE){g.disabled=true;KDB.addPost(QM?{t:v,cat,q:opt.q}:{t:v,cat},authorSnap()).then(()=>{closeSheet();askPushOnce("itiraf");KDB.logAccess&&KDB.logAccess("itiraf");state.tab="akis";state.cat=QM?"soru":"hepsi";state.sort="yeni";render();scrollTo(0,0);toast("İtirafın akışta paylaşıldı");track("itiraf_yazildi",{kategori:cat})}).catch(e=>{g.disabled=false;toast(writeErr(e,"itiraf"))});return}
    const p={id:"m"+Date.now(),u:"me",cat,t:v,ago:"Şimdi",r:{bende:0,saril:0,yok:0},cm:[],today:true,day:dayKey(),ts:Date.now()};
    state.myPosts.unshift(p);closeSheet();
    state.tab="akis";state.cat="hepsi";state.sort="yeni";render();scrollTo(0,0);toast("İtirafın akışta paylaşıldı");track("itiraf_yazildi",{kategori:cat});
    if(!DEMO)return;
    setTimeout(()=>{p.r.saril+=3;p.r.bende+=5;p.cm.push({u:"dumanli",t:"Bunu yazdığın için cesursun. Yalnız değilsin.",ago:"Şimdi",ts:Date.now()});notify("cm","dumanli","itirafına yorum yaptı: “Bunu yazdığın için cesursun.”",{post:p.id});notify("react",null,"8 kişi itirafına tepki verdi",{post:p.id});render()},5000);
    setTimeout(()=>{const k=["dumanli","eskiplak","sessizlimon","mavimerdiven"].find(x=>!state.chats.some(c=>c.u===x)&&!state.requests.some(r=>r.u===x));if(!k)return;state.requests.push({u:k,first:"İtirafını okudum, çok tanıdık geldi. Biraz konuşmak ister misin?",from:p.t});notify("req",k,"itirafını okudu ve sana mesaj isteği gönderdi",{tab:"mesajlar"});toast("Yeni bir mesaj isteğin var");render()},9000);};
}
