/* ============ BİLDİRİM İZNİNİ KENDİMİZ İSTE ============
   Önceden izin sadece bildirimler penceresindeki küçük karttan açılıyordu, kimse açmıyordu.
   - İzin zaten verilmişse (ör. Android uygulamasında) ama cihaz kaydı yoksa: sessizce kaydet.
   - İzin hiç sorulmamışsa: girişten biraz sonra, ekranda başka pencere yokken, bir kez nazikçe sor.
     "Şimdi değil" derse 3 gün sonra yeniden sorar. Tarayıcı "engelle" dediyse bir daha sormaz. */
const BILDIRIM_SOR_ARA=3*864e5;
function bildirimSorUygun(){
  if(!REMOTE||!state.me||!R.uid||!R.pushOk||typeof Notification==="undefined")return false;
  if(Notification.permission!=="default")return false;
  if(LS("kulis_push_sor",0)>Date.now())return false;
  if(!popupHakki())return false;
  if($("#scrim")&&$("#scrim").classList.contains("open"))return false;
  if(openIdx>=0)return false;// sohbetin ortasında bölme
  return true;
}
function bildirimSorPenceresi(){
  LSset("kulis_push_sor",Date.now()+BILDIRIM_SOR_ARA);popupKullan();track("bildirim_sor");
  openSheet(`<div class="bs-p">
    <span class="bs-i" aria-hidden="true">${AY_IC.zil}</span>
    <h2>Kimse sana yazdığında haberin olsun</h2>
    <p class="muted">Kulis kapalıyken bile telefonuna kısa bir bildirim gelir. Mesajının içeriği bildirimde görünmez.</p>
    <ul class="bs-l"><li>Biri sana mesaj ya da istek gönderince</li><li>İtirafına yorum ve tepki gelince</li><li>Biriyle eşleşince</li></ul>
    <div class="bs-b"><button class="btn wide" id="bsAc">Bildirimleri aç</button><button class="btn line wide" id="bsNo">Şimdi değil</button></div>
    <p class="hint">İstediğin zaman Ayarlar'dan kapatabilirsin.</p></div>`);
  $("#bsNo").onclick=()=>{track("bildirim_sor_hayir");closeSheet()};
  $("#bsAc").onclick=async()=>{closeSheet();await turnPushOn(null)};
}
async function bildirimSessizKaydet(){
  // İzin var ama bu cihaz kayıtlı değil: sor(ma)madan kaydet
  if(!REMOTE||!R.uid||!R.pushOk||typeof Notification==="undefined"||Notification.permission!=="granted")return;
  if(LS("kulis_push_on",false)&&localStorage.getItem("kulis_push"))return;
  try{await KDB.enablePush();LSset("kulis_push_on",true);track("bildirim_sessiz_kayit")}catch(e){}
}
{let ilk=0,bitti=false;
  const t=setInterval(()=>{
    if(bitti)return;
    if(REMOTE&&R.uid&&R.pushOk&&typeof Notification!=="undefined"&&Notification.permission==="granted"){bitti=true;clearInterval(t);bildirimSessizKaydet();return}
    if(!bildirimSorUygun()){ilk=0;return}
    if(!ilk){ilk=Date.now();return}
    // uygulamada (Android) biraz erken, sitede biraz geç sor
    if(Date.now()-ilk>=(IN_APP?6e3:20e3)){bitti=true;clearInterval(t);bildirimSorPenceresi()}
  },3000);
}
