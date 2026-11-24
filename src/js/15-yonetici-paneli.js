/* ============ YÖNETİCİ PANELİ ============ */
// Şimdilik bu cihazdaki verileri gösterir. Sunucu bağlanınca tüm kullanıcıların şikâyetleri buraya düşecek ve panel şifreyle korunacak.
const LS=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?d:v}catch(e){return d}};
const LSset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
function logReport(key,reason,extra){if(REMOTE){let pv=null;try{const o=reportPreview(key);pv=`${o.kind}: ${o.who} | ${o.text}`.slice(0,400)}catch(e){}
  const [t,id]=key.split(":");extra=extra||{};if(!extra.target&&(t==="u"||t==="k"))extra.target=id;
  if(t==="k"){const c=state.chats.find(x=>x.u===id);if(c){extra.cid=c.id;extra.mids=c.msgs.filter(m=>!m.me&&m.id&&!m.mod).slice(-20).map(m=>m.id);
    extra.msgs=c.msgs.filter(m=>m.id||m.t).slice(-30).map(m=>{const o={w:m.me?"b":"k",t:String(m.t||"").slice(0,500),ts:m.ts||0};if(m.id)o.id=m.id;if(m.kind==="img"&&m.src)o.img=m.src;if(m.kind==="voice"&&m.src){o.aud=m.src;o.dur=m.dur||0}if(m.mod)o.mod=true;return o})}}
  if(t==="p"&&!extra.target){const rp=(R.posts||[]).find(x=>x.id===id);if(rp&&rp.uid&&!rp.anon)extra.target=rp.uid}
  if(t==="c"&&!extra.target){const cc=(R.cm[id]||[])[+key.split(":")[2]];if(cc&&cc.uid)extra.target=cc.uid}
  return KDB.report(key,reason,pv,extra).then(()=>track("sikayet")).catch(e=>{toast("Şikâyet gönderilemedi: "+(e.code||e.message));throw e})}const l=LS("arcana_reports",[]);l.unshift({id:"r"+Date.now(),key,reason,ts:Date.now(),status:"bekliyor"});LSset("arcana_reports",l.slice(0,200));track("sikayet")}
function reportPreview(key){
  const [t,id]=key.split(":");
  if(t==="p"){const p=allPosts().find(x=>x.id===id);return p?{who:p.anon?"Anonim":userOf(p.u).n,text:p.t,kind:"İtiraf"}:{who:"?",text:"(silinmiş itiraf)",kind:"İtiraf"}}
  if(t==="u"){const u=U[id];return {who:u?u.n:id,text:u?u.bio||"":"",kind:"Kullanıcı"}}
  if(t==="k"){const u=U[id],c=state.chats.find(x=>x.u===id);const last=c?c.msgs.filter(m=>!m.me).slice(-6).map(m=>m.kind==="img"?"[fotoğraf]":m.kind==="voice"?"[ses]":m.t).join(" / "):"";return {who:u?u.n:id,text:last||"(mesaj yok)",kind:"Konuşma"}}
  return {who:"?",text:key,kind:"İçerik"};
}
const STAT_NAMES=[["kayit","Yeni üye"],["itiraf_yazildi","İtiraf"],["yorum","Yorum"],["mesaj","Mesaj"],["begen","Sağa kaydırma"],["eslesme","Eşleşme"],["paylas","Hikâye paylaşımı"],["davet","Davet linki paylaşımı"],["sikayet","Şikâyet"],["filtre_kelime","Filtre: kelime"],["filtre_isim","Filtre: ad soyad"],["filtre_kurum","Filtre: okul/iş yeri"],["filtre_kullaniciadi","Filtre: kullanıcı adı"]];
function openAdmin(){
  if(REMOTE)return openAdminRemote();
  let el=$("#adm");if(!el){el=document.createElement("div");el.id="adm";el.setAttribute("role","dialog");el.setAttribute("aria-label","Yönetici paneli");document.body.appendChild(el)}
  const stats=LS("arcana_stats",{}),today=stats[dayKey()]||{},tot={};
  Object.values(stats).forEach(d=>Object.entries(d).forEach(([k,v])=>tot[k]=(tot[k]||0)+v));
  const reps=REMOTE?(R.reports||[]).map(r=>Object.assign({},r,{status:r.status||"bekliyor"})):LS("arcana_reports",[]),open=reps.filter(r=>r.status==="bekliyor"),done=reps.filter(r=>r.status!=="bekliyor").slice(0,20);
  const banned=bannedList();
  const repRow=r=>{let pv=reportPreview(r.key);if(REMOTE&&r.preview&&(pv.who==="?"||pv.text==="(silinmiş itiraf)")){const m=String(r.preview).match(/^([^:]*): ([^|]*) \| ([\s\S]*)$/);pv=m?{kind:m[1],who:m[2]+" (artık yok)",text:m[3]}:{kind:"İçerik",who:"",text:r.preview}}return `<div class="adm-rep ${r.status!=="bekliyor"?"done":""}"><div class="adm-rh"><span class="adm-k">${pv.kind}</span><b>${esc(pv.who)}</b><span class="adm-reason">${esc(r.reason)}</span><small>${agoOf(r.ts)}</small></div>
    <p>${esc(pv.text).slice(0,220)}</p>${r.status==="bekliyor"?`<div class="adm-acts"><button class="btn" data-adm="kaldir:${r.id}" style="background:var(--nar)">İçeriği kaldır</button><button class="btn line" data-adm="yoksay:${r.id}">Yoksay</button></div>`:`<small class="adm-st">${r.status==="kaldirildi"?"Kaldırıldı":"Yoksayıldı"}</small>`}</div>`};
  el.innerHTML=`<div class="adm-in">
    <div class="adm-top"><h2>Yönetici paneli</h2><button class="icon-btn" id="admX" aria-label="Kapat">${IC.close}</button></div>
    <p class="hint" style="margin:-4px 0 16px">${REMOTE?"Şikâyetler tüm kullanıcılardan canlı geliyor. Aşağıdaki sayılar sadece bu cihazdaki hareketler; sitenin genel istatistikleri Google Analytics'te.":"Şu an sadece bu cihazdaki verileri görüyorsun."}</p>
    <h3 class="adm-h">Bugün</h3>
    <div class="adm-stats">${STAT_NAMES.map(([k,n])=>`<div><b>${today[k]||0}</b><small>${n}</small><i>toplam ${tot[k]||0}</i></div>`).join("")}</div>
    <h3 class="adm-h">Şikâyetler <span>${open.length} bekliyor</span></h3>
    ${open.length?open.map(repRow).join(""):`<p class="muted" style="font-size:14px">Bekleyen şikâyet yok.</p>`}
    ${done.length?`<details class="adm-done"><summary>Sonuçlananlar (${done.length})</summary>${done.map(repRow).join("")}</details>`:""}
    ${REMOTE?`<h3 class="adm-h">Hesap sil</h3><p class="hint" style="margin:-4px 0 10px">Mailden silme talebi gelince takma adı yaz. Profil ve itirafları kalıcı olarak silinir.</p>
    <div class="adm-add"><input class="city-search" id="admDel" placeholder="Takma ad" maxlength="20" autocomplete="off"><button class="btn" id="admDelGo" style="background:var(--nar);color:var(--on-nar)">Sil</button></div>`:""}
    <h3 class="adm-h">Yasaklı kelimeler</h3>
    <p class="hint" style="margin:-4px 0 10px">Bu kelimeler itiraf, yorum ve mesajlarda engellenir. Kelimenin başı eşleşir: “orospu” yazarsan “orospuluk” da engellenir.</p>
    <div class="adm-words">${banned.map((w,i)=>`<span>${esc(w)}<button data-adm="sil:${i}" aria-label="${esc(w)} kelimesini kaldır">${IC.close}</button></span>`).join("")}</div>
    <div class="adm-add"><input class="city-search" id="admW" placeholder="Kelime ekle" maxlength="40"><button class="btn" id="admWAdd">Ekle</button></div>
    <button class="dice" id="admReset" style="margin-top:8px">Varsayılan listeye dön</button>
    ${REMOTE?"":`<h3 class="adm-h">Demo modu</h3>
    <div class="adm-demo"><span><b>${DEMO?"Açık":"Kapalı"}</b><small>${DEMO?"Örnek kullanıcılar, otomatik cevaplar ve sahte beğeniler görünüyor. Gerçek kullanıcıya açmadan önce kapatılmalı.":"Sadece gerçek içerik görünüyor. Örnek kullanıcılar ve otomatik cevaplar kapalı."}</small></span><button class="btn line" id="admDemo">${DEMO?"Kapat":"Aç"}</button></div>`}
  </div>`;
  el.classList.add("open");document.body.style.overflow="hidden";
  $("#admX").onclick=closeAdmin;
  el.querySelectorAll("[data-adm]").forEach(b=>b.onclick=()=>{const [a,id]=b.dataset.adm.split(":");
    if(a==="sil"){const l=[...bannedList()];l.splice(+id,1);LSset("arcana_banned",l);openAdmin();return}
    if(REMOTE){const r=reps.find(x=>x.id===id);if(!r)return;const st=a==="kaldir"?"kaldirildi":"yoksayildi";const jobs=[KDB.setReport(id,st)];
      if(a==="kaldir"){const[t,pid,ci]=r.key.split(":");if(t==="p")jobs.push(KDB.deletePost(pid).catch(()=>{}));else if(t==="c"){const c=(R.cm[pid]||[])[+ci];if(c)jobs.push(KDB.deleteComment(pid,c.id))}}
      Promise.all(jobs).then(()=>{toast(a==="kaldir"?"İçerik kaldırıldı":"Şikâyet yoksayıldı");setTimeout(openAdmin,500)}).catch(e=>toast("Olmadı: "+(e.code||e.message)));return}
    const l=LS("arcana_reports",[]),r=l.find(x=>x.id===id);if(!r)return;
    r.status=a==="kaldir"?"kaldirildi":"yoksayildi";LSset("arcana_reports",l);
    if(a==="kaldir"){const rm=LS("arcana_removed",[]);if(!rm.includes(r.key))rm.push(r.key);LSset("arcana_removed",rm);state.hidden.add(r.key)}
    toast(a==="kaldir"?"İçerik kaldırıldı":"Şikâyet yoksayıldı");openAdmin()});
  const add=()=>{const v=$("#admW").value.trim();if(!v)return;const l=[...bannedList()];if(!l.map(lowTR).includes(lowTR(v)))l.push(v);LSset("arcana_banned",l);openAdmin()};
  $("#admWAdd").onclick=add;
  if($("#admDelGo"))$("#admDelGo").onclick=async()=>{const n=lowTR($("#admDel").value.trim());const uid=Object.keys(U).find(k=>lowTR(U[k].n||"")===n);
    if(!uid){toast("Bu takma adla kullanıcı bulunamadı");return}
    if(!confirm(`${U[uid].n} hesabı ve itirafları kalıcı olarak silinsin mi?`))return;
    try{await KDB.adminDeleteUser(uid);delete U[uid];toast("Hesap silindi");openAdmin()}catch(e){toast("Silinemedi: "+(e.code||e.message))}};$("#admW").onkeydown=e=>{if(e.key==="Enter")add()};
  $("#admReset").onclick=()=>{try{localStorage.removeItem("arcana_banned")}catch(e){}openAdmin()};
  if($("#admDemo"))$("#admDemo").onclick=()=>{try{localStorage.setItem("arcana_demo",DEMO?"0":"1")}catch(e){}location.reload()};
}
function closeAdmin(){const el=$("#adm");if(el)el.classList.remove("open");document.body.style.overflow="";if(/[?&]yonetim/.test(location.search))history.replaceState(null,"",location.pathname);render()}


function showInvite(){
  if(REMOTE&&window.KDB&&KDB.uid)return showInviteRemote();
  const url="https://kulistr.com/",text="Kulis'te takma adla itiraf ediliyor, burç uyumuna göre eşleşiliyor. Gel bak: "+url;
  track("davet");
  if(navigator.share){navigator.share({title:"Kulis",text,url}).catch(()=>{});return}
  try{navigator.clipboard.writeText(text);toast("Davet linki kopyalandı")}catch(e){toast(url)}
}
