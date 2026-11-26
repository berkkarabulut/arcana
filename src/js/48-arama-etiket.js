/* ============ ARAMA VE #ETİKET ============
   Akışta kategorilerin altında arama kutusu: yazdıkça itiraflar süzülür (son yüklenen itiraflarda).
   İtiraf metnindeki #etiketler tıklanabilir; dokununca o etiketle süzülür. Kutu boşken en çok kullanılan etiketler çıkar. */
let ARA="";
const ETK_RE=/(^|[\s(])#([0-9A-Za-zÇĞİÖŞÜÂÎÛçğıöşüâîû_]{2,30})/g;
const trKucuk=s=>String(s||"").toLocaleLowerCase("tr");
function etiketler(t){const o=[];String(t||"").replace(ETK_RE,(_,a,b)=>{o.push(trKucuk(b));return _});return o}
function aramaUyar(p){
  if(!ARA)return true;
  const q=trKucuk(ARA).trim();if(!q)return true;
  if(q.startsWith("#"))return etiketler(p.t).includes(q.slice(1));
  return trKucuk(p.t).includes(q)||trKucuk(p.q).includes(q);
}
{const apAra=allPosts;allPosts=function(){const l=apAra();return ARA&&state.tab==="akis"?l.filter(aramaUyar):l}}
{const phEt=postHTML;postHTML=function(p,opts){
  const h=phEt(p,opts),e=esc(p.t);
  if(!e.includes("#"))return h;
  const t=e.replace(ETK_RE,(_,a,b)=>`${a}<button class="etiket" type="button" data-etiket="${b}">#${b}</button>`);
  return h.replace(">"+e+"</blockquote>",">"+t+"</blockquote>");
}}
function populerEtiketler(){
  const say={};(typeof apAraHam==="function"?apAraHam():[]).forEach(p=>etiketler(p.t).forEach(t=>say[t]=(say[t]||0)+1));
  return Object.entries(say).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);
}
function apAraHam(){const a=ARA;ARA="";try{return allPosts()}finally{ARA=a}}
function aramaKutusu(){
  if(typeof MSF!=="undefined"&&MSF.on)return;
  const cats=$("#view .cats");if(!cats||$("#araK"))return;
  const n=ARA?allPosts().filter(p=>(state.cat==="hepsi"||p.cat===state.cat)).length:0;
  const pe=ARA?[]:populerEtiketler();
  const el=document.createElement("div");el.className="ara";el.id="araK";
  el.innerHTML=`<label class="ara-k"><span class="ara-ic" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span><input type="search" id="araIn" placeholder="İtiraflarda ara ya da #etiket" value="${esc(ARA)}" maxlength="40" enterkeyhint="search" aria-label="İtiraflarda ara"></label>
    ${ARA?`<div class="ara-s"><span>“${esc(ARA)}” için ${n} itiraf</span><button id="araX" type="button">Temizle</button></div>`:pe.length?`<div class="ara-e" aria-label="Popüler etiketler">${pe.map(t=>`<button type="button" class="etiket" data-etiket="${esc(t)}">#${esc(t)}</button>`).join("")}</div>`:""}`;
  cats.after(el);
  const i=$("#araIn");let zam;
  i.oninput=()=>{clearTimeout(zam);zam=setTimeout(()=>{ARA=i.value.trim();track("arama");const pos=i.selectionStart;render();const j=$("#araIn");if(j){j.focus();try{j.setSelectionRange(pos,pos)}catch(e){}}},280)};
  const x=$("#araX");if(x)x.onclick=()=>{ARA="";render()};
}
{const vAkisAra=vAkis;vAkis=function(){vAkisAra();try{aramaKutusu()}catch(e){}}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-etiket]");if(!b)return;
  e.preventDefault();e.stopPropagation();ARA="#"+b.dataset.etiket;track("etiket");closeSheet();state.tab="akis";render();scrollTo(0,0)},true);
