/* ============ ÇEREZ ONAYI ve GOOGLE ANALYTICS ============ */
const GA_ID="G-399L057981";
const consent=()=>{try{return localStorage.getItem("arcana_consent")}catch(e){return null}};
function loadGA(){
  if(!GA_ID||window.gtag||!/github\.io$|arcana|kulis/.test(location.hostname))return;
  const sc=document.createElement("script");sc.async=true;sc.src="https://www.googletagmanager.com/gtag/js?id="+GA_ID;document.head.appendChild(sc);
  window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};
  gtag("js",new Date());gtag("config",GA_ID,{allow_google_signals:false,allow_ad_personalization_signals:false});
}
function setConsent(ok){
  try{localStorage.setItem("arcana_consent",ok?"yes":"no")}catch(e){}
  const c=$("#ckb");if(c)c.remove();
  if(ok)loadGA();else if(window.gtag){location.reload()}
}
function showConsent(force){
  if(!GA_ID||(!force&&consent()))return;
  const old=$("#ckb");if(old)old.remove();
  const el=document.createElement("div");el.id="ckb";el.setAttribute("role","dialog");el.setAttribute("aria-label","Çerez tercihleri");
  el.innerHTML=`<p><b>Çerez tercihin</b>Uygulamayı geliştirmek için Google Analytics ile kullanım istatistiği toplamak istiyoruz. İtirafların, mesajların ve adın asla paylaşılmaz. <a href="gizlilik.html" data-legal="kvkk">Ayrıntılar</a></p>
    <div><button class="btn line" id="ckNo">Sadece gerekli</button><button class="btn" id="ckYes">Kabul et</button></div>`;
  document.body.appendChild(el);
  $("#ckYes").onclick=()=>{setConsent(true);toast("Teşekkürler")};
  $("#ckNo").onclick=()=>setConsent(false);
}
if(consent()==="yes")loadGA();
setTimeout(()=>showConsent(),1200);

