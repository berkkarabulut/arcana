/* ============ FOTOĞRAF ============ */
function openCropper(img,kind,onDone,onCancel){
  const isB=kind==="banner",OW=isB?900:320,OH=isB?300:320;
  const g=document.createElement("div");g.className="cf-scrim";g.setAttribute("role","dialog");g.setAttribute("aria-modal","true");
  g.innerHTML=`<div class="cf crop"><h2>${isB?"Kapağı ayarla":"Fotoğrafı ayarla"}</h2>
    <p class="muted" style="font-size:13.5px;margin:6px 0 14px">Sürükleyerek konumunu, alttaki çubukla yakınlığını ayarla.</p>
    <div class="crop-frame ${isB?"":"round"}" id="cfr"><img alt="" draggable="false"><div class="crop-grid"></div></div>
    <div class="zoom-row"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="6"/><path d="M8 11h6M20 20l-4-4"/></svg>
      <input type="range" id="zm" min="1" max="3" step="0.01" value="1" aria-label="Yakınlaştır">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="6"/><path d="M8 11h6M11 8v6M20 20l-4-4"/></svg></div>
    <div style="display:flex;gap:8px;margin-top:16px"><button class="btn line" style="flex:1" id="crN">Vazgeç</button><button class="btn" style="flex:2" id="crY">Uygula</button></div></div>`;
  document.body.appendChild(g);
  const fr=g.querySelector("#cfr"),im=fr.querySelector("img"),zm=g.querySelector("#zm");
  im.src=img.src;
  let FW,FH,s0,z=1,x=0,y=0;
  const layout=()=>{FW=fr.clientWidth;FH=fr.clientHeight;s0=Math.max(FW/img.width,FH/img.height)};
  const clamp=()=>{const dw=img.width*s0*z,dh=img.height*s0*z;x=Math.min(0,Math.max(FW-dw,x));y=Math.min(0,Math.max(FH-dh,y))};
  const paint=()=>{clamp();im.style.width=img.width*s0*z+"px";im.style.height=img.height*s0*z+"px";im.style.transform=`translate(${x}px,${y}px)`};
  layout();x=(FW-img.width*s0)/2;y=(FH-img.height*s0)/2;paint();
  const setZoom=(nz,cx=FW/2,cy=FH/2)=>{nz=Math.min(3,Math.max(1,nz));const k=nz/z;x=cx-(cx-x)*k;y=cy-(cy-y)*k;z=nz;zm.value=z;paint()};
  zm.oninput=()=>setZoom(+zm.value);
  let drag=null;const pts=new Map();let pinch=null;
  fr.addEventListener("pointerdown",e=>{fr.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===1)drag={sx:e.clientX,sy:e.clientY,ox:x,oy:y};
    if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z};drag=null}});
  fr.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pinch&&pts.size===2){const [a,b]=[...pts.values()];const r=fr.getBoundingClientRect();setZoom(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);return}
    if(drag){x=drag.ox+(e.clientX-drag.sx);y=drag.oy+(e.clientY-drag.sy);paint()}});
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!pts.size)drag=null};
  fr.addEventListener("pointerup",up);fr.addEventListener("pointercancel",up);
  fr.addEventListener("wheel",e=>{e.preventDefault();const r=fr.getBoundingClientRect();setZoom(z*(e.deltaY<0?1.08:1/1.08),e.clientX-r.left,e.clientY-r.top)},{passive:false});
  fr.tabIndex=0;fr.addEventListener("keydown",e=>{const st=10;if(e.key==="ArrowLeft")x+=st;else if(e.key==="ArrowRight")x-=st;else if(e.key==="ArrowUp")y+=st;else if(e.key==="ArrowDown")y-=st;else return;e.preventDefault();paint()});
  const close=()=>{g.remove();removeEventListener("resize",onRs)};
  const onRs=()=>{const cx=(FW/2-x)/(s0*z),cy=(FH/2-y)/(s0*z);layout();x=FW/2-cx*s0*z;y=FH/2-cy*s0*z;paint()};addEventListener("resize",onRs);
  g.querySelector("#crN").onclick=()=>{close();onCancel&&onCancel()};
  g.querySelector("#crY").onclick=()=>{const c=document.createElement("canvas");c.width=OW;c.height=OH;const r=OW/FW;
    c.getContext("2d").drawImage(img,x*r,y*r,img.width*s0*z*r,img.height*s0*z*r);close();onDone(c.toDataURL("image/jpeg",.85))};
}
let photoInput=null;
function pickPhoto(done,target,kind){
  if(!photoInput){photoInput=document.createElement("input");photoInput.type="file";photoInput.accept="image/*";photoInput.hidden=true;document.body.appendChild(photoInput)}
  photoInput.onchange=()=>{const f=photoInput.files[0];photoInput.value="";if(!f)return;
    if(!f.type.startsWith("image/")){toast("Lütfen bir fotoğraf seç");return}
    const url=URL.createObjectURL(f),img=new Image();
    img.onload=()=>openCropper(img,kind==="banner"?"banner":"photo",data=>{URL.revokeObjectURL(url);
      (target||state.me)[kind==="banner"?"banner":"photo"]=data;if(!target)save();toast(target?"Görsel hazır. Kaydetmeyi unutma.":"Profil fotoğrafın güncellendi");done&&done()},()=>URL.revokeObjectURL(url));
    img.onerror=()=>toast("Bu fotoğraf açılamadı, başka bir tane dene");
    img.src=url};
  photoInput.click();
}
function showEditProfile(focus){
  const me=state.me;
  const real0=me.real||{};
  const draft={photo:me.photo,banner:me.banner,bio:me.bio||"",c:me.c,n:me.n,rAv:real0.av||null,rBn:real0.banner||null};
  const curAv=AVATARS.find(a=>"preset:"+a.id===me.photo);
  const tabs=me.g==="Kadın"?["Kadın","Simge"]:me.g==="Erkek"?["Erkek","Simge"]:["Kadın","Erkek","Simge"];
  let avTab=curAv&&tabs.includes(curAv.g||"Simge")?(curAv.g||"Simge"):tabs[0];
  const nickOk=()=>/^[a-zçğıöşü0-9._]{3,16}$/.test(draft.n);
  const realDirty=()=>draft.rAv!==(real0.av||null)||draft.rBn!==(real0.banner||null);
  const dirty=()=>draft.photo!==me.photo||draft.banner!==me.banner||draft.bio.trim()!==(me.bio||"")||draft.c!==me.c||draft.n!==me.n||realDirty();
  const commit=()=>{if(!nickOk()){toast("Takma ad en az 3 karakter olmalı, boşluk içeremez");return}me.n=draft.n;["photo","banner"].forEach(k=>{if(draft[k])me[k]=draft[k];else delete me[k]});me.bio=draft.bio.trim();me.c=draft.c;
    if(REMOTE){const rd=realDirty();save();closeSheet();if(rd)saveMyReal(draft.rAv,draft.rBn);else toast("Profilin kaydedildi");render();return}
    try{localStorage.setItem("itiraf_me",JSON.stringify(me))}catch(e){toast("Görsel çok büyük, kaydedilemedi. Daha küçük bir görsel dene.");return}
    closeSheet();toast("Profilin kaydedildi");render()};
  const askLeave=()=>{openSheet(`<h2>Değişiklikler kaydedilmedi</h2><p class="muted" style="font-size:14px;margin:8px 0 16px">Profilinde yaptığın değişiklikleri kaydetmeden çıkarsan hepsi kaybolur.</p>
      <div style="display:grid;gap:8px"><button class="btn wide" id="lv1">Kaydet ve çık</button><button class="btn line wide" id="lv2">Kaydetmeden çık</button><button class="btn line wide" id="lv3">Düzenlemeye dön</button></div>`,true);
    $("#lv1").onclick=commit;$("#lv2").onclick=()=>{closeSheet();toast("Değişiklikler kaydedilmedi")};$("#lv3").onclick=draw;};
  const draw=()=>{
    const prevAv=`<span class="av" style="width:76px;height:76px;background:${draft.photo?"var(--yuzey2)":draft.c};font-size:30px;box-shadow:0 0 0 3px var(--sheet),0 0 0 6px ${draft.c}">${draft.photo?`<img src="${presetURI(draft.photo)}" alt="">`:esc(me.n.charAt(0).toLocaleUpperCase("tr"))}</span>`;
    openSheet(`<div class="sheet-head"><h2>Profili düzenle</h2><button class="x" id="ex" aria-label="Kapat">${IC.close}</button></div>
    <div class="ed-prev pro-wrap" style="--acc:${draft.c}"><div class="ed-cover" style="${coverCSS(draft)}"></div><div class="ed-av">${prevAv}</div></div>

    ${REMOTE?`<div class="ed-sec perde-sec" id="secPerde"><div class="ed-h"><b>Perde arkası</b><span class="muted" style="font-size:12px">ücretsiz</span></div>
    <p class="hint" style="margin:0 0 10px">Gerçek fotoğrafını ve kapağını buraya koy. Herkes aşağıda seçtiğin hazır görünümü görür. Bunları sadece perdeyi birlikte açtığın kişiler görür.</p>
    <div class="perde-up"><button class="pk up round" id="rAvUp" aria-label="Gerçek fotoğrafını yükle">${draft.rAv?`<img src="${draft.rAv}" alt="">`:`${IC.camera}<span>Fotoğraf</span>`}</button>
    <button class="pk up wide-pk" id="rBnUp" aria-label="Gerçek kapağını yükle">${draft.rBn?`<img src="${draft.rBn}" alt="">`:`${IC.camera}<span>Kapak</span>`}</button></div>
    ${draft.rAv||draft.rBn?`<div style="display:flex;gap:14px;margin-top:8px">${draft.rAv?`<button class="lnk" id="rAvX">Fotoğrafı kaldır</button>`:""}${draft.rBn?`<button class="lnk" id="rBnX">Kapağı kaldır</button>`:""}</div>`:""}</div>`:""}

    <div class="ed-sec" id="secBanner"><div class="ed-h"><b>${REMOTE?"Herkese görünen kapak":"Kapak görseli"}</b>${draft.banner?`<button class="lnk" id="bnx" style="height:28px">Kaldır</button>`:""}</div>
    <div class="picker">
      ${REMOTE?"":`<button class="pk up" id="bnUp" aria-label="Kendi kapak görselini yükle">${IC.camera}<span>Yükle</span>${state.premium?"":`<i class="pk-lock">${IC.lock}</i>`}</button>`}
      ${BANNERS.map(b=>`<button class="pk wide-pk" data-bn="preset:${b.id}" aria-pressed="${draft.banner==="preset:"+b.id}" aria-label="${b.n}"><img src="${presetURI("preset:"+b.id)}" alt=""><span>${b.n}</span></button>`).join("")}
    </div></div>

    <div class="ed-sec" id="secPhoto"><div class="ed-h"><b>${REMOTE?"Herkese görünen avatar":"Profil fotoğrafı"}</b>${draft.photo?`<button class="lnk" id="phx" style="height:28px">Kaldır</button>`:""}</div>
    <div class="seg2" role="group" aria-label="Avatar türü" style="margin-bottom:10px">${tabs.map(k=>`<button data-avt="${k}" aria-pressed="${avTab===k}">${k}</button>`).join("")}</div>
    <div class="picker">
      ${REMOTE?"":`<button class="pk up round" id="phUp" aria-label="Kendi fotoğrafını yükle">${IC.camera}<span>Yükle</span>${state.premium?"":`<i class="pk-lock">${IC.lock}</i>`}</button>`}
      ${AVATARS.filter(a=>(a.g||"Simge")===avTab).map(a=>`<button class="pk round" data-av="preset:${a.id}" aria-pressed="${draft.photo==="preset:"+a.id}" aria-label="Hazır görsel"><img src="${presetURI("preset:"+a.id)}" alt=""></button>`).join("")}
    </div></div>

    <div class="ed-sec"><div class="ed-h"><b>Takma ad</b><span class="muted" style="font-size:12px">3-16 karakter</span></div>
    <input class="city-search" id="nkIn" value="${esc(draft.n)}" maxlength="16" autocomplete="off" aria-label="Takma ad">
    <p class="hint" id="nkErr" style="color:var(--nar-soft);${nickOk()?"display:none":""}">Takma ad en az 3 karakter olmalı, sadece harf, rakam, nokta ve alt çizgi içerebilir.</p></div>

    <div class="ed-sec"><div class="ed-h"><b>Profil cümlen</b><span class="muted" id="bioCnt" style="font-size:12px">${draft.bio.length} / 80</span></div>
    <div class="box"><textarea id="bioIn" rows="2" maxlength="80" placeholder="Seni anlatan tek bir cümle" aria-label="Profil cümlen">${esc(draft.bio)}</textarea></div></div>

    <div class="ed-sec"><div class="ed-h"><b>Profil rengi</b></div><div class="swatches" style="margin-top:0">${COLORS.map(x=>`<button class="sw" style="background:${x}" data-sc="${x}" aria-pressed="${draft.c===x}" aria-label="Renk"></button>`).join("")}</div>
    <p class="hint">Profilindeki vurgular bu renkte görünür: avatar halkası, sayılar, sekmeler ve butonlar. Kapak seçmezsen kapak da bu renkte olur.</p></div>

    <p class="hint">${REMOTE?"Hazır avatar ve kapaklar herkese görünür. Gerçek fotoğrafın sadece perde açılınca görünür.":state.premium?"Kapak ve profil fotoğrafın herkese görünür. Yüzünü göstermek zorunda değilsin.":"Hazır avatar ve kapaklar ücretsiz. Kendi fotoğrafını ve kapağını yüklemek Premium'a özel."}</p>
    <p class="hint" id="dirtyNote" style="color:var(--altin);${dirty()?"":"visibility:hidden"}">Kaydedilmemiş değişiklikler var.</p>
    <div class="ed-foot"><button class="btn line" style="flex:1" id="cn">Vazgeç</button><button class="btn" style="flex:2" id="sv" ${dirty()&&nickOk()?"":"disabled"}>Kaydet</button></div>`,true);
    sheetGuard=()=>{if(dirty()){askLeave();return true}return false};
    const upd=()=>{$("#sv").disabled=!dirty()||!nickOk();$("#dirtyNote").style.visibility=dirty()?"visible":"hidden";$("#nkErr").style.display=nickOk()?"none":""};
    const nk=$("#nkIn");nk.oninput=()=>{const v=nk.value.replace(/\s/g,"").toLocaleLowerCase("tr");if(nk.value!==v)nk.value=v;draft.n=v;upd()};
    $("#ex").onclick=tryCloseSheet;$("#cn").onclick=tryCloseSheet;
    const ru=(k)=>{const tmp={};pickPhoto(()=>{if(k==="photo")draft.rAv=tmp.photo;else draft.rBn=tmp.banner;draw()},tmp,k)};
    const ra=$("#rAvUp");if(ra)ra.onclick=()=>ru("photo");const rb=$("#rBnUp");if(rb)rb.onclick=()=>ru("banner");
    const rax=$("#rAvX");if(rax)rax.onclick=()=>{draft.rAv=null;draw()};const rbx=$("#rBnX");if(rbx)rbx.onclick=()=>{draft.rBn=null;draw()};
    if($("#phUp"))$("#phUp").onclick=()=>state.premium?pickPhoto(draw,draft,"photo"):premiumGate("Kendi fotoğrafın Premium'a özel","Hazır avatarlar herkese açık. Kendi fotoğrafını yüklemek ve diğer kullanıcılara göstermek için Premium'a geç.",()=>{draw();pickPhoto(draw,draft,"photo")});
    if($("#bnUp"))$("#bnUp").onclick=()=>state.premium?pickPhoto(draw,draft,"banner"):premiumGate("Kendi kapağın Premium'a özel","Hazır kapaklar herkese açık. Kendi görselini kapak yapmak için Premium'a geç.",()=>{draw();pickPhoto(draw,draft,"banner")});
    const px=$("#phx");if(px)px.onclick=()=>{draft.photo=undefined;draw()};
    const bx=$("#bnx");if(bx)bx.onclick=()=>{draft.banner=undefined;draw()};
    $("#sheet").querySelectorAll("[data-av]").forEach(b=>b.onclick=()=>{draft.photo=b.dataset.av;draw()});
    $("#sheet").querySelectorAll("[data-avt]").forEach(b=>b.onclick=()=>{avTab=b.dataset.avt;draw()});
    $("#sheet").querySelectorAll("[data-bn]").forEach(b=>b.onclick=()=>{draft.banner=b.dataset.bn;draw()});
    const t=$("#bioIn");t.oninput=()=>{draft.bio=t.value;$("#bioCnt").textContent=`${t.value.length} / 80`;upd()};
    $("#sheet").querySelectorAll("[data-sc]").forEach(b=>b.onclick=()=>{draft.c=b.dataset.sc;draw()});
    $("#sv").onclick=commit;};
  draw();
  if(focus==="banner")setTimeout(()=>{const e=$("#secBanner");e&&e.scrollIntoView({block:"start",behavior:"smooth"})},60);
  if(focus==="photo")setTimeout(()=>{const e=$("#secPhoto");e&&e.scrollIntoView({block:"start",behavior:"smooth"})},60);
  if(focus==="perde")setTimeout(()=>{const e=$("#secPerde");e&&e.scrollIntoView({block:"start",behavior:"smooth"})},60);
}
