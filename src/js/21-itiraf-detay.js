/* ============ İTİRAF DETAY ============ */
function showPost(id){
  const p=allPosts().find(x=>x.id===id); if(!p)return;
  const cms=p.cm.map((c,i)=>({c,i})).filter(({i})=>!state.hidden.has("c:"+p.id+":"+i));
  openSheet(`<div class="sheet-head"><h2>Yorumlar <span class="muted" style="font-family:var(--body);font-size:15px">${cms.length}</span></h2><button class="x" id="ex" aria-label="Kapat">${IC.close}</button></div>
   ${postHTML(p,{full:true}).replace('<article class="it">','<article class="it" style="margin-bottom:6px">')}
   <div>${cms.length?cms.map(({c,i})=>`<div class="cm${c.re?" cm-re":""}"><div class="who" style="width:100%">${who(c.u,c.ago)}${c.u==="me"?"":`<button class="ib" style="margin-left:auto" data-report="c:${p.id}:${i}" aria-label="Yorumu şikâyet et">${IC.flag}</button>`}</div>${c.re?`<small class="cm-to">↳ ${esc(c.re.n)} kişisine cevap</small>`:""}<p>${esc(c.t)}</p>${c.u==="me"||c.u==="anon"?"":`<button class="cm-yan" data-yan="${i}">Yanıtla</button>`}</div>`).join(""):`<p class="empty">İlk yorumu sen yaz. Yorumun takma adınla ve burcunla görünür.</p>`}</div>
   <div id="cmReBox"></div>
   <div class="composer2">${av("me",36)}<div class="box"><textarea id="cmIn" rows="1" maxlength="300" placeholder="Yorum yaz"></textarea><button class="go" id="cmGo" disabled>Gönder</button></div></div>
   <div id="cmWarn"></div>`);
  $("#ex").onclick=closeSheet;
  const t=$("#cmIn"),g=$("#cmGo");let re=null;
  const reCiz=()=>{$("#cmReBox").innerHTML=re?`<div class="cm-rechip"><span>↳ <b>${esc(re.n)}</b> kişisine cevap yazıyorsun</span><button class="ib" id="cmReX" aria-label="Cevabı iptal et">${IC.close}</button></div>`:"";const x=$("#cmReX");if(x)x.onclick=()=>{re=null;reCiz()}};
  $("#sheet").querySelectorAll("[data-yan]").forEach(b=>b.onclick=()=>{const c=p.cm[+b.dataset.yan];if(!c)return;re={id:String(c.id||b.dataset.yan),n:(U[c.u]&&U[c.u].n||"kullanıcı").slice(0,20),uid:c.uid||c.u};reCiz();t.focus()});
  t.oninput=()=>{grow(t);g.disabled=t.value.trim().length<2};
  g.onclick=()=>{const v=t.value.trim();const mc=modCheck(v,"yorum");if(mc){$("#cmWarn").innerHTML=`<p class="warn">${mc}</p>`;return}const bad=contactBlock(v);if(bad){$("#cmWarn").innerHTML=`<p class="warn">Yorumlarda ${bad} paylaşılamaz. Tanışmak istersen “Özelden yaz”ı kullan.</p>`;return}
    if(!state.premium&&p.u!=="me"&&!state.replied.has(p.u)&&state.replied.size>=3){premiumGate("Bugün daha fazla kişiye cevap yazamazsın","Ücretsiz planda günde sınırlı sayıda kişinin itirafına cevap yazabilirsin. Herkese sınırsız cevap yazmak için Premium'a geç.",()=>g.click());return}
    if(p.u!=="me")state.replied.add(p.u);
    if(REMOTE){g.disabled=true;const r0=re;KDB.addComment(p.id,v,authorSnap(),r0).then(()=>{track("yorum");if(r0&&r0.uid&&r0.uid!==R.uid&&r0.uid!==p.uid)setTimeout(()=>KDB.notify(r0.uid,"cm",`yorumuna cevap verdi: “${v.slice(0,60)}”`,{post:p.id}),2600);KDB.logAccess&&KDB.logAccess("yorum");state.myComments.push({on:p.t,t:v});t.value="";toast("Yorumun gönderildi");if(p.uid&&p.u!=="me"&&!p.anon)KDB.notify(p.uid,"cm",`itirafına yorum yaptı: “${v.slice(0,60)}”`,{post:p.id});showPost(id)}).catch(e=>{g.disabled=false;toast(writeErr(e,"yorum"))});return}
    p.cm.push({u:"me",t:v,ago:"Şimdi",ts:Date.now(),re:re?{id:re.id,n:re.n}:null});track("yorum");state.myComments.push({on:p.t,t:v});toast("Yorumun gönderildi");showPost(id);render()};
}
function showMore(id){
  const p=allPosts().find(x=>x.id===id); if(!p)return; const mine=p.u==="me";state.lastMore=id;
  openSheet(`<div class="menu">
    <button id="m1">${IC.link}Bağlantıyı kopyala</button>
    ${REMOTE&&(R.admin||R.isMod)?`<button id="mF">${IC.spark}${isBoosted(p)?"Öne çıkarmayı kaldır ("+boostLeft(p)+" kaldı)":"Moderatör: 24 saat öne çıkar"}</button>`:""}
    ${mine?`${REMOTE?"":`<button id="mB">${IC.spark}${isBoosted(p)?"Öne çıkarıldı, "+boostLeft(p)+" kaldı":"24 saat öne çıkar"}${state.premium?"":`<span class="lk-mini">${IC.lock}</span>`}</button>`}<button id="mD" class="danger">${IC.close}İtirafı sil</button>`:""}
    ${mine?"":`<button id="m2">${IC.flag}İtirafı şikâyet et</button>${p.anon?"":`<button id="m3" class="danger">${IC.block}${esc(U[p.u].n)} kullanıcısını engelle</button>`}`}
    <button id="m4">${IC.close}Vazgeç</button></div>`);
  $("#m1").onclick=async()=>{closeSheet();try{await navigator.clipboard.writeText(location.href.split("#")[0]+"#"+p.id);toast("Bağlantı kopyalandı")}catch(e){toast("Kopyalanamadı")}};
  const mf=$("#mF");if(mf)mf.onclick=()=>{const on=isBoosted(p);closeSheet();KDB.setFeature(p.id,on?null:Date.now()+864e5).then(()=>toast(on?"Öne çıkarma kaldırıldı":"İtiraf 24 saat akışın en üstünde")).catch(e=>toast("Olmadı: "+(e.code||e.message)))};
  if(mine){
    if($("#mB"))$("#mB").onclick=()=>{if(isBoosted(p)){closeSheet();return}
      if(!state.premium){premiumGate("İtirafını öne çıkar","Premium üyeler itiraflarını 24 saat boyunca akışın en üstüne taşıyabilir. Daha çok kişi okur, daha çok tepki ve mesaj gelir.",()=>showMore(id));return}
      p.boost=Date.now();closeSheet();state.tab="akis";render();scrollTo(0,0);toast("İtirafın 24 saat akışın en üstünde");track("one_cikar")};
    $("#mD").onclick=()=>openSheet(`<h2>İtiraf silinsin mi?</h2><p class="muted" style="margin:8px 0 16px">İtirafın, altındaki yorumlar ve tepkiler kalıcı olarak silinir. Bu işlem geri alınamaz.</p><div style="display:grid;gap:8px"><button class="btn wide" id="mDy" style="background:var(--nar)">Sil</button><button class="btn line wide" id="mDn">Vazgeç</button></div>`);
  }
  if(!mine){$("#m2").onclick=()=>showReport("p:"+p.id);
    if($("#m3"))$("#m3").onclick=()=>{if(REMOTE)KDB.block(p.uid).catch(()=>{});allPosts().filter(x=>x.u===p.u).forEach(x=>state.hidden.add("p:"+x.id));closeSheet();toast(`${U[p.u].n} engellendi. İtirafları ve mesajları sana görünmeyecek.`);render()}}
  $("#m4").onclick=closeSheet;
}
