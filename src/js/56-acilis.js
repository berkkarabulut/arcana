/* ============ AÇILIŞ DÖNEMİ ============
   Yönetici panelindeki anahtar config/genel.acilis'i açınca: herkes Kulis Tam gibi kullanır (sunucu kuralları da aynı anahtara bakar),
   Premium satış izleri gizlenir, yerine "açılış dönemi, ücretsiz" ve "uygulamalar yakında" bilgisi çıkar.
   Anahtar kapanınca her şey eski haline döner; Premium kodu silinmedi, sadece uyuyor. */
R.acilis=false;
function acilisPenceresi(){
  openSheet(`<div class="ac-p">
    <span class="ac-i" aria-hidden="true">${IC.spark}</span>
    <h2>Açılış dönemi: Kulis tamamen ücretsiz</h2>
    <p class="muted">Mesajlaşma, sesli ve görüntülü arama, Eşleş ve seni beğenenler; hepsi şu an herkese açık, sınır yok.</p>
    <div class="ac-hediye"><b>Erken gelene teşekkür</b><span>Açılış döneminde katılan herkese <b>Kurucu üye</b> rozeti. Kurucu görevlerini bitirene de uygulamalar çıkınca <b>1 ay Premium</b> hediye.</span><button class="btn sm ac-gv" id="acGv">Görevlere bak</button></div>
    ${uygHTML()}
    <button class="btn line wide" onclick="closeSheet()" style="margin-top:6px">Tamam</button></div>`);
  const ag=$("#acGv");if(ag)ag.onclick=()=>{closeSheet();if(typeof showGorevler==="function")showGorevler()};
  track("acilis_pencere");
}
{const sp0=showPremium;showPremium=function(){if(R.acilis){acilisPenceresi();return}return sp0.apply(this,arguments)}}
{const spr0=showPremiumRemote;showPremiumRemote=function(){if(R.acilis){acilisPenceresi();return}return spr0.apply(this,arguments)}}
{const r0=render;render=function(){r0.apply(this,arguments);if(R.acilis){const p=$("#premPill");if(p){p.innerHTML=`${IC.spark}<span>Ücretsiz</span>`;p.classList.add("ac-pill");p.setAttribute("aria-label","Açılış dönemi: ücretsiz")}}else{const p=$("#premPill");if(p)p.classList.remove("ac-pill")}}}
{const pill=$("#premPill");if(pill){const eski=pill.onclick;pill.onclick=e=>{if(R.acilis){acilisPenceresi();return}eski&&eski.call(pill,e)}}}
function acilisDinle(){
  KDB.listenGenel(d=>{const a=!!(d&&d.acilis===true);if(a===R.acilis)return;R.acilis=a;document.body.classList.toggle("acilis",a);
    if(typeof setPremiumFrom==="function")setPremiumFrom(R.lastPrem||null);render();if(openIdx>=0)drawChat()});
}
{let basladi=false;const t=setInterval(()=>{if(basladi)return;if(REMOTE&&window.KDB&&KDB.listenGenel&&R.uid){basladi=true;clearInterval(t);acilisDinle()}},1500)}
