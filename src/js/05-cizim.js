/* ============ ÇİZİM ============ */
function render(){
  document.querySelectorAll(".nb").forEach(b=>b.dataset.tab===state.tab?b.setAttribute("aria-current","page"):b.removeAttribute("aria-current"));
  $("#premPill").innerHTML=state.premium?"Premium":`${IC.lock} Premium`;
  const unread=state.chats.filter(c=>c.unread).length+state.requests.length+(REMOTE&&R.ekip&&R.ekip.userUnread?1:0);
  $("#pip").hidden=!unread;$("#pip").textContent=unread;
  const nu=state.notifs.filter(n=>!n.read).length;$("#bellPip").hidden=!nu;$("#bellPip").textContent=nu>9?"9+":nu;$("#topBell").setAttribute("aria-label",nu?`Bildirimler, ${nu} yeni`:"Bildirimler");
  ({akis:vAkis,kesfet:vKesfet,mesajlar:vMesajlar,ben:vBen})[state.tab]();
}
function allPosts(){return DEMO?[...state.myPosts,...POSTS]:[...state.myPosts]}
const isBoosted=p=>REMOTE?(!!p.feat&&Date.now()<p.feat):(!!p.boost&&Date.now()-p.boost<864e5);
function boostLeft(p){const end=REMOTE?p.feat:p.boost+864e5;const h=Math.max(1,Math.ceil((end-Date.now())/36e5));return h+" saat"}
function postHTML(p,opts={}){
  const mine=p.u==="me", my=state.react[p.id];
  const long=p.t.length>150;
  return `<article class="it">
   <div class="it-top">${p.anon?`<span class="who anon-who"><span class="av anon-av" style="width:36px;height:36px">?</span><span><b>Anonim${p.u==="me"?" <em class=\"me-tag\">sen</em>":""}</b><small>${p.ago}</small></span></span>`:who(p.u,p.ago)}<span class="it-cat">${CATN[p.cat]||""}</span></div>
   ${p.q?`<p class="it-q">${esc(p.q)}</p>`:""}<blockquote class="${long?"long":""}" ${opts.full?"":`data-open="${p.id}"`}>${esc(p.t)}</blockquote>
   <div class="it-foot"><div class="reacts">${REACTS.map(([k,l,ic])=>`<button class="r" data-react="${p.id}:${k}" aria-pressed="${my===k}" title="${l}" aria-label="${l}">${IC[ic]}<span class="n">${(p.r[k]||0)+(!REMOTE&&my===k?1:0)}</span></button>`).join("")}</div>
   <div class="acts2">${opts.full?"":`<button class="ib" data-open="${p.id}" aria-label="Yorumlar">${IC.cm}${cmN(p)}</button>`}
   ${mine||p.anon?"":`<button class="ib dm" data-dm="${p.u}" data-from="${p.id}" aria-label="Özelden yaz">${IC.dm}</button>`}
   <button class="ib" data-share="${p.id}" aria-label="Hikâyede paylaş">${IC.share}</button>
   <button class="ib" data-more="${p.id}" aria-label="Diğer seçenekler">${IC.more}</button></div></div></article>`;
}
const reactTotal=p=>Object.values(p.r).reduce((a,b)=>a+b,0);
function vAkis(){
  let list=allPosts().filter(p=>(state.cat==="hepsi"||p.cat===state.cat)&&!state.hidden.has("p:"+p.id));
  const boosted=list.filter(isBoosted);list=list.filter(p=>!isBoosted(p));
  let feat=null;
  const WK=7*864e5,score=p=>reactTotal(p)*2+cmN(p);let rank=false;
  if(state.sort==="hafta"){list=list.concat(boosted.splice(0)).filter(p=>!p.ts||Date.now()-p.ts<WK).sort((a,b)=>score(b)-score(a)).slice(0,10);rank=true}
  // Popüler: tepki sayısı + yeni itiraflara ilk 6 saatte azalan bir öncelik (yeni yazılan, 6 tepkili bir itiraf kadar öne çıkar)
  const YENI=6*36e5,taze=p=>p.ts&&Date.now()-p.ts<YENI?6*(1-(Date.now()-p.ts)/YENI):0,pop=p=>reactTotal(p)+taze(p);
  if(state.sort==="populer"){list=[...list].sort((a,b)=>(b.u==="me")-(a.u==="me")||pop(b)-pop(a));
    if(state.cat==="hepsi"&&list.length>2){let i=-1;list.forEach((p,j)=>{if(p.u!=="me"&&(i<0||reactTotal(p)>reactTotal(list[i])))i=j});if(i>=0&&reactTotal(list[i])>0)feat=list.splice(i,1)[0]}}
  view.innerHTML=`${instBanner()}${dailyCard()}${qCard()}<div class="cats" role="toolbar" aria-label="Kategori">${CATS.map(([k,l])=>`<button class="c" data-cat="${k}" aria-pressed="${state.cat===k}">${l}</button>`).join("")}</div>
   <div class="feed-head"><div class="seg2" role="group" aria-label="Sıralama"><button data-sort="populer" aria-pressed="${state.sort==="populer"}">Popüler</button><button data-sort="yeni" aria-pressed="${state.sort==="yeni"}">Yeni</button><button data-sort="hafta" aria-pressed="${state.sort==="hafta"}">Haftanın</button></div><span class="feed-count">${list.length+boosted.length+(feat?1:0)} itiraf</span></div>
   ${boosted.map(p=>`<div class="boost-wrap"><div class="boost-tag">${IC.spark}Öne çıkarıldı</div>${postHTML(p)}</div>`).join("")}${feat?`<div class="feat"><div class="it" style="padding-top:12px"><div class="feat-tag">${IC.spark}Bugün en çok sarılan</div>${postHTML(feat).replace('<article class="it">','<article class="it" style="background:none;border:0;padding:0;margin:0">')}</div></div>`:""}
   ${rank&&list.length?`<p class="hint" style="margin:0 0 10px">Son 7 günün en çok sarılan ve konuşulan itirafları. Paylaş düğmesiyle hikâye görseli yapabilirsin.</p>`:""}
   ${list.length?list.map((p,i)=>rank?`<div class="wk"><span class="wk-n">${i+1}</span>${postHTML(p)}</div>`:postHTML(p)).join(""):(feat?"":bosHTML(IC.spark,rank?"Bu hafta sessiz geçti":"Burası henüz boş",rank?"Bu hafta henüz itiraf yok. İlk sen yaz, haftanın listesine gir.":"Bu kategoride henüz itiraf yok. İlk itirafı sen yaz, akışı sen başlat.",'<button class="btn bos-b" id="bosYaz">İtiraf et</button>'))}`;
  bindInst();
  const dh=$("#dhCard");if(dh)dh.onclick=()=>showDaily();
  const qg=$("#qcGo");if(qg)qg.onclick=()=>showConfess({q:todayQ().t});
  const by=$("#bosYaz");if(by)by.onclick=()=>showConfess();
}
function vMesajlar(){
  const free=!state.premium;
  const active=state.chats.length;
  view.innerHTML=`<h1 class="h2s">Mesajlar</h1>
   ${state.requests.length?`<h3 style="font-size:20px;margin:6px 0 8px">Mesaj istekleri</h3>${state.requests.map((r,i)=>`<div class="req">${av(r.u,42)}<div class="t"><b>${esc(U[r.u].n)}${pb(r.u)}</b> <span class="muted" style="font-size:12.5px">${Z[U[r.u].s].n}</span><q>“${esc(r.first)}”</q></div><button class="sbtn no" data-rq="${i}:no">Sil</button><button class="sbtn ok" data-rq="${i}:ok">Kabul et</button></div>`).join("")}`:""}
   <h3 style="font-size:20px;margin:16px 0 4px">Sohbetler</h3>
   ${REMOTE&&R.ekip?`<button class="row ekip-row" id="ekipRow"><span class="av ekip-av" style="width:46px;height:46px">🛡️</span><span class="t"><b>Kulis Ekibi</b><div>${R.ekip.lastStaff?"":"Sen: "}${esc(R.ekip.last||"")}</div></span><span class="meta">${R.ekip.userUnread?'<span class="dot"></span>':""}</span></button>`:""}
   ${state.chats.length?state.chats.map((c,i)=>{const last=c.msgs[c.msgs.length-1];const locked=last&&!last.me&&isLockedIdx(c,c.msgs.length-1);
     return `<button class="row" data-chat="${i}">${av(c.u,46)}<span class="t"><b>${esc(U[c.u].n)}${pb(c.u)}${c.match?'<span class="mtag">Eşleşme</span>':""}</b><div class="${locked?"blur":""}">${last?(last.me?"Sen: ":"")+(last.mod?"Mesaj moderatör tarafından silindi":last.kind==="img"?"Fotoğraf":last.kind==="vid"?"Video":last.kind==="voice"?"Ses kaydı":last.kind==="call"?(last.type==="video"?"Görüntülü arama":"Sesli arama"):esc(last.t)):"Sohbet başladı. İlk mesajı yaz."}</div></span><span class="meta">${c.unread?'<span class="dot"></span>':""}</span></button>`}).join(""):bosHTML(IC.dm,"Henüz sohbetin yok","Akışta seni etkileyen bir itirafın altındaki “Özelden yaz”a dokun. Karşı taraf kabul edince sohbet burada açılır.",'<button class="btn bos-b" id="bosAkis">Akışa göz at</button>')}`;
  const er=$("#ekipRow");if(er)er.onclick=openEkip;
  const ba=$("#bosAkis");if(ba)ba.onclick=()=>{state.tab="akis";render();window.scrollTo(0,0)};
}
function vBen(){
  const me=state.me;
  const mine=state.myPosts;
  view.innerHTML=`<div class="pro-wrap" style="--acc:${me.c}"><div class="cover" style="${coverCSS(me)}"><button class="cover-edit" id="covBtn">${IC.camera}Kapak</button><button class="cover-edit" id="outTop" style="right:auto;left:10px">${LOGOUT}Çıkış</button></div>
   <div class="pro2"><div style="position:relative"><span class="ring2" style="display:inline-block">${av("me",96,true)}</span><button class="cam" id="camBtn" aria-label="Profil fotoğrafını değiştir">${IC.camera}</button></div>
   <h2>${esc(me.n)}${pb("me")}</h2>
   <div class="badges"><span class="bd"><span class="glyph">${Z[me.s].g}</span>${Z[me.s].n}</span><span class="bd">${me.g}</span></div>
   ${REMOTE?perdeCard():(isUpload(me.photo)||isUpload(me.banner))&&!state.premium?`<button class="pnote" id="pNote">${IC.lock}<span>Yüklediğin ${isUpload(me.photo)&&isUpload(me.banner)?"fotoğraf ve kapak":isUpload(me.photo)?"fotoğraf":"kapak"} şu an sadece sana görünüyor. Diğer kullanıcılar hazır görünümü görür. Göstermek için Premium'a geç.</span></button>`:""}
   <p class="bio">${me.bio?esc(me.bio):'<span class="muted" style="font-family:var(--body);font-size:13.5px">Profiline kendini anlatan tek bir cümle ekle.</span>'}</p></div>
   <div class="stats"><div><b>${mine.length}</b><span>itiraf</span></div><div><b>${state.myComments.length}</b><span>yorum</span></div><div><b>${mine.reduce((a,p)=>a+reactTotal(p),0)}</b><span>tepki</span></div></div>
   <div class="pro-btns"><button class="btn line sm" id="editPro">${IC.edit.replace('<svg','<svg width="16" height="16"')}Profili düzenle</button>${state.premium?"":`<button class="btn gold sm" id="goPrem">Premium'a geç</button>`}</div>
   ${me.ad?`<details class="private"><summary>${IC.lock} Gizli bilgilerin<span class="chev">${IC.chev}</span></summary><div class="val" style="margin-top:10px">${esc(me.ad)} ${esc(me.soyad)}<br>${esc(me.email||"")}</div><p>${{google:"Google ile giriş yaptın.",apple:"Apple ile giriş yaptın.",email:"E-posta ile giriş yaptın."}[me.provider]||""} Bunları sadece sen görüyorsun, diğer kullanıcılar seni ${esc(me.n)} olarak görür.</p></details>`:""}
   <div class="tabs"><button aria-pressed="true">İtiraflarım</button></div>
   ${mine.length?mine.map(p=>`<div class="mini"><q data-open="${p.id}" style="cursor:pointer">“${esc(p.t)}”</q><div class="on">${CATN[p.cat]}, ${p.cm.length} yorum, ${reactTotal(p)} tepki${isBoosted(p)?", öne çıkarıldı":""}<button class="mini-sh" data-share="${p.id}">${IC.share}Hikâyede paylaş</button></div></div>`).join(""):bosHTML(IC.edit,"","Henüz itirafın yok. İlk itirafını yazınca burada durur, kimlerin tepki verdiğini de buradan görürsün.",'<button class="btn bos-b" id="bosItiraf">İlk itirafını yaz</button>')}
   ${isStandalone()?"":`<button class="btn line wide" id="instPro" style="margin-top:22px">${PHONE_DL}Ana ekrana ekle</button>`}
   ${themePicker()}
   <div class="lg-links"><a href="kurallar.html" data-legal="kurallar">Topluluk kuralları</a><a href="kosullar.html" data-legal="kosullar">Kullanım koşulları</a><a href="gizlilik.html" data-legal="kvkk">KVKK ve gizlilik</a>${GA_ID?'<a href="#" id="ckPref">Çerez tercihleri</a>':""}</div>
   ${REMOTE?`<button class="btn line wide" id="setBtn" style="margin-top:22px">Ayarlar</button>`:""}
   <button class="btn line wide" id="outBtn" style="margin-top:22px;color:var(--nar);border-color:rgba(var(--nar-rgb),.35)">${LOGOUT}Çıkış yap</button>${REMOTE?`${pushState()==="acik"?`<button class="dice" data-push="off" style="margin:14px auto 0;display:flex">Telefon bildirimlerini kapat</button>`:""}<button class="dice" id="delAcc" style="margin:14px auto 0;display:flex">Hesabımı sil</button>`:""}</div>`;
  const pcd=$("#perdeCard");if(pcd)pcd.onclick=()=>showEditProfile("perde");
  const pn=$("#pNote");if(pn)pn.onclick=()=>premiumGate("Fotoğrafın görünsün","Yüklediğin fotoğraf ve kapak Premium üyelerde herkese görünür.",()=>vBen());
  $("#camBtn").onclick=()=>showEditProfile("photo");$("#covBtn").onclick=()=>showEditProfile("banner");
  $("#editPro").onclick=showEditProfile;
  $("#outTop").onclick=$("#outBtn").onclick=confirmLogout;
  const sb=$("#setBtn");if(sb)sb.onclick=showSettings;
  if($("#delAcc"))$("#delAcc").onclick=confirmDeleteAccount;
  const ip=$("#instPro");if(ip)ip.onclick=installApp;
  const ck=$("#ckPref");if(ck)ck.onclick=e=>{e.preventDefault();showConsent(true)};
  const gp=$("#goPrem");if(gp)gp.onclick=()=>showPremium("profil");
  const bi=$("#bosItiraf");if(bi)bi.onclick=()=>showConfess();
}

const LOGOUT='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>';
function confirmDeleteAccount(){
  const g=document.createElement("div");g.className="cf-scrim";g.setAttribute("role","dialog");g.setAttribute("aria-modal","true");
  g.innerHTML=`<div class="cf"><h2>Hesabın silinsin mi?</h2><p class="muted" style="font-size:14px;margin:6px 0 12px">Profilin, itirafların, sohbetlerin, beğenilerin ve bildirimlerin kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
    ${state.premUntil?`<p class="warn" style="margin:0 0 12px">Premium aboneliğin hesabı silince durmaz. Önce Google Play > Ödemeler ve abonelikler'den iptal et.</p>`:""}
    <label class="lbl" for="delTx">Onaylamak için <b>SİL</b> yaz</label><input class="city-search" id="delTx" style="margin:6px 0 14px" autocomplete="off" maxlength="5">
    <div style="display:grid;gap:8px"><button class="btn wide" id="delY" disabled style="background:var(--nar);color:var(--on-nar)">Hesabımı kalıcı olarak sil</button><button class="btn line wide" id="delN">Vazgeç</button></div></div>`;
  document.body.appendChild(g);
  const y=g.querySelector("#delY"),tx=g.querySelector("#delTx");
  tx.oninput=()=>{y.disabled=tx.value.trim().toLocaleUpperCase("tr")!=="SİL"};
  g.onclick=e=>{if(e.target===g)g.remove()};g.querySelector("#delN").onclick=()=>g.remove();
  y.onclick=async()=>{y.disabled=true;y.textContent="Siliniyor…";
    try{await KDB.deleteEverything();track("hesap_silindi");try{["kulis_beta_local","kulis_seen","kulis_ob"].forEach(k=>localStorage.removeItem(k))}catch(e){}g.remove();toast("Hesabın silindi");setTimeout(()=>location.reload(),1200)}
    catch(e){y.disabled=false;y.textContent="Hesabımı kalıcı olarak sil";toast("Silinemedi: "+(e.code||e.message)+". Tekrar dene ya da bize yaz.")}};
  setTimeout(()=>tx.focus(),50);
}
function confirmLogout(){
  const g=document.createElement("div");g.className="cf-scrim";g.setAttribute("role","dialog");g.setAttribute("aria-modal","true");
  const guest=state.me&&state.me.provider==="guest";
  g.innerHTML=`<div class="cf"><div class="cf-ic" style="background:rgba(var(--nar-rgb),.14);color:var(--nar)">${LOGOUT.replace('width="16" height="16"','width="22" height="22"')}</div><h2>Çıkış yapılsın mı?</h2><p class="muted" style="font-size:14px;margin:6px 0 16px">${guest?"Üye olmadan girdiğin için profilin, itirafların ve sohbetlerin bu cihazdan silinir. Geri dönmek için yeniden profil oluşturman gerekir.":"Tekrar girmek için aynı hesapla giriş yapman yeterli."}</p>
    <div style="display:grid;gap:8px"><button class="btn wide" id="loY" style="background:var(--nar);color:var(--on-nar)">Çıkış yap</button><button class="btn line wide" id="loN">Vazgeç</button></div></div>`;
  document.body.appendChild(g);
  g.onclick=e=>{if(e.target===g)g.remove()};
  g.querySelector("#loN").onclick=()=>g.remove();
  g.querySelector("#loY").onclick=()=>{if(REMOTE){KDB.signOut().finally(()=>location.reload());return}try{localStorage.removeItem("itiraf_me");localStorage.removeItem("arcana_data")}catch(e){}location.reload()};
}
