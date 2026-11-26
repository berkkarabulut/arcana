/* ============ SELFIE İLE DOĞRULAMA ============
   Ayarlar > Doğrulanmış profil rozeti: rastgele bir poz istenir, kişi o an ön kamerayla selfie çeker (galeriden seçilemez).
   Selfie herkese açık olmaz; moderatör perde arkasındaki profil fotoğrafıyla yan yana karşılaştırıp onaylar ya da reddeder.
   Sonuç bildirim olarak gelir, onaylanınca mavi ✓ rozeti verilir ve selfie silinir. */
const DG_POZ=["Başparmağını yukarı kaldır 👍","İki parmakla zafer işareti yap ✌️","Elini çenene koy 🤔","Bir elinle selam ver 👋","Bir gözünü kapat 😉","Elini kalp yap 🫶"];
let dgAkis=null;
function dgKapat(){if(dgAkis){dgAkis.getTracks().forEach(t=>t.stop());dgAkis=null}}
async function selfieDogrula(){
  if((state.me&&state.me.dg)||(U[R.uid]||{}).dg){toast("Profilin zaten doğrulanmış");return}
  openSheet(`<div class="sheet-head"><h2>Profilini doğrula</h2></div><p class="muted">Kontrol ediliyor…</p>`);
  const d=REMOTE&&KDB.dogrulamaDurum?await KDB.dogrulamaDurum():null;
  if(d&&d.durum==="bekliyor"){openSheet(`<div class="sheet-head"><h2>Profilini doğrula</h2></div><div class="seri-b"><b>⏳</b><span>Selfie'n inceleniyor. Sonuç bildirim olarak gelecek, genelde bir gün içinde.</span></div>`);return}
  const poz=DG_POZ[Math.floor(Math.random()*DG_POZ.length)];
  openSheet(`<div class="sheet-head"><h2>Profilini doğrula</h2></div>
    <p class="muted">Mavi <span class="dg">✓</span> rozeti, profilin arkasında gerçek bir kişi olduğunu gösterir. Doğrulanmış profillere daha çok yazılıyor.</p>
    ${d&&d.durum==="ret"?`<p class="warn" style="margin:10px 0">Önceki selfie doğrulanamadı. Yüzünün net göründüğü ve pozu verdiğin yeni bir selfie çek.</p>`:""}
    <ol class="dg-adim"><li>Ön kamerayla <b>şu an</b> bir selfie çekeceksin, galeriden seçilemez.</li><li>Selfie'de şu pozu ver: <b>${esc(poz)}</b></li><li>Kulis ekibi selfie'ni perde arkasındaki profil fotoğrafınla karşılaştırır. Selfie kimseye gösterilmez, sonuçtan sonra silinir.</li></ol>
    <button class="btn wide" id="dgKam" style="margin-top:14px">Kamerayı aç</button>`);
  $("#dgKam").onclick=()=>selfieKamera(poz);
}
async function selfieKamera(poz){
  try{dgAkis=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1080},height:{ideal:1440}},audio:false})}
  catch(e){toast("Kameraya izin verilmedi. Tarayıcı ya da telefon ayarlarından Kulis'e kamera izni ver.");return}
  openSheet(`<div class="sheet-head"><h2>${esc(poz)}</h2></div>
    <div class="dg-kam"><video id="dgV" playsinline autoplay muted></video><div class="dg-cerceve" aria-hidden="true"></div></div>
    <button class="btn wide" id="dgCek" style="margin-top:12px">Fotoğrafı çek</button><button class="btn line wide" id="dgVaz" style="margin-top:8px">Vazgeç</button>`);
  sheetGuard=()=>{dgKapat();return false};
  const v=$("#dgV");v.srcObject=dgAkis;
  $("#dgVaz").onclick=()=>{dgKapat();closeSheet()};
  $("#dgCek").onclick=async()=>{
    const w=v.videoWidth,h=v.videoHeight;if(!w){toast("Kamera hazır değil, bir saniye bekle");return}
    const sc=Math.min(1,1100/Math.max(w,h)),cv=document.createElement("canvas");cv.width=Math.round(w*sc);cv.height=Math.round(h*sc);
    const x=cv.getContext("2d");x.translate(cv.width,0);x.scale(-1,1);x.drawImage(v,0,0,cv.width,cv.height);dgKapat();
    const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.85)),url=URL.createObjectURL(blob);
    openSheet(`<div class="sheet-head"><h2>Selfie hazır</h2></div><div class="dg-kam"><img src="${url}" alt="Çektiğin selfie"></div>
      <p class="hint" style="margin:10px 0">Poz: ${esc(poz)}. Yüzün net görünüyor mu?</p>
      <button class="btn wide" id="dgGon">Doğrulamaya gönder</button><button class="btn line wide" id="dgTek" style="margin-top:8px">Tekrar çek</button>`);
    $("#dgTek").onclick=()=>selfieKamera(poz);
    $("#dgGon").onclick=async()=>{const b=$("#dgGon");b.disabled=true;b.textContent="Gönderiliyor…";
      try{await KDB.dogrulamaGonder(blob,poz);track("dogrulama_gonder");closeSheet();toast("Selfie'n gitti. Sonuç bildirim olarak gelecek.")}
      catch(e){b.disabled=false;b.textContent="Doğrulamaya gönder";toast("Gönderilemedi: "+(e.code||e.message))}};
  };
}
