/* ============ MİSAFİR: üye olmadan göz atma ============ */
// Yeni gelen kişi kayıt ekranı yerine en çok tepki alan 5 itirafı görür (Instagram gibi).
// 5'ten fazlasını göremez; tepki, yorum, mesaj, itiraf yazma, diğer sekmeler gibi her etkileşimde üyelik istenir.
// İtirafları sunucudaki misafirAkis fonksiyonu verir: en fazla 5 tane, yazarın hesap kimliği olmadan.
const MSF_URL="https://europe-west1-kulis-1647d.cloudfunctions.net/misafirAkis";
const MSF={on:false,hazir:false,gozuktu:false};
function misafirBasla(){
  if(MSF.on||state.me||R.started)return;
  MSF.on=true;MSF.hazir=false;
  remoteLoading(false);$("#onb").hidden=true;
  state.tab="akis";state.cat="hepsi";state.sort="populer";
  document.body.classList.add("misafir");
  render();track("misafir_giris");
  fetch(MSF_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:'{"data":{}}'})
    .then(r=>r.ok?r.json():Promise.reject(new Error("durum "+r.status)))
    .then(j=>{
      const list=(j&&j.result&&j.result.list)||[];
      if(!list.length)throw new Error("bos");
      R.mapped=list.slice(0,5).map(p=>{
        if(!p.anon)putUser(p.k,p.a||{});
        return {id:p.id,feat:0,anon:!!p.anon,ag:p.a&&p.a.g||null,u:p.anon?"anon":p.k,uid:p.anon?"anon":p.k,cat:p.cat,q:null,t:p.t,ts:p.ts,ago:agoOf(p.ts),r:p.r||{bende:0,saril:0,yok:0},cm:[],cmCount:p.cm||0,today:false}});
      MSF.hazir=true;if(MSF.on)render();
    })
    .catch(()=>{if(!MSF.on)return;misafirBitir();startOnb()});
}
function misafirBitir(){
  if(!MSF.on)return;MSF.on=false;
  document.body.classList.remove("misafir");
  R.mapped=[];
  ["#msfDuvar","#msfGeri"].forEach(s=>{const e=$(s);e&&e.remove()});
  if(MSF.kaydirma){removeEventListener("scroll",MSF.kaydirma);MSF.kaydirma=null}
}
// kayıt / giriş ekranını aç; misafir isterse çarpıyla akışa geri dönebilir
function misafirKayit(google){
  const d=$("#msfDuvar");d&&d.remove();
  startOnb();
  if(!$("#msfGeri")){const b=document.createElement("button");b.id="msfGeri";b.className="ib";b.setAttribute("aria-label","Kapat, itiraflara dön");b.innerHTML=IC.close;
    b.onclick=()=>{$("#onb").hidden=true;b.remove();render()};$("#onb").appendChild(b)}
  if(google){const g=$('#onb [data-prov="google"]');if(g)g.click()}
}
// Instagram tarzı alttan açılan üyelik penceresi
function misafirDuvar(neden){
  if($("#msfDuvar")||!MSF.on)return;
  track("misafir_duvar",{neden:neden||"kaydirma"});
  const baslik={tepki:"Tepki vermek için üye ol",yorum:"Yorumları okumak için üye ol",mesaj:"Mesaj atmak için üye ol",itiraf:"İtiraf etmek için üye ol",sekme:"Devam etmek için üye ol",profil:"Profilleri görmek için üye ol"}[neden]||"Devamını görmek için üye ol";
  const g=document.createElement("div");g.id="msfDuvar";g.setAttribute("role","dialog");g.setAttribute("aria-modal","true");g.setAttribute("aria-labelledby","msfB");
  g.innerHTML=`<div class="msf-kart"><button class="ib msf-x" aria-label="Kapat">${IC.close}</button>
    <img src="icons/icon-192.png" alt="" width="56" height="56">
    <h2 id="msfB">${baslik}</h2>
    <p>Kulis'te herkes takma adla yazar. Bütün itirafları oku, tepki ver, yorum yaz, sana uyan kişilerle eşleş.</p>
    <button class="btn wide" data-msf="google">Google ile devam et</button>
    <button class="btn line wide" data-msf="kayit">E-posta ile üye ol</button>
    <small>Adın ve e-postan gizli kalır, kimse görmez.</small></div>`;
  document.body.appendChild(g);
  g.onclick=e=>{const b=e.target.closest("[data-msf]");if(b){misafirKayit(b.dataset.msf==="google");return}
    if(e.target===g||e.target.closest(".msf-x"))g.remove()};
}
if(REMOTE){
  // misafirken sadece sunucunun verdiği 5 itiraf görünür
  const ap0=allPosts;allPosts=function(){return MSF.on?(R.mapped||[]).slice(0,5):ap0()};
  const ib0=instBanner;instBanner=function(){return MSF.on?"":ib0()};
  const vA0=vAkis;
  vAkis=function(){
    if(MSF.on&&!MSF.hazir){view.innerHTML=`<div class="msf-yuk"><span></span><span></span><span></span></div>`;return}
    vA0();
    if(!MSF.on)return;
    view.insertAdjacentHTML("afterbegin",`<div class="msf-ust"><b>Kulis'te bugün en çok konuşulanlar</b><span>Üye olmadan ilk 5 itirafı okuyabilirsin.</span></div>`);
    view.insertAdjacentHTML("beforeend",`<div class="msf-son" id="msfSon"><div class="msf-hayal" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="msf-son-in"><b>Devamı üyelere açık</b><p>Bütün itirafları görmek, tepki vermek ve yorum yazmak için üye ol. 30 saniye sürer.</p>
      <button class="btn wide" data-msf-ac="google">Google ile devam et</button><button class="btn line wide" data-msf-ac="kayit">E-posta ile üye ol</button></div></div>`);
    view.querySelectorAll("[data-msf-ac]").forEach(b=>b.onclick=()=>misafirKayit(b.dataset.msfAc==="google"));
    // 5. itirafın sonuna kaydırarak gelince üyelik penceresi bir kez kendiliğinden açılır (sayfa açılır açılmaz değil)
    if(!MSF.kaydirma){MSF.kaydirma=()=>{if(!MSF.on||MSF.gozuktu||scrollY<80)return;const s=$("#msfSon");if(!s)return;
      if(s.getBoundingClientRect().top<innerHeight*.6){MSF.gozuktu=true;setTimeout(()=>misafirDuvar("kaydirma"),300)}};
      addEventListener("scroll",MSF.kaydirma,{passive:true})}
  };
  // giriş yapılınca misafir modu biter
  const rea0=remoteEnterApp;remoteEnterApp=function(a,b){misafirBitir();const x=$("#msfGeri");x&&x.remove();return rea0(a,b)};
  // misafirken her etkileşim üyelik ister; okumak, yasal metinler ve çerez tercihi serbest
  document.addEventListener("click",e=>{
    if(!MSF.on||!$("#onb").hidden)return;
    const t=e.target;
    if(t.closest("#msfDuvar,#ckb,#msfSon,#toast,.toast,#tstBtn,#remLoad"))return;
    if($("#scrim")&&$("#scrim").classList.contains("open")&&t.closest("#scrim"))return; // açık yasal metin vb.
    const el=t.closest("button,a,input,textarea,select,label,[data-open],[data-u],[role=button]");
    if(!el)return;
    if(el.closest("[data-legal]")||el.matches('.nb[data-tab="akis"]'))return;
    e.preventDefault();e.stopImmediatePropagation();
    const n=el.closest("[data-react]")?"tepki":el.closest("[data-open]")?"yorum":el.closest("[data-dm]")?"mesaj":el.closest("#confessBtn")?"itiraf":el.closest(".nb")?"sekme":el.closest("[data-u],.who")?"profil":"sekme";
    misafirDuvar(n);
  },true);
}
