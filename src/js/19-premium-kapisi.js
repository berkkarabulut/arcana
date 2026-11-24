/* ============ PREMIUM KAPISI ============ */
function premiumGate(title,text,onUnlock){
  const g=document.createElement("div");g.className="cf-scrim";g.setAttribute("role","dialog");g.setAttribute("aria-modal","true");
  g.innerHTML=`<div class="cf"><div class="cf-ic">${IC.lock}</div><h2>${title}</h2><p class="muted" style="font-size:14px;margin:6px 0 12px">${text}</p>
    ${REMOTE?`<div class="perks" style="margin:0 0 14px">${PREM_PERKS.map(t=>`<div>${IC.chk}${t}</div>`).join("")}</div>`:`<div class="perks" style="margin:0 0 14px"><div>${IC.chk}Kendi profil fotoğrafını ve kapak görselini yükle</div><div>${IC.chk}İtirafını 24 saat akışın en üstüne taşı</div><div>${IC.chk}Sınırsız cevap, mesaj ve sohbet</div><div>${IC.chk}Seni beğenenleri gör, sınırsız kaydır</div><div>${IC.chk}Fotoğraf, ses, sesli ve görüntülü arama</div></div>`}
    <div style="display:grid;gap:8px"><button class="btn gold wide" id="pgY">${REMOTE?"Premium'u gör":"Premium'u başlat · 119,90 ₺/ay"}</button><button class="btn line wide" id="pgN">Şimdi değil</button></div>
    ${REMOTE?"":`<p class="hint" style="text-align:center">Prototip: ödeme alınmaz.</p>`}</div>`;
  document.body.appendChild(g);
  g.querySelector("#pgY").onclick=()=>{g.remove();if(REMOTE){showPremium("gate");return}state.premium=true;toast("Premium açık");render();onUnlock&&onUnlock()};
  g.querySelector("#pgN").onclick=()=>g.remove();
}
