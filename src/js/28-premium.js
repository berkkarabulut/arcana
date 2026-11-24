/* ============ PREMIUM ============ */
function showPremium(src){
  return showPremiumRemote(src); // tek, güncel premium ekranı (demo modunda da)
  let plan="aylik";
  const draw=()=>openSheet(`<h2>Kulis Premium</h2><p class="muted" style="margin:6px 0 2px;font-size:14px">${src==="medya"?"Fotoğraf, ses kaydı, sesli ve görüntülü arama Premium'a özel.":src==="mesaj"?"Sohbetin yarıda kalmasın.":src==="esles"?"Sınırsız kaydır, seni beğenenleri gör.":src==="sohbet"?"Yeni sohbet başlatmak için Premium'a geç.":"Sınırsız konuş."}</p>
   <div class="perks"><div>${IC.chk}Sınırsız mesaj, sınırsız sohbet</div><div>${IC.chk}Sınırsız kaydır, seni beğenenleri gör</div><div>${IC.chk}İtirafını 24 saat akışın en üstüne taşı</div><div>${IC.chk}İtiraflara sınırsız cevap yaz</div><div>${IC.chk}Kendi profil fotoğrafını ve kapağını yükle</div><div>${IC.chk}Fotoğraf, video ve ses kaydı gönder</div><div>${IC.chk}Sesli ve görüntülü arama</div><div>${IC.chk}Biriken mesajları hemen oku</div><div>${IC.chk}Mesajının okunduğunu gör</div></div>
   <div class="plans">${[["haftalik","Haftalık","İstediğin zaman iptal","49,90 ₺"],["aylik","Aylık","En çok seçilen, haftalığa göre %40 ucuz","119,90 ₺"],["yillik","Yıllık","Aylık 49,90 ₺'ye gelir","599 ₺"]].map(([k,n,s,pr])=>`<button class="plan" data-plan="${k}" aria-pressed="${plan===k}"><span><b>${n}</b><small>${s}</small></span><span class="p">${pr}</span></button>`).join("")}</div>
   <button class="btn gold wide" id="buy">Premium'u başlat</button>
   <p class="hint" style="text-align:center">Prototip: ödeme alınmaz, düğme sadece Premium görünümünü açar. Fiyatlar örnektir.</p>`);
  draw();
  const bind=()=>{$("#sheet").querySelectorAll("[data-plan]").forEach(b=>b.onclick=()=>{plan=b.dataset.plan;draw();bind()});
    $("#buy").onclick=()=>{state.premium=true;closeSheet();toast("Premium açık. Biriken mesajların görünür oldu.");render();if(openIdx>=0)drawChat()}};
  bind();
}
