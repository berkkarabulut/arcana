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
/* Profilim kısayol kutucuğu: simge, sayı, etiket. Dört kutucuk tek kartta yan yana durur. */
const PK_IC={
  seri:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21c-3.9 0-7-2.8-7-6.6 0-2.6 1.4-4.6 3-6.2.3 1.6 1.1 2.7 2.3 3.2C10 7.6 11.6 5 14.5 3c-.3 2.6.6 4.4 2 6.1 1.4 1.6 2.5 3.2 2.5 5.4C19 18.3 15.9 21 12 21z"/><path d="M12 21c-1.7 0-3-1.2-3-2.9 0-1.8 1.4-2.7 2.3-4.1.9 1.4 3.7 2.4 3.7 4.2 0 1.6-1.3 2.8-3 2.8z"/></svg>',
  soru:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z"/><path d="M10 9.6a2.1 2.1 0 1 1 3 1.9c-.6.3-1 .8-1 1.5"/><path d="M12 15.6h.01"/></svg>',
  ziyaret:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  begenen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>'};
function pkHTML(k,n,etiket,yeni){return `<button class="ks ks-${k}${yeni?" yeni":""}" data-pk="${k}" aria-label="${esc(etiket)}: ${n}"><i class="ks-i" aria-hidden="true">${PK_IC[k]}</i><b>${n}</b><span>${etiket}</span></button>`}
function seriTileHTML(){const n=seriSimdi();return pkHTML("seri",n,"günlük seri",false).replace("<button",'<button id="seriTile"')}
function showSeri(){
  const n=seriSimdi(),en=SERI&&SERI.en||0,bugun=SERI&&SERI.gun===trGun();
  openSheet(`<div class="sheet-head"><h2>Günlük seri</h2></div>
    <div class="seri-b${n?"":" sifir"}"><i class="seri-alev" aria-hidden="true">${PK_IC.seri}</i><div><b>${n}<small> gün</small></b><span>${n?`${n} gündür her gün buradasın.`:"Henüz bir serin yok. Bugün başla."}</span></div></div>
    <p class="muted" style="margin:10px 0">${bugun?"Bugünü tamamladın. Yarın bir itirafa tepki bırakman ya da bir mesaj yazman seriyi sürdürür.":"Bugün bir itirafa tepki bırak, yorum yap ya da bir mesaj yaz: serin büyüsün."}</p>
    ${(()=>{const sonraki=SERI_ROZET.find(r=>r>n),onceki=[...SERI_ROZET].reverse().find(r=>r<=n)||0;
      const yuzde=sonraki?Math.max(4,Math.round(n/sonraki*100)):100;
      return `${sonraki?`<div class="seri-hedef"><div><b>Sıradaki rozet: ${sonraki} gün</b><span>${sonraki-n} gün kaldı</span></div><div class="seri-bar" role="progressbar" aria-valuenow="${n}" aria-valuemax="${sonraki}"><i style="width:${yuzde}%"></i></div></div>`:`<div class="seri-hedef"><b>Bütün rozetleri topladın</b></div>`}
      <ol class="seri-r" aria-label="Seri rozetleri">${SERI_ROZET.map(r=>`<li class="${en>=r?"on":""}"><span>${r}</span><small>gün</small></li>`).join("")}</ol>`})()}
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
