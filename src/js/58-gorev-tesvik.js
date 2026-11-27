/* ============ KURUCU GÖREVLERİNİ ÖNE ÇIKAR ============
   1) Karşılama penceresi (bir kez)  2) Akışın üstünde "sıradaki görev" şeridi  3) Doğru anda dürtme (itiraf sonrası seri, biten görevde yeşil kutlama)
   4) Üstteki "Ücretsiz" düğmesinde yeşil nokta. Kendiliğinden açılan pencere günde en fazla bir; her şey tek dokunuşla kapanır. */
const gorevAktif=()=>REMOTE&&R.acilis&&state.me&&R.gorev&&!R.gorev.tamam;
function gorevSiradaki(){const g=R.gorev;if(!g||!g.gorevler)return null;
  return GOREV_LISTE.find(x=>!g.gorevler[x.k]&&x.b)||GOREV_LISTE.find(x=>!g.gorevler[x.k])||null}
// yeşil kutlama/dürtme kutusu (toast'tan büyük, düğmeli)
function gorevYesil(gorev,metin){
  $("#gvToast")&&$("#gvToast").remove();
  const sira=gorevSiradaki(),el=document.createElement("div");el.id="gvToast";el.setAttribute("role","status");
  el.innerHTML=`<span class="gvt-i" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
    <span class="gvt-m"><b>${metin||("Görev tamam: "+gorev.t)}</b>${!metin&&sira?`<small>Sıradaki: ${sira.t} · ${gorevSay(R.gorev)}/6</small>`:""}</span>
    <button class="gvt-b" id="gvtB">${metin?"Gör":"Sıradaki"}</button><button class="gvt-x" id="gvtX" aria-label="Kapat">${IC.close}</button>`;
  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add("show"));
  const kapat=()=>{el.classList.remove("show");setTimeout(()=>el.remove(),300)};
  $("#gvtX").onclick=kapat;$("#gvtB").onclick=()=>{kapat();showGorevler()};setTimeout(kapat,8000);
}
function gorevDurt(metin){
  $("#gvToast")&&$("#gvToast").remove();
  const el=document.createElement("div");el.id="gvToast";el.className="durt";el.setAttribute("role","status");
  el.innerHTML=`<span class="gvt-i" aria-hidden="true">${PK_IC.seri}</span><span class="gvt-m"><b>${metin}</b><small>Kurucu görevleri · ${gorevSay(R.gorev)}/6</small></span><button class="gvt-b" id="gvtB">Görevler</button><button class="gvt-x" id="gvtX" aria-label="Kapat">${IC.close}</button>`;
  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add("show"));
  const kapat=()=>{el.classList.remove("show");setTimeout(()=>el.remove(),300)};
  $("#gvtX").onclick=kapat;$("#gvtB").onclick=()=>{kapat();showGorevler()};setTimeout(kapat,8000);
}
// 1) karşılama penceresi
function gorevKarsila(){
  const anahtar="kulis_gv_hos_"+R.uid;LSset(anahtar,1);popupKullan();track("gorev_karsila");
  const g=R.gorev;
  openSheet(`<div class="gk-p"><span class="gk-rozet" aria-hidden="true">${PK_IC.seri}</span>
    <h2>Kulis'in kurucularından ol</h2>
    <p class="muted">Açılış döneminde katıldın, bu yüzden <b>Kurucu üye</b> rozetin hazır. 6 küçük görevi bitirirsen uygulamalar çıkınca <b>1 ay Premium</b> de senin.</p>
    <ol class="gk-l">${GOREV_LISTE.map(x=>`<li class="${g.gorevler[x.k]?"ok":""}"><i aria-hidden="true"></i>${x.t}</li>`).join("")}</ol>
    <div class="bs-b"><button class="btn wide" id="gkBasla">Görevlere başla</button><button class="btn line wide" id="gkSonra">Sonra</button></div></div>`);
  $("#gkBasla").onclick=()=>{closeSheet();showGorevler()};$("#gkSonra").onclick=()=>{track("gorev_karsila_sonra");closeSheet()};
}
{let bekle=0;setInterval(()=>{
  if(!gorevAktif()||LS("kulis_gv_hos_"+R.uid,0)){bekle=0;return}
  if(!popupHakki()||$("#scrim").classList.contains("open")||openIdx>=0||!$("#onb").hidden){bekle=0;return}
  if(!bekle){bekle=Date.now();return}
  if(Date.now()-bekle>=5000){bekle=0;gorevKarsila()}
},2500)}
// 2) akışın üstünde sıradaki görev şeridi  4) "Ücretsiz" düğmesinde yeşil nokta
{const r0=render;render=function(){r0.apply(this,arguments);
  const p=$("#premPill");if(p)p.classList.toggle("gv-nokta",!!gorevAktif());
  if(!gorevAktif()||state.tab!=="akis"||LS("kulis_gv_serit","")===yerelGun()||$("#gvSerit"))return;
  const s=gorevSiradaki();if(!s)return;const v=$("#view");if(!v)return;const n=gorevSay(R.gorev);
  v.insertAdjacentHTML("afterbegin",`<div class="gv-serit" id="gvSerit"><button class="gvs-a" id="gvsAc"><span class="gvs-h">${gorevHalka(n,6,34)}<b>${n}</b></span><span class="gvs-m"><b>Kurucu görevleri</b><small>Sıradaki: ${s.t}${s.k==="gun"?` (${Math.min(R.gorev.gunSay||0,15)}/15)`:""}</small></span></button>${s.b?`<button class="btn sm" id="gvsYap">${{profil:"Düzenle",anaEkran:"Ekle",bildirim:"Aç",itiraf:"Yaz",paylas:"Paylaş"}[s.k]||"Yap"}</button>`:""}<button class="gvs-x" id="gvsX" aria-label="Bugünlük gizle">${IC.close}</button></div>`);
  $("#gvsAc").onclick=showGorevler;$("#gvsX").onclick=()=>{LSset("kulis_gv_serit",yerelGun());$("#gvSerit").remove();track("gorev_serit_kapat")};
  const y=$("#gvsYap");if(y)y.onclick=()=>gorevYap(s.k,y);
}}
// 3) itiraf yazınca seri dürtmesi
{const t=setInterval(()=>{if(!window.KDB||!KDB.addPost)return;clearInterval(t);
  const sonra=()=>{if(!gorevAktif())return;setTimeout(()=>gorevGetir(null,true).then(g=>{if(!g||!g.gorevler||g.gorevler.itiraf)return;
    const s=Math.max(1,Math.min(g.itirafSeri||1,2));gorevDurt(s===1?"İtiraf serin başladı: 1/3 gün. Yarın da yaz!":"Serin 2/3 gün. Yarın bir itiraf daha, görev tamam!")}),2500)};
  for(const ad of ["addPost","anonPost"]){const f=KDB[ad];if(typeof f!=="function")continue;KDB[ad]=function(){return f.apply(KDB,arguments).then(r=>{sonra();return r})}}
},1500)}
