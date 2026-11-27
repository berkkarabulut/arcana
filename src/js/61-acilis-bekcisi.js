/* ============ AÇILIŞ BEKÇİSİ ============
   "Kulis açılıyor…" ekranı takılı kalmasın. (iPhone/iPad ana ekran uygulamasında sitenin yerel önbelleği ya da bağlantısı
   bazen askıda kalabiliyor.) 12 sn içinde açılmazsa bir kez otomatik olarak yedek bağlantı moduyla yeniden açar;
   yine olmazsa ekranda "Tekrar dene" ve "Önbelleği temizle" çıkar. */
async function kulisOnbellekTemizle(){
  try{if(indexedDB.databases){const l=await indexedDB.databases();await Promise.all(l.filter(d=>d.name&&/firestore|firebase/i.test(d.name)).map(d=>new Promise(r=>{const q=indexedDB.deleteDatabase(d.name);q.onsuccess=q.onerror=q.onblocked=()=>r()})))}}catch(e){}
  try{if(window.caches){const ks=await caches.keys();await Promise.all(ks.map(k=>caches.delete(k)))}}catch(e){}
  try{const r=await navigator.serviceWorker.getRegistrations();await Promise.all(r.map(x=>x.update().catch(()=>{})))}catch(e){}
}
{const rl0=remoteLoading;let bekci=null;
  remoteLoading=function(on){rl0(on);clearTimeout(bekci);if(!on)return;
    bekci=setTimeout(()=>{const el=$("#remLoad");if(!el)return;
      let deneme=0;try{deneme=+sessionStorage.getItem("kulis_bekci")||0}catch(e){}
      if(deneme<1){try{sessionStorage.setItem("kulis_bekci",String(deneme+1));localStorage.setItem("kulis_lp","1")}catch(e){}track("acilis_takildi",{deneme:1});location.reload();return}
      track("acilis_takildi",{deneme:2});
      const p=el.querySelector(".rl-in");if(!p||$("#rlYardim"))return;
      p.insertAdjacentHTML("beforeend",`<div id="rlYardim" style="margin-top:14px;display:grid;gap:8px;max-width:260px"><p class="hint" style="margin:0;text-align:center">Açılış her zamankinden uzun sürdü.</p><button class="btn wide" id="rlTekrar">Tekrar dene</button><button class="btn line wide" id="rlTemiz">Önbelleği temizle ve aç</button></div>`);
      $("#rlTekrar").onclick=()=>location.reload();
      $("#rlTemiz").onclick=async()=>{$("#rlTemiz").disabled=true;$("#rlTemiz").textContent="Temizleniyor…";await kulisOnbellekTemizle();try{sessionStorage.removeItem("kulis_bekci")}catch(e){}location.reload()};
    },12000);
  };
  // başarıyla açılınca sayaç sıfırlansın
  {const t=setInterval(()=>{if(state.me&&!$("#remLoad")){clearInterval(t);try{sessionStorage.removeItem("kulis_bekci")}catch(e){}}},2000);setTimeout(()=>clearInterval(t),60000)}
}
