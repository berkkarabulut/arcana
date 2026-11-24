/* ============ EŞLEŞ (itirafla kaydırmalı eşleşme) ============ */
const SWIPE_EXTRA=[
 {u:"mavimerdiven",cat:"ask",t:"Her sabah aynı kahveciye sırf kasadaki kız için gidiyorum. Aslında kahve bile sevmiyorum."},
 {u:"dumanli",cat:"arkadas",t:"En yakın arkadaşımın düğününde konuşma yaptım, herkes ağladı. Konuşmayı yapay zekâya yazdırmıştım."},
 {u:"kedikahve",cat:"ask",t:"İlk buluşmada otobüsü kaçırdım dedim. Aslında kapının önünde yirmi dakika cesaret topladım."},
 {u:"gecekusu",cat:"aile",t:"Kardeşimin harçlığını yıllardır ben gönderiyorum. Annemler babamdan geldiğini sanıyor."},
 {u:"eskiplak",cat:"kimse",t:"Gitar çalabildiğimi söylüyorum ama sadece tek bir şarkıyı ezbere biliyorum."},
 {u:"kumsaati",cat:"is",t:"Toplantılarda kamerayı açmıyorum çünkü çoğu zaman yataktan katılıyorum."},
 {u:"kirmiziceket",cat:"ask",t:"Eski sevgilime bilerek yanlışlıkla mesaj atıyorum, sonra özür dilemek için."},
 {u:"ucuncukat",cat:"arkadas",t:"Arkadaşlarım beni sakin biri sanıyor. Aslında her konuşmayı kafamda yüz kere kuruyorum."},
 {u:"sessizlimon",cat:"kimse",t:"Her yılbaşı gecesi tek başıma sinemaya gidiyorum ve bu benim yılın en sevdiğim gecesi."},
 {u:"yorgunkaptan",cat:"ask",t:"Yeni biriyle tanışınca ilk iş burcunu soruyorum. Ama burca inanmadığımı söylüyorum."}
];
const LIKED_ME=new Set(!REMOTE&&(()=>{try{return localStorage.getItem("arcana_demo")!=="0"}catch(e){return true}})()?["gecekusu","kedikahve","eskiplak","dumanli","sessizlimon","yorgunkaptan"]:[]);
// karşı cins kuralı: erkeklere kadınlar, kadınlara erkekler görünür (cinsiyet belirtmeyen herkesi görür)
const genderOk=uid=>{const t=state.me?swTarget():null;if(!t)return true;const u=U[uid];return !!u&&u.g===t};
const swTarget=()=>state.me.g==="Kadın"?"Erkek":state.me.g==="Erkek"?"Kadın":null;
const FREE_SWIPES=12;
const sw={done:new Set(),hist:[],used:0,mode:"eslesme",matched:new Set(),front:null,busy:false};
function swipePool(){
  if(!DEMO)return [];
  const all=[];const a=POSTS.map(p=>({id:p.id,u:p.u,cat:p.cat,t:p.t})),b=SWIPE_EXTRA.map((p,i)=>({id:"s"+i,...p}));
  for(let i=0;i<Math.max(a.length,b.length);i++){if(a[i])all.push(a[i]);if(b[i])all.push(b[i])}
  const tg=swTarget();let l=all.filter(c=>!sw.done.has(c.id)&&U[c.u].g===tg);
  if(sw.front){const i=l.findIndex(c=>c.u===sw.front);if(i>0)l.unshift(l.splice(i,1)[0]);else if(i<0)sw.front=null}
  return l;
}
function vKesfet(){
  view.innerHTML=`<div class="ks-head"><h1 class="h2s">Keşfet</h1><div class="seg2" role="group" aria-label="Keşfet görünümü"><button data-ks="eslesme" aria-pressed="${sw.mode==="eslesme"}">Eşleş</button><button data-ks="uyum" aria-pressed="${sw.mode==="uyum"}">Uyumlu kişiler</button></div></div><div id="ksBody"></div>`;
  view.querySelectorAll("[data-ks]").forEach(b=>b.onclick=()=>{sw.mode=b.dataset.ks;vKesfet()});
  sw.mode==="uyum"?vUyumlu():vEsles();
}
function vUyumlu(){
  const me=state.me;
  const people=(DEMO||REMOTE)?Object.keys(U).filter(k=>(DEMO||genderOk(k))&&yasOk(k)).map(k=>({k,p:uyum(me.s,U[k].s)})).sort((a,b)=>b.p-a.p):[];
  if(!people.length){$("#ksBody").innerHTML=`<p class="empty">Henüz başka üye yok. Arkadaşlarını davet et, burcuna en uyumlu kişiler burada sıralansın.</p><button class="btn wide" id="invK" style="margin-top:12px">${IC.share}Arkadaşını davet et</button>`;$("#invK").onclick=()=>showInvite();return}
  const sameSign=Object.keys(U).filter(k=>U[k].s===me.s&&(DEMO||genderOk(k)));
  $("#ksBody").innerHTML=`<p class="muted" style="font-size:14px;margin-bottom:14px">Burcuna göre en uyumlu itirafçılar. Profiline girip itiraflarını okuyabilir, özelden yazabilirsin.</p>
   ${people.map(({k,p})=>{const u=U[k];return `<button class="row" data-prof="${k}">${av(k,46)}<span class="t"><b>${esc(u.n)}${pb(k)}${dgb(k)}</b><div>${Z[u.s].n}, ${u.age}, ${u.bio}</div></span><span class="meta"><b style="color:var(--kagit);font-size:15px">%${p}</b><br>uyum</span></button>`}).join("")}
   <p class="hint" style="margin-top:14px">${sameSign.length?`${Z[me.s].n} burcundan ${sameSign.length} kişi aktif.`:`Şu an ${Z[me.s].n} burcundan aktif kimse yok.`}</p>`;
}
function swCard(c,back){
  const u=U[c.u],p=uyum(state.me.s,u.s);
  return `<div class="swc${back?" under":""}" ${back?'aria-hidden="true"':`id="swTop" tabindex="0" aria-label="${esc(u.n)} adlı kişinin itirafı. Sağ ok: bana dokundu, sol ok: geç."`} style="--acc:${u.c}">
    <span class="stamp yes">Dokundu</span><span class="stamp no">Geç</span>
    <div class="swc-top"><span class="swz" style="background:${u.c}">${Z[u.s].g}</span><span class="swn"><b>${esc(u.n)}${pb(c.u)}</b><small>${Z[u.s].n}, ${u.age}, ${u.g}</small></span><span class="it-cat">${CATN[c.cat]}</span></div>
    <blockquote class="swq">${esc(c.t)}</blockquote>
    <div class="swc-foot">${ringSVG(p)}<span><b>Burç uyumunuz</b><small>${Z[state.me.s].n} ve ${Z[u.s].n}</small></span></div>
  </div>`;
}
function vEsles(){
  const body=$("#ksBody");if(!body)return;
  const pool=swipePool(), out=!state.premium&&sw.used>=FREE_SWIPES;
  const tg=swTarget();
  if(!tg){body.innerHTML=`<div class="deck"><div class="swc end"><div class="cf-ic">${IC.spark}</div><h2>Önce cinsiyetini seç</h2><p class="muted">Eşleş'te kadınlar erkeklerin, erkekler kadınların itiraflarını görür. Kayıtta cinsiyetini belirtmediğin için seçmen gerekiyor. Bu seçim profilinde de görünür ve sonradan değiştirilemez.</p><div class="choice" style="width:100%;max-width:300px;display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="btn line" data-sg="Kadın">Kadın</button><button class="btn line" data-sg="Erkek">Erkek</button></div></div></div>`;
    body.querySelectorAll("[data-sg]").forEach(b=>b.onclick=()=>{state.me.g=b.dataset.sg;save();toast("Cinsiyetin kaydedildi");vEsles()});return}
  const likers=[...LIKED_ME].filter(k=>!sw.matched.has(k)&&U[k].g===tg);
  const strip=likers.length?`<button class="likers" id="likers">${state.premium?likers.map(k=>`<span class="lk-av" data-lk="${k}">${av(k,34,true)}</span>`).join(""):`<span class="lk-stack">${likers.slice(0,4).map(k=>`<span class="lk-av blurred">${av(k,34,true)}</span>`).join("")}</span>`}
     <span class="lk-t"><b>${likers.length} kişi seni beğendi</b><small>${state.premium?"Birine dokun, itirafı öne gelsin":"Kim olduklarını görmek için Premium"}</small></span>${state.premium?"":IC.lock}</button>`:"";
  let deck;
  if(out)deck=`<div class="swc end"><div class="cf-ic">${IC.lock}</div><h2>Bugünlük kartların bitti</h2><p class="muted">Yarın yeni itiraflar gelecek. Beklemek istemiyorsan Premium ile sınırsız kaydır, seni beğenenleri de gör.</p><button class="btn gold wide" id="swPrem">Premium ile devam et</button></div>`;
  else if(!pool.length&&!DEMO)deck=`<div class="swc end"><div class="cf-ic">${IC.spark}</div><h2>Henüz kaydıracak itiraf yok</h2><p class="muted">Yeni üyeler itiraf yazdıkça kartlar burada görünecek. Arkadaşlarını davet et, eşleşme şansın artsın.</p><button class="btn wide" id="swInv">${IC.share}Arkadaşını davet et</button></div>`;
  else if(!pool.length)deck=`<div class="swc end"><div class="cf-ic">${IC.spark}</div><h2>Hepsini gördün</h2><p class="muted">Yeni itiraflar geldikçe burada göreceksin. Geçtiğin itiraflara bir daha bakmak istersen başa dön.</p><button class="btn line wide" id="swReset">Geçtiklerimi tekrar göster</button></div>`;
  else deck=(pool[1]?swCard(pool[1],true):"")+swCard(pool[0]);
  body.innerHTML=`${strip}
    <div class="deck" id="deck">${deck}</div>
    ${out||!pool.length?"":`<div class="sw-acts">
      <button class="swb sm" id="swUndo" aria-label="Son kartı geri al">${UNDO}${state.premium?"":`<span class="lk">${IC.lock}</span>`}</button>
      <button class="swb no" id="swNo" aria-label="Geç">${IC.close.replace('width="18" height="18"','width="28" height="28"')}</button>
      <button class="swb yes" id="swYes" aria-label="Bana dokundu">${HEART}</button>
      <button class="swb sm" id="swProf" aria-label="Profiline bak">${IC.dm.replace('<svg','<svg width="20" height="20"').replace('M4 5h16v11H9l-5 4z','M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5')}</button>
    </div>`}
    <p class="hint" style="text-align:center;max-width:340px;margin:12px auto 0">Sağa kaydır: bana dokundu. Sola kaydır: geç. Sen ${tg==="Erkek"?"erkeklerin":"kadınların"} itiraflarını görürsün. Birbirinizi beğenirseniz eşleşirsiniz, sohbet açılır.</p>
    ${state.myPosts.length?"":`<button class="pnote" id="swNudge" style="max-width:none;margin:14px 0 0">${IC.spark}<span>Kendi itirafını yazanlar daha çok eşleşiyor. İnsanlar seni yazdıklarınla tanır.</span></button>`}`;
  const L=$("#likers");if(L)L.onclick=e=>{if(REMOTE?!hasFeat("tam"):!state.premium){premiumGate("Seni kimler beğendi?","Seni beğenen kişileri görmek ve onların itirafını hemen önüne getirmek Premium ile açılır.",()=>vKesfet());return}
    const a=e.target.closest("[data-lk]");if(a){sw.front=a.dataset.lk;vEsles()}};
  const P=$("#swPrem");if(P)P.onclick=()=>showPremium("esles");
  const SI=$("#swInv");if(SI)SI.onclick=()=>showInvite();
  const R=$("#swReset");if(R)R.onclick=()=>{sw.hist.filter(h=>!h.like).forEach(h=>sw.done.delete(h.id));sw.hist=sw.hist.filter(h=>h.like);vEsles()};
  const N=$("#swNudge");if(N)N.onclick=()=>showConfess();
  if(out||!pool.length)return;
  const top=$("#swTop"),c=pool[0];
  $("#swNo").onclick=()=>fling(top,c,false);
  $("#swYes").onclick=()=>fling(top,c,true);
  $("#swProf").onclick=()=>showProfile(c.u);
  $("#swUndo").onclick=undoSwipe;
  dragCard(top,c);
}
function dragCard(el,c){
  let x0=0,y0=0,dx=0,dy=0,on=false,id=null;
  const set=()=>{el.style.transform=`translate(${dx}px,${dy*.35}px) rotate(${dx/16}deg)`;el.style.setProperty("--yes",Math.max(0,Math.min(1,dx/110)));el.style.setProperty("--no",Math.max(0,Math.min(1,-dx/110)))};
  el.onpointerdown=e=>{if(sw.busy||e.button>0)return;on=true;id=e.pointerId;x0=e.clientX;y0=e.clientY;dx=dy=0;el.setPointerCapture(id);el.classList.add("drag")};
  el.onpointermove=e=>{if(!on)return;dx=e.clientX-x0;dy=e.clientY-y0;set()};
  const up=()=>{if(!on)return;on=false;el.classList.remove("drag");
    if(Math.abs(dx)>100)fling(el,c,dx>0,dx,dy);
    else{el.style.transform="";el.style.setProperty("--yes",0);el.style.setProperty("--no",0)}};
  el.onpointerup=up;el.onpointercancel=up;
}
function fling(el,c,like,dx=0,dy=0){
  if(sw.busy)return;sw.busy=true;
  const d=like?1:-1;el.classList.remove("drag");el.classList.add("fly");
  el.style.setProperty(like?"--yes":"--no",1);
  el.style.transform=`translate(${d*(innerWidth*.9+200)}px,${dy*.35+40}px) rotate(${d*24}deg)`;
  const b=document.querySelector(".swc.under");if(b)b.classList.add("rise");
  setTimeout(()=>{sw.busy=false;decide(c,like)},300);
}
function decide(c,like){
  if(like)track("begen");
  sw.done.add(c.id);sw.used++;sw.hist.push({id:c.id,u:c.u,like});
  if(sw.front===c.u)sw.front=null;
  let m=false;
  if(REMOTE){vEsles();if(like)KDB.like(c.u,c.id).then(cid=>{if(cid){sw.matched.add(c.u);sw.hist[sw.hist.length-1].match=true;track("eslesme");KDB.notify(c.u,"match","ile eşleştin",{chat:R.uid,kesfet:1});showMatch(c)}else toast(`${U[c.u].n} itirafını beğendiğini görmeyecek, sadece o da seni beğenirse eşleşirsiniz`)}).catch(e=>toast("Beğeni kaydedilemedi: "+(e.code||e.message)));return}
  if(like&&LIKED_ME.has(c.u)&&!sw.matched.has(c.u)){sw.matched.add(c.u);sw.hist[sw.hist.length-1].match=true;m=true;track("eslesme");notify("match",c.u,"ile eşleştin",{chat:c.u,kesfet:1},Date.now(),true)}
  vEsles();
  if(m)showMatch(c);else if(like)toast(`${U[c.u].n} itirafını beğendiğini görmeyecek, sadece o da seni beğenirse eşleşirsiniz`);
}
function undoSwipe(){
  if(REMOTE?!hasFeat("tam"):!state.premium){premiumGate("Son kartı geri al","Yanlışlıkla geçtiğin itirafı geri getirmek Premium ile açılır.",()=>vKesfet());return}
  const h=sw.hist[sw.hist.length-1];if(!h){toast("Geri alınacak kart yok");return}
  if(h.match){toast("Eşleşme geri alınamaz");return}
  sw.hist.pop();sw.done.delete(h.id);sw.used=Math.max(0,sw.used-1);sw.front=h.u;vEsles();
}
function showMatch(c){
  const u=U[c.u],p=uyum(state.me.s,u.s);
  const g=document.createElement("div");g.className="cf-scrim match-scrim";g.setAttribute("role","dialog");g.setAttribute("aria-modal","true");g.setAttribute("aria-label","Eşleştiniz");
  g.innerHTML=`<div class="match"><div class="m-avs"><span class="m-a" style="--acc:${state.me.c}">${av("me",92,true)}</span><span class="m-h">${HEART}</span><span class="m-a" style="--acc:${u.c}">${av(c.u,92,true)}</span></div>
    <h2>Eşleştiniz</h2>
    <p class="muted">Sen ${esc(u.n)} adlı kişinin itirafını beğendin, o da seni beğenmişti. Burç uyumunuz %${p}.</p>
    <q>“${esc(c.t)}”</q>
    <div style="display:grid;gap:8px;margin-top:18px"><button class="btn wide" id="mGo1">Mesaj yaz</button><button class="btn line wide" id="mGo2">Kaydırmaya devam et</button></div></div>`;
  document.body.appendChild(g);
  g.onclick=e=>{if(e.target===g)g.remove()};
  g.querySelector("#mGo2").onclick=()=>g.remove();
  g.querySelector("#mGo1").onclick=()=>{g.remove();
    const ex=state.chats.findIndex(x=>x.u===c.u);if(ex>=0){openChat(ex);return}
    if(!state.premium&&state.chats.length>=FREE_CHATS){showPremium("sohbet");return}
    state.chats.unshift({u:c.u,from:c.t,match:true,msgs:[],status:"open",unread:false});openChat(0)};
  setTimeout(()=>{const b=g.querySelector("#mGo1");b&&b.focus()},50);
}
const HEART='<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.8c0 5.8-7.5 10.4-7.5 10.4z"/></svg>';
const UNDO='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-4"/></svg>';
document.addEventListener("keydown",e=>{
  if(state.tab!=="kesfet"||sw.mode!=="eslesme"||$("#scrim").classList.contains("open")||$("#chat").classList.contains("open")||document.querySelector(".cf-scrim"))return;
  if(e.target.matches("input,textarea"))return;
  if(e.key==="ArrowRight"){const b=$("#swYes");if(b){e.preventDefault();b.click()}}
  else if(e.key==="ArrowLeft"){const b=$("#swNo");if(b){e.preventDefault();b.click()}}
});

