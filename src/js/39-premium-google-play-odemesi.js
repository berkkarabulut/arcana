/* ============ PREMIUM: GOOGLE PLAY ÖDEMESİ ============ */
// Play'den indirilen uygulamada gerçek abonelik (Google Play Billing, Digital Goods API).
// Tarayıcıdan girenlere uygulama yayınlanana kadar Premium ücretsiz.
const WEB_FREE_PREMIUM=false;
const PLAY_BILLING="https://play.google.com/billing";
// Üyelik paketleri: 3 seviye x 3 süre. Ürün kimliği: kulis_<seviye>_<süre>
const TIERS=[
  {k:"sohbet",n:"Sohbet",d:"Sınırsız konuşma",perks:["Sınırsız mesaj ve sohbet","İtiraflara sınırsız cevap"],pr:{haftalik:"29,90 ₺",aylik:"79,90 ₺",yillik:"549 ₺"}},
  {k:"ses",n:"Sohbet + Ses",d:"Konuşma ve sesli arama",perks:["Sınırsız mesaj ve sohbet","İtiraflara sınırsız cevap","Sesli arama"],pr:{haftalik:"49,90 ₺",aylik:"129,90 ₺",yillik:"899 ₺"}},
  {k:"tam",n:"Kulis Tam",d:"Her şey sınırsız",perks:["Sınırsız mesaj ve sohbet","İtiraflara sınırsız cevap","Sesli ve görüntülü arama","Eşleş'te sınırsız kaydırma ve geri alma","Seni beğenenleri gör"],pr:{haftalik:"69,90 ₺",aylik:"179,90 ₺",yillik:"1.249 ₺"}}];
const PERIODS=[["haftalik","Haftalık","Her hafta yenilenir"],["aylik","Aylık","Haftalığa göre ~%40 avantajlı"],["yillik","Yıllık","Aylığa göre ~%40 avantajlı"]];
const skuOf=(t,p)=>`kulis_${t}_${p}`;
const ALL_SKUS=TIERS.flatMap(t=>PERIODS.map(([p])=>skuOf(t.k,p)));
const PREM_PERKS=TIERS[2].perks;
const IN_APP=(()=>{try{if(document.referrer.startsWith("android-app://")||new URLSearchParams(location.search).get("src")==="twa")sessionStorage.setItem("kulis_app","1");return sessionStorage.getItem("kulis_app")==="1"||new URLSearchParams(location.search).get("src")==="twa"}catch(e){return false}})();
let playSvc=null,playPrices={};
async function playService(){
  if(playSvc!==null)return playSvc;playSvc=false;
  try{if("getDigitalGoodsService" in window){playSvc=await window.getDigitalGoodsService(PLAY_BILLING)||false}}catch(e){playSvc=false}
  if(playSvc){try{(await playSvc.getDetails(ALL_SKUS)).forEach(d=>{playPrices[d.itemId]=new Intl.NumberFormat("tr-TR",{style:"currency",currency:d.price.currency}).format(+d.price.value)})}catch(e){}}
  return playSvc;
}
function setPremiumFrom(p){
  if(REMOTE)R.lastPrem=p;
  const on=!!(p&&p.active&&(p.until||0)>Date.now());
  // Premium sadece satın alanlarda. Yönetici ve moderatörlerde her şey açık.
  // Google Play inceleme hesabı: satın alma yapamadıkları için tüm özellikler açık
  const web=REMOTE&&((WEB_FREE_PREMIUM&&!IN_APP)||R.admin===true||R.isMod===true||["kulistrinfo@gmail.com"].includes(String(KDB.email||"").toLowerCase()));
  const was=state.premium,wasT=state.tier;state.premium=web||on;state.premUntil=on?p.until:0;
  state.tier=web?"tam":on?(p.tier||(String(p.productId||"").split("_")[1])||"tam"):null;
  if(wasT!==state.tier&&state.me&&was===state.premium){render();if(openIdx>=0)drawChat()}
  if(was!==state.premium&&state.me){render();if(openIdx>=0)drawChat()}
}
// uygulama açılınca mevcut abonelikleri yeniden doğrula (yenilenme / iptal güncellensin)
async function playRestore(){
  if(!IN_APP)return;const svc=await playService();if(!svc)return;
  try{for(const p of await svc.listPurchases()){if(ALL_SKUS.includes(p.itemId))await KDB.verifyPurchase(p.itemId,p.purchaseToken).catch(()=>{})}}catch(e){}
}
async function playBuy(sku,btn){
  const svc=await playService();
  if(!svc){toast("Google Play ödemesi açılamadı. Uygulamayı Play Store'dan güncelleyip tekrar dene.");return}
  if(btn)btn.disabled=true;
  try{
    const req=new PaymentRequest([{supportedMethods:PLAY_BILLING,data:{sku}}],{total:{label:"Toplam",amount:{currency:"TRY",value:"0"}}});
    const resp=await req.show();
    const token=resp.details&&resp.details.purchaseToken;
    let ok=false;try{const r=await KDB.verifyPurchase(sku,token);ok=!!r.active}catch(e){}
    await resp.complete(ok?"success":"fail");
    if(ok){track("premium",{plan:sku});closeSheet();toast("Premium açık. İyi sohbetler!")}
    else toast("Ödeme alındı ama doğrulanamadı. Birkaç dakika sonra uygulamayı yeniden aç, düzelmezse bize yaz.");
  }catch(e){if(e&&e.name!=="AbortError")toast("Ödeme tamamlanamadı")}
  finally{if(btn)btn.disabled=false}
}
function showPremiumRemote(src){
  let tier="ses",per="aylik";const web=!IN_APP;
  // her paket sadece bir öncekine göre neyi eklediğini söyler
  const FARK={sohbet:["Sınırsız mesaj ve sohbet","İtiraflara sınırsız cevap"],ses:["Sohbet paketindeki her şey","Sesli arama"],tam:["Sohbet + Ses'teki her şey","Görüntülü arama","Eşleş'te sınırsız kaydırma ve geri alma","Seni beğenenleri gör"]};
  const draw=()=>{const T=TIERS.find(x=>x.k===tier),PER=PERIODS.find(x=>x[0]===per),fiyat=k=>playPrices[skuOf(k,per)]||TIERS.find(x=>x.k===k).pr[per];
   openSheet(`<h2>Kulis Premium</h2>
   <p class="prem-free">${IC.spark}<span><b>Ücretsiz olanlar:</b> itiraf yazmak ve okumak, her sohbette 20 mesaj, profil fotoğrafı ve Perde, görüldü ve yazıyor bilgisi. Premium sadece sınırları kaldırır.</span></p>
   ${state.premUntil?`<p class="hint" style="margin:0 0 10px">Premium üyeliğin ${new Date(state.premUntil).toLocaleDateString("tr-TR")} tarihine kadar açık. <a href="${ABONE_URL}" target="_blank" rel="noopener">Aboneliğimi yönet / iptal et</a></p>`:""}
   <div class="seg3 pr-per" role="radiogroup" aria-label="Süre">${PERIODS.map(([k,n])=>`<button role="radio" aria-checked="${per===k}" data-per="${k}">${n}</button>`).join("")}</div>
   <small class="pr-per-a">${PER[2]}</small>
   <div class="pr-kart" role="radiogroup" aria-label="Paket">${TIERS.map(x=>`<button class="pr-k" role="radio" aria-checked="${tier===x.k}" data-tier="${x.k}">
      <span class="pr-k-u"><b>${x.n}</b>${x.k==="ses"?`<i>Önerilen</i>`:""}<span class="pr-f">${fiyat(x.k)}</span></span>
      <span class="pr-k-l">${FARK[x.k].map(t=>`<span>${IC.chk}${t}</span>`).join("")}</span></button>`).join("")}</div>
   ${web?`<p class="prem-free" style="margin-top:12px">${IC.spark}<span>Premium, Google Play'deki <b>Kulis uygulamasından</b> alınır. Aldığın üyelik aynı hesapla web'de de geçerli olur.</span></p>
     <a class="btn gold wide" href="https://play.google.com/store/apps/details?id=com.kulistr.app" target="_blank" rel="noopener" style="display:flex;justify-content:center;align-items:center;text-decoration:none">Uygulamayı Google Play'den aç</a><button class="btn line wide" id="buyX" style="margin-top:8px">Kapat</button>
     <p class="hint" style="text-align:center;margin-top:10px">Aboneliğin varsa <a href="${ABONE_URL}" target="_blank" rel="noopener">Google Play > Abonelikler</a>'den istediğin zaman iptal edebilirsin.</p>`
    :`<button class="btn gold wide" id="buy" style="margin-top:12px">${T.n}, ${PER[1].toLocaleLowerCase("tr")} ${fiyat(tier)} ile abone ol</button>
     <p class="hint" style="text-align:center">Her dönem sonunda otomatik yenilenir. İstediğin zaman <a href="${ABONE_URL}" target="_blank" rel="noopener">Google Play > Abonelikler</a>'den iptal edersin; dönem sonuna kadar premium kalırsın.</p>`}`);
   const x=$("#buyX");if(x)x.onclick=closeSheet;
   $("#sheet").querySelectorAll("[data-tier]").forEach(b=>b.onclick=()=>{tier=b.dataset.tier;draw()});
   $("#sheet").querySelectorAll("[data-per]").forEach(b=>b.onclick=()=>{per=b.dataset.per;draw()});
   const by=$("#buy");if(by)by.onclick=()=>playBuy(skuOf(tier,per),by)};
  draw();
  if(!web)playService().then(()=>{if($("#buy"))draw()});
}
