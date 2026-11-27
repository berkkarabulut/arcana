/* ============ MESAJA TEPKİ VE ALINTILI CEVAP ============
   Bir mesaja uzun bas (ya da sağ tıkla): üstte 6 emoji, altta Cevapla ve Kopyala.
   Emoji mesajın altında küçük bir rozet olarak görünür, aynı emojiye tekrar basınca kalkar.
   Cevapla: yazı kutusunun üstünde alıntı çubuğu çıkar, giden mesajın başında alıntı görünür. */
const TEPKI_E=["❤️","😂","😮","😢","👍","🔥"];
let CEVAP=null;// {id,t,u}
function cevapAl(){const r=CEVAP;CEVAP=null;const b=$("#cvBar");if(b)b.remove();return r}
function cevapAd(uid){const c=state.chats[openIdx];if(!REMOTE)return uid==="me"?"Sen":(c&&U[c.u]?U[c.u].n:"");return uid===R.uid?"Sen":(c&&U[c.u]?U[c.u].n:"")}
{const mhT=msgHTML;msgHTML=function(m,lk){
  let h=mhT(m,lk);
  if(lk||m.mod||m.kind==="call"||!/^<div class="m /.test(h))return h;
  if(m.id)h=h.replace('<div class="m ',`<div data-mid="${esc(m.id)}" class="m `);
  if(m.re&&m.re.t!=null)h=h.replace(/^(<div[^>]*>)/,`$1<span class="m-re"><b>${esc(cevapAd(m.re.u))}</b>${esc(String(m.re.t).slice(0,120))||"Fotoğraf / ses"}</span>`);
  const tp=m.tp?Object.entries(m.tp).filter(([,e])=>TEPKI_E.includes(e)):[];
  if(tp.length){const say={};tp.forEach(([,e])=>say[e]=(say[e]||0)+1);
    const benim=tp.find(([u])=>u===(REMOTE?R.uid:"me"));
    h+=`<div class="m-tp ${m.me?"me":"them"}"><span${benim?' class="ben"':""}>${Object.entries(say).map(([e,n])=>e+(n>1?" "+n:"")).join(" ")}</span></div>`}
  return h}}
function mesajMenu(el){
  const c=state.chats[openIdx];if(!c)return;const id=el.dataset.mid,m=c.msgs.find(x=>x.id===id);if(!m)return;
  const benim=m.tp&&m.tp[REMOTE?R.uid:"me"];
  openSheet(`<div class="mm-e" role="group" aria-label="Tepki ver">${TEPKI_E.map(e=>`<button class="mm-eb${benim===e?" on":""}" data-tpe="${e}" aria-label="${e} tepkisi">${e}</button>`).join("")}</div>
    <div class="menu"><button id="mmCv">${IC.reply||IC.dm}Cevapla</button>${m.t?`<button id="mmKp">${IC.copy||IC.share}Kopyala</button>`:""}<button id="mmX">${IC.close}Vazgeç</button></div>`);
  $("#sheet").querySelectorAll("[data-tpe]").forEach(b=>b.onclick=()=>{
    const e=b.dataset.tpe,yeni=benim===e?null:e;closeSheet();track("mesaj_tepki");
    m.tp=Object.assign({},m.tp||{});if(yeni)m.tp[REMOTE?R.uid:"me"]=yeni;else delete m.tp[REMOTE?R.uid:"me"];drawChat();
    if(REMOTE&&c.id)KDB.mesajTepki(c.id,id,yeni).catch(er=>toast("Tepki gönderilemedi: "+(er.code||er.message)))});
  $("#mmCv").onclick=()=>{closeSheet();CEVAP={id,t:(m.t||"").slice(0,120),u:m.me?(REMOTE?R.uid:"me"):(REMOTE?c.u:c.u)};cevapCubuk();const t=$("#mIn");if(t)t.focus()};
  const kp=$("#mmKp");if(kp)kp.onclick=async()=>{closeSheet();try{await navigator.clipboard.writeText(m.t);toast("Mesaj kopyalandı")}catch(e){toast("Kopyalanamadı")}};
  $("#mmX").onclick=closeSheet;
}
function cevapCubuk(){
  const kutu=$("#chatIn .composer .box");if(!kutu||!CEVAP)return;
  let b=$("#cvBar");if(!b){b=document.createElement("div");b.id="cvBar";b.className="cv-bar";kutu.before(b)}
  b.innerHTML=`<div><b>${esc(cevapAd(CEVAP.u))} kişisine cevap</b><span>${esc(CEVAP.t||"Fotoğraf / ses")}</span></div><button id="cvX" aria-label="Cevaplamaktan vazgeç">${IC.close}</button>`;
  $("#cvX").onclick=()=>{CEVAP=null;b.remove()};
}
function mesajDokunmaBagla(){
  const box=$("#msgs");if(!box||box._tpBagli)return;box._tpBagli=1;
  let zam=null;
  const hedef=e=>e.target.closest&&e.target.closest(".m[data-mid]");
  box.addEventListener("contextmenu",e=>{const el=hedef(e);if(el){e.preventDefault();mesajMenu(el)}});
  box.addEventListener("pointerdown",e=>{const el=hedef(e);if(!el||e.pointerType==="mouse")return;clearTimeout(zam);zam=setTimeout(()=>{zam=null;if(navigator.vibrate)navigator.vibrate(12);mesajMenu(el)},450)});
  ["pointerup","pointercancel","pointerleave"].forEach(t=>box.addEventListener(t,()=>{clearTimeout(zam)}));
  box.addEventListener("scroll",()=>clearTimeout(zam),{passive:true});
  box.addEventListener("dblclick",e=>{const el=hedef(e);if(el)mesajMenu(el)});
}
{const dcTp=drawChat;drawChat=function(){dcTp();try{mesajDokunmaBagla();if(CEVAP)cevapCubuk();else{const b=$("#cvBar");if(b)b.remove()}}catch(e){}}}
