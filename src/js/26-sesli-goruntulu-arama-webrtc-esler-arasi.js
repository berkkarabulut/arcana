/* ============ SESLİ / GÖRÜNTÜLÜ ARAMA (WebRTC, eşler arası) ============ */
// Ses ve görüntü iki telefon arasında doğrudan akar; sunucu sadece bağlantı bilgisini taşır.
const ICE={iceServers:[{urls:["stun:stun.l.google.com:19302","stun:stun1.l.google.com:19302","stun:stun2.l.google.com:19302"]}]};
// TURN (aktarma sunucusu): bilgileri config/turn belgesinden, sadece giriş yapmış kullanıcılara gelir
function loadTurn(){if(R.turnOk||!KDB.getTurn)return;KDB.getTurn().then(t=>{if(t&&Array.isArray(t.urls)&&t.u&&t.p&&!R.turnOk){R.turnOk=1;ICE.iceServers.push({urls:t.urls,username:t.u,credential:t.p})}}).catch(()=>{})}
const CALL={id:null};
const RING_MS=40000;
// paket kilidi: Sohbet paketinde arama yok, Sohbet + Ses'te sadece sesli, Kulis Tam'da hepsi
function hasFeat(f){
  if(!state.premium)return false;
  const t=state.tier||"tam";
  if(f==="voice")return t!=="sohbet";
  if(f==="video"||f==="tam")return t==="tam";
  return true;
}
function callScr(){let el=$("#callscr");if(!el){el=document.createElement("div");el.id="callscr";el.className="callscr";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");document.body.appendChild(el)}return el}
function callDraw(){
  const el=callScr(),k=CALL,u=U[k.peer]||{n:"Kullanıcı",c:"#888"},vid=k.type==="video";
  const st=k.phase==="live"?fmt(k.sec||0):k.phase==="incoming"?(vid?"Seni görüntülü arıyor":"Seni sesli arıyor"):k.phase==="connecting"?"Bağlanıyor…":(vid?"Görüntülü aranıyor…":"Aranıyor…");
  const on=k.phase==="live"||k.phase==="connecting";
  el.style.background=vid&&on?"#0E0B12":`linear-gradient(180deg,#2A2233,#14101A)`;
  el.innerHTML=`${vid?`${on?`<video id="cRemote" class="c-remote" autoplay playsinline></video>`:""}${k.local?`<video id="cLocal" class="c-local" autoplay playsinline muted></video>`:""}`:`<audio id="cRemoteA" autoplay></audio>`}
    <div class="c-top" style="position:relative;display:flex;flex-direction:column;align-items:center">${k.phase==="live"&&vid?"":av(k.peer,110)}<h2>${esc(u.n)}</h2><div class="st">${st}</div></div>
    <div style="position:relative">${k.phase==="incoming"?`<div class="cbtns"><button class="cb end" id="cDec" aria-label="Reddet">${IC.end}</button><button class="cb ok" id="cAcc" aria-label="Cevapla">${vid?IC.video:IC.phone}</button></div>`:
    `<div class="cbtns"><button class="cb" id="cMute" aria-pressed="${!!k.mute}" aria-label="Sessize al">${IC.mic}</button>${vid?`<button class="cb" id="cCam" aria-pressed="${!!k.camOff}" aria-label="Kamerayı kapat">${IC.video}</button><button class="cb" id="cFlip" aria-label="Kamerayı çevir">${IC.cam}</button>`:""}<button class="cb end" id="cEnd" aria-label="Aramayı bitir">${IC.end}</button></div>`}</div>`;
  el.classList.add("open");
  const lv=$("#cLocal");if(lv&&k.local){lv.srcObject=k.local}
  const rv=$("#cRemote")||$("#cRemoteA");if(rv&&k.remote){rv.srcObject=k.remote}
  const q=id=>el.querySelector(id);
  if(q("#cAcc"))q("#cAcc").onclick=acceptCall;
  if(q("#cDec"))q("#cDec").onclick=()=>{KDB.callUpdate(k.id,{status:"decline"}).catch(()=>{});callCleanup()};
  if(q("#cEnd"))q("#cEnd").onclick=()=>hangUp();
  if(q("#cMute"))q("#cMute").onclick=()=>{k.mute=!k.mute;k.local&&k.local.getAudioTracks().forEach(t=>t.enabled=!k.mute);callDraw()};
  if(q("#cCam"))q("#cCam").onclick=()=>{k.camOff=!k.camOff;k.local&&k.local.getVideoTracks().forEach(t=>t.enabled=!k.camOff);callDraw()};
  if(q("#cFlip"))q("#cFlip").onclick=flipCam;
}
async function flipCam(){
  const k=CALL;if(!k.pc||!k.local)return;k.facing=k.facing==="environment"?"user":"environment";
  try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:k.facing}});const nt=s.getVideoTracks()[0];
    const snd=k.pc.getSenders().find(x=>x.track&&x.track.kind==="video");if(snd)await snd.replaceTrack(nt);
    k.local.getVideoTracks().forEach(t=>{t.stop();k.local.removeTrack(t)});k.local.addTrack(nt);callDraw()}catch(e){toast("Kamera çevrilemedi")}
}
// zil sesi (dosya indirmeden, tarayıcının kendi ses motoruyla)
function ringStart(out){
  ringStop();try{const C=window.AudioContext||window.webkitAudioContext;const ctx=new C();CALL.ctx=ctx;
    const beep=()=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=out?425:660;g.gain.value=0;o.connect(g);g.connect(ctx.destination);const t=ctx.currentTime;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(out?.08:.18,t+.05);g.gain.setValueAtTime(out?.08:.18,t+(out?1:.4));g.gain.linearRampToValueAtTime(0,t+(out?1.05:.45));
      if(!out){g.gain.linearRampToValueAtTime(.18,t+.6);g.gain.setValueAtTime(.18,t+.95);g.gain.linearRampToValueAtTime(0,t+1)}o.start(t);o.stop(t+1.1)};
    beep();CALL.ringIv=setInterval(beep,out?4000:2500)}catch(e){}
  if(!out&&navigator.vibrate)try{navigator.vibrate([400,300,400,300,400])}catch(e){}
}
function ringStop(){clearInterval(CALL.ringIv);CALL.ringIv=null;if(CALL.ctx){CALL.ctx.close().catch(()=>{});CALL.ctx=null}if(navigator.vibrate)try{navigator.vibrate(0)}catch(e){}}
function newPC(side){
  const k=CALL,pc=new RTCPeerConnection(ICE);k.pc=pc;k.remote=new MediaStream();k.pend=[];
  pc.ontrack=e=>{e.streams[0]?e.streams[0].getTracks().forEach(t=>{if(!k.remote.getTracks().includes(t))k.remote.addTrack(t)}):k.remote.addTrack(e.track);const rv=$("#cRemote")||$("#cRemoteA");if(rv&&rv.srcObject!==k.remote)rv.srcObject=k.remote};
  pc.onicecandidate=e=>{if(!e.candidate)return;const c=e.candidate.toJSON();if(k.id)KDB.addCand(k.id,side,c);else k.pend.push(c)};
  pc.onconnectionstatechange=()=>{const s=pc.connectionState;
    if(s==="connected"&&k.phase!=="live"){k.phase="live";k.sec=0;ringStop();clearTimeout(k.ringT);callDraw();k.iv=setInterval(()=>{k.sec++;const st=$("#callscr .st");if(st)st.textContent=fmt(k.sec)},1000)}
    if(s==="failed"){toast("Bağlantı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.");hangUp()}
    if(s==="disconnected"){clearTimeout(k.dcT);k.dcT=setTimeout(()=>{if(pc.connectionState==="disconnected"){toast("Bağlantı koptu");hangUp()}},8000)}};
  k.local.getTracks().forEach(t=>pc.addTrack(t,k.local));
  return pc;
}
async function getMedia(type){
  return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:type==="video"?{facingMode:"user",width:{ideal:720},height:{ideal:1280}}:false});
}
async function startCallRemote(kind,c){
  const type=kind==="video"?"video":"voice";
  if(CALL.id||CALL.busy){toast("Zaten bir aramadasın");return}
  if(!hasFeat(type)){premiumGate(type==="video"?"Görüntülü arama":"Sesli arama",type==="video"?"Görüntülü arama Kulis Tam paketinde var.":"Sesli arama Sohbet + Ses ve Kulis Tam paketlerinde var.",()=>{});return}
  if(c.status!=="open"){toast("Önce isteğin kabul edilmeli");return}
  if(!window.RTCPeerConnection||!navigator.mediaDevices){toast("Bu tarayıcı aramayı desteklemiyor");return}
  CALL.busy=true;
  const st=await KDB.getSettings(c.u);
  if(st[type==="video"?"callVideo":"callVoice"]===false){CALL.busy=false;toast(`${(U[c.u]||{}).n||"Bu kişi"} ${type==="video"?"görüntülü":"sesli"} aramaları kapatmış`);return}
  try{CALL.local=await getMedia(type)}catch(e){CALL.busy=false;toast(type==="video"?"Kamera ve mikrofon izni gerekli":"Mikrofon izni gerekli");return}
  Object.assign(CALL,{peer:c.u,type,role:"out",phase:"ring",chat:c,mute:false,camOff:false,facing:"user"});
  callDraw();ringStart(true);
  try{
    const pc=newPC("fc");const off=await pc.createOffer();await pc.setLocalDescription(off);
    CALL.id=await KDB.callStart(c.u,type,{type:off.type,sdp:off.sdp});
    CALL.pend.forEach(x=>KDB.addCand(CALL.id,"fc",x));CALL.pend=[];
    KDB.logAccess("arama");
    KDB.listenCall(CALL.id,async d=>{
      if(!d||!CALL.pc)return;
      if(d.status==="accept"&&d.answer&&!CALL.pc.currentRemoteDescription){CALL.phase="connecting";ringStop();callDraw();
        try{await CALL.pc.setRemoteDescription(d.answer);KDB.listenCand(CALL.id,"tc",x=>CALL.pc&&CALL.pc.addIceCandidate(x).catch(()=>{}))}catch(e){hangUp()}}
      if(d.status==="decline"){toast(`${(U[CALL.peer]||{}).n||"Karşı taraf"} şu an cevap veremiyor`);callCleanup("red")}
      if(d.status==="end"){callCleanup()}
    });
    CALL.ringT=setTimeout(()=>{if(CALL.id&&CALL.phase==="ring"){KDB.callUpdate(CALL.id,{status:"miss"}).catch(()=>{});
      KDB.notify(CALL.peer,"call",`seni ${type==="video"?"görüntülü":"sesli"} aradı`,{chat:R.uid});toast("Cevap vermedi");callCleanup("cevapsiz")}},RING_MS);
  }catch(e){toast(e&&e.code==="permission-denied"?"Bu kişiyi şu an arayamazsın":"Arama başlatılamadı");callCleanup()}
}
function showIncoming(d){
  if(CALL.id||CALL.busy)return;
  if(Date.now()-(d.ts||Date.now())>RING_MS)return;
  if(state.hidden&&state.hidden.has("u:"+d.from))return;
  Object.assign(CALL,{id:d.id,peer:d.from,type:d.type,role:"in",phase:"incoming",offer:d.offer,mute:false,camOff:false,facing:"user"});
  if(!U[d.from]&&R.usersRaw){const x=R.usersRaw.find(z=>z.id===d.from);if(x)putUser(x.id,x)}
  callDraw();ringStart(false);
  KDB.listenCall(d.id,x=>{if(!x||["end","miss","decline"].includes(x.status)){if(CALL.phase!=="live")callCleanup()}else if(x.status==="end")callCleanup()});
  CALL.ringT=setTimeout(()=>{if(CALL.phase==="incoming")callCleanup()},RING_MS+3000);
}
async function acceptCall(){
  const k=CALL;if(!k.id)return;ringStop();
  try{k.local=await getMedia(k.type)}catch(e){toast(k.type==="video"?"Kamera ve mikrofon izni gerekli":"Mikrofon izni gerekli");KDB.callUpdate(k.id,{status:"decline"}).catch(()=>{});callCleanup();return}
  k.phase="connecting";callDraw();
  try{
    const pc=newPC("tc");await pc.setRemoteDescription(k.offer);const ans=await pc.createAnswer();await pc.setLocalDescription(ans);
    await KDB.callUpdate(k.id,{status:"accept",answer:{type:ans.type,sdp:ans.sdp}});
    KDB.listenCand(k.id,"fc",x=>k.pc&&k.pc.addIceCandidate(x).catch(()=>{}));
    KDB.listenCall(k.id,x=>{if(!x||x.status==="end")callCleanup()});
    KDB.logAccess("arama");
  }catch(e){toast("Aramaya bağlanılamadı");callCleanup()}
}
function hangUp(){if(CALL.id)KDB.callUpdate(CALL.id,{status:"end"}).catch(()=>{});callCleanup()}
function callCleanup(why){
  const k=CALL;if(!k.id&&!k.busy&&!k.pc)return;
  const wasLive=k.phase==="live",sec=k.sec||0,out=k.role==="out",type=k.type,chat=k.chat;
  ringStop();clearTimeout(k.ringT);clearTimeout(k.dcT);clearInterval(k.iv);
  try{k.pc&&k.pc.close()}catch(e){}
  k.local&&k.local.getTracks().forEach(t=>t.stop());
  KDB.stopCall&&KDB.stopCall();
  const el=$("#callscr");if(el){el.classList.remove("open");el.innerHTML=""}
  // aramayı yapan taraf sohbete kısa bir kayıt düşer
  if(out&&chat&&(wasLive||why==="cevapsiz")){const tn=type==="video"?"Görüntülü arama":"Sesli arama";KDB.sendMsg(chat.id,wasLive?`📞 ${tn}, ${fmt(sec)}`:`📞 Cevapsız ${tn.toLocaleLowerCase("tr")}`).catch(()=>{})}
  if(wasLive)toast(`Arama bitti, ${fmt(sec)}`);
  for(const x in k)delete k[x];CALL.id=null;
}
addEventListener("pagehide",()=>{if(CALL.id)KDB.callUpdate(CALL.id,{status:CALL.phase==="incoming"?"decline":"end"}).catch(()=>{})});
