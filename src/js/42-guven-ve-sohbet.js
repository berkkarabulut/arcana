/* ============ GÜVEN VE SOHBET EKLERİ ============ */
// Yazıyor / görüldü, ekran görüntüsü uyarısı, "kimler bana yazabilir" kontrolü, itiraf kaydetme, şikâyet sonucu bildirimi.
NIC.rapor="flag";

// ---- Sohbet: ekran görüntüsü uyarısı, yazıyor, görüldü ----
// Sohbet ekranı baştan çizilmez (yazdığın metin silinmesin); sadece göstergeler güncellenir.
const SD={tyAt:0,seenAt:{},iv:null};
const YAZIYOR_MS=7000;
function sohbetDurum(){
  if(!REMOTE||openIdx<0)return;
  const c=state.chats[openIdx],box=$("#msgs");if(!c||!box)return;
  // karşı taraf yazıyor mu
  const yaz=c.status==="open"&&c.ty&&Date.now()-c.ty<YAZIYOR_MS;
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
    sohbetDurum();
    // yazıyor sinyali: en fazla 4 saniyede bir, ayarlardan kapatılmadıysa
    const t=$("#mIn");if(t&&c.status==="open")t.addEventListener("input",()=>{if((R.settings||{}).yaziyor===false||!t.value.trim())return;if(Date.now()-SD.tyAt>4000){SD.tyAt=Date.now();KDB.typing(c.id)}});
    if(!SD.iv)SD.iv=setInterval(()=>{if(openIdx<0){clearInterval(SD.iv);SD.iv=null;return}sohbetDurum()},2000);
  };
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")sohbetDurum()});
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
  remoteEnterApp=function(a,b){const r=rea1(a,b);if(KDB.listenSaved)KDB.listenSaved(l=>{R.kayit=new Set(l.map(x=>x.id));if(state.tab==="ben"){const t=$("#kyTab");if(t)t.textContent=`Kaydettiklerim${R.kayit.size?" ("+R.kayit.size+")":""}`}});return r};
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
