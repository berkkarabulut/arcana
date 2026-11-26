/* ============ PROFİLİNE KİM BAKTI ============
   Birinin profilini açınca ona iz bırakırsın (günde bir kez, sadece zaman kaydedilir).
   Ayarlar > Gizlilik'te "Profillere iz bırak" kapatılırsa iz bırakmazsın, karşılığında sen de kimin baktığını göremezsin.
   Liste Premium ile açılır; Premium değilse son 7 günün sayısı ve bulanık kartlar görünür. */
let ZIYARET=[];// [{uid,ts}]
const izAcik=()=>(R.settings||{}).iz!==false;
const ZIY_SON={};
function ziyaretBirak(k){
  if(!REMOTE||!k||k==="me"||k==="anon"||k===R.uid||!izAcik()||!window.KDB||!KDB.ziyaret)return;
  const g=new Date().toDateString();if(ZIY_SON[k]===g)return;ZIY_SON[k]=g;
  KDB.ziyaret(k).catch(()=>{delete ZIY_SON[k]});
}
{const spZ=showProfile;showProfile=function(k){spZ(k);try{ziyaretBirak(k)}catch(e){}}}
const ziyaretSon7=()=>ZIYARET.filter(z=>Date.now()-z.ts<7*864e5);
async function showZiyaretciler(){
  if(REMOTE&&!izAcik()){
    openSheet(`<div class="sheet-head"><h2>Profiline bakanlar</h2></div><p class="muted">Profillere iz bırakmayı kapattığın için kimin baktığını göremezsin. Açmak için Ayarlar, Gizlilik ve mesajlar bölümüne bak.</p><button class="btn line wide" id="zAy" style="margin-top:14px">Ayarlara git</button>`);
    $("#zAy").onclick=()=>{closeSheet();showSettings()};return}
  const son=ziyaretSon7(),n=son.length;
  if(!state.premium){
    openSheet(`<div class="sheet-head"><h2>Profiline bakanlar</h2></div>
      <p class="muted" style="margin:-4px 0 14px">${n?`Son 7 günde <b>${n} kişi</b> profiline baktı.`:"Son 7 günde profiline bakan olmadı. İtiraf yazdıkça artar."}</p>
      ${n?`<div class="bg-kilit" aria-hidden="true">${Array.from({length:Math.min(n,6)},(_,i)=>`<span class="bg-bulanik" style="--h:${(i*83+40)%360}"></span>`).join("")}</div>
      <button class="btn gold wide" id="zPrem">Kim olduklarını gör</button><p class="hint" style="text-align:center;margin-top:10px">Premium ile profiline bakanları görür, merak ettiğine hemen yazarsın.</p>`:""}`);
    const b=$("#zPrem");if(b)b.onclick=()=>{track("ziyaret_premium");closeSheet();showPremiumRemote("ziyaret")};return;
  }
  openSheet(`<div class="sheet-head"><h2>Profiline bakanlar</h2></div><p class="muted">Yükleniyor…</p>`);
  if(REMOTE){const eksik=son.filter(z=>!U[z.uid]).slice(0,30);await Promise.all(eksik.map(async z=>{const d=await KDB.userPub(z.uid);if(d)putUser(z.uid,d)}))}
  const l=son.filter(z=>U[z.uid]);
  openSheet(`<div class="sheet-head"><h2>Profiline bakanlar</h2></div>
    ${l.length?`<p class="muted" style="margin:-4px 0 10px">Son 7 gün, ${l.length} kişi.</p><ul class="bg-liste">${l.map(z=>{const u=U[z.uid];return `<li class="bg-s"><button class="bg-av" data-zp="${z.uid}" aria-label="${esc(u.n)} profiline bak">${av(z.uid,48,true)}</button><div class="bg-m"><b>${esc(u.n)}</b><small>${Z[u.s]?Z[u.s].n:""}${u.age?", "+esc(u.age):""}, ${agoOf(z.ts)}</small></div><button class="btn line sm" data-zp="${z.uid}">Profil</button></li>`}).join("")}</ul>`
      :`<p class="empty">Son 7 günde profiline bakan olmadı.</p>`}`,true);
  $("#sheet").querySelectorAll("[data-zp]").forEach(b=>b.onclick=()=>showProfile(b.dataset.zp));
}
