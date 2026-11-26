/* ============ ANONİM SORU LİNKİ ============
   Her üyenin bir linki var: kulistr.com/?soru=takmaad. Linke gelen kişi (üye olmasa da) ona anonim bir soru sorar.
   Soru sahibine bildirim gider; Profilim > Anonim sorular'dan cevaplar. Cevap, soru-cevap itirafı olarak akışa düşer
   ve istersen hikâyende paylaşırsın. Ayarlar'dan link kapatılabilir. Soranın kimliği hiçbir yerde tutulmaz. */
const SORU_N=(()=>{try{const v=new URLSearchParams(location.search).get("soru");return v&&/^[\wçğıöşüÇĞİÖŞÜ.\-]{3,20}$/.test(v)?v:null}catch(e){return null}})();
let SORULAR=[],SORU_CVP=null;
const soruLink=()=>`https://kulistr.com/?soru=${encodeURIComponent(state.me&&state.me.n||"")}`;
function soruKdb(){return new Promise((ok,no)=>{if(window.KDB&&window.KDB.anonimSoru)return ok(window.KDB);if(window.__kdbYukle)window.__kdbYukle();
  let n=0;const iv=setInterval(()=>{if(window.KDB&&window.KDB.anonimSoru){clearInterval(iv);ok(window.KDB)}else if(++n>80){clearInterval(iv);no(new Error("yuklenemedi"))}},150)})}
// --- linke gelen kişi: tam ekran soru sayfası ---
function soruSayfasi(){
  if(!SORU_N||$("#soruS"))return;
  track("soru_sayfa");
  const el=document.createElement("div");el.id="soruS";el.className="soru-s";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label",SORU_N+" kişisine anonim soru");
  el.innerHTML=`<div class="soru-k">
    <div class="soru-logo">Kulis<span>.</span></div>
    <h1><b>@${esc(SORU_N)}</b> sana soruyor:<br>Bana anonim bir şey sor</h1>
    <p class="muted">Kim olduğun hiçbir zaman görünmez. Cevaplarsa Kulis'te ve hikâyesinde paylaşabilir.</p>
    <textarea id="soruIn" rows="4" maxlength="300" placeholder="Aklından geçeni yaz…" aria-label="Sorun"></textarea>
    <div class="soru-alt"><span id="soruSay">0 / 300</span><button class="btn" id="soruGo" disabled>Anonim gönder</button></div>
    <p class="warn" id="soruW" hidden></p>
    <button class="dice" id="soruKapat" style="margin:16px auto 0;display:flex">Kulis'e göz at</button></div>`;
  document.body.appendChild(el);document.documentElement.style.overflow="hidden";
  const t=$("#soruIn"),go=$("#soruGo"),w=$("#soruW");
  t.oninput=()=>{$("#soruSay").textContent=`${t.value.length} / 300`;go.disabled=t.value.trim().length<3;w.hidden=true};
  const kapat=()=>{el.remove();document.documentElement.style.overflow="";try{history.replaceState(null,"",location.pathname)}catch(e){}};
  $("#soruKapat").onclick=kapat;
  go.onclick=async()=>{
    const v=t.value.trim();if(v.length<3)return;go.disabled=true;go.textContent="Gönderiliyor…";
    try{const K=await soruKdb();await K.anonimSoru(SORU_N,v);track("soru_gonder");
      el.querySelector(".soru-k").innerHTML=`<div class="soru-logo">Kulis<span>.</span></div><h1>Sorun gitti 🤫</h1>
        <p class="muted">@${esc(SORU_N)} cevaplarsa Kulis'te görürsün. Sen de kendi linkini al, arkadaşların sana anonim sorsun.</p>
        <button class="btn gold wide" id="soruKatil" style="margin-top:18px">Ben de link istiyorum</button>
        <button class="dice" id="soruBir" style="margin:12px auto 0;display:flex">Bir soru daha sor</button>`;
      $("#soruKatil").onclick=()=>{track("soru_katil");kapat();if(typeof misafirKayit==="function"&&!state.me)misafirKayit();else if(!state.me&&typeof showLogin==="function")showLogin()};
      $("#soruBir").onclick=()=>{el.remove();soruSayfasi()};
    }catch(e){
      const k=e&&(e.code||"").replace("functions/","");
      w.textContent=k==="not-found"?"Bu takma adla bir üye bulunamadı.":k==="failed-precondition"?"Bu kişi anonim soruları kapatmış.":k==="resource-exhausted"?"Çok sık soru gönderdin, biraz sonra tekrar dene.":k==="permission-denied"?"Bu soruda izin verilmeyen bir kelime var.":k==="invalid-argument"?"Soruda bağlantı olamaz, en az 3 harf olmalı.":"Gönderilemedi, bağlantını kontrol edip tekrar dene.";
      w.hidden=false;go.disabled=false;go.textContent="Anonim gönder"}
  };
  setTimeout(()=>t.focus(),300);
}
if(SORU_N){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",soruSayfasi);else setTimeout(soruSayfasi,0)}
// --- sahibi: sorularım ---
async function soruStory(){
  try{await Promise.all(['italic 400 100px Newsreader','400 64px Newsreader','700 34px Figtree'].map(f=>document.fonts.load(f)))}catch(e){}
  const W=1080,H=1920,cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");
  const SERIF='Newsreader, Georgia, serif',SANS='Figtree, system-ui, sans-serif';
  x.fillStyle="#0B1220";x.fillRect(0,0,W,H);
  const glow=(cx,cy,r,c)=>{const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,c);g.addColorStop(1,"rgba(11,18,32,0)");x.fillStyle=g;x.fillRect(0,0,W,H)};
  glow(900,300,800,"rgba(255,138,101,.34)");glow(140,1700,800,"rgba(124,196,255,.2)");
  drawLogo(x,W/2-60,160,120);
  x.textAlign="center";x.fillStyle="#EEF3FF";x.font=`italic 400 96px ${SERIF}`;x.fillText("Kulis",W/2,400);
  x.fillStyle="#FFFFFF";rr(x,90,560,W-180,560,48);x.fill();
  x.fillStyle="#FF8A65";rr(x,90,560,W-180,150,48);x.fill();x.fillRect(90,660,W-180,50);
  x.fillStyle="#2A0F05";x.font=`700 46px ${SANS}`;x.fillText("Bana anonim bir şey sor 👀",W/2,655);
  x.fillStyle="#0B1220";x.font=`400 58px ${SERIF}`;wrapLines(x,"Kim olduğun görünmez. Ne sorarsan cevaplarım.",W-300).forEach((l,i)=>x.fillText(l,W/2,830+i*78));
  x.fillStyle="#7CC4FF";x.font=`700 40px ${SANS}`;x.fillText("Linke dokun, sor ↓",W/2,1300);
  x.fillStyle="#EEF3FF";x.font=`700 36px ${SANS}`;x.fillText("kulistr.com/?soru="+(state.me&&state.me.n||""),W/2,1380);
  return cv;
}
async function soruPaylas(){
  openSheet(`<div class="sheet-head"><h2>Linkini paylaş</h2></div><div class="sh-prev"><div class="sh-load">Görsel hazırlanıyor…</div></div>`);
  const cv=await soruStory(),blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));
  const file=new File([blob],"kulis-anonim-soru.jpg",{type:"image/jpeg"}),url=URL.createObjectURL(blob);
  const canShare=!!(navigator.canShare&&navigator.canShare({files:[file]}));
  const box=$("#sheet .sh-prev");if(!box)return;box.innerHTML=`<img src="${url}" alt="Anonim soru linki hikâye görseli">`;
  box.insertAdjacentHTML("afterend",`<p class="hint" style="margin:12px 0">Instagram'da hikâyeye bu görseli koy, üstüne "Bağlantı" çıkartmasıyla linkini ekle: <b>${esc(soruLink())}</b></p>
    <div style="display:grid;gap:8px">${canShare?`<button class="btn wide" id="sqGo">${IC.share}Görseli paylaş</button>`:""}<button class="btn line wide" id="sqKp">Linki kopyala</button><a class="dice" id="sqDl" href="${url}" download="kulis-anonim-soru.jpg" style="margin:4px auto 0;display:flex">Görseli indir</a></div>`);
  const go=$("#sqGo");if(go)go.onclick=async()=>{track("soru_link_paylas");try{await navigator.share({files:[file],text:"Bana anonim bir şey sor: "+soruLink()})}catch(e){}};
  $("#sqKp").onclick=async()=>{track("soru_link_kopya");try{await navigator.clipboard.writeText(soruLink());toast("Linkin kopyalandı. Hikâyene bağlantı çıkartmasıyla ekle.")}catch(e){toast(soruLink())}};
}
function showSorular(){
  const kapali=(R.settings||{}).soru===false,bek=SORULAR.filter(s=>!s.cevap);
  openSheet(`<div class="sheet-head"><h2>Anonim sorular</h2></div>
    <div class="soru-link"><div><b>Senin linkin</b><small>${esc(soruLink().replace("https://",""))}</small></div><button class="btn sm" id="sqP">${kapali?"Kapalı":"Paylaş"}</button></div>
    ${kapali?`<p class="hint" style="margin:8px 0">Linkin kapalı. Ayarlar > Gizlilik'ten açabilirsin.</p>`:""}
    ${bek.length?`<ul class="soru-l">${bek.map(s=>`<li><q>${esc(s.t)}</q><small>${agoOf(s.ts)}</small><div><button class="btn sm" data-sqc="${s.id}">Cevapla</button><button class="dice" data-sqs="${s.id}" aria-label="Soruyu sil">Sil</button></div></li>`).join("")}</ul>`
      :`<p class="empty">${SORULAR.length?"Bütün soruları cevapladın.":"Henüz soru yok. Linkini hikâyende paylaş, arkadaşların sana anonim sorsun."}</p>`}`);
  $("#sqP").onclick=()=>{if(kapali){closeSheet();showSettings();return}soruPaylas()};
  $("#sheet").querySelectorAll("[data-sqc]").forEach(b=>b.onclick=()=>{const s=SORULAR.find(x=>x.id===b.dataset.sqc);if(!s)return;
    let q=s.t.slice(0,200);if(q.length<5)q="Soru: "+q;SORU_CVP={id:s.id,q};closeSheet();track("soru_cevapla");showConfess({q})});
  $("#sheet").querySelectorAll("[data-sqs]").forEach(b=>b.onclick=()=>{KDB.soruSil(b.dataset.sqs).then(()=>toast("Soru silindi")).catch(e=>toast("Silinemedi: "+(e.code||e.message)))});
}
// cevap itiraf olarak yazılınca soruyu cevaplandı işaretle
{const trSoru=track;track=function(ad,p){const r=trSoru(ad,p);
  if(ad==="itiraf_yazildi"&&SORU_CVP){const sc=SORU_CVP;SORU_CVP=null;let n=0;
    const bul=()=>{const p2=(state.myPosts||[]).find(x=>x.q===sc.q&&x.id&&!String(x.id).startsWith("tmp"));
      if(p2&&window.KDB)KDB.soruCevaplandi(sc.id,p2.id).then(()=>toast("Cevabın akışta. Profilim'den hikâyende de paylaşabilirsin.")).catch(()=>{});else if(++n<10)setTimeout(bul,1000)};
    setTimeout(bul,800)}
  return r}}
{const reaSoru=remoteEnterApp;remoteEnterApp=function(a,b){const r=reaSoru(a,b);
  if(window.KDB&&KDB.listenSorular)KDB.listenSorular(l=>{SORULAR=l;const t=$("#soruTile");if(t)t.outerHTML=soruTileHTML()});
  return r}}
function soruTileHTML(){const n=SORULAR.filter(s=>!s.cevap).length;return `<button class="pk${n?" yeni":""}" id="soruTile" data-pk="soru"><b>${n?n:"?"}</b><span>anonim soru</span></button>`}
