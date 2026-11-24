/* ============ SOHBET ============ */
let openIdx=-1;
function isLockedIdx(c,i){return !state.premium&&i>=FREE_LIMIT}
function openChat(i){openIdx=i;state.chats[i].unread=false;closeSheet();$("#chat").classList.add("open");drawChat();render()}
function closeChat(){openIdx=-1;$("#chat").classList.remove("open");render()}
function drawChat(){
  const c=state.chats[openIdx]; if(!c)return; const u=U[c.u];
  const used=Math.max(c.msgs.length,REMOTE?(c.srvN||0):0), left=Math.max(0,FREE_LIMIT-used), full=!state.premium&&used>=FREE_LIMIT;
  const hidden=c.msgs.filter((m,i)=>!m.me&&isLockedIdx(c,i)).length;
  $("#chatIn").innerHTML=`<div class="chat-h"><button class="back" id="cBack" aria-label="Geri">${IC.back}</button>${who(c.u,c.status==="wait"?"istek bekliyor":durumYazi(c.u))}
    ${perdeBtnHTML(c)}<button class="hb" id="cRep" aria-label="Konuşmayı bildir" title="Konuşmayı bildir">${IC.flag}</button><button class="hb" data-media="call" aria-label="Sesli ara">${IC.phone}${REMOTE?(hasFeat("voice")?"":lockIc()):lockBadge()}</button><button class="hb" data-media="video" aria-label="Görüntülü ara">${IC.video}${REMOTE?(hasFeat("video")?"":lockIc()):lockBadge()}</button></div>
   <div class="msgs" id="msgs">
     ${c.from?`<div class="origin"><small>${c.match?"Eşleştiniz. Bu itirafını beğenmiştin":"Bu itiraf üzerinden tanıştınız"}</small><q>“${esc(c.from)}”</q></div>`:`<div class="origin"><small>Profil üzerinden tanıştınız</small></div>`}
     ${c.msgs.map((m,i)=>{const lk=!m.me&&isLockedIdx(c,i);return msgHTML(m,lk)}).join("")}
     ${REMOTE&&perdeState(c.u)==="acik"?`<div class="sys">🎭 Perde açık. Birbirinizin gerçek fotoğrafını görüyorsunuz.</div>`:""}
     ${perdeReqHTML(c)}
     ${c.status==="wait"?`<div class="sys">${esc(u.n)} isteğini henüz görmedi</div>`:""}
     ${c.typing?`<div class="typing"><i></i><i></i><i></i></div>`:""}
     ${full?`<div class="wall"><h3>${hidden?`${esc(u.n)} sana ${hidden} yeni mesaj yazdı`:`Sohbetin burada duraklatıldı`}</h3><p>${hidden?"Okumak ve cevap vermek için":"Sohbete devam etmek için"} Premium'a geç. ${esc(u.n)} sana yazmaya devam edebilir, mesajları burada birikir.</p><button class="btn gold wide" id="wallGo">Premium ile devam et</button></div>`:""}
   </div>
   <div class="composer">${full?`<button class="btn line wide" id="wallGo2">${IC.lock} Mesaj yazmak için Premium gerekli</button>`:
    `<div class="box">${c.status==="open"?`<button class="tb" data-media="photo" aria-label="Fotoğraf veya video gönder">${IC.cam}${lockBadge()}</button><button class="tb" data-media="voice" aria-label="Ses kaydı gönder">${IC.mic}${lockBadge()}</button>`:""}<textarea id="mIn" rows="1" maxlength="500" placeholder="${c.status==="wait"?"Kabul edilince yazabilirsin":"Mesaj yaz"}" ${c.status==="wait"?"disabled":""}></textarea><button class="go" id="mGo" disabled>Gönder</button></div><div id="mWarn"></div>`}</div>`;
  const box=$("#msgs");box.scrollTop=box.scrollHeight;
  $("#cBack").onclick=closeChat;
  $("#chatIn").querySelectorAll("[data-media]").forEach(b=>b.onclick=()=>media(b.dataset.media,c));
  $("#chatIn").querySelectorAll("[data-play]").forEach(b=>b.onclick=()=>playVoice(b));
  const cRep=$("#cRep");if(cRep)cRep.onclick=()=>showChatReport(c);
  const pdB=$("#pdB");if(pdB)pdB.onclick=()=>{if(perdeState(c.u)==="onda"){const r=$(".perde-req");r&&r.scrollIntoView({block:"center",behavior:"smooth"});return}perdeAction(c)};
  const prOk=$("#prOk");if(prOk)prOk.onclick=()=>{prOk.disabled=true;KDB.perdeKabul(c.u).catch(e=>{prOk.disabled=false;toast(writeErr(e,"perde"))})};
  const prNo=$("#prNo");if(prNo)prNo.onclick=()=>KDB.perdeKapat(c.u).then(()=>toast("Perde isteği reddedildi")).catch(e=>toast(writeErr(e,"perde")));
  $("#chatIn").querySelectorAll("[data-zoom]").forEach(b=>b.onclick=()=>zoomImg(b.dataset.zoom));
  [$("#wallGo"),$("#wallGo2")].forEach(b=>b&&(b.onclick=()=>showPremium("mesaj")));
  const t=$("#mIn");if(!t)return;
  t.oninput=()=>{grow(t);$("#mGo").disabled=!t.value.trim();$("#mWarn").innerHTML=""};
  t.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#mGo").click()}};
  $("#mGo").onclick=()=>{const v=t.value.trim();if(!v)return;track("mesaj");const mc=modCheck(v,"mesaj");if(mc){$("#mWarn").innerHTML=`<p class="warn">${mc}</p>`;return}const bad=contactBlock(v);
    if(bad){$("#mWarn").innerHTML=`<p class="warn">Bu mesaj gönderilmedi: ${bad} paylaşılamaz. Sohbetler sitede kalır, böylece iki taraf da güvende olur.</p>`;return}
    if(REMOTE){if(c.status==="wait"){toast("Karşı taraf isteğini kabul edince yazabilirsin");return}t.value="";$("#mGo").disabled=true;const wasMine=c.lastBy===R.uid;KDB.sendMsg(c.id,v).then(()=>{askPushOnce("mesaj");if(!R.loggedMsg){R.loggedMsg=1;KDB.logAccess&&KDB.logAccess("mesaj")}if(!wasMine)KDB.notify(c.u,"dm","sana yeni mesaj gönderdi",{chat:c.u})}).catch(e=>{
      // sunucu ücretsiz sınırı uyguladıysa premium ekranını göster
      if(e&&e.code==="permission-denied"&&!state.premium&&(c.srvN||0)>=FREE_LIMIT){c.msgs=c.msgs.filter(x=>x!==om);drawChat();const mi=$("#mIn");if(mi)mi.value=v;showPremium("sohbet");return}
      toast(writeErr(e,"mesaj"))});const om={me:true,t:v};c.msgs.push(om);drawChat();setTimeout(()=>{const x=$("#mIn");x&&x.focus()},30);return}
    c.msgs.push({me:true,t:v});drawChat();
    const ci=c;setTimeout(()=>{ci.typing=true;if(state.chats[openIdx]===ci)drawChat()},700);
    setTimeout(()=>{ci.typing=false;ci.msgs.push({me:false,t:replyFor(ci)});if(state.chats[openIdx]===ci)drawChat();else{ci.unread=true;notify("dm",ci.u,"sana yeni mesaj gönderdi",{chat:ci.u});render()}
      if(!state.premium&&ci.msgs.length>=FREE_LIMIT&&!ci.extra){ci.extra=true;setTimeout(()=>{ci.msgs.push({me:false,t:"Tamam söylüyorum, Kızılay'daki yerin adı şu, gelince beraber gideriz belki."});if(state.chats[openIdx]===ci)drawChat();else{ci.unread=true;render()}},3500)}},2300);
    setTimeout(()=>{const x=$("#mIn");x&&x.focus()},30)};
}
