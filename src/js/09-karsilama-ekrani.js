/* ============ KARŞILAMA EKRANI ============ */
function welcomeHero(){
  const UU=REMOTE?WEL.U:U;const pool=[...(REMOTE?WEL.P:POSTS).map(p=>({u:p.u,t:p.t})),...SWIPE_EXTRA];
  const cut=t=>t.length>78?t.slice(0,t.lastIndexOf(" ",76))+"…":t;
  const card=c=>{const u=UU[c.u];return `<div class="wq"><span class="wq-z" style="background:${u.c}">${Z[u.s].g}</span><span><small>Bir ${Z[u.s].n}</small>${esc(cut(c.t))}</span></div>`};
  const a=pool.filter((_,i)=>i%2===0),b=pool.filter((_,i)=>i%2===1);
  const row=(l,cls)=>`<div class="wq-row ${cls}"><div class="wq-track">${l.map(card).join("")}${l.map(card).join("").replace(/class="wq"/g,'class="wq" aria-hidden="true"')}</div></div>`;
  const ICS=[
    ['<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',"İtiraf et","Takma adınla, içinden geçeni yaz"],
    ['<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',"Eşleş","İtirafına dokunanla karşılaş"],
    ['<path d="M4 5h16v11H9l-5 4z"/>',"Sohbet et","Burcuna uyan biriyle konuş"]];
  return `<div class="wel-hero">
    <div class="wel-logo"><img class="wel-ic" src="icons/icon-192.png" width="54" height="54" alt=""><span class="wl">Kulis<b>.</b></span></div>
    <p class="wel-sub">İtiraf &amp; Sohbet</p>
    <h1 class="wel-h">Aramızda.</h1>
    <p class="wel-h2">Kimseye söyleyemediğini burada söyle.</p>
  </div>
  <div class="wq-wrap" aria-label="Örnek itiraflar">${row(a,"r1")}${row(b,"r2")}</div>
  <ol class="wel-steps">${ICS.map(([d,t,s])=>`<li><span class="wi"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg></span><b>${t}</b><small>${s}</small></li>`).join("")}</ol>`;
}

