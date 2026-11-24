/* ============ OLAYLAR ============ */
document.addEventListener("click",e=>{
  if(e.target.closest("#onb"))return;
  const so=e.target.closest("[data-sort]");if(so){state.sort=so.dataset.sort;vAkis();return}
  const mo=e.target.closest("[data-more]");if(mo){showMore(mo.dataset.more);return}
  if(e.target.closest("#mDn")){closeSheet();return}
  const del=e.target.closest("#mDy");if(del&&REMOTE){const id=state.lastMore;closeSheet();KDB.deletePost(id).then(()=>toast("İtirafın silindi")).catch(e=>toast("Silinemedi: "+(e.code||e.message)));return}
  if(del){const id=state.lastMore;state.myPosts=state.myPosts.filter(x=>x.id!==id);state.notifs=state.notifs.filter(n=>!(n.go&&n.go.post===id));closeSheet();render();toast("İtirafın silindi");return}
  const shb=e.target.closest("[data-share]");if(shb){showShare(shb.dataset.share);return}
  const rp=e.target.closest("[data-report]");if(rp&&!e.target.closest("#onb")){showReport(rp.dataset.report);return}
  const t=e.target.closest("[data-tab],[data-cat],[data-react],[data-open],[data-prof],[data-dm],[data-chat],[data-rq],[data-block]");if(!t)return;
  const d=t.dataset;
  if(d.tab){closeChat();state.tab=d.tab;render();scrollTo(0,0)}
  else if(d.cat){state.cat=d.cat;vAkis()}
  else if(d.react){const[id,k]=d.react.split(":");const oldK=state.react[id]||null;state.react[id]=state.react[id]===k?null:k;
    if(REMOTE){const nk=state.react[id]||null;KDB.react(id,nk,oldK).catch(e=>toast("Tepki kaydedilemedi: "+(e.code||e.message)));const pp=(R.mapped||[]).find(x=>x.id===id);if(nk&&!oldK&&pp&&pp.u!=="me"&&!pp.anon)KDB.notify(pp.uid,"react",{bende:"itirafına “Ben de” dedi",saril:"itirafına sarıldı",yok:"itirafına “Yok artık” dedi"}[nk],{post:id})}if(state.react[id])toast({bende:"“Ben de” dedin",saril:"Sarıldın",yok:"“Yok artık” dedin"}[k]);
    if($("#scrim").classList.contains("open"))showPost(id);render()}
  else if(d.open){showPost(d.open)}
  else if(d.prof){showProfile(d.prof)}
  else if(d.dm){startDM(d.dm,d.from)}
  else if(d.chat){openChat(+d.chat)}
  else if(d.rq&&REMOTE){const[i,a]=d.rq.split(":");const r=state.requests[+i];if(!r)return;
    if(a==="ok"){if(!state.premium&&state.chats.length>=FREE_CHATS){showPremium("sohbet");return}KDB.acceptChat(r.cid).then(()=>{KDB.notify(r.u,"dm","mesaj isteğini kabul etti",{chat:R.uid});toast("Sohbet açıldı")}).catch(e=>toast("Olmadı: "+(e.code||e.message)))}
    else KDB.declineChat(r.cid).then(()=>toast("İstek silindi")).catch(e=>toast("Olmadı: "+(e.code||e.message)))}
  else if(d.rq){const[i,a]=d.rq.split(":");const r=state.requests.splice(+i,1)[0];
    if(a==="ok"){if(!state.premium&&state.chats.length>=FREE_CHATS){state.requests.splice(+i,0,r);showPremium("sohbet");return}
      state.chats.unshift({u:r.u,from:r.from,msgs:[{me:false,t:r.first}],status:"open",unread:false});render();openChat(0)}else{render();toast("İstek silindi")}}
  else if(d.block){openSheet(`<h2>${esc(U[d.block].n)}</h2><div style="display:grid;gap:8px;margin-top:14px"><button class="btn line wide" id="bl1">Engelle</button><button class="btn line wide" id="bl2">Şikâyet et</button></div><p class="hint">Engellediğin kişi seni göremez ve sana yazamaz. Şikâyetler 24 saat içinde incelenir.</p>`);
    const bu=d.block;$("#bl1").onclick=()=>{closeSheet();if(REMOTE)KDB.block(bu).then(()=>toast("Engellendi")).catch(e=>toast("Olmadı: "+(e.code||e.message)));else toast("Engellendi")};$("#bl2").onclick=()=>{closeSheet();if(REMOTE)showReport("u:"+bu);else toast("Şikâyetin alındı, inceleyeceğiz")}}
});
// sonradan genişletilen sürüm (okundu bilgisini sunucuya yazan) çağrılsın diye fonksiyon her tıklamada adıyla çağrılır
$("#topBell").onclick=()=>showNotifs();
$("#confessBtn").onclick=()=>{closeChat();showConfess()};
$("#premPill").onclick=()=>{if(!state.premium)showPremium("pill");else toast("Premium üyesin")};
