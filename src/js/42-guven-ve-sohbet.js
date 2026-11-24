/* ============ GÜVEN VE SOHBET EKLERİ ============ */
// Yazıyor / görüldü, ekran görüntüsü uyarısı, "kimler bana yazabilir" kontrolü, itiraf kaydetme, şikâyet sonucu bildirimi.
NIC.rapor="flag";NIC.kilometre="spark";NIC.hatirla="spark";NIC.duyuru="spark";

// ---- Sohbet: ekran görüntüsü uyarısı, yazıyor, görüldü ----
// Sohbet ekranı baştan çizilmez (yazdığın metin silinmesin); sadece göstergeler güncellenir.
const SD={seenAt:{},lsAt:{},st:{},iv:null,pcOff:null,tyOff:null,pcFor:null,yaziyorum:null,tyT:null};
const YAZIYOR_MS=7000;
function sohbetDurum(){
  if(!REMOTE||openIdx<0)return;
  const c=state.chats[openIdx],box=$("#msgs");if(!c||!box)return;
  sohbetBaslik(c);
  // karşı tarafın son görülmesini dakikada bir tazele
  if(c.u&&Date.now()-(SD.lsAt[c.u]||0)>60e3){SD.lsAt[c.u]=Date.now();Promise.all([KDB.userPub(c.u),KDB.getSettings(c.u)]).then(([x,st])=>{SD.st[c.u]=st||{};if(x)putUser(c.u,x);if(state.chats[openIdx]===c)sohbetBaslik(c)})}
  // karşı taraf yazıyor mu
  // anlık kanal (yazmayı bırakınca hemen silinir) + eski sürümlerin sohbet kaydına yazdığı işaret
  const yaz=c.status==="open"&&((c.tyRt&&Date.now()-c.tyRt<30e3)||(c.ty&&Date.now()-c.ty<YAZIYOR_MS));
  let ty=$("#sdTy");
  if(yaz&&!ty){ty=document.createElement("div");ty.id="sdTy";ty.className="typing";ty.setAttribute("aria-label",(U[c.u]?U[c.u].n:"Karşı taraf")+" yazıyor");ty.innerHTML="<i></i><i></i><i></i>";box.appendChild(ty);box.scrollTop=box.scrollHeight}
  else if(!yaz&&ty)ty.remove();
  // görüldü: son mesaj benimse ve karşı taraf ondan sonra sohbete baktıysa
  const old=$("#sdSeen");if(old)old.remove();
  const son=c.msgs[c.msgs.length-1];
  if(son&&son.me&&son.ts&&c.seenO&&c.seenO>=son.ts){
    const s=document.createElement("div");s.id="sdSeen";s.className="sd-seen";s.textContent="Görüldü";
    const t=$("#sdTy");t?box.insertBefore(s,t):box.appendChild(s)}
  // ben gördüm: karşıdan yeni mesaj geldiyse (okundu bilgisi kapalı değilse)
  const sonO=[...c.msgs].reverse().find(m=>!m.me&&m.ts);
  if(sonO&&document.visibilityState==="visible"&&(R.settings||{}).okundu!==false&&(SD.seenAt[c.id]||0)<sonO.ts){SD.seenAt[c.id]=Date.now();KDB.seen(c.id)}
}
// Çevrimiçi / son görülme: anlık durum veritabanından (bağlantı kopunca kendiliğinden çevrimdışı olur).
// Anlık kaydı olmayan (eski sürüm) kişilerde 2 dakikalık "buradayım" sinyaline (lastSeen) bakılır.
const CEVRIMICI_MS=3.5*60e3;
function durumYazi(k){
  if(!REMOTE)return "çevrimiçi";
  // karşılıklı: ben gizlediysem ya da karşı taraf gizlediyse gösterme
  if((R.settings||{}).songor===false||(SD.st[k]||{}).songor===false)return "";
  const u=U[k];if(!u)return "";
  if(u.on===true)return "çevrimiçi";
  const ls=Math.max(u.ls||0,u.rtTs||0);if(!ls)return "";
  const f=Date.now()-ls;
  if(u.on===undefined&&f<CEVRIMICI_MS)return "çevrimiçi";
  if(f<60e3)return "az önce görüldü";
  if(f<60*60e3)return `${Math.round(f/60e3)} dk önce görüldü`;
  const d=new Date(ls),bugun=new Date();bugun.setHours(0,0,0,0);
  if(ls>=bugun.getTime())return `bugün ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}'de görüldü`;
  if(ls>=bugun.getTime()-864e5)return "dün görüldü";
  const g=Math.floor((bugun.getTime()-ls)/864e5)+1;return g<30?`${g} gün önce görüldü`:"uzun süredir görülmedi";
}
function sohbetBaslik(c){
  const sm=$("#chatIn .chat-h .who small"),u=U[c.u];if(!sm||!u||c.status==="wait")return;
  const dy=durumYazi(c.u),t=`${Z[u.s].n}${dy?", "+dy:""}`;if(sm.textContent!==t)sm.textContent=t;
  sm.classList.toggle("on",dy==="çevrimiçi");
}
function sohbetUyari(){
  const box=$("#msgs");if(!box||$("#sdUy"))return;
  const o=box.querySelector(".origin"),d=document.createElement("div");
  d.id="sdUy";d.className="sd-uyari";d.innerHTML=`${IC.lock}<span>Mesajların sadece ikiniz arasında kalır, ama hiçbir site ekran görüntüsünü engelleyemez. Adres, numara ve tanınabilir fotoğraf paylaşırken dikkatli ol.</span>`;
  o?o.after(d):box.prepend(d);
}
{
  const dc0=drawChat;
  drawChat=function(){
    dc0();sohbetUyari();
    if(!REMOTE)return;
    const c=state.chats[openIdx];if(!c)return;
    // karşı tarafın anlık durumunu ve yazıyor bilgisini dinle (sohbet değişince eskisini bırak)
    if(SD.pcFor!==c.id){durumBirak();SD.pcFor=c.id;
      SD.pcOff=KDB.watchPresence(c.u,v=>{const u=U[c.u];if(!u)return;u.on=v?!!v.on:undefined;u.rtTs=v&&v.ts||0;if(state.chats[openIdx]===c)sohbetBaslik(c)});
      SD.tyOff=KDB.watchTyping(c.id,c.u,v=>{c.tyRt=v||0;if(state.chats[openIdx]===c)sohbetDurum()})}
    sohbetDurum();
    // yazıyor: yazmaya başlayınca işaret konur, 3 saniye durunca ya da mesaj gidince hemen kalkar
    const t=$("#mIn");
    if(t&&c.status==="open"){
      if(SD.yaziyorum&&!t.value.trim())yaziyorBitti();
      t.addEventListener("input",()=>{if((R.settings||{}).yaziyor===false)return;
        if(!t.value.trim()){yaziyorBitti();return}
        if(SD.yaziyorum!==c.id){SD.yaziyorum=c.id;KDB.typingRt(c.id,true)}
        clearTimeout(SD.tyT);SD.tyT=setTimeout(yaziyorBitti,3000)});
    }
    if(!SD.iv)SD.iv=setInterval(()=>{if(openIdx<0){clearInterval(SD.iv);SD.iv=null;return}sohbetDurum()},2000);
  };
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")sohbetDurum()});
  if(REMOTE){const cc0=closeChat;closeChat=function(){yaziyorBitti();durumBirak();return cc0()}}
}
function yaziyorBitti(){clearTimeout(SD.tyT);if(SD.yaziyorum){KDB.typingRt(SD.yaziyorum,false);SD.yaziyorum=null}}
function durumBirak(){if(SD.pcOff)SD.pcOff();if(SD.tyOff)SD.tyOff();SD.pcOff=SD.tyOff=null;SD.pcFor=null}
// kendi durumum: ekrandaysam çevrimiçi, arka plandaysam çevrimdışı, son görülmemi gizlediysem hiç kayıt yok
function durumGonder(){
  if(!REMOTE||!R.uid||!KDB.presence)return;
  if(!R.settingsOk){setTimeout(durumGonder,1000);return}
  KDB.presence((R.settings||{}).songor===false?"gizli":!document.hidden);
}
if(REMOTE){
  document.addEventListener("visibilitychange",durumGonder);
  addEventListener("pagehide",()=>{if(R.uid&&KDB.presence&&(R.settings||{}).songor!==false)KDB.presence(false)});
}

// ---- Kimler bana yazabilir: istek göndermeden önce karşı tarafın ayarına bak ----
if(REMOTE){
  const sd0=startDM;
  startDM=function(k,fromId){
    if(state.chats.some(c=>c.u===k)||!KDB.getSettings)return sd0(k,fromId);
    KDB.getSettings(k).then(st=>{
      const dm=st.dm||"herkes",n=U[k]?esc(U[k].n):"Bu kişi";
      if(dm==="herkes")return sd0(k,fromId);
      openSheet(`<h2>${n} şu an mesaj almıyor</h2><p class="muted" style="margin:8px 0 16px">${dm==="kimse"
        ?`${n}, ayarlarından yeni mesajları kapatmış. Açık sohbetler dışında kimse ona yazamıyor.`
        :`${n} sadece Eşleş'te karşılıklı beğendiği kişilerden mesaj alıyor. Keşfet'te onu beğen; o da seni beğenirse sohbetiniz kendiliğinden açılır.`}</p>
        ${dm==="eslesme"?`<button class="btn wide" id="dmEs">Keşfet'e git</button>`:""}<button class="btn line wide" style="margin-top:8px" onclick="closeSheet()">Tamam</button>`);
      const b=$("#dmEs");if(b)b.onclick=()=>{closeSheet();closeChat();state.tab="kesfet";sw.mode="eslesme";render();scrollTo(0,0)};
    });
  };
}

// ---- İtiraf kaydetme ----
R.kayit=R.kayit||new Set();
if(!REMOTE)try{(JSON.parse(localStorage.getItem("kulis_kayit")||"[]")||[]).forEach(id=>R.kayit.add(id))}catch(e){}
function kaydetDegis(id){
  const on=!R.kayit.has(id);
  if(on)R.kayit.add(id);else R.kayit.delete(id);
  if(REMOTE)KDB.save(id,on).catch(e=>{if(on)R.kayit.delete(id);else R.kayit.add(id);toast("Olmadı: "+(e.code||e.message))});
  else LSset("kulis_kayit",[...R.kayit]);
  toast(on?"Kaydedildi. Profilim > Kaydettiklerim'de bulursun":"Kaydedilenlerden çıkarıldı");
}
async function showSaved(){
  const ids=[...R.kayit];
  openSheet(`<div class="sheet-head"><h2>Kaydettiklerim</h2><button class="x" onclick="closeSheet()" aria-label="Kapat">${IC.close}</button></div><div id="kyIc">${ids.length?`<p class="hint">Yükleniyor…</p>`:`<p class="empty">Henüz bir itiraf kaydetmedin. Bir itirafın “…” menüsünden “Kaydet”e basınca burada toplanır.</p>`}</div>`);
  if(!ids.length)return;
  const hepsi=allPosts();
  const list=(await Promise.all(ids.map(async id=>{let p=hepsi.find(x=>x.id===id);if(p)return p;
    if(!REMOTE)return null;const x=await KDB.getPost(id);if(!x)return {id,gone:true};p=mapPost(x);if(R.mapped&&!R.mapped.some(y=>y.id===id))R.mapped.push(p);return p}))).filter(Boolean);
  const box=$("#kyIc");if(!box)return;
  box.innerHTML=list.map(p=>p.gone?`<div class="mini"><q>Bu itiraf silinmiş.</q><div class="on"><button class="mini-sh" data-kyx="${p.id}">Listeden çıkar</button></div></div>`
    :`<div class="mini"><q data-kyo="${p.id}" style="cursor:pointer">“${esc(p.t)}”</q><div class="on">${CATN[p.cat]||""}, ${reactTotal(p)} tepki<button class="mini-sh" data-kyx="${p.id}">Kaydı kaldır</button></div></div>`).join("");
  box.querySelectorAll("[data-kyo]").forEach(b=>b.onclick=()=>showPost(b.dataset.kyo));
  box.querySelectorAll("[data-kyx]").forEach(b=>b.onclick=()=>{const id=b.dataset.kyx;if(R.kayit.has(id))kaydetDegis(id);b.closest(".mini").remove();if(!box.children.length)box.innerHTML=`<p class="empty">Kaydettiğin itiraf kalmadı.</p>`});
}
{
  // "…" menüsüne Kaydet
  const sm0=showMore;
  showMore=function(id){
    sm0(id);
    const m=$("#sheet .menu"),x=$("#m4");if(!m||!x)return;
    const b=document.createElement("button");b.id="mKy";b.innerHTML=`${IC.chk||IC.spark}${R.kayit.has(id)?"Kaydedilenlerden çıkar":"Kaydet"}`;
    b.onclick=()=>{closeSheet();kaydetDegis(id)};m.insertBefore(b,m.firstChild);
  };
  // Profilim'e "Kaydettiklerim" sekmesi
  const vb0=vBen;
  vBen=function(){
    vb0();
    const tb=view.querySelector(".tabs");if(!tb||$("#kyTab"))return;
    const b=document.createElement("button");b.id="kyTab";b.setAttribute("aria-pressed","false");b.textContent=`Kaydettiklerim${R.kayit.size?" ("+R.kayit.size+")":""}`;b.onclick=showSaved;tb.appendChild(b);
  };
}
if(REMOTE){
  const rea1=remoteEnterApp;
  remoteEnterApp=function(a,b){const r=rea1(a,b);durumGonder();if(KDB.listenSaved)KDB.listenSaved(l=>{R.kayit=new Set(l.map(x=>x.id));if(state.tab==="ben"){const t=$("#kyTab");if(t)t.textContent=`Kaydettiklerim${R.kayit.size?" ("+R.kayit.size+")":""}`}});return r};
}

// ---- Yaş filtresi (Keşfet: Eşleş ve Uyumlu kişiler) ----
const YAS_GRUP=[["hepsi","Hepsi"],["18-24","18-24"],["25-34","25-34"],["35+","35+"]];
function yasOk(k){
  const f=state.yasF||"hepsi";if(f==="hepsi")return true;
  const u=U[k];if(!u||!u.age)return false;const n=parseInt(u.age,10);if(!n)return false;
  return f==="18-24"?n<25:f==="25-34"?n>=25&&n<35:n>=35;
}
try{state.yasF=localStorage.getItem("kulis_yas")||"hepsi"}catch(e){state.yasF="hepsi"}
{
  const sp0=swipePool;swipePool=function(){return sp0().filter(c=>yasOk(c.u))};
  const vk0=vKesfet;
  vKesfet=function(){
    vk0();
    const body=$("#ksBody");if(!body||$("#yasF"))return;
    const d=document.createElement("div");d.id="yasF";d.className="yas-f";d.setAttribute("role","group");d.setAttribute("aria-label","Yaş aralığı");
    d.innerHTML=`<span>Yaş</span>${YAS_GRUP.map(([k,l])=>`<button class="c" data-yas="${k}" aria-pressed="${state.yasF===k}">${l}</button>`).join("")}`;
    body.parentNode.insertBefore(d,body);
    d.querySelectorAll("[data-yas]").forEach(b=>b.onclick=()=>{state.yasF=b.dataset.yas;try{localStorage.setItem("kulis_yas",state.yasF)}catch(e){}vKesfet()});
  };
}
