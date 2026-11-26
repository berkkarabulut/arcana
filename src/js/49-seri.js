/* ============ GÜNLÜK SERİ ============
   Her gün en az bir şey yapan (tepki, yorum, itiraf, mesaj, Keşfet'te kaydırma, paylaşım) serisini büyütür.
   Bir gün atlanırsa seri 1'den başlar; en uzun seri saklanır. 3, 7, 14, 30, 50, 100. günlerde kutlama.
   Serisi en az 3 gün olan ve o gün henüz bir şey yapmamış kişiye sunucu akşam hatırlatma gönderir. */
let SERI=null;// {gun,n,en}
const SERI_ROZET=[3,7,14,30,50,100];
const trGun=(o=0)=>new Date(Date.now()+3*36e5+o*864e5).toISOString().slice(0,10);
function seriSimdi(){if(!SERI)return 0;return SERI.gun===trGun()||SERI.gun===trGun(-1)?SERI.n:0}
function seriIsaretle(){
  if(!state.me||(typeof MSF!=="undefined"&&MSF.on))return;
  const bugun=trGun();if(SERI&&SERI.gun===bugun)return;
  const n=SERI&&SERI.gun===trGun(-1)?SERI.n+1:1,en=Math.max(n,SERI&&SERI.en||0);
  SERI={gun:bugun,n,en};
  try{localStorage.setItem("kulis_seri_"+(REMOTE?R.uid:"demo"),JSON.stringify(SERI))}catch(e){}
  if(REMOTE&&window.KDB&&KDB.seriYaz)KDB.seriYaz(SERI).catch(()=>{});
  if(SERI_ROZET.includes(n)){track("seri_"+n);setTimeout(()=>toast(`🔥 ${n} günlük seri! ${n>=7?"Kulis'in müdavimlerindensin.":"Yarın da gel, seri büyüsün."}`),500)}
  else if(n>1)setTimeout(()=>toast(`🔥 Serin ${n} gün`),500);
  const t=$("#seriTile");if(t)t.outerHTML=seriTileHTML();
}
function seriTileHTML(){const n=seriSimdi();return `<button class="pk" id="seriTile" data-pk="seri"><b>🔥 ${n}</b><span>günlük seri</span></button>`}
function showSeri(){
  const n=seriSimdi(),en=SERI&&SERI.en||0,bugun=SERI&&SERI.gun===trGun();
  openSheet(`<div class="sheet-head"><h2>Günlük seri</h2></div>
    <div class="seri-b"><b>🔥 ${n}</b><span>${n?`${n} gündür her gün buradasın.`:"Henüz bir serin yok."}</span></div>
    <p class="muted" style="margin:10px 0">${bugun?"Bugünü tamamladın. Yarın bir itirafa tepki bırakman ya da bir mesaj yazman seriyi sürdürür.":"Bugün bir itirafa tepki bırak, yorum yap ya da bir mesaj yaz: serin büyüsün."}</p>
    <div class="seri-r">${SERI_ROZET.map(r=>`<span class="${en>=r?"on":""}">${r} gün</span>`).join("")}</div>
    <p class="hint" style="margin-top:10px">En uzun serin: ${en} gün</p>`);
}
// eylemleri yakala
{const trS=track;track=function(ad,p){try{if(["itiraf_yazildi","yorum","mesaj","eslesme","begen","paylas","mesaj_tepki","buz_kirici"].includes(ad))seriIsaretle()}catch(e){}return trS(ad,p)}}
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-react]"))setTimeout(()=>{try{seriIsaretle()}catch(x){}},0)},true);
{const deSeri=decide;decide=function(c,like){deSeri(c,like);try{seriIsaretle()}catch(e){}}}
// girişte sunucudan oku (yoksa bu cihazdaki kopya)
{const reaSeri=remoteEnterApp;remoteEnterApp=function(a,b){const r=reaSeri(a,b);
  try{SERI=JSON.parse(localStorage.getItem("kulis_seri_"+R.uid)||"null")}catch(e){}
  if(window.KDB&&KDB.seriOku)KDB.seriOku().then(d=>{if(d&&(!SERI||d.gun>=SERI.gun))SERI={gun:d.gun,n:d.n,en:d.en};const t=$("#seriTile");if(t)t.outerHTML=seriTileHTML()});
  return r}}
