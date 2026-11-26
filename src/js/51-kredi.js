/* ============ TEK SEFERLİK SATIN ALMALAR: ÖNE ÇIKARMA VE SÜPER BEĞENİ ============
   Öne çıkarma: itiraf 24 saat akışın en üstünde. Süper beğeni: karşı taraf özel bildirimle "süper beğendi" diye görür.
   Premium üyeye her 24 saatte 1 öne çıkarma ve 1 süper beğeni ücretsiz. Fazlası (ya da Premium olmayan için) tek seferlik
   paketlerle alınır (Google Play). Hak ve krediler sunucuda tutulur; harcamayı da sunucu yapar. */
const KREDI_PAKET=[
  {sku:"kulis_one_cikar_1",n:"1 öne çıkarma",d:"İtirafın 24 saat akışın en üstünde",fy:"24,90 ₺",tur:"oneCikar"},
  {sku:"kulis_one_cikar_3",n:"3 öne çıkarma",d:"Tanesi 16,63 ₺",fy:"49,90 ₺",tur:"oneCikar",on:1},
  {sku:"kulis_super_begeni_5",n:"5 süper beğeni",d:"Beğendiğin kişi bunu özel bildirimle görür",fy:"39,90 ₺",tur:"superBegeni"}];
let KREDI={};
{const reaKr=remoteEnterApp;remoteEnterApp=function(a,b){const r=reaKr(a,b);if(window.KDB&&KDB.listenKredi)KDB.listenKredi(k=>{KREDI=k||{}});return r}}
const krediSay=t=>Math.max(0,KREDI[t]||0);
function premiumHakVar(son){if(!state.premium)return false;const s=KREDI[son];const ms=s&&s.toMillis?s.toMillis():0;return Date.now()-ms>864e5}
// tek seferlik ürün satın al (sadece Play'den indirilen uygulamada)
async function urunAl(sku,btn){
  if(!IN_APP){openSheet(`<div class="sheet-head"><h2>Uygulamadan satın alınır</h2></div><p class="muted">Tek seferlik paketler şimdilik Google Play'den indirilen Kulis uygulamasında satılıyor. Web'den kartla ödeme yakında.</p>`);return}
  const svc=await playService();if(!svc){toast("Google Play ödemesi açılamadı. Uygulamayı güncelleyip tekrar dene.");return}
  if(btn)btn.disabled=true;
  try{
    const req=new PaymentRequest([{supportedMethods:PLAY_BILLING,data:{sku}}],{total:{label:"Toplam",amount:{currency:"TRY",value:"0"}}});
    const resp=await req.show(),token=resp.details&&resp.details.purchaseToken;
    let ok=false;try{const r=await KDB.verifyProduct(sku,token);ok=true;KREDI=Object.assign({},KREDI,r.kredi||{})}catch(e){}
    await resp.complete(ok?"success":"fail");
    if(ok){track("urun",{sku});closeSheet();toast("Paket hesabına eklendi")}
    else toast("Ödeme alındı ama doğrulanamadı. Biraz sonra uygulamayı yeniden aç; düzelmezse bize yaz.");
  }catch(e){if(e&&e.name!=="AbortError")toast("Ödeme tamamlanamadı")}
  finally{if(btn)btn.disabled=false}
}
// uygulama açılınca tüketilmemiş tek seferlik alımları kontrol et (ödeme alınıp kredi yazılamadıysa telafi)
{const prKr=playRestore;playRestore=async function(){await prKr();if(!IN_APP)return;const svc=await playService();if(!svc)return;
  try{for(const p of await svc.listPurchases()){if(KREDI_PAKET.some(k=>k.sku===p.itemId))await KDB.verifyProduct(p.itemId,p.purchaseToken).catch(()=>{})}}catch(e){}}}
function krediMagaza(tur,baslik,neden){
  const l=KREDI_PAKET.filter(k=>k.tur===tur);
  openSheet(`<div class="sheet-head"><h2>${baslik}</h2></div><p class="muted" style="margin:-4px 0 14px">${neden}</p>
    <div class="kr-l">${l.map(k=>`<button class="kr-p${k.on?" on":""}" data-sku="${k.sku}"><span><b>${k.n}</b><small>${k.d}</small></span><em>${playPrices[k.sku]||k.fy}</em>${k.on?'<i class="kr-on">Avantajlı</i>':""}</button>`).join("")}</div>
    ${state.premium?"":`<button class="btn gold wide" id="krPrem" style="margin-top:14px">Premium ile her gün 1 tane ücretsiz</button>`}
    <p class="hint" style="margin-top:10px;text-align:center">Tek seferlik ödeme, abonelik değildir.</p>`);
  $("#sheet").querySelectorAll("[data-sku]").forEach(b=>b.onclick=()=>urunAl(b.dataset.sku,b));
  const p=$("#krPrem");if(p)p.onclick=()=>{closeSheet();showPremiumRemote("kredi")};
}
// --- öne çıkarma ---
async function oneCikarAkisi(p){
  if(isBoosted(p)){closeSheet();return}
  if(!(premiumHakVar("sonBoost")||krediSay("oneCikar")>0)){track("one_cikar_magaza");
    krediMagaza("oneCikar","İtirafını öne çıkar",state.premium?"Bugünkü ücretsiz öne çıkarmanı kullandın. Bir paketle hemen tekrar öne çıkarabilirsin.":"İtirafın 24 saat boyunca akışın en üstünde durur. Daha çok kişi okur, daha çok tepki ve mesaj gelir.");return}
  closeSheet();
  try{const r=await KDB.oneCikar(p.id);p.feat=r.feat;track("one_cikar");state.tab="akis";render();scrollTo(0,0);
    toast(r.kaynak==="premium"?"İtirafın 24 saat akışın en üstünde (Premium hakkın)":`İtirafın 24 saat akışın en üstünde. Kalan öne çıkarma: ${Math.max(0,krediSay("oneCikar")-1)}`)}
  catch(e){const k=String(e&&e.code||"").replace("functions/","");
    if(k==="failed-precondition")krediMagaza("oneCikar","İtirafını öne çıkar","Öne çıkarma hakkın kalmadı.");else toast("Olmadı: "+(e.message||k))}
}
// --- süper beğeni (Keşfet) ---
async function superBegenAkisi(){
  const c=swipePool()[0];if(!c||!REMOTE)return;
  if(!(premiumHakVar("sonSuper")||krediSay("superBegeni")>0)){track("super_magaza");
    krediMagaza("superBegeni","Süper beğeni",state.premium?"Bugünkü ücretsiz süper beğenini kullandın.":"Normal beğeniyi karşı taraf sadece Premium ile görür. Süper beğeniyi herkes, özel bir bildirimle hemen görür.");return}
  const u=U[c.u];decide(c,true);
  try{const r=await KDB.superBegen(c.u,c.id);track("super_begen");toast(r.cid?`${u?u.n:""} ile eşleştin!`:`${u?u.n:"O"} süper beğenini görecek ⭐`)}
  catch(e){const k=String(e&&e.code||"").replace("functions/","");if(k==="failed-precondition")krediMagaza("superBegeni","Süper beğeni","Süper beğeni hakkın kalmadı.");else toast("Süper beğeni gönderilemedi")}
}
{const veKr=vEsles;vEsles=function(){veKr();try{
  const acts=$("#ksBody .sw-acts"),yes=$("#swYes");if(!acts||!yes||$("#swSuper")||!REMOTE)return;
  const b=document.createElement("button");b.className="swb sm super";b.id="swSuper";b.setAttribute("aria-label","Süper beğen");
  b.innerHTML=`<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>`;
  yes.after(b);b.onclick=superBegenAkisi}catch(e){}}}
