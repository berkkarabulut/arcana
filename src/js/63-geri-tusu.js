/* ============ TARAYICI / TELEFON GERİ TUŞU ============
   Geri: önce en üstteki pencere (alt sayfa, yönetim, yasal metin, sohbet) kapanır, sonra bir önceki sekmeye dönülür, en sonda siteden çıkılır.
   Uygulama kökte değilken geçmişte tek bir "bekçi" kaydı tutulur; geri basılınca o harcanır, gerekirse yeniden konur. Arama ekranı geri ile kapanmaz. */
{
  let sekmeYigin=[],sonSekme=null,donuyor=false;
  const by=i=>document.getElementById(i),acik=s=>{const e=by(s);return !!(e&&e.classList.contains("open"))};
  const kokte=()=>!acik("scrim")&&!acik("adm")&&!acik("legal")&&!acik("chat")&&!acik("callscr")&&!sekmeYigin.length&&state.tab==="akis";
  const bekciVar=()=>!!(history.state&&history.state.kg);
  const bekciKoy=()=>{try{if(!kokte()&&!bekciVar())history.pushState({kg:1},"",location.href)}catch(e){}};
  const sonra=()=>setTimeout(bekciKoy,0);
  const r0=render;render=function(){
    if(!donuyor&&sonSekme&&state.tab!==sonSekme){const i=sekmeYigin.lastIndexOf(state.tab);if(i>=0)sekmeYigin.length=i;else sekmeYigin.push(sonSekme);if(state.tab==="akis")sekmeYigin=[];if(sekmeYigin.length>15)sekmeYigin.shift()}
    sonSekme=state.tab;const s=r0.apply(this,arguments);sonra();return s};
  const os0=openSheet;openSheet=function(){const s=os0.apply(this,arguments);sonra();return s};
  const oc0=openChat;openChat=function(){const s=oc0.apply(this,arguments);sonra();return s};
  // yönetim paneli / yasal metin gibi geç yüklenen pencereler için: her dokunuştan sonra bir kez bak
  document.addEventListener("click",()=>{setTimeout(bekciKoy,450)});
  function geriIsle(){
    if(acik("callscr")){toast("Aramadayken geri gidilmez, kapatmak için kırmızı tuşa bas");return}
    if(acik("scrim")){tryCloseSheet();return}
    if(acik("legal")){const x=by("lgX");if(x)x.click();else by("legal").classList.remove("open");return}
    if(acik("adm")){if(typeof closeAdmin==="function")closeAdmin();else by("adm").classList.remove("open");return}
    if(acik("chat")){closeChat();return}
    if(sekmeYigin.length||state.tab!=="akis"){donuyor=true;try{state.tab=sekmeYigin.pop()||"akis";render();scrollTo(0,0)}finally{donuyor=false}return}
  }
  addEventListener("popstate",e=>{
    if(kokte()){try{history.back()}catch(x){}return}// kökteyiz: kalan bekçi kaydını da geç, siteden çık
    geriIsle();bekciKoy();
  });
  sonSekme=state.tab;sonra();
}
