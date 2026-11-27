/* ============ BİLDİRİMLER ============ */
state.notifs=state.notifs||[];
function notify(type,u,text,go,ts=Date.now(),read=false){
  const dup=u&&!read&&state.notifs.find(n=>!n.read&&n.type===type&&n.u===u&&n.text===text);
  if(dup){dup.ts=ts;return}
  state.notifs.unshift({id:"n"+ts+Math.random().toString(36).slice(2,6),type,u,text,go:go||null,ts,read});
  if(state.notifs.length>60)state.notifs.length=60;
}
const NIC={dm:"dm",req:"dm",cm:"cm",react:"meToo",like:"spark",match:"spark",sys:"spark",perde:"spark"};
function notifRow(n){
  const ic=IC[NIC[n.type]]||IC.spark;
  const who=n.u&&U[n.u]?`${av(n.u,42,true)}`:`<span class="nf-sys">${ic}</span>`;
  const txt=n.u&&U[n.u]?`<b>${esc(U[n.u].n)}</b> ${esc(n.text)}`:esc(n.text);
  return `<button class="nf ${n.read?"":"new"}" data-nf="${n.id}"><span class="nf-av">${who}${n.u&&U[n.u]?`<span class="nf-ic t-${n.type}">${ic}</span>`:""}</span><span class="nf-t">${txt}<small>${agoOf(n.ts)}</small></span></button>`;
}
function showNotifs(){
  const list=state.notifs,fresh=list.filter(n=>!n.read),old=list.filter(n=>n.read);
  openSheet(`<div class="sheet-head"><h2>Bildirimler</h2>${fresh.length?`<button class="lnk nf-all" id="nfAll">Tümünü okundu işaretle</button>`:""}</div>${typeof pushCard==="function"?pushCard("nf"):""}
    ${list.length?`${fresh.length?`<h3 class="nf-h">Yeni</h3>${fresh.map(notifRow).join("")}`:""}${old.length?`<h3 class="nf-h">Önceki</h3>${old.map(notifRow).join("")}`:""}`
    :bosHTML(AY_IC.zil,"Her şey sakin","İtirafına tepki geldiğinde, biri sana yazdığında ya da eşleştiğinde burada görürsün.")}`);
  $("#sheet").querySelectorAll("[data-nf]").forEach(b=>b.onclick=()=>{
    const n=state.notifs.find(x=>x.id===b.dataset.nf);if(!n)return;n.read=true;closeSheet();const g=n.go||{};
    if(g.chat){const i=state.chats.findIndex(c=>c.u===g.chat);if(i>=0){render();openChat(i);return}}
    if(g.post){render();showPost(g.post);return}
    if(g.confess){render();showConfess();return}
    if(g.kesfet){sw.mode="eslesme"}
    if(g.tab){closeChat();state.tab=g.tab;if(g.tab==="kesfet")sw.mode="eslesme";render();scrollTo(0,0);return}
    render();
  });
  if(fresh.length){state.notifs.forEach(n=>n.read=true);const nu=$("#bellPip");nu.hidden=true;saveData()}
  const all=$("#nfAll");if(all)all.onclick=()=>{state.notifs.forEach(n=>n.read=true);toast("Hepsi okundu işaretlendi");showNotifs()};
}

