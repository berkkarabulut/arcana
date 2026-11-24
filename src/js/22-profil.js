/* ============ PROFİL ============ */
function showProfile(k){
  if(k==="me"){closeSheet();state.tab="ben";render();scrollTo(0,0);return}
  const u=U[k],me=state.me,p=uyum(me.s,u.s);
  const posts=POSTS.filter(x=>x.u===k);
  const comments=[...POSTS.flatMap(x=>x.cm.filter(c=>c.u===k).map(c=>({on:x.t,t:c.t}))),...(EXTRA_COMMENTS[k]||[])];
  let tab="itiraf";
  const chatIdx=state.chats.findIndex(c=>c.u===k);
  const draw=()=>{openSheet(`<div class="pro-wrap" style="--acc:${u.c}"><div class="cover" style="height:96px;${coverCSS(u)}"></div><div class="pro2" style="margin-top:-46px"><span class="ring2" style="display:inline-block">${av(k,84,true)}</span><h2>${esc(u.n)}${pb(k)}</h2>
    <div class="badges"><span class="bd"><span class="glyph">${Z[u.s].g}</span>${Z[u.s].n}</span><span class="bd">${u.age}</span><span class="bd">${u.g}</span><span class="bd">${u.since}'den beri</span></div>
    <p class="bio">${esc(u.bio)}</p></div>
    <div class="stats"><div><b>${u.stat[0]}</b><span>itiraf</span></div><div><b>${u.stat[1]}</b><span>yorum</span></div><div><b>${u.stat[2]}</b><span>tepki aldı</span></div></div>
    <div class="uyum">${ringSVG(p)}<div><b>Seninle burç uyumu</b><p>${Z[me.s].n} ve ${Z[u.s].n}. ${uyumText(me.s,u.s,p)}</p></div></div>
    <div class="tabs"><button data-pt="itiraf" aria-pressed="${tab==="itiraf"}">İtirafları</button><button data-pt="yorum" aria-pressed="${tab==="yorum"}">Yorumları</button></div>
    ${tab==="itiraf"?(posts.length?posts.map(x=>`<div class="mini"><q data-open="${x.id}" style="cursor:pointer">“${esc(x.t)}”</q><div class="on">${CATN[x.cat]}, ${x.ago}, ${x.cm.length} yorum</div></div>`).join(""):`<p class="empty">Herkese açık itirafı yok.</p>`)
     :(comments.length?comments.map(c=>`<div class="mini"><div class="on" style="margin:0 0 4px">Şu itirafa yorum yaptı: “${esc(c.on.slice(0,60))}…”</div><div style="font-size:15px">${esc(c.t)}</div></div>`).join(""):`<p class="empty">Henüz yorumu yok.</p>`)}
    <div class="pro-acts">${chatIdx>=0?`<button class="btn wide" data-chat="${chatIdx}">Sohbete git</button>`:`<button class="btn wide" data-dm="${k}" data-from="">Özelden yaz</button>`}<button class="btn line" data-block="${k}" aria-label="Engelle veya şikâyet et">Engelle</button></div>
    ${REMOTE&&(u.realAv||u.realBn)?`<button class="dice" id="rpPhoto" style="margin:14px auto 0;display:flex">Fotoğrafı şikâyet et</button>`:""}</div>`);
    const rpp=$("#rpPhoto");if(rpp)rpp.onclick=()=>{rpp.disabled=true;logReport("u:"+k,"Uygunsuz perde fotoğrafı").then(()=>toast("Şikâyetin alındı. Fotoğraf incelenecek.")).catch(()=>{rpp.disabled=false})};
    $("#sheet").querySelectorAll("[data-pt]").forEach(b=>b.onclick=()=>{tab=b.dataset.pt;draw()});};
  draw();
}
