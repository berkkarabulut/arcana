/* ============ MEDYA (Premium) ============ */
const lockBadge=()=>state.premium?"":`<span class="lk">${IC.lock}</span>`;
const lockIc=()=>`<span class="lk">${IC.lock}</span>`;
function waveHTML(seed){let h="";for(let i=0;i<26;i++){const v=6+((seed*31+i*17)%18);h+=`<i style="height:${v}px"></i>`}return h}
const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
function msgHTML(m,lk){
  if(m.mod)return `<div class="m ${m.me?"me":"them"} modded">🛡️ Bu mesaj moderatör tarafından silindi</div>`;
  const cls=`m ${m.me?"me":"them"} ${lk?"locked":""}`;
  if((m.kind==="img"||m.kind==="vid")&&!m.src)return `<div class="${cls}"><span style="opacity:.75">${m.kind==="vid"?"Video":"Fotoğraf"} gönderildi</span></div>`;
  if(m.kind==="img")return `<div class="${cls} media"><img src="${esc(m.src)}" alt="Gönderilen fotoğraf" loading="lazy" data-zoom="${esc(m.src)}"></div>`;
  if(m.kind==="vid")return `<div class="${cls} media"><video src="${m.src}" controls playsinline></video></div>`;
  if(m.kind==="voice"&&m.src&&!lk)return `<div class="${cls}"><div class="voice"><button class="pl" data-play="${esc(m.src)}" aria-label="Sesli mesajı oynat">${IC.play}</button><span class="wave">${waveHTML(m.dur||3)}</span><span style="font-size:12.5px;font-variant-numeric:tabular-nums">${fmt(m.dur||0)}</span></div></div>`;
  if(m.kind==="img"&&m.src&&lk)return `<div class="${cls}"><span style="opacity:.75">Fotoğraf gönderildi</span></div>`;
  if(m.kind==="voice"&&lk)return `<div class="${cls}"><span style="opacity:.75">Sesli mesaj gönderildi</span></div>`;
  if(m.kind==="voice")return `<div class="${cls}"><div class="voice"><span class="pl">${IC.play}</span><span class="wave">${waveHTML(m.dur)}</span><span style="font-size:12.5px;font-variant-numeric:tabular-nums">${fmt(m.dur)}</span></div></div>`;
  if(m.kind==="call")return `<div class="callmsg">${m.type==="video"?IC.video:IC.phone}${m.type==="video"?"Görüntülü arama":"Sesli arama"}, ${fmt(m.dur)}</div>`;
  return `<div class="${cls}">${esc(m.t)}</div>`;
}
let picker=null;
function media(kind,c){
  if(REMOTE&&(kind==="call"||kind==="video")){startCallRemote(kind,c);return}
  if(!state.premium){showPremium("medya");return}
  if(c.status!=="open"){toast("Önce isteğin kabul edilmeli");return}
  if(REMOTE&&kind==="photo"){sendPhotoRemote(c);return}
  if(REMOTE&&kind==="voice"){recordVoiceRemote(c);return}
  if(kind==="photo"){
    if(!picker){picker=document.createElement("input");picker.type="file";picker.accept="image/*,video/*";picker.hidden=true;document.body.appendChild(picker)}
    picker.onchange=()=>{const f=picker.files[0];if(!f)return;const url=URL.createObjectURL(f);c.msgs.push({me:true,kind:f.type.startsWith("video")?"vid":"img",src:url});picker.value="";drawChat();fakeReply(c,"Vay, güzelmiş 🙂")};
    picker.click();return}
  if(kind==="voice"){let sec=0;openSheet(`<div class="rec"><div class="big">${IC.mic}</div><div class="tm" id="recT">0:00</div><p class="muted" style="font-size:13px">Kaydediliyor. Prototipte mikrofon açılmaz, kayıt taklit edilir.</p>
      <div style="display:flex;gap:8px;width:100%"><button class="btn line" style="flex:1" id="recX">Vazgeç</button><button class="btn" style="flex:1" id="recS">Gönder</button></div></div>`);
    const iv=setInterval(()=>{sec++;const e=$("#recT");if(e)e.textContent=fmt(sec);else clearInterval(iv)},1000);
    $("#recX").onclick=()=>{clearInterval(iv);closeSheet()};
    $("#recS").onclick=()=>{clearInterval(iv);closeSheet();c.msgs.push({me:true,kind:"voice",dur:Math.max(2,sec)});drawChat();fakeReply(c,"Sesin çok farklıymış, hayal ettiğim gibi değil haha")};return}
  if(kind==="call"||kind==="video")startCall(kind,c);
}
/* ---- gerçek fotoğraf ve sesli mesaj ---- */
function shrinkImg(file,max=1600){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();
  im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),cv=document.createElement("canvas");cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);
    cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(u);cv.toBlob(b=>b?ok(b):no(new Error("görsel işlenemedi")),"image/jpeg",.82)};
  im.onerror=()=>{URL.revokeObjectURL(u);no(new Error("Bu fotoğraf açılamadı"))};im.src=u})}
function mediaSent(c){const wasMine=c.lastBy===R.uid;askPushOnce("mesaj");if(!wasMine)KDB.notify(c.u,"dm","sana yeni mesaj gönderdi",{chat:c.u})}
function sendPhotoRemote(c){
  if(!picker){picker=document.createElement("input");picker.type="file";picker.hidden=true;document.body.appendChild(picker)}
  picker.accept="image/*";
  picker.onchange=async()=>{const f=picker.files[0];picker.value="";if(!f)return;
    if(!f.type.startsWith("image/")){toast("Lütfen bir fotoğraf seç");return}
    const tmp={me:true,kind:"img",src:URL.createObjectURL(f),sending:true};c.msgs.push(tmp);drawChat();toast("Fotoğraf gönderiliyor…");
    try{const blob=await shrinkImg(f);const url=await KDB.upload("m",blob,"jpg");await KDB.sendMedia(c.id,{img:url});mediaSent(c)}
    catch(e){c.msgs=c.msgs.filter(x=>x!==tmp);drawChat();toast("Fotoğraf gönderilemedi: "+(e.code||e.message))}};
  picker.click()}
function recordVoiceRemote(c){
  if(!navigator.mediaDevices||!window.MediaRecorder){toast("Bu cihaz ses kaydını desteklemiyor");return}
  const types=["audio/webm;codecs=opus","audio/mp4","audio/webm","audio/ogg;codecs=opus"];const mt=types.find(t=>MediaRecorder.isTypeSupported(t))||"";
  let rec,stream,chunks=[],sec=0,iv,cancel=false,t0=0;
  openSheet(`<div class="rec"><div class="big">${IC.mic}</div><div class="tm" id="recT">0:00</div><p class="muted" style="font-size:13px" id="recP">Mikrofon açılıyor…</p>
    <div style="display:flex;gap:8px;width:100%"><button class="btn line" style="flex:1" id="recX">Vazgeç</button><button class="btn" style="flex:1" id="recS" disabled>Gönder</button></div></div>`);
  const stopAll=()=>{clearInterval(iv);try{stream&&stream.getTracks().forEach(t=>t.stop())}catch(e){}};
  $("#recX").onclick=()=>{cancel=true;try{rec&&rec.state!=="inactive"&&rec.stop()}catch(e){}stopAll();closeSheet()};
  navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}).then(s=>{
    stream=s;if(!$("#recS")){stopAll();return}
    rec=new MediaRecorder(s,mt?{mimeType:mt,audioBitsPerSecond:32000}:undefined);
    rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
    rec.onstop=async()=>{stopAll();if(cancel)return;closeSheet();
      const dur=Math.max(1,Math.min(120,Math.round((Date.now()-t0)/1000)));
      const type=(rec.mimeType||mt||"audio/webm").split(";")[0];const blob=new Blob(chunks,{type});
      if(blob.size<800){toast("Kayıt çok kısa");return}
      const tmp={me:true,kind:"voice",dur,sending:true};c.msgs.push(tmp);drawChat();
      try{const url=await KDB.upload("m",blob,type.includes("mp4")?"m4a":type.includes("ogg")?"ogg":"webm");await KDB.sendMedia(c.id,{aud:url,dur});mediaSent(c)}
      catch(e){c.msgs=c.msgs.filter(x=>x!==tmp);drawChat();toast("Sesli mesaj gönderilemedi: "+(e.code||e.message))}};
    rec.start(1000);t0=Date.now();$("#recP").textContent="Kaydediliyor. En fazla 2 dakika.";$("#recS").disabled=false;
    iv=setInterval(()=>{sec=Math.round((Date.now()-t0)/1000);const e=$("#recT");if(!e){cancel=true;try{rec.stop()}catch(x){}stopAll();return}e.textContent=fmt(sec);if(sec>=120)$("#recS").click()},250);
    $("#recS").onclick=()=>{$("#recS").disabled=true;try{rec.stop()}catch(e){}};
  }).catch(()=>{stopAll();closeSheet();toast("Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verip tekrar dene.")});
}
let vAudio=null,vBtn=null;
function playVoice(b){
  if(vAudio&&vBtn===b){if(vAudio.paused){vAudio.play()}else{vAudio.pause()}return}
  if(vAudio){vAudio.pause();if(vBtn)vBtn.innerHTML=IC.play}
  vAudio=new Audio(b.dataset.play);vBtn=b;
  vAudio.onplay=()=>{b.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'};
  vAudio.onpause=vAudio.onended=()=>{b.innerHTML=IC.play};
  vAudio.onerror=()=>{b.innerHTML=IC.play;toast("Bu sesli mesaj bu cihazda oynatılamadı")};
  vAudio.play().catch(()=>{})}
function zoomImg(src){const g=document.createElement("div");g.className="cf-scrim";g.style.cssText="display:grid;place-items:center;padding:16px;cursor:zoom-out";g.setAttribute("role","dialog");
  g.innerHTML=`<img src="${esc(src)}" alt="Fotoğraf" style="max-width:100%;max-height:100%;border-radius:12px">`;g.onclick=()=>g.remove();document.body.appendChild(g)}
function fakeReply(c,t){setTimeout(()=>{c.typing=true;if(state.chats[openIdx]===c)drawChat()},800);setTimeout(()=>{c.typing=false;c.msgs.push({me:false,t});if(state.chats[openIdx]===c)drawChat()},2400)}
function startCall(type,c){
  const u=U[c.u];let el=$("#callscr");if(!el){el=document.createElement("div");el.id="callscr";el.className="callscr";el.setAttribute("role","dialog");document.body.appendChild(el)}
  let sec=0,live=false,mute=false,camOff=false,iv;
  const draw=()=>{el.style.background=type==="video"?`radial-gradient(circle at 50% 35%,${u.c}55,#14101A 70%),#14101A`:`linear-gradient(180deg,#2A2233,#14101A)`;
    el.innerHTML=`${type==="video"?`<div class="self">${camOff?"Kamera kapalı":"Kameran"}</div>`:""}
    <div style="display:flex;flex-direction:column;align-items:center">${av(c.u,120)}<h2>${esc(u.n)}${pb(c.u)}</h2><div class="st">${live?fmt(sec):(type==="video"?"Görüntülü aranıyor…":"Aranıyor…")}</div></div>
    <div><div class="cbtns"><button class="cb" id="cMute" aria-pressed="${mute}" aria-label="Sessize al">${IC.mic}</button>${type==="video"?`<button class="cb" id="cCam" aria-pressed="${camOff}" aria-label="Kamerayı kapat">${IC.video}</button>`:""}<button class="cb end" id="cEnd" aria-label="Aramayı bitir">${IC.end}</button></div>
    <p class="cnote">Prototip: gerçek sürümde kamera ve mikrofon açılır.</p></div>`;
    $("#cMute").onclick=()=>{mute=!mute;draw()};const cc=$("#cCam");if(cc)cc.onclick=()=>{camOff=!camOff;draw()};
    $("#cEnd").onclick=()=>{clearInterval(iv);el.classList.remove("open");if(live){c.msgs.push({kind:"call",type,dur:sec});drawChat()}else toast("Arama iptal edildi")};};
  el.classList.add("open");draw();
  setTimeout(()=>{if(!el.classList.contains("open"))return;live=true;draw();iv=setInterval(()=>{sec++;const st=el.querySelector(".st");if(st)st.textContent=fmt(sec)},1000)},2500);
}
