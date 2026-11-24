/* ============ GERÇEK SUNUCU (Firebase) BAĞLANTISI ============ */
// Sadece REMOTE modda (beta adresi) çalışır. Demo sürümün davranışı değişmez.
const R={posts:[],cm:{},cmPid:null,chats:{},users:{},reports:null,admin:false,started:false,syncedMe:null,uid:null,real:{},perde:{}};
const cmN=p=>p.cmCount!=null?p.cmCount:p.cm.length;
function authorSnap(){const m=state.me;return {n:m.n,c:m.c,s:m.s,g:m.g,age:m.age,av:(m.photo&&String(m.photo).startsWith("preset:"))?m.photo:null}}
function monthTR(ts){const d=new Date(ts);return AYLAR[d.getMonth()]+" "+d.getFullYear()}
function putUser(uid,d){if(!uid||uid===R.uid)return;const o=U[uid]||{};const rl=R.real&&R.real[uid];if(rl){o.realAv=rl.av||null;o.realBn=rl.banner||null}U[uid]=Object.assign(o,{n:d.n||o.n||"kullanıcı",s:d.s||o.s||"koc",age:d.age||o.age||"",g:d.g||o.g||"Belirtmeyeyim",c:d.c||o.c||"#7CC4FF",bio:d.bio!=null?d.bio:(o.bio||""),photo:d.av||o.photo,banner:d.banner||o.banner,since:d.createdAt?monthTR(d.createdAt.toMillis?d.createdAt.toMillis():d.createdAt):(o.since||""),stat:o.stat||[0,0,0]})}
function mapPost(p){
  if(p.anon){const m=!!(R.myAnon&&R.myAnon.has(p.id));return {id:p.id,feat:p.feat||0,anon:true,ag:p.a&&p.a.g||null,u:m?"me":"anon",uid:"anon",cat:p.cat,q:null,t:p.t,ts:p.ts,ago:agoOf(p.ts),r:p.r||{bende:0,saril:0,yok:0},cm:R.cm[p.id]||[],cmCount:p.cm||0,today:dayKeyOf(Date.now())===dayKeyOf(p.ts)}}
  const mine=p.uid===R.uid;if(!mine&&p.a)putUser(p.uid,p.a);
  return {id:p.id,feat:p.feat||0,u:mine?"me":p.uid,uid:p.uid,cat:p.cat,q:p.q||null,t:p.t,ts:p.ts,ago:agoOf(p.ts),r:p.r||{bende:0,saril:0,yok:0},cm:R.cm[p.id]||[],cmCount:p.cm||0,today:dayKeyOf(Date.now())===dayKeyOf(p.ts)}}
const dayKeyOf=ts=>{const d=new Date(ts);return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()};
function refreshStats(){const by={};R.posts.forEach(p=>{const k=p.uid;by[k]=by[k]||[0,0,0];by[k][0]++;by[k][2]+=reactTotal(p)});Object.keys(U).forEach(k=>{U[k].stat=by[k]||[0,0,0]})}
/* ---- Ekranı yenile: sadece bulunduğun ekran tazelenir; sitenin yeni sürümü varsa aynı ekrana dönülerek yüklenir ---- */
// derleme her yayında sayfaya yeni bir sürüm kodu yazar (<meta name="kulis-ver">)
const pageVer=()=>{const m=document.querySelector('meta[name="kulis-ver"]');return m?m.content:""};
async function softRefresh(){
  const t0=Date.now();
  try{const h=await fetch(location.pathname+"?_="+t0,{cache:"no-store"}).then(r=>r.text());const v=(h.match(/<meta name="kulis-ver" content="([^"]+)"/)||[])[1]||"";
    const cur=pageVer();if(v&&cur&&v!==cur&&!/\{\{/.test(v)){try{sessionStorage.setItem("kulis_tab",JSON.stringify({tab:state.tab,y:scrollY}))}catch(e){}location.reload();return new Promise(()=>{})}}catch(e){}
  if(state.tab==="kesfet"&&typeof sw!=="undefined"&&sw.mode==="eslesme"&&typeof vEsles==="function")vEsles();else render();
  await new Promise(r=>setTimeout(r,Math.max(0,650-(Date.now()-t0))));
  toast("Güncellendi");
}
/* ---- Aşağı çekip yenile: her sayfada, sayfa en üstteyken aşağı çekince yenilenir ---- */
(function pullToRefresh(){
  const TH=78,MAX=130;let y0=null,x0=0,dy=0,active=false,busy=false;
  const ptr=document.getElementById("ptr"),txt=document.getElementById("ptrTxt");
  const blocked=t=>{
    if(busy)return true;
    if(document.querySelector("#scrim.open,#chat.open,#adm.open,#perdeOv,.cf-scrim,#callscr.open"))return true;
    const onb=document.getElementById("onb");if(onb&&!onb.hidden)return true;
    if(t&&t.closest&&t.closest("#swTop,textarea,input,select,[contenteditable],.no-ptr"))return true;
    // içi kaydırılabilen bir kutunun ortasındaysa dokunma
    for(let e=t;e&&e!==document.body;e=e.parentElement){if(e.scrollTop>0)return true}
    return (window.scrollY||document.documentElement.scrollTop)>2;
  };
  const show=d=>{const p=Math.min(1,d/TH);ptr.style.transition="none";txt.style.transition="none";
    ptr.style.transform=`translateY(${Math.min(d,MAX)*.6-40}px) rotate(${p*220}deg)`;ptr.style.opacity=Math.min(1,p*1.4);
    ptr.classList.toggle("go",d>=TH);txt.textContent=d>=TH?"Bırak, yenilensin":"Yenilemek için çek";
    txt.style.opacity=Math.max(0,p-.35);txt.style.transform=`translateY(${Math.min(d,MAX)*.6+18}px)`};
  const hide=()=>{ptr.style.transition="transform .3s,opacity .3s";txt.style.transition="opacity .2s";ptr.style.transform="translateY(-60px)";ptr.style.opacity=0;txt.style.opacity=0;ptr.classList.remove("go")};
  addEventListener("touchstart",e=>{if(e.touches.length!==1||blocked(e.target)){y0=null;return}y0=e.touches[0].clientY;x0=e.touches[0].clientX;dy=0;active=false},{passive:true});
  addEventListener("touchmove",e=>{if(y0==null)return;const t=e.touches[0],d=t.clientY-y0,dx=Math.abs(t.clientX-x0);
    if(!active){if(d<8)return;if(dx>d||(window.scrollY||0)>2){y0=null;return}active=true}
    dy=Math.max(0,d*.55);show(dy)},{passive:true});
  const end=()=>{if(y0==null||!active){y0=null;return}y0=null;active=false;
    if(dy>=TH){busy=true;ptr.style.transition="transform .25s";ptr.classList.remove("go");ptr.classList.add("spin");txt.textContent="Yenileniyor…";txt.style.opacity=1;
      try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}
      softRefresh().then(()=>{busy=false;ptr.classList.remove("spin");hide();txt.textContent=""})}
    else hide()};
  addEventListener("touchend",end,{passive:true});addEventListener("touchcancel",()=>{y0=null;active=false;hide()},{passive:true});
})();
function rerender(){if(!state.me)return;if($("#chat").classList.contains("open"))return void render();render()}
