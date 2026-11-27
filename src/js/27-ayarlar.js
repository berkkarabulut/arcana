/* ============ AYARLAR ============ */
const NOTIF_KINDS=[["dm","Mesajlar"],["req","Mesaj istekleri"],["call","Aramalar"],["cm","Yorumlar"],["react","Tepkiler"],["match","Eşleşmeler"],["like","Beğeniler"],["hatirla","Hatırlatmalar (birkaç gün girmeyince, sen yokken olanlar)"],["duyuru","Kulis duyuruları"]];
const DM_ACIK={herkes:"Herkes sana mesaj isteği gönderebilir. İsteği sen kabul edince sohbet açılır.",eslesme:"Sadece Eşleş'te karşılıklı beğendiğin kişiler sana yazabilir.",kimse:"Kimse yeni sohbet başlatamaz. Açık sohbetlerin aynen devam eder."};
const AY_IC={zil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',tac:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>'};
const ABONE_URL="https://play.google.com/store/account/subscriptions?package=com.kulistr.app";
const AK_IC={mesaj:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',goz:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',soru:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5"/><path d="M12 17h.01"/></svg>',kalkan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>'};
function swHTML(id,on,label,sub){return `<button class="set-row" data-set="${id}" role="switch" aria-checked="${on}"><span><b>${label}</b>${sub?`<small>${sub}</small>`:""}</span><i class="tgl"><i></i></i></button>`}
function showSettings(){
  const S=R.settings||{},n=S.n||{};const qf=Number.isInteger(S.qFrom)?S.qFrom:0,qt=Number.isInteger(S.qTo)?S.qTo:8;
  const dm=S.dm||"herkes",nb=(R.blocks||[]).length;
  const hrs=sel=>Array.from({length:24},(_,h)=>`<option value="${h}" ${h===sel?"selected":""}>${String(h).padStart(2,"0")}:00</option>`).join("");
  const grup=(id,ic,baslik,ozet,ic2,acik)=>`<details class="ayar-grup" data-grup="${id}" ${acik?"open":""}><summary><span class="ag-ic">${ic}</span><span class="ag-t"><b>${baslik}</b><small>${ozet}</small></span><span class="chev">${IC.chev}</span></summary><div class="ag-ic2">${ic2}</div></details>`;
  const acikGrup=R.ayarGrup||"gizlilik";
  openSheet(`<div class="sheet-head"><h2>Ayarlar</h2></div>
    ${grup("gizlilik",IC.lock,"Gizlilik ve mesajlar",`${{herkes:"Herkes yazabilir",eslesme:"Sadece eşleştiklerin yazabilir",kimse:"Kimse yeni sohbet açamaz"}[dm]}, son görülme ${S.songor===false?"gizli":"açık"}`,`
      <div class="ak"><div class="ak-h">${AK_IC.mesaj}Mesajlar</div>
      <div class="set-dm"><b>Kimler bana yazabilir?</b>
        <div class="seg3" role="radiogroup" aria-label="Kimler bana yazabilir">${[["herkes","Herkes"],["eslesme","Eşleştiklerim"],["kimse","Kimse"]].map(([k,l])=>`<button role="radio" aria-checked="${dm===k}" data-dm-set="${k}">${l}</button>`).join("")}</div>
        <small id="dmAc">${DM_ACIK[dm]}</small></div>
      ${swHTML("yaziyor",S.yaziyor!==false,"Yazarken karşı taraf görsün","Kapatırsan \"yazıyor…\" göstergesi karşıya gitmez")}
      ${swHTML("okundu",S.okundu!==false,"Okundu bilgisi gönder","Kapatırsan mesajını okuduğunu karşı taraf göremez")}</div>
      <div class="ak"><div class="ak-h">${AK_IC.goz}Görünürlük</div>
      ${swHTML("songor",S.songor!==false,"Son görülmemi göster","Kapatırsan kimse ne zaman çevrimiçi olduğunu göremez; sen de başkalarınınkini göremezsin")}
      ${swHTML("iz",S.iz!==false,"Profillere iz bırak","Kapatırsan baktığın profillere iz bırakmazsın; sen de kimin baktığını göremezsin")}</div>
      <div class="ak"><div class="ak-h">${AK_IC.soru}Anonim soru</div>
      ${swHTML("soru",S.soru!==false,"Anonim soru linkim açık","Kapatırsan linkinden sana soru gönderilemez")}</div>
      <div class="ak"><div class="ak-h">${AK_IC.kalkan}Güvenlik</div>
      <button class="set-row" id="engList"><span><b>Engellediklerim</b><small>${nb?nb+" kişi":"Kimseyi engellemedin"}</small></span></button>
      <button class="set-row" id="dgIste"><span><b>Doğrulanmış profil rozeti <span class="dg">✓</span></b><small>${(U[R.uid]||{}).dg?"Profilin doğrulanmış.":"Gerçek kişi olduğunu gösteren mavi rozet. Selfie ile doğrulamak için dokun."}</small></span></button></div>`,acikGrup==="gizlilik")}
    ${grup("arama",IC.phone,"Aramalar",S.callVoice===false&&S.callVideo===false?"Kimse arayamaz":S.callVideo===false?"Sadece sesli arama açık":S.callVoice===false?"Sadece görüntülü arama açık":"Sesli ve görüntülü arama açık",`
      ${swHTML("callVoice",S.callVoice!==false,"Beni sesli arayabilirler","Sadece sohbetin açık olduğu kişiler arayabilir")}
      ${swHTML("callVideo",S.callVideo!==false,"Beni görüntülü arayabilirler","")}`,acikGrup==="arama")}
    ${grup("bildirim",AY_IC.zil,"Bildirimler",`${pushState()==="acik"?"Telefon bildirimleri açık":"Telefon bildirimleri kapalı"}${S.quiet?", sessiz saatler açık":""}`,`
      ${pushState()==="acik"?"":`<p class="hint" style="margin:6px 0 8px">Telefon bildirimleri şu an kapalı. ${pushState()==="kapali"?`<button class="lnk" data-push="on">Aç</button>`:""}</p>`}
      <h3 class="ayar-h">Hangi bildirimler gelsin?</h3>
      ${NOTIF_KINDS.map(([k,l])=>swHTML("n."+k,n[k]!==false,l,"")).join("")}
      <h3 class="ayar-h">Sessiz saatler</h3>
      ${swHTML("quiet",!!S.quiet,"Sessiz saatleri aç","Bu saatlerde telefonuna bildirim gelmez, uygulama içinde yine görünür")}
      <div class="set-q" ${S.quiet?"":"hidden"}><label>Başlangıç<select id="qF">${hrs(qf)}</select></label><label>Bitiş<select id="qT">${hrs(qt)}</select></label></div>`,acikGrup==="bildirim")}
    ${grup("premium",AY_IC.tac,"Premium",state.premUntil?`${new Date(state.premUntil).toLocaleDateString("tr-TR")} tarihine kadar açık`:R.acilis?"Açılış dönemi, ücretsiz":"Abonelik ve iptal",`
      ${R.acilis&&!state.premUntil?`<div class="set-row"><span><b>Açılış dönemi: her şey ücretsiz</b><small>Mesaj, arama ve eşleşmede sınır yok. Android ve iPhone uygulamaları çıkınca Premium başlayacak; açılışta katılanlara Kurucu üye rozeti, kurucu görevlerini bitirene 1 ay Premium hediye.</small></span></div>`:""}
      ${!R.acilis&&!state.premUntil&&!IN_APP?`<div class="set-row"><span><b>Premium uygulamalarla geliyor</b><small>Android ve iPhone uygulamaları çok yakında mağazalarda. Premium'u oradan alabileceksin.</small></span></div>`:""}
      ${state.premUntil||(IN_APP&&!R.acilis)?`<a class="set-row" href="${ABONE_URL}" target="_blank" rel="noopener"><span><b>Aboneliğimi yönet / iptal et</b><small>Google Play'den, istediğin zaman. İptal edersen dönem sonuna kadar premium kalır.</small></span></a>`:""}`,acikGrup==="premium")}
    <button class="btn wide" style="margin-top:18px" onclick="closeSheet()">Tamam</button>`);
  // aynı anda tek grup açık kalsın, hangisinin açık olduğu hatırlansın
  $("#sheet").querySelectorAll(".ayar-grup").forEach(d=>d.addEventListener("toggle",()=>{if(!d.open)return;R.ayarGrup=d.dataset.grup;$("#sheet").querySelectorAll(".ayar-grup").forEach(x=>{if(x!==d)x.open=false})}));
  const save=d=>{R.settings=Object.assign({},R.settings||{},d);KDB.saveSettings(d).catch(e=>toast("Kaydedilemedi: "+(e.code||e.message)));if("songor" in d&&typeof durumGonder==="function")durumGonder()};
  $("#sheet").querySelectorAll("[data-set]").forEach(b=>b.onclick=()=>{const on=b.getAttribute("aria-checked")!=="true";b.setAttribute("aria-checked",on);const k=b.dataset.set;
    if(k.startsWith("n.")){const nn=Object.assign({},(R.settings||{}).n||{});nn[k.slice(2)]=on;save({n:nn})}
    else{save({[k]:on});if(k==="quiet"){const q=$(".set-q");if(q)q.hidden=!on;if(on)save({qFrom:+$("#qF").value,qTo:+$("#qT").value})}}});
  $("#qF").onchange=e=>save({qFrom:+e.target.value});$("#qT").onchange=e=>save({qTo:+e.target.value});
  $("#sheet").querySelectorAll("[data-dm-set]").forEach(b=>b.onclick=()=>{const v=b.dataset.dmSet;$("#sheet").querySelectorAll("[data-dm-set]").forEach(x=>x.setAttribute("aria-checked",x===b));$("#dmAc").textContent=DM_ACIK[v];save({dm:v})});
  $("#engList").onclick=showBlocked;
  $("#dgIste").onclick=()=>selfieDogrula();
}
// ilk itiraf / ilk mesajdan sonra bir kere "bildirim açılsın mı" sorusu
function askPushOnce(why){
  if(!REMOTE||pushState()!=="kapali"||LS("kulis_push_asked",false))return;
  LSset("kulis_push_asked",true);
  setTimeout(()=>{if($("#scrim").classList.contains("open")||CALL.id)return;
    openSheet(`<div class="inst-hero"><img src="icons/icon-192.png" alt="" width="56" height="56"><div><b>${why==="mesaj"?"Cevap gelince haber verelim mi?":"Tepki ve yorum gelince haber verelim mi?"}</b><small>Site kapalıyken bile telefonuna bildirim gelir. Hangi bildirimlerin geleceğini Ayarlar'dan seçebilirsin.</small></div></div>
      <button class="btn wide" data-push="on" style="margin-top:14px">Bildirimleri aç</button><button class="btn line wide" style="margin-top:8px" onclick="closeSheet()">Şimdi değil</button>`)},1500);
}

// Engellediklerim: listele, engeli kaldır
async function showBlocked(){
  const ids=[...(R.blocks||[])];
  openSheet(`<div class="sheet-head"><h2>Engellediklerim</h2></div><div id="engIc">${ids.length?`<p class="hint">Yükleniyor…</p>`:`<p class="hint">Kimseyi engellemedin. Birini engellediğinde burada görünür, istersen engeli buradan kaldırırsın.</p>`}</div>
    <button class="btn line wide" style="margin-top:16px" onclick="showSettings()">Geri</button>`);
  if(!ids.length)return;
  const rows=await Promise.all(ids.map(async id=>{let u=U[id];if(!u){const x=await KDB.userPub(id);if(x)putUser(id,x);u=U[id]}return {id,n:u?u.n:"silinmiş hesap"}}));
  const box=$("#engIc");if(!box)return;
  box.innerHTML=rows.map(r=>`<div class="eng-row"><span>${U[r.id]?av(r.id,40,true):""}<b>${esc(r.n)}</b></span><button class="btn line" data-unb="${r.id}">Engeli kaldır</button></div>`).join("");
  box.querySelectorAll("[data-unb]").forEach(b=>b.onclick=()=>{const id=b.dataset.unb;b.disabled=true;
    KDB.unblock(id).then(()=>{state.hidden.delete("u:"+id);(R.mapped||[]).filter(p=>p.uid===id).forEach(p=>state.hidden.delete("p:"+p.id));saveData();
      b.closest(".eng-row").remove();toast("Engel kaldırıldı");if(!box.children.length)box.innerHTML=`<p class="hint">Engellediğin kimse kalmadı.</p>`})
      .catch(e=>{b.disabled=false;toast("Olmadı: "+(e.code||e.message))})});
}
