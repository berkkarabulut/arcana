/* ============ ANA EKRANA EKLE (PWA) ============ */
let instEvt=null;
addEventListener("beforeinstallprompt",e=>{e.preventDefault();instEvt=e;if(state.tab==="akis"&&state.me)render()});
addEventListener("appinstalled",()=>{instEvt=null;toast("Kulis ana ekranına eklendi");render()});
const isStandalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const isMobile=()=>isIOS()||/android/i.test(navigator.userAgent);
const inAppBrowser=()=>/Instagram|FBAN|FBAV|TikTok|musical_ly|Snapchat|Line\//i.test(navigator.userAgent);
const PHONE_DL='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M12 7v7"/><path d="M9 11l3 3 3-3"/></svg>';
function instBanner(){
  let off=false;try{off=localStorage.getItem("arcana_inst_off")==="1"}catch(e){}
  if(isStandalone()||off||!(instEvt||isMobile()))return "";
  return `<div class="inst" id="inst"><img src="icons/icon-192.png" alt="" width="44" height="44"><span><b>Kulis'i ana ekranına ekle</b><small>Uygulama gibi tam ekran açılır.</small></span><button class="btn" id="instGo">Ekle</button><button class="inst-x" id="instX" aria-label="Kapat">${IC.close}</button></div>`;
}
function bindInst(){
  const g=$("#instGo");if(g)g.onclick=installApp;
  const x=$("#instX");if(x)x.onclick=()=>{try{localStorage.setItem("arcana_inst_off","1")}catch(e){}$("#inst").remove();toast("Profilim'den istediğin zaman ekleyebilirsin")};
}
async function installApp(){
  if(instEvt){instEvt.prompt();const r=await instEvt.userChoice.catch(()=>null);instEvt=null;if(r&&r.outcome==="accepted")toast("Ekleniyor…");return}
  const step=(n,t)=>`<li><span class="n">${n}</span><span>${t}</span></li>`;
  const SHARE='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  let body;
  if(inAppBrowser())body=`<p class="muted" style="margin-bottom:12px">Şu an Instagram ya da TikTok'un kendi tarayıcısındasın, buradan ana ekrana eklenmiyor.</p><ol class="inst-steps">${step(1,"Sağ üstteki <b>⋯</b> menüsüne dokun")}${step(2,isIOS()?"<b>Safari'de aç</b>'ı seç":"<b>Tarayıcıda aç</b>'ı seç")}${step(3,"Açılan sayfada bu adımları tekrar et")}</ol>`;
  else if(isIOS())body=`<ol class="inst-steps">${step(1,`Safari'de alttaki <b>Paylaş</b> ${SHARE} simgesine dokun`)}${step(2,"Listeyi aşağı kaydır, <b>Ana Ekrana Ekle</b>'yi seç")}${step(3,"Sağ üstteki <b>Ekle</b>'ye dokun")}</ol><p class="hint" style="margin-top:12px">iPhone'da bu sadece Safari'de çalışır. Chrome'daysan linki Safari'de aç.</p>`;
  else body=`<ol class="inst-steps">${step(1,"Tarayıcının sağ üstündeki <b>⋮</b> menüsüne dokun")}${step(2,"<b>Ana ekrana ekle</b> ya da <b>Uygulamayı yükle</b>'yi seç")}${step(3,"<b>Ekle</b>'ye dokun")}</ol>`;
  openSheet(`<div class="sheet-head"><h2>Ana ekrana ekle</h2></div>
    <div class="inst-hero"><img src="icons/icon-192.png" alt="" width="64" height="64"><div><b>Kulis</b><small>Telefonunda uygulama gibi dursun</small></div></div>${body}
    <button class="btn wide" style="margin-top:16px" onclick="closeSheet()">Tamam</button>`);
}
// iPhone/iPad'de Safari'den girenlere bir kere "ana ekrana ekle" açılır penceresi (3 günde bir en fazla)
function iosInstallNudge(){
  if(!isIOS()||isStandalone())return;
  let last=0;try{last=+localStorage.getItem("kulis_ios_nudge")||0}catch(e){}
  let now=false;try{now=sessionStorage.getItem("kulis_ios_now")==="1";sessionStorage.removeItem("kulis_ios_now")}catch(e){}
  if(!now&&Date.now()-last<3*864e5)return;
  setTimeout(()=>{
    if(isStandalone()||$("#scrim").classList.contains("open")||$("#gAsk")||$(".cf-scrim")){if(now)try{sessionStorage.setItem("kulis_ios_now","1")}catch(e){}return}
    try{localStorage.setItem("kulis_ios_nudge",String(Date.now()))}catch(e){}
    installApp();
    const sh=$("#sheet"),ok=sh.querySelector(".btn.wide");
    if(ok){ok.textContent="Tamam, ekledim";const l=document.createElement("button");l.className="dice";l.style.cssText="margin:10px auto 0;display:flex";l.textContent="Sonra hatırlat";l.onclick=closeSheet;ok.after(l)}
    const h=sh.querySelector(".sheet-head h2");if(h)h.textContent="iPhone'una Kulis'i ekle";
  },now?1200:4000);
}
if("serviceWorker" in navigator&&location.protocol==="https:")addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));

