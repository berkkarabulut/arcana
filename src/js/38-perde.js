/* ============ PERDE ============ */
// Herkes hazır avatarını görür; gerçek fotoğraf ve kapak "perde arkasında" durur.
// İki kişi sohbette perdeyi birlikte açınca birbirinin gerçek görsellerini görür.
function perdeCard(){const r=state.me.real||{},has=r.av||r.banner;
  return `<button class="perde-card" id="perdeCard"><span class="pc-ic">🎭</span><span class="pc-tx"><b>Perde arkası</b><small>${has?"Gerçek fotoğrafını sadece perdeyi birlikte açtığın kişiler görür.":"Gerçek fotoğrafını ve kapağını ekle. Sadece perdeyi birlikte açtığın kişiler görür."}</small></span>${r.av?`<img src="${r.av}" alt="">`:`<span class="pc-add">Ekle</span>`}</button>`}
function loadMyReal(){if(!KDB.getReal)return;KDB.getReal().then(g=>{R.realPaths=g||{};if(g&&(g.av||g.banner))return KDB.perdeFoto(R.uid).then(d=>{state.me.real={av:d.av||null,banner:d.banner||null};if(state.tab==="ben")render()})}).catch(()=>{})}
async function saveMyReal(av,bn){
  const old=state.me.real||{},g=R.realPaths||{};let pa=g.av||null,pbn=g.banner||null;
  state.me.real={av,banner:bn};render();toast("Perde arkası kaydediliyor…");
  try{if(av!==(old.av||null))pa=av?await KDB.uploadReal(dataBlob(av)):null;
    if(bn!==(old.banner||null))pbn=bn?await KDB.uploadReal(dataBlob(bn)):null;
    await KDB.saveReal(pa,pbn);R.realPaths={av:pa,banner:pbn};toast("Perde arkası kaydedildi")}
  catch(e){state.me.real=old;render();toast("Perde arkası kaydedilemedi: "+(e.code||e.message))}}
const perdeOf=uid=>R.perde[uid]||null;
function perdeState(uid){const p=perdeOf(uid);if(!p)return "yok";if(p.status==="acik")return "acik";return p.by===R.uid?"bende":"onda"}
function setReal(uid,d){R.real[uid]=d;const u=U[uid];if(u){u.realAv=d?d.av||null:null;u.realBn=d?d.banner||null:null}}
function loadReal(uid,anim){KDB.perdeFoto(uid).then(d=>{setReal(uid,d);if(anim)playPerde(uid);else{render();if(openIdx>=0)drawChat()}}).catch(()=>{if(anim)playPerde(uid)})}
function onPerde(list){
  const seen=LS("kulis_perde_seen",[]),now={},first=!R.perdeReady;R.perdeReady=true;
  list.forEach(p=>{const o=p.members.find(x=>x!==R.uid);if(!o)return;now[o]=p;const prev=R.perde[o];
    if(p.status==="acik"&&(!prev||prev.status!=="acik")){const key=p.id+":"+p.ts;const anim=!seen.includes(key)&&(!first||Date.now()-p.ts<36e5);
      if(anim){seen.push(key);LSset("kulis_perde_seen",seen.slice(-200))}loadReal(o,anim)}
    if(p.status==="istek"&&p.by!==R.uid&&!first&&(!prev||prev.status!==p.status))toast(`${(U[o]&&U[o].n)||"Biri"} seninle perdeyi açmak istiyor 🎭`)});
  Object.keys(R.perde).forEach(o=>{if(!now[o]&&R.perde[o].status==="acik"){setReal(o,null)}});
  R.perde=now;render();if(openIdx>=0)drawChat();
}
function perdeAction(c){
  const st=perdeState(c.u),u=U[c.u]||{n:"Bu kişi"};
  if(st==="yok"){KDB.perdeIste(c.u).then(()=>{KDB.notify(c.u,"perde","seninle perdeyi açmak istiyor",{chat:c.u});toast("Perde isteğin gönderildi")}).catch(e=>toast(writeErr(e,"perde")));return}
  if(st==="bende"){openSheet(`<h2>Perde isteğin bekliyor</h2><p class="muted" style="font-size:14px;margin:8px 0 16px">${esc(u.n)} kabul edince birbirinizin gerçek fotoğrafını göreceksiniz.</p><div style="display:grid;gap:8px"><button class="btn line wide" id="pdC">İsteği geri çek</button><button class="btn wide" id="pdK">Tamam</button></div>`);
    $("#pdK").onclick=closeSheet;$("#pdC").onclick=()=>{closeSheet();KDB.perdeKapat(c.u).then(()=>toast("Perde isteğin geri çekildi")).catch(e=>toast(writeErr(e,"perde")))};return}
  if(st==="acik"){openSheet(`<h2>Perdeyi kapat?</h2><p class="muted" style="font-size:14px;margin:8px 0 16px">Kapatırsan ikiniz de yeniden sadece hazır avatarlarınızı görürsünüz. İstediğiniz zaman tekrar açabilirsiniz.</p><div style="display:grid;gap:8px"><button class="btn wide" id="pdX" style="background:var(--nar)">Perdeyi kapat</button><button class="btn line wide" id="pdN">Vazgeç</button></div>`);
    $("#pdN").onclick=closeSheet;$("#pdX").onclick=()=>{closeSheet();KDB.perdeKapat(c.u).then(()=>toast("Perde kapandı")).catch(e=>toast(writeErr(e,"perde")))};return}
}
function perdeReqHTML(c){if(!REMOTE||c.status!=="open"||perdeState(c.u)!=="onda")return "";const u=U[c.u]||{n:"Biri"};
  return `<div class="perde-req"><div class="pr-t">🎭 Perde isteği</div><div><b>${esc(u.n)}</b> seninle perdeyi açmak istiyor</div><small>Kabul edersen birbirinizin gerçek fotoğrafını görürsünüz.</small><div class="pr-b"><button class="btn line sm" id="prNo">Şimdi değil</button><button class="btn gold sm" id="prOk">Kabul et</button></div></div>`}
function perdeBtnHTML(c){if(!REMOTE||c.status!=="open")return "";const st=perdeState(c.u);
  const t={yok:"Perdeyi aç",bende:"İstek gitti",onda:"Perde isteği",acik:"Perde açık"}[st];
  return `<button class="pd-pill ${st}" id="pdB" aria-label="${t}">🎭<span>${t}</span></button>`}
// Perde animasyonu: kadife perde yavaşça iki yana toplanır, spot ışığında karşı tarafın gerçek fotoğrafı belirir
function playPerde(uid){
  const u=U[uid]||{n:"",c:"#C79AF2"};$("#perdeOv")&&$("#perdeOv").remove();
  const ph=u.realAv?`<img src="${u.realAv}" alt="">`:`<span style="font-size:50px;font-weight:700;color:#14101A">${esc((u.n||"?").charAt(0).toLocaleUpperCase("tr"))}</span>`;
  const ov=document.createElement("div");ov.id="perdeOv";ov.setAttribute("role","dialog");ov.setAttribute("aria-label","Perde açılıyor");
  ov.innerHTML=`<div class="po-stg"></div><div class="po-beam"></div><div class="po-rv"><div class="po-big" style="background:${u.c}">${ph}</div><div class="po-n">${esc(u.n)}</div><div class="po-s">Perde açıldı</div></div>
   <div class="po-cu po-l"></div><div class="po-cu po-r"></div><div class="po-tie" style="left:2px"></div><div class="po-tie" style="right:2px"></div><div class="po-sw"></div><div class="po-fr"></div><div class="po-rod"></div>`;
  document.body.appendChild(ov);
  const q=x=>ov.querySelector(x),L=q(".po-l"),Rr=q(".po-r"),B=q(".po-beam"),V=q(".po-rv"),T=ov.querySelectorAll(".po-tie");
  const red=matchMedia("(prefers-reduced-motion: reduce)").matches,D=red?1400:4200,END=red?3200:8600;
  const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2,lerp=(a,b,t)=>a+(b-a)*t,cl=x=>Math.max(0,Math.min(1,x));
  const L0=[[0,0],[100,0],[100,46],[100,57],[100,100],[0,100]],L1=[[0,0],[100,0],[62,46],[44,57],[72,100],[0,100]];
  const poly=(t,m)=>"polygon("+L0.map((p,i)=>{let x=lerp(p[0],L1[i][0],t);const y=lerp(p[1],L1[i][1],t);if(m)x=100-x;return x+"% "+y+"%"}).join(",")+")";
  let done=false,raf=0;const s0=performance.now()+500;
  const finish=()=>{if(done)return;done=true;cancelAnimationFrame(raf);ov.style.transition="opacity .8s";ov.style.opacity="0";setTimeout(()=>{ov.remove();render();if(openIdx>=0)drawChat()},800)};
  const step=n=>{const ms=n-s0,e=ease(cl(ms/D));
    [[L,0],[Rr,1]].forEach(([c,m])=>{c.style.width=lerp(51,19,e)+"%";c.style.backgroundSize="100% 100%,"+lerp(46,12,e)+"px 100%";c.style.clipPath=poly(e,m);
      const sw=!red&&ms>D?Math.sin((ms-D)/260)*2.2*Math.exp(-(ms-D)/700):0;c.style.transform="skewX("+(m?-sw:sw)+"deg)"});
    T.forEach(x=>x.style.opacity=cl((ms-D*.86)/600));B.style.opacity=cl((ms-D*.43)/(D*.52));
    const r=ease(cl((ms-D*.55)/(D*.43)));V.style.opacity=r;V.style.transform="scale("+lerp(.88,1,r)+")";V.style.filter="blur("+lerp(8,0,r)+"px)";
    if(ms<END)raf=requestAnimationFrame(step);else finish()};
  ov.style.opacity="0";requestAnimationFrame(()=>{ov.style.transition="opacity .6s";ov.style.opacity="1";raf=requestAnimationFrame(step)});
  ov.onclick=finish;
}
function remoteStartListeners(){
  if(R.started)return;R.started=true;
  // yeni sürüm yüklendiyse kullanıcı kaldığı ekrana döner
  try{const k=sessionStorage.getItem("kulis_tab");if(k){sessionStorage.removeItem("kulis_tab");const o=JSON.parse(k);if(o&&o.tab){state.tab=o.tab;setTimeout(()=>{render();scrollTo(0,o.y||0)},50)}}}catch(e){}
  if(KDB.listenPerde)KDB.listenPerde(onPerde);
  if(KDB.listenEkipThread)KDB.listenEkipThread(onEkipThread);
  try{if(new URLSearchParams(location.search).get("ekip")==="1"){history.replaceState(null,"",location.pathname);setTimeout(()=>{state.tab="mesajlar";render();openEkip()},1200)}}catch(e){}
  KDB.listenUsers(list=>{R.usersRaw=list;list.forEach(u=>putUser(u.id,u));if($("#adm.open")&&ADM.tab==="uye"&&!document.activeElement.closest("#adm input"))openAdminRemote();refreshStats();if(state.tab==="kesfet")rerender()});
  if(KDB.listenMyAnon)KDB.listenMyAnon(ids=>{R.myAnon=new Set(ids);if(R.posts&&R.posts.length){R.mapped=R.posts.map(mapPost);state.myPosts=R.mapped.filter(p=>p.u==="me");rerender()}});
  KDB.listenPosts(list=>{R.posts=list;const mapped=list.map(mapPost);state.myPosts=mapped.filter(p=>p.u==="me");R.mapped=mapped;refreshStats();
    if(!$("#scrim").classList.contains("open")||!R.cmPid)rerender()});
  if(KDB.listenIncoming)KDB.listenIncoming(list=>{const d=list.sort((a,b)=>b.ts-a.ts)[0];if(d)showIncoming(d)});
  if(KDB.listenSettings)KDB.listenSettings(st=>{R.settings=st});
  KDB.listenNotifs(list=>{state.notifs=list.map(n=>({id:n.id,type:n.type,u:n.from,text:n.text,go:n.go,ts:n.ts,read:!!n.read}));render()});
  KDB.listenBlocks(ids=>{R.blocks=ids;ids.forEach(id=>{(R.mapped||[]).filter(p=>p.uid===id).forEach(p=>state.hidden.add("p:"+p.id));state.hidden.add("u:"+id)});rerender()});
  KDB.listenLikesToMe(list=>{LIKED_ME.clear();list.forEach(l=>LIKED_ME.add(l.from));if(state.tab==="kesfet"&&sw.mode==="eslesme")vEsles()});
  KDB.listenChats(list=>{
    const me=R.uid,seen=LS("kulis_seen",{});const chats=[],reqs=[];
    list.sort((a,b)=>(b.lastAt||0)-(a.lastAt||0)).forEach(c=>{
      const other=c.members.find(x=>x!==me)||c.members[0];
      const o=R.chats[c.id]||(R.chats[c.id]={id:c.id,u:other,msgs:[]});
      Object.assign(o,{u:other,from:c.from,status:c.status,match:!!c.match,reqBy:c.reqBy,lastBy:c.lastBy,lastAt:c.lastAt,last:c.last,srvN:c.n||0,ty:(c.ty||{})[other]||0,seenO:(c.seen||{})[other]||0});
      if(!o.msgs.length&&c.last)o.msgs=[{me:c.lastBy===me,t:c.last}];
      o.unread=c.lastBy&&c.lastBy!==me&&(c.lastAt||0)>(seen[c.id]||0);
      if(c.match)sw.matched.add(other);
      if(c.status==="wait"&&c.reqBy!==me)reqs.push({u:other,first:c.last||"",from:c.from,cid:c.id});else chats.push(o);
    });
    const openId=openIdx>=0&&state.chats[openIdx]?state.chats[openIdx].id:null;
    state.chats=chats;state.requests=reqs;
    if(openId){openIdx=state.chats.findIndex(c=>c.id===openId)}
    render();sohbetDurum();
  });
  setPremiumFrom(null);KDB.listenPremium(setPremiumFrom);playRestore();
  if(KDB.listenModeration)KDB.listenModeration(d=>{R.mod=d;if($("#adm.open")&&ADM.tab==="kelime")openAdminRemote()});
  const onReps=r=>{R.reports=r;if($("#adm.open")&&ADM.tab==="sikayet")openAdminRemote()};
  const onEkL=l=>{R.ekipList=l;if($("#adm.open")&&ADM.tab==="destek"&&!ADM.dm)openAdminRemote()};
  const onBans=l=>{R.bans=new Set((l||[]).map(x=>x.id));R.banList=l||[];if($("#adm.open"))openAdminRemote()};
  if(KDB.isMod)KDB.isMod().then(m=>{R.isMod=m;setPremiumFrom(R.lastPrem);if(m&&!R.admin){KDB.listenReports(onReps);if(KDB.listenBans)KDB.listenBans(onBans);if(KDB.listenEkipThreads)KDB.listenEkipThreads(onEkL)}});
  KDB.isAdmin().then(a=>{R.admin=a;setPremiumFrom(R.lastPrem);if(a&&KDB.listenMods)KDB.listenMods(l=>{R.mods=l;if($("#adm.open")&&ADM.tab==="mod")openAdminRemote()});if(a){KDB.listenReports(onReps);if(KDB.listenBans)KDB.listenBans(onBans);if(KDB.listenEkipThreads)KDB.listenEkipThreads(onEkL);if(KDB.listenErrors)KDB.listenErrors(l=>{R.errors=l;if($("#adm.open")&&ADM.tab==="hata")openAdminRemote()})}});
}
function askGender(){
  if(!state.me||state.me.g==="Kadın"||state.me.g==="Erkek"||$("#gAsk"))return;
  const g=document.createElement("div");g.className="cf-scrim";g.id="gAsk";g.setAttribute("role","dialog");g.setAttribute("aria-modal","true");
  g.innerHTML=`<div class="cf"><h2>Cinsiyetini seç</h2><p class="muted" style="font-size:14px;margin:6px 0 14px">Kulis'te erkekler kadınların, kadınlar erkeklerin itiraflarını görür ve eşleşir. Devam etmek için cinsiyetini seç. Sonradan değiştirilemez.</p>
    <div class="choice">${["Kadın","Erkek"].map(x=>`<button data-gq="${x}">${x}</button>`).join("")}</div></div>`;
  document.body.appendChild(g);
  g.querySelectorAll("[data-gq]").forEach(b=>b.onclick=()=>{state.me.g=b.dataset.gq;save();g.remove();toast("Cinsiyetin kaydedildi");render()});
}
function remoteEnterApp(pub,priv){
  R.uid=KDB.uid;
  const isPre=v=>v&&String(v).startsWith("preset:");
  if((pub.av&&!isPre(pub.av))||(pub.banner&&!isPre(pub.banner))){const f={};if(pub.av&&!isPre(pub.av))f.av=null;if(pub.banner&&!isPre(pub.banner))f.banner=null;KDB.updateProfile(f).catch(()=>{});if(pub.av&&!isPre(pub.av))pub.av=null;if(pub.banner&&!isPre(pub.banner))pub.banner=null}
  state.me={n:pub.n,c:pub.c,s:pub.s,g:pub.g,age:pub.age,bio:pub.bio||"",photo:pub.av||undefined,banner:pub.banner||undefined,
    ad:priv?priv.ad||"":"",soyad:priv?priv.soyad||"":"",email:priv?priv.email||"":"",b:priv?priv.b:undefined,provider:priv?priv.provider:(pub.guest?"guest":"")};
  R.syncedMe=JSON.stringify({n:state.me.n,c:state.me.c,bio:state.me.bio,photo:state.me.photo,banner:state.me.banner,g:state.me.g});
  $("#onb").hidden=true;$("#remLoad")&&$("#remLoad").remove();
  remoteStartListeners();render();askGender();iosInstallNudge();loadTurn();loadMyReal();
  if(KDB.logAccess)KDB.logAccess("giris");
  try{const cq=new URLSearchParams(location.search).get("call");if(cq&&KDB.getCall){history.replaceState(null,"",location.pathname);KDB.getCall(cq).then(d=>{if(d&&d.status==="ring"&&d.to===R.uid)showIncoming(d)}).catch(()=>{})}}catch(e){}
  if(KDB.pushSupported)KDB.pushSupported().then(ok=>{R.pushOk=ok;if(ok&&LS("kulis_push_on",false))KDB.refreshPush();if(state.tab==="ben")render()});
  const tch=()=>{if(KDB.touch)KDB.touch()};tch();if(!R.hb){R.hb=setInterval(()=>{if(!document.hidden)tch()},120e3);document.addEventListener("visibilitychange",()=>{if(!document.hidden)tch()})}
}
// profil değişikliklerini sunucuya yaz (takma ad, renk, profil cümlesi, hazır görseller, cinsiyet seçimi)
const ST_URL="https://firebasestorage.googleapis.com/v0/b/kulis-1647d.firebasestorage.app/o/";
function dataBlob(d){const [h,b]=d.split(",");const bin=atob(b),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:h.slice(5).split(";")[0]})}
function remoteSyncMe(){
  if(!state.me||!R.syncedMe||!KDB.uid)return;
  const cur={n:state.me.n,c:state.me.c,bio:state.me.bio||"",photo:state.me.photo,banner:state.me.banner,g:state.me.g};
  const old=JSON.parse(R.syncedMe);if(JSON.stringify(cur)===R.syncedMe)return;
  const f={};if(cur.n!==old.n)f.n=cur.n;if(cur.c!==old.c)f.c=cur.c;if(cur.bio!==old.bio)f.bio=cur.bio;
  const pre=v=>(v&&String(v).startsWith("preset:"))?v:null;
  if(pre(cur.photo)!==pre(old.photo))f.av=pre(cur.photo);if(pre(cur.banner)!==pre(old.banner))f.banner=pre(cur.banner);
  if(cur.g!==old.g&&old.g==="Belirtmeyeyim")f.g=cur.g;
  R.syncedMe=JSON.stringify(cur);
  if(Object.keys(f).length)KDB.updateProfile(f,old.n).catch(e=>toast("Profil kaydedilemedi: "+(e.code||e.message)));
}
function remoteLoading(on){
  let el=$("#remLoad");
  if(on&&!el){el=document.createElement("div");el.id="remLoad";el.innerHTML=`<div class="rl-in"><img src="icons/icon-192.png" alt="" width="72" height="72"><p>Kulis açılıyor…</p></div>`;document.body.appendChild(el)}
  if(!on&&el)el.remove();
}
function showBanned(b){remoteLoading(false);const g=document.createElement("div");g.className="cf-scrim";g.setAttribute("role","alertdialog");
  g.innerHTML=`<div class="cf"><h2>Hesabın kapatıldı</h2><p class="muted" style="font-size:14px;margin:8px 0 14px">Hesabın Kulis Topluluk Kuralları'na aykırılık nedeniyle kapatıldı${b&&b.reason?` (${esc(b.reason)})`:""}. Bir hata olduğunu düşünüyorsan mberkarabulut@gmail.com adresine yazabilirsin.</p><button class="btn wide" id="banOk">Tamam</button></div>`;
  document.body.appendChild(g);$("#banOk").onclick=()=>{g.remove();location.reload()}}
async function remoteAfterAuth(user,provider){
  if(KDB.myBan){const b=await KDB.myBan();if(b){await KDB.signOut().catch(()=>{});showBanned(b);return}}
  // sadece e-postası doğrulanmış hesaplar (Google veya e-posta bağlantısı) girebilir
  if(!KDB.isTest&&(user.isAnonymous||!user.emailVerified)){await KDB.signOut().catch(()=>{});remoteLoading(false);ob.provider=null;ob.step=0;startOnb();toast("Devam etmek için Google ya da e-posta bağlantısıyla giriş yap");return}
  remoteLoading(true);
  // kayıtlı kullanıcıyı asla yeniden kayıt ekranına düşürme: profil okunamazsa birkaç kez dene
  let pub=null,ok=false;
  let lastErr=null;
  for(let i=0;i<(KDB.longPolling?3:2)&&!ok;i++){try{pub=await KDB.getProfile(user.uid);ok=true}catch(e){lastErr=e;console.warn(e);await new Promise(r=>setTimeout(r,700*(i+1)))}}
  // normal bağlantı engellendiyse bir kereliğine yedek bağlantı moduyla yeniden aç
  if(!ok&&!KDB.longPolling){try{localStorage.setItem("kulis_lp","1")}catch(e){}location.reload();return}
  if(!ok){
    let exists=null;try{exists=await KDB.profileExistsREST(user.uid)}catch(e){}
    remoteLoading(false);const g=document.createElement("div");g.className="cf-scrim";
    g.innerHTML=`<div class="cf"><h2>Bağlanamadık</h2><p class="muted" style="font-size:14px;margin:6px 0 14px">${exists===true?"Hesabın duruyor ama tarayıcın Kulis'in sunucuyla konuşmasını engelliyor. Reklam ya da takip engelleyicinde kulistr.com'a izin verip tekrar dene.":"Hesabına ulaşırken bir sorun oldu. İnternetini kontrol edip tekrar dene."}</p><p class="hint" style="margin:0 0 12px">Hata: ${esc(String(lastErr&&(lastErr.code||lastErr.message)||"bilinmiyor"))}</p><button class="btn wide" id="rtY">Tekrar dene</button></div>`;
    document.body.appendChild(g);g.querySelector("#rtY").onclick=()=>location.reload();return}
  if(pub){const priv=await KDB.getPrivate().catch(()=>null);remoteEnterApp(pub,priv);return}
  remoteLoading(false);
  const pend=LS("kulis_ob",null);
  ob.provider=provider||(user.isAnonymous?"guest":(user.providerData[0]&&user.providerData[0].providerId==="google.com"?"google":"email"));
  if(pend){ob.ad=pend.ad||ob.ad;ob.soyad=pend.soyad||ob.soyad;ob.email=pend.email||ob.email;try{localStorage.removeItem("kulis_ob")}catch(e){}}
  if(!ob.email&&user.email)ob.email=user.email;
  if(!ob.ad&&user.displayName){const parts=user.displayName.trim().split(/\s+/);ob.soyad=parts.length>1?parts.pop():"";ob.ad=parts.join(" ")}
  ob.codeSent=true;ob.kod="000000";
  // Google bilgileri hazırsa bilgi ekranını atla, direkt takma ada geç
  ob.step=(ob.provider==="guest"||(ob.provider==="google"&&ob.ad&&ob.email))?1:0;$("#onb").hidden=false;drawOnb();$("#onb").scrollTop=0;
}
async function remoteFinishOnb(){
  const n=ob.n.trim();
  try{if(!(await KDB.nickFree(n))){toast("Bu takma ad alınmış, başka bir tane seç");ob.step=1;drawOnb();return}}catch(e){}
  const pub={n,c:ob.c,s:signOf(ob.m,ob.d),g:ob.g,age:ageBand(ageOf(ob.y,ob.m,ob.d)),bio:"",av:null,banner:null,guest:ob.provider==="guest"};
  const priv={ad:ob.ad.trim(),soyad:ob.soyad.trim(),email:ob.email.trim(),b:{d:ob.d,m:ob.m,y:ob.y},provider:ob.provider};
  try{const rf=localStorage.getItem("kulis_ref");if(rf&&rf!==KDB.uid)priv.ref=rf}catch(e){}
  remoteLoading(true);
  try{await KDB.createProfile(pub,priv);track("kayit",{yontem:ob.provider});remoteEnterApp(pub,priv);toast(`Hoş geldin ${n}`)}
  catch(e){remoteLoading(false);toast("Kayıt tamamlanamadı: "+(e.code||e.message))}
}
const IN_WEBVIEW=/Instagram|FBAN|FBAV|FB_IAB|WhatsApp|TikTok|musical_ly|BytedanceWebview|Snapchat|Line\/|Twitter|; wv\)/i.test(navigator.userAgent);
function showWebviewHelp(){
  const g=document.createElement("div");g.className="cf-scrim";g.setAttribute("role","dialog");g.setAttribute("aria-modal","true");
  g.innerHTML=`<div class="cf"><h2>Tarayıcıda aç</h2><p class="muted" style="font-size:14px;margin:6px 0 14px">Kulis'i bir uygulamanın içinden (WhatsApp, Instagram, TikTok gibi) açmışsın. Google bu pencerelerde girişe izin vermiyor. Sağ üstteki menüden <b>Chrome'da aç</b> ya da <b>Tarayıcıda aç</b>'a bas, veya linki kopyalayıp tarayıcına yapıştır.</p>
    <div style="display:grid;gap:8px"><button class="btn wide" id="wvC">Linki kopyala</button><button class="btn line wide" id="wvX">Tamam</button></div></div>`;
  document.body.appendChild(g);
  g.querySelector("#wvX").onclick=()=>g.remove();
  g.querySelector("#wvC").onclick=async()=>{try{await navigator.clipboard.writeText("https://kulistr.com/");toast("Link kopyalandı, tarayıcına yapıştır")}catch(e){toast("kulistr.com")}};
}
// sitede oluşan hataları (aynısını tekrar tekrar değil) yönetici paneline bildir
const ERR_SEEN=new Set();let errLast=0;
function reportError(msg,where){try{if(!REMOTE||!window.KDB||!KDB.uid||!KDB.logError)return;const k=String(msg).slice(0,120);if(ERR_SEEN.has(k)||Date.now()-errLast<25e3)return;ERR_SEEN.add(k);errLast=Date.now();KDB.logError(msg,where)}catch(e){}}
addEventListener("error",e=>{if(!e.message)return;reportError(`${e.message} @ ${(e.filename||"").split("/").pop()}:${e.lineno}`,"js")});
addEventListener("unhandledrejection",e=>{const r=e.reason;reportError((r&&(r.code||r.message))||String(r),"promise")});
function testLoginButton(){
  if(!window.KDB||!KDB.isTest||$("#tstBtn"))return;
  const b=document.createElement("button");b.id="tstBtn";b.className="btn line";b.textContent="TEST GİRİŞİ (sadece beta)";
  b.style.cssText="position:fixed;left:50%;transform:translateX(-50%);top:calc(10px + env(safe-area-inset-top));z-index:95;height:42px;background:var(--yuzey)";
  b.onclick=()=>KDB.anon().then(u=>{b.remove();ob.provider="google";ob.ad="Test";ob.soyad="Kullanıcı";ob.email="test@kulistr.com";remoteAfterAuth(u,"google")}).catch(e=>toast("Test girişi olmadı: "+(e.code||e.message)));
  document.body.appendChild(b);
}
/* ---- telefona bildirim ---- */
const IS_IOS=/iPhone|iPad|iPod/.test(navigator.userAgent),IS_STANDALONE=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
function pushState(){
  if(!REMOTE||!R.pushOk){if(IS_IOS&&!IS_STANDALONE)return "ios";return "yok"}
  return Notification.permission==="granted"&&LS("kulis_push_on",false)?"acik":Notification.permission==="denied"?"engelli":"kapali";
}
function pushCard(where){
  const st=pushState();if(st==="acik"||st==="yok")return "";
  if(where==="nf"&&LS("kulis_push_x",0)>Date.now())return "";
  if(st==="ios")return `<div class="push-card">${IC.spark}<span><b>Bildirim almak ister misin?</b>iPhone'da önce Paylaş → Ana Ekrana Ekle ile Kulis'i ana ekrana ekle, oradan aç.</span></div>`;
  if(st==="engelli")return where==="nf"?"":`<div class="push-card">${IC.spark}<span><b>Bildirimler engelli</b>Tarayıcı ayarlarından kulistr.com için bildirimlere izin ver.</span></div>`;
  return `<div class="push-card">${IC.spark}<span><b>Telefonuna bildirim gelsin</b>Mesaj, yorum ya da eşleşme olunca site kapalıyken bile haberin olsun.</span><button class="btn" data-push="on">Aç</button>${where==="nf"?`<button class="ib" data-push="x" aria-label="Kapat">${IC.close}</button>`:""}</div>`;
}
async function turnPushOn(btn){
  if(btn)btn.disabled=true;
  try{const p=await Notification.requestPermission();if(p!=="granted"){toast("Bildirim izni verilmedi");if(btn)btn.disabled=false;return}
    await KDB.enablePush();LSset("kulis_push_on",true);toast("Bildirimler açık");track("bildirim_acik");render();if($("#scrim").classList.contains("open"))showNotifs()}
  catch(e){if(btn)btn.disabled=false;toast("Bildirim açılamadı: "+(e.code||e.message))}
}
async function turnPushOff(){await KDB.disablePush().catch(()=>{});LSset("kulis_push_on",false);toast("Telefon bildirimleri kapalı");render()}
document.addEventListener("click",e=>{const b=e.target.closest("[data-push]");if(!b)return;const a=b.dataset.push;
  if(a==="on")turnPushOn(b);else if(a==="off")turnPushOff();else if(a==="x"){LSset("kulis_push_x",Date.now()+7*864e5);b.closest(".push-card").remove()}});
async function showInviteRemote(){
  const url="https://kulistr.com/?ref="+KDB.uid,text="Kulis'te takma adla itiraf ediliyor, burç uyumuna göre eşleşiliyor. Bu linkle gel: "+url;
  track("davet");
  const draw=c=>{const n=c.count||0,left=3-(n%3);openSheet(`<h2>Arkadaşını davet et</h2>
    <p class="muted" style="font-size:14px;margin:6px 0 14px">Senin linkinle katılan her <b>3 kişi</b> için <b>1 hafta Premium</b> kazanırsın. Katılan kişinin e-postasını doğrulaması gerekir.</p>
    <div class="adm-stats" style="grid-template-columns:1fr 1fr;margin-bottom:14px"><div><b>${n}</b><small>Seninle katılan</small></div><div><b>${left}</b><small>Sonraki ödüle kalan</small></div></div>
    <div class="box" style="padding:10px 12px;font-size:13.5px;overflow-wrap:anywhere">${esc(url)}</div>
    <div style="display:grid;gap:8px;margin-top:12px"><button class="btn wide" id="invS">Paylaş</button><button class="btn line wide" id="invC">Linki kopyala</button></div>`);
    $("#invC").onclick=async()=>{try{await navigator.clipboard.writeText(text);toast("Davet linki kopyalandı")}catch(e){toast(url)}};
    $("#invS").onclick=()=>{if(navigator.share)navigator.share({title:"Kulis",text,url}).catch(()=>{});else $("#invC").click()}};
  draw({count:0});KDB.refInfo().then(c=>{if($("#invS"))draw(c)}).catch(()=>{});
}
function remoteInit(){
  // giriş düğmeleri: Google, Apple, e-posta bağlantısı ve misafir girişi
  document.addEventListener("click",e=>{
    if($("#onb").hidden)return;
    const pv=e.target.closest("[data-prov]");
    if(pv&&pv.dataset.prov==="google"){e.stopImmediatePropagation();e.preventDefault();
      if(IN_WEBVIEW){showWebviewHelp();return}
      if(!window.KDB){toast("Bir saniye, bağlantı kuruluyor… Tekrar dokun.");return}
      KDB.google().then(u=>remoteAfterAuth(u,"google")).catch(err=>{const c=err&&err.code;if(c==="auth/popup-closed-by-user"||c==="auth/cancelled-popup-request")return;
        if(c==="auth/user-disabled"){showBanned(null);return}
        if(c==="auth/popup-blocked"){toast("Giriş penceresi engellendi. Tarayıcıda açılır pencerelere izin verip tekrar dene.");return}
        if(c==="auth/operation-not-supported-in-this-environment"||c==="auth/web-storage-unsupported"){showWebviewHelp();return}
        toast("Google ile giriş olmadı: "+(c||err.message))});return}
    if(pv&&pv.dataset.prov==="apple"){e.stopImmediatePropagation();e.preventDefault();toast("Apple ile giriş yakında. Şimdilik Google ya da e-postayla devam et.");return}

  },true);
  remoteLoading(true);
  // Hızlı açılış: bu cihazda hiç Kulis oturumu yoksa (yeni ziyaretçi) karşılama ekranını Firebase'i beklemeden göster
  try{if(!/[?&](oobCode|apiKey)=/.test(location.search)&&indexedDB.databases)indexedDB.databases().then(l=>{
    const lsOturum=Object.keys(localStorage).some(k=>k.startsWith("firebase:authUser"));
    if(!R.started&&!R.onbErken&&!lsOturum&&!l.some(d=>d.name==="firebaseLocalStorageDb")){R.onbErken=true;remoteLoading(false);misafirBasla()}}).catch(()=>{})}catch(e){}
  const go=async()=>{
    if(KDB.isLink()){
      let mail=localStorage.getItem("kulis_mail");
      if(!mail){remoteLoading(false);mail=prompt("Güvenlik için e-posta adresini tekrar yaz")||"";remoteLoading(true)}
      try{const u=await KDB.finishLink(mail);await remoteAfterAuth(u,"email");return}catch(e){toast("Giriş bağlantısı geçersiz ya da süresi dolmuş. Tekrar dene.")}
    }
    let first=true;
    KDB.onAuth(u=>{if(!first)return;first=false;
      if(u)remoteAfterAuth(u);else{remoteLoading(false);if(!R.onbErken)misafirBasla();testLoginButton()}});
  };
  if(window.KDB)go();else addEventListener("kdb-ready",go,{once:true});
}
