/* ============ ŞİKÂYET ============ */
// Konuşmayı bildir: sohbetteki karşı tarafı ve son mesajlarını yöneticiye iletir
function showChatReport(c){
  const u=U[c.u]||{n:"Bu kişi"};
  const reasons=["Taciz veya rahatsız edici mesajlar","İstenmeyen cinsel içerik veya fotoğraf","Tehdit veya şantaj","Para, hediye veya kişisel bilgi istiyor","Sahte hesap veya dolandırıcılık","18 yaşından küçük olabilir","Nefret söylemi","Diğer"];let sel=null;
  const draw=()=>{openSheet(`<h2>Konuşmayı bildir</h2><p class="muted" style="font-size:14px;margin:6px 0 14px">${esc(u.n)} ile konuşmanda neyi bildirmek istiyorsun? Son mesajlar yöneticiye iletilir ve 24 saat içinde incelenir. Kimin bildirdiği karşı tarafa gösterilmez.</p>
    <div class="plans">${reasons.map(r=>`<button class="plan" data-crs="${r}" aria-pressed="${sel===r}"><b style="font-weight:600">${r}</b></button>`).join("")}</div>
    <button class="btn wide" id="crGo" ${sel?"":"disabled"}>Bildir</button>
    <p class="hint" style="text-align:center;margin-top:10px">Acil bir tehlike varsa 112'yi ara.</p>`);
    $("#sheet").querySelectorAll("[data-crs]").forEach(b=>b.onclick=()=>{sel=b.dataset.crs;draw()});
    $("#crGo").onclick=()=>{const g=$("#crGo");g.disabled=true;g.textContent="Gönderiliyor…";logReport("k:"+c.u,sel).then(()=>{
      openSheet(`<h2>Bildirimin alındı</h2><p class="muted" style="font-size:14px;margin:8px 0 16px">Teşekkürler. Konuşma incelenecek. İstersen ${esc(u.n)} kişisini engelleyebilirsin; engellediğin kişi sana yazamaz ve seni arayamaz.</p>
        <div style="display:grid;gap:8px"><button class="btn line wide" data-block="${c.u}">Engelle</button><button class="btn wide" id="crOk">Tamam</button></div>`);
      $("#crOk").onclick=closeSheet}).catch(()=>{const g2=$("#crGo");if(g2){g2.disabled=false;g2.textContent="Bildir"}})}};
  draw();
}
function showReport(key){
  const reasons=["Taciz veya zorbalık","Cinsel içerik","Başkasını ifşa ediyor","Nefret söylemi","Spam veya dolandırıcılık","18 yaşından küçük olabilir","Çocuk istismarı veya reşit olmayan","Diğer"];let sel=null;
  const draw=()=>{openSheet(`<h2>Neden şikâyet ediyorsun?</h2><p class="muted" style="font-size:14px;margin:6px 0 14px">Şikâyetler 24 saat içinde incelenir. Kimin şikâyet ettiği gösterilmez.</p>
    <div class="plans">${reasons.map(r=>`<button class="plan" data-rs="${r}" aria-pressed="${sel===r}"><b style="font-weight:600">${r}</b></button>`).join("")}</div>
    <button class="btn wide" id="rpGo" ${sel?"":"disabled"}>Şikâyeti gönder</button>`);
    $("#sheet").querySelectorAll("[data-rs]").forEach(b=>b.onclick=()=>{sel=b.dataset.rs;draw()});
    $("#rpGo").onclick=()=>{state.hidden.add(key);const pr=logReport(key,sel);if(pr&&pr.catch)pr.catch(()=>{});closeSheet();toast("Şikâyetin alındı. Bu içerik artık sana gösterilmeyecek.");render()}};
  draw();
}
