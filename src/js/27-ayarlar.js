/* ============ AYARLAR ============ */
const NOTIF_KINDS=[["dm","Mesajlar"],["req","Mesaj istekleri"],["call","Aramalar"],["cm","Yorumlar"],["react","Tepkiler"],["match","Eşleşmeler"],["like","Beğeniler"]];
function swHTML(id,on,label,sub){return `<button class="set-row" data-set="${id}" role="switch" aria-checked="${on}"><span><b>${label}</b>${sub?`<small>${sub}</small>`:""}</span><i class="tgl"><i></i></i></button>`}
function showSettings(){
  const S=R.settings||{},n=S.n||{};const qf=Number.isInteger(S.qFrom)?S.qFrom:0,qt=Number.isInteger(S.qTo)?S.qTo:8;
  const hrs=sel=>Array.from({length:24},(_,h)=>`<option value="${h}" ${h===sel?"selected":""}>${String(h).padStart(2,"0")}:00</option>`).join("");
  openSheet(`<div class="sheet-head"><h2>Ayarlar</h2></div>
    <h3 class="ayar-h">Aramalar</h3>
    ${swHTML("callVoice",S.callVoice!==false,"Beni sesli arayabilirler","Sadece sohbetin açık olduğu kişiler arayabilir")}
    ${swHTML("callVideo",S.callVideo!==false,"Beni görüntülü arayabilirler","")}
    <h3 class="ayar-h">Telefonuma gelen bildirimler</h3>
    ${pushState()==="acik"?"":`<p class="hint" style="margin:0 0 8px">Telefon bildirimleri şu an kapalı. ${pushState()==="kapali"?`<button class="lnk" data-push="on">Aç</button>`:""}</p>`}
    ${NOTIF_KINDS.map(([k,l])=>swHTML("n."+k,n[k]!==false,l,"")).join("")}
    <h3 class="ayar-h">Sessiz saatler</h3>
    ${swHTML("quiet",!!S.quiet,"Sessiz saatleri aç","Bu saatlerde telefonuna bildirim gelmez, uygulama içinde yine görünür")}
    <div class="set-q" ${S.quiet?"":"hidden"}><label>Başlangıç<select id="qF">${hrs(qf)}</select></label><label>Bitiş<select id="qT">${hrs(qt)}</select></label></div>
    <button class="btn wide" style="margin-top:18px" onclick="closeSheet()">Tamam</button>`);
  const save=d=>{R.settings=Object.assign({},R.settings||{},d);KDB.saveSettings(d).catch(e=>toast("Kaydedilemedi: "+(e.code||e.message)))};
  $("#sheet").querySelectorAll("[data-set]").forEach(b=>b.onclick=()=>{const on=b.getAttribute("aria-checked")!=="true";b.setAttribute("aria-checked",on);const k=b.dataset.set;
    if(k.startsWith("n.")){const nn=Object.assign({},(R.settings||{}).n||{});nn[k.slice(2)]=on;save({n:nn})}
    else{save({[k]:on});if(k==="quiet"){const q=$(".set-q");if(q)q.hidden=!on;if(on)save({qFrom:+$("#qF").value,qTo:+$("#qT").value})}}});
  $("#qF").onchange=e=>save({qFrom:+e.target.value});$("#qT").onchange=e=>save({qTo:+e.target.value});
}
// ilk itiraf / ilk mesajdan sonra bir kere "bildirim açılsın mı" sorusu
function askPushOnce(why){
  if(!REMOTE||pushState()!=="kapali"||LS("kulis_push_asked",false))return;
  LSset("kulis_push_asked",true);
  setTimeout(()=>{if($("#scrim").classList.contains("open")||CALL.id)return;
    openSheet(`<div class="inst-hero"><img src="icons/icon-192.png" alt="" width="56" height="56"><div><b>${why==="mesaj"?"Cevap gelince haber verelim mi?":"Tepki ve yorum gelince haber verelim mi?"}</b><small>Site kapalıyken bile telefonuna bildirim gelir. Hangi bildirimlerin geleceğini Ayarlar'dan seçebilirsin.</small></div></div>
      <button class="btn wide" data-push="on" style="margin-top:14px">Bildirimleri aç</button><button class="btn line wide" style="margin-top:8px" onclick="closeSheet()">Şimdi değil</button>`)},1500);
}
