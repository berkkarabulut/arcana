/* ============ SOHBETTE GIF ============
   Yazı kutusunun solunda GIF düğmesi. Dokununca alttan pencere açılır: önce popüler GIF'ler, yazınca arama.
   Arama sunucudaki gifAra fonksiyonundan geçer (GIPHY, önbellekli). Mesajda yalnızca GIF kimliği saklanır. */
const GIF_URL=(id,k)=>`https://i.giphy.com/media/${id}/${k||"200w"}.gif`;
const GIF_ON={};// arama -> sonuç (oturum içi önbellek)
{const mhG=msgHTML;msgHTML=function(m,lk){
  if(m.kind!=="gif"||!m.g||m.mod)return mhG(m,lk);
  if(lk)return `<div class="m ${m.me?"me":"them"} locked"><span style="opacity:.75">GIF gönderildi</span></div>`;
  let h=mhG(Object.assign({},m,{kind:undefined,t:""}),lk);
  h=h.replace('class="m ','class="m media gif ');
  const i=h.indexOf("</div>");
  if(i>-1)h=h.slice(0,i)+`<img src="${GIF_URL(esc(m.g))}" alt="GIF" loading="lazy" decoding="async">`+h.slice(i);
  return h}}
function gifHata(e){const c=e&&(e.code||"").replace("functions/","");
  if(c==="resource-exhausted")return "Çok hızlı aradın, biraz sonra tekrar dene";
  return "GIF'ler şu an açılmıyor, birazdan tekrar dene"}
async function gifGetir(q){q=(q||"").trim().toLocaleLowerCase("tr");if(GIF_ON[q])return GIF_ON[q];const r=await KDB.gifAra(q);GIF_ON[q]=r;return r}
function gifSec(c){
  if(!REMOTE){toast("GIF'ler canlı sürümde açık");return}
  if(c.status!=="open"){toast("Önce isteğin kabul edilmeli");return}
  openSheet(`<div class="gif-p"><h3 class="gif-b">GIF gönder</h3>
    <input id="gifQ" type="search" maxlength="50" placeholder="GIF ara (ör. kahkaha, utandım)" autocomplete="off" aria-label="GIF ara">
    <div id="gifL" class="gif-l" role="list" aria-live="polite"><p class="muted gif-d">Yükleniyor…</p></div>
    <p class="gif-a">Powered by GIPHY</p></div>`);
  let sira=0,zam=null;
  const yukle=async q=>{const ben=++sira,l=$("#gifL");if(!l)return;
    try{const r=await gifGetir(q);if(ben!==sira||!$("#gifL"))return;
      l.innerHTML=r.length?r.map(g=>`<button class="gif-i" role="listitem" data-gid="${esc(g.id)}" style="aspect-ratio:${g.w}/${g.h}" aria-label="Bu GIF'i gönder"><img src="${GIF_URL(esc(g.id))}" alt="" loading="lazy" decoding="async"></button>`).join(""):`<p class="muted gif-d">Bununla ilgili GIF bulamadık, başka bir kelime dene.</p>`;
      l.querySelectorAll("[data-gid]").forEach(b=>b.onclick=()=>{closeSheet();gifGonder(c,b.dataset.gid)})}
    catch(e){if(ben===sira&&$("#gifL"))$("#gifL").innerHTML=`<p class="muted gif-d">${gifHata(e)}</p>`}};
  const q=$("#gifQ");q.oninput=()=>{clearTimeout(zam);zam=setTimeout(()=>yukle(q.value),450)};
  q.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();clearTimeout(zam);yukle(q.value)}};
  yukle("");track("gif_ac");
}
function gifGonder(c,id){
  if(!/^[A-Za-z0-9]{4,40}$/.test(id))return;
  const wasMine=c.lastBy===R.uid,re=cevapAl(),om={me:true,kind:"gif",g:id,t:"",re};
  c.msgs.push(om);drawChat();track("gif_gonder");
  KDB.sendMsg(c.id,"",re,id).then(()=>{if(!wasMine)KDB.notify(c.u,"dm","sana bir GIF gönderdi",{chat:c.u})}).catch(e=>{
    c.msgs=c.msgs.filter(x=>x!==om);drawChat();
    if(e&&e.code==="permission-denied"&&!state.premium&&(c.srvN||0)>=FREE_LIMIT){showPremium("sohbet");return}
    toast(writeErr(e,"mesaj"))});
}
function gifDugme(){
  const c=state.chats[openIdx];if(!c||c.status!=="open"||!REMOTE)return;
  const t=$("#mIn");if(!t||$("#gifB"))return;
  const b=document.createElement("button");b.className="tb gif-tb";b.id="gifB";b.type="button";b.textContent="GIF";b.setAttribute("aria-label","GIF gönder");
  t.before(b);b.onclick=()=>gifSec(c);
}
{const dcGif=drawChat;drawChat=function(){dcGif();try{gifDugme()}catch(e){}}}
