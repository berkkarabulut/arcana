/* ============ KURUCU GÖREVLERİ ============
   Açılış döneminde 6 görevi bitirene, uygulamalar çıkınca 1 ay Premium. İlerlemeyi sunucu (gorevDurum) hesaplar;
   cihaz sadece kendi görebildiği iki şeyi bildirir: Kulis ana ekrandan açıldı ve link paylaşıldı.
   Profilim'de ilerleme kartı, dokununca yeşil tiklerle ilerleyen görev ekranı. */
R.gorev=null;
const GOREV_LISTE=[
  {k:"profil",t:"Profilini tamamla",d:"Profil görseli ve kapak seç, kendini anlatan kısa bir cümle yaz. Hazır görseller de olur, gerçek fotoğraf gerekmez.",b:"Profili düzenle"},
  {k:"anaEkran",t:"Kulis'i ana ekranına ekle",d:"Ana ekrana ekle, sonra Kulis'i bir kez oradan aç. Uygulama gibi tam ekran açılır.",b:"Ana ekrana ekle"},
  {k:"bildirim",t:"Bildirimleri aç",d:"Biri sana yazınca ya da itirafına tepki gelince haberin olsun.",b:"Bildirimleri aç"},
  {k:"itiraf",t:"3 gün üst üste itiraf yaz",d:"Art arda üç gün, her gün en az bir itiraf. Anonim itiraflar da sayılır.",b:"İtiraf et"},
  {k:"gun",t:"15 farklı gün Kulis'e gir",d:"Üst üste olması gerekmez, açtığın her gün sayılır.",b:""},
  {k:"paylas",t:"Linkini paylaş ya da birini davet et",d:"Anonim soru linkini hikâyende paylaş ya da bir arkadaşını davet et.",b:"Linkimi paylaş"}];
const GOREV_YESIL='#22B07D';
let gorevYukleniyor=null,gorevSon=0;
function gorevGetir(bildir,zorla){
  if(!REMOTE||!R.uid||!KDB.gorevDurum)return Promise.resolve(R.gorev);
  if(!bildir&&!zorla&&gorevYukleniyor)return gorevYukleniyor;
  if(!bildir&&!zorla&&R.gorev&&Date.now()-gorevSon<60e3)return Promise.resolve(R.gorev);
  gorevYukleniyor=KDB.gorevDurum(bildir).then(g=>{const once=R.gorev;R.gorev=g;gorevSon=Date.now();gorevYukleniyor=null;
    if(once&&!once.tamam&&g.tamam)gorevKutla();
    if(state.tab==="ben")render();if($("#gvIc"))gorevCiz();return g}).catch(()=>{gorevYukleniyor=null;return R.gorev});
  return gorevYukleniyor;
}
const gorevSay=g=>g?GOREV_LISTE.filter(x=>g.gorevler&&g.gorevler[x.k]).length:0;
function gorevHalka(n,top,boy){const r=(boy-8)/2,c=2*Math.PI*r,o=c*(1-n/top);
  return `<svg class="gv-halka" width="${boy}" height="${boy}" viewBox="0 0 ${boy} ${boy}" aria-hidden="true"><circle cx="${boy/2}" cy="${boy/2}" r="${r}" fill="none" stroke="var(--cizgi)" stroke-width="6"/><circle cx="${boy/2}" cy="${boy/2}" r="${r}" fill="none" stroke="${GOREV_YESIL}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${o}" transform="rotate(-90 ${boy/2} ${boy/2})"/></svg>`}
function gorevKartHTML(){
  const g=R.gorev,n=gorevSay(g),bitti=g&&g.tamam;
  return `<button class="gv-kart${bitti?" bitti":""}" id="gvKart"><span class="gv-k-h">${gorevHalka(n,6,52)}<b>${n}/6</b></span>
    <span class="gv-k-t"><b>Kurucu görevleri</b><small>${bitti?"Hepsi tamam! 1 ay Premium hakkını kazandın.":g?"Hepsini bitir, 1 ay Premium kazan":"Yükleniyor…"}</small></span><span class="gv-k-o" aria-hidden="true">${IC.chev||"›"}</span></button>`;
}
function gorevAlt(k,g){
  if(!g)return "";
  if(k==="gun")return `${Math.min(g.gunSay||0,15)}/15 gün`;
  if(k==="itiraf")return `En uzun serin: ${Math.min(g.itirafSeri||0,3)}/3 gün`;
  return "";
}
function gorevCiz(){
  const box=$("#gvIc");if(!box)return;const g=R.gorev,n=gorevSay(g);
  box.innerHTML=`<div class="gv-ust">${gorevHalka(n,6,84)}<div><b>${n}/6</b><span>${g&&g.tamam?"Tebrikler, hepsini bitirdin!":"görev tamam"}</span></div></div>
    ${g&&g.tamam?`<div class="gv-odul">${IC.spark}<span><b>1 ay Premium hakkını kazandın.</b> Kulis uygulamaları mağazalara çıkıp Premium başladığında hesabına otomatik yüklenecek. Kurucu üye rozetin de hazır.</span></div>`
      :`<p class="muted gv-acik">Altı görevin hepsini bitirene, uygulamalar çıkınca <b>1 ay Premium</b> hediye. Açılış döneminde katılan herkes ayrıca <b>Kurucu üye</b> rozeti alır.</p>`}
    <ol class="gv-l">${GOREV_LISTE.map((x,i)=>{const ok=!!(g&&g.gorevler&&g.gorevler[x.k]),alt=gorevAlt(x.k,g);
      return `<li class="gv-g${ok?" ok":""}"><span class="gv-tik" aria-hidden="true">${ok?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':i+1}</span>
        <div class="gv-m"><b>${x.t}</b><small>${ok?"Tamamlandı":x.d}</small>${!ok&&alt?`<em>${alt}</em>`:""}</div>
        ${!ok&&x.b?`<button class="btn sm gv-b" data-gv="${x.k}">${x.b}</button>`:""}<span class="sr-only">${ok?"tamamlandı":"yapılmadı"}</span></li>`}).join("")}</ol>
    <p class="hint gv-not">İlerlemeni Kulis sayar. Bir görevi yaptın ama tik gelmediyse birkaç dakika sonra bu ekranı yeniden aç.</p>`;
  box.querySelectorAll("[data-gv]").forEach(b=>b.onclick=()=>gorevYap(b.dataset.gv,b));
}
function gorevYap(k,btn){
  track("gorev_"+k);
  if(k==="profil"){closeSheet();showEditProfile();return}
  if(k==="anaEkran"){if(isStandalone()||IN_APP){gorevGetir("anaEkran");return}closeSheet();installApp();return}
  if(k==="bildirim"){turnPushOn(btn).then(()=>setTimeout(()=>gorevGetir(null,true),1500));return}
  if(k==="itiraf"){closeSheet();showConfess();return}
  if(k==="paylas"){closeSheet();soruPaylas();return}
}
function showGorevler(){
  openSheet(`<div class="sheet-head"><h2>Kurucu görevleri</h2></div><div id="gvIc"></div>`);gorevCiz();gorevGetir(null,true);track("gorev_ac");
}
function gorevKutla(){toast("Bütün kurucu görevlerini bitirdin! 1 ay Premium hakkın hazır 🎉");track("gorev_tamam")}
// Profilim'e kart: kısayol kutucuklarının hemen altına
{const r0=render;render=function(){r0.apply(this,arguments);
  if(!REMOTE||!R.acilis||state.tab!=="ben"||!state.me)return;
  const row=$("#pkRow");if(!row||$("#gvKart"))return;row.insertAdjacentHTML("afterend",gorevKartHTML());
  $("#gvKart").onclick=showGorevler;if(!R.gorev)gorevGetir()}}
// paylaşım ve davet düğmeleri görevi işaretler
document.addEventListener("click",e=>{if(e.target.closest("#sqGo,#sqKp,#sqDl,#invS,#invC"))gorevGetir("paylas")},true);
addEventListener("appinstalled",()=>gorevGetir("anaEkran"));
// açılışta bugünü say; ana ekrandan açıldıysa bildir
{let ilk=false;const t=setInterval(()=>{if(ilk)return;if(REMOTE&&R.uid&&window.KDB&&KDB.gorevDurum){ilk=true;clearInterval(t);
  setTimeout(()=>gorevGetir((isStandalone()||IN_APP)?"anaEkran":null,true),4000)}},2000)}
