/* ============ İLK ADIMLAR ============
   Yeni üye olan kişiye akışın en üstünde 3 adımlık bir kontrol listesi gösterilir:
   bir itirafa tepki ver, ilk itirafını yaz, Keşfet'te birini beğen. Adımlar yapıldıkça işaretlenir,
   hepsi bitince ya da kullanıcı kapatınca kart bir daha çıkmaz. Sadece bu özellikten sonra kayıt olan
   hesaplarda görünür (kayıt anında bu cihaza işaret bırakılır), eski üyeler görmez.
   Her adımın ilk kez yapılması yönetici panelindeki Huni sekmesine sayılır. */
const ILK_GUN=14;
const ILK_ADIM=[
  ["tepki","Bir itirafa tepki ver","Aşağıdaki itiraflardan birine “Ben de” de ya da sarıl.","ilkTepki"],
  ["itiraf","İlk itirafını yaz","Takma adınla ya da tamamen anonim. Aklına bir şey gelmezse günün sorusunu cevapla.","ilkItiraf"],
  ["esles","Keşfet'te birini beğen","İtirafı sana dokunanı sağa kaydır. Karşılıklı beğenirseniz sohbet açılır.","ilkBegeni"]];
const ilkAnahtar=()=>"kulis_ilk_"+(REMOTE?(R.uid||window.KDB&&window.KDB.uid||""):"demo");
function ilkOku(){try{return JSON.parse(localStorage.getItem(ilkAnahtar())||"null")}catch(e){return null}}
function ilkYaz(v){try{localStorage.setItem(ilkAnahtar(),JSON.stringify(v))}catch(e){}}
// kayıt tamamlanınca çağrılır (38-perde.js)
function ilkBasla(){ilkYaz({t:Date.now(),d:{}})}
function ilkSay(olay){try{if(typeof MSF_URL==="string")fetch(MSF_URL.replace("misafirAkis","misafirOlay"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({data:{olay,cid:typeof cihazId==="function"?cihazId():""}}),keepalive:true}).catch(()=>{})}catch(e){}}
function ilkYapildi(k){
  if(k==="tepki")return Object.values(state.react||{}).some(Boolean);
  if(k==="itiraf")return (state.myPosts||[]).length>0;
  if(k==="esles")return typeof sw!=="undefined"&&sw.hist.some(h=>h.like);
  return false;
}
function ilkDurum(){
  const v=ilkOku();if(!v||v.bitti||v.kapali)return null;
  if(Date.now()-v.t>ILK_GUN*864e5)return null;
  let yeni=false;
  ILK_ADIM.forEach(([k,,,olay])=>{if(!v.d[k]&&ilkYapildi(k)){v.d[k]=1;yeni=true;track("ilk_"+k);ilkSay(olay)}});
  if(ILK_ADIM.every(([k])=>v.d[k])){v.bitti=1;ilkYaz(v);track("ilk_bitti");ilkSay("ilkBitti");
    setTimeout(()=>toast("Hazırsın! Kulis'te ilk üç adımı tamamladın"),400);return null}
  if(yeni)ilkYaz(v);
  return v;
}
function ilkKart(){
  if(!state.me||(typeof MSF!=="undefined"&&MSF.on))return;
  const v=ilkDurum(),eski=$("#ilkKart");if(eski)eski.remove();
  if(!v)return;
  const n=ILK_ADIM.filter(([k])=>v.d[k]).length,sira=ILK_ADIM.findIndex(([k])=>!v.d[k]);
  const el=document.createElement("section");el.className="ilk";el.id="ilkKart";el.setAttribute("aria-label","İlk adımlar");
  el.innerHTML=`<div class="ilk-ust"><div><b>Kulis'e hoş geldin</b><small>${n} / ${ILK_ADIM.length} adım tamam</small></div><button class="ilk-x" id="ilkKapat" aria-label="Listeyi kapat">${IC.close}</button></div>
    <div class="ilk-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${ILK_ADIM.length}" aria-valuenow="${n}"><i style="width:${n*100/ILK_ADIM.length}%"></i></div>
    <ol class="ilk-liste">${ILK_ADIM.map(([k,b,s],i)=>`<li><button class="ilk-adim${v.d[k]?" ok":""}${i===sira?" sira":""}" data-ilk="${k}" ${v.d[k]?'aria-disabled="true"':""}><span class="ilk-tik" aria-hidden="true">${v.d[k]?"✓":i+1}</span><span class="ilk-m"><b>${b}</b>${v.d[k]?"":`<small>${s}</small>`}</span></button></li>`).join("")}</ol>`;
  const ust=$("#view .inst")||null;
  if(ust&&ust.parentNode===view)ust.after(el);else view.prepend(el);
  $("#ilkKapat").onclick=()=>{const x=ilkOku();if(x){x.kapali=1;ilkYaz(x)}track("ilk_kapat");el.remove()};
  el.querySelectorAll("[data-ilk]").forEach(b=>b.onclick=()=>{
    const k=b.dataset.ilk;if(v.d[k])return;
    if(k==="tepki"){const it=[...document.querySelectorAll("#view .it")].find(x=>x.querySelector("[data-react]"));
      if(it){it.scrollIntoView({behavior:"smooth",block:"center"});it.classList.remove("ilk-vurgu");void it.offsetWidth;it.classList.add("ilk-vurgu")}else toast("Akışta henüz itiraf yok")}
    else if(k==="itiraf")showConfess({q:todayQ().t});
    else if(k==="esles"){closeChat();state.tab="kesfet";render();scrollTo(0,0)}
  });
}
{const vAkisIlk=vAkis;vAkis=function(){vAkisIlk();try{ilkKart()}catch(e){}}}
// Keşfet'te beğeni anında da kaydedilsin (kullanıcı akışa dönmeden çıkabilir)
{const decideIlk=decide;decide=function(c,like){decideIlk(c,like);if(like)try{ilkDurum()}catch(e){}}}
