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
// Bildirilen konuşmanın kaydı (bildirim anındaki son 30 mesaj): kim ne yazdı, fotoğraf ve sesler dahil
function convHTML(r,nameOf){const bn=nameOf(r.by),kn=nameOf(r.target);const del=new Set();
  return `<div class="adm-conv">${r.msgs.map(m=>{const me=m.w==="b";const who=me?bn+" (bildiren)":kn+" (bildirilen)";
    const body=m.mod?`<i>Moderatör tarafından silinmiş</i>`:m.img?`<a href="${esc(m.img)}" target="_blank" rel="noopener"><img src="${esc(m.img)}" alt="Gönderilen fotoğraf"></a>${m.t?`<div>${esc(m.t)}</div>`:""}`:m.aud?`<audio controls preload="none" src="${esc(m.aud)}"></audio>`:esc(m.t);
    return `<div class="ac-m ${me?"ac-sag":"ac-sol"}"><small>${esc(who)}${m.ts?" · "+new Date(m.ts).toLocaleString("tr-TR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):""}</small><div class="ac-b">${body}</div></div>`}).join("")}</div>`}
const ONLINE_MS=5*60e3;
const dayStart=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime()};
function relTime(ts){if(!ts)return "bilinmiyor";const m=Math.floor((Date.now()-ts)/60000);if(m<1)return "az önce";if(m<60)return m+" dk önce";const h=Math.floor(m/60);if(h<24)return h+" sa önce";const d=Math.floor(h/24);return d===1?"dün":d<30?d+" gün önce":new Date(ts).toLocaleDateString("tr-TR",{day:"numeric",month:"short",year:"numeric"})}
const fmtDate=ts=>ts?new Date(ts).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})+" "+new Date(ts).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"}):"—";
function admUsers(){
  const posts={};(R.posts||[]).forEach(p=>{posts[p.uid]=(posts[p.uid]||0)+1});
  return (R.usersRaw||[]).map(u=>({uid:u.id,n:u.n,c:u.c,s:u.s,g:u.g,age:u.age,av:u.av,prem:!!u.prem,dg:!!u.dg,created:u.createdAt||0,seen:Math.max(u.lastSeen||0,u.createdAt||0),posts:posts[u.id]||0,me:u.id===R.uid}));
}
function openAdminRemote(){
  if(!R.admin&&!R.isMod){toast("Bu panel sadece yöneticiler için");return}
  if(!R.admin&&!["sikayet","destek"].includes(ADM.tab))ADM.tab="sikayet";
  let el=$("#adm");if(!el){el=document.createElement("div");el.id="adm";el.setAttribute("role","dialog");el.setAttribute("aria-label","Yönetici paneli");document.body.appendChild(el)}
  const now=Date.now(),today=dayStart(),all=admUsers();
  const online=all.filter(u=>now-u.seen<ONLINE_MS),activeToday=all.filter(u=>u.seen>=today),newToday=all.filter(u=>u.created>=today),newWeek=all.filter(u=>now-u.created<7*864e5);
  const reps=(R.reports||[]).map(r=>Object.assign({},r,{status:r.status||"bekliyor"})),openReps=reps.filter(r=>r.status==="bekliyor");
  const errs=R.errors||[];
  const tabs=R.admin?[["uye","Kullanıcılar",all.length],["sikayet","Şikâyetler",openReps.length],["mod","Moderatörler",(R.mods||[]).length||null],["destek","Destek",(R.ekipList||[]).filter(x=>x.staffUnread).length||null],["dogru","Doğrulama",(R.dgBek||[]).length||null],["huni","Huni",null],["duyuru","Bildirim gönder",null],["kelime","Kelimeler",null],["hata","Hatalar",errs.length]]:[["sikayet","Şikâyetler",openReps.length],["destek","Destek",(R.ekipList||[]).filter(x=>x.staffUnread).length||null],["dogru","Doğrulama",(R.dgBek||[]).length||null]];
  let body="";
  if(ADM.tab==="uye"&&!R.bdDurum&&!R.bdYuk){R.bdYuk=true;KDB.adminBildirimDurum().then(d=>{R.bdDurum=d||{};R.bdYuk=false;if($("#adm.open")&&ADM.tab==="uye")openAdminRemote()}).catch(()=>{R.bdDurum={};R.bdYuk=false})}
  const bd=R.bdDurum||{},bdAcik=all.filter(u=>bd[u.uid]&&bd[u.uid].acik),bdKapali=all.filter(u=>R.bdDurum&&!(bd[u.uid]&&bd[u.uid].acik));
  if(ADM.tab==="uye"){
    const q=lowTR(ADM.q.trim());
    let list=ADM.f==="online"?online:ADM.f==="bugun"?activeToday:ADM.f==="yeni"?newWeek:ADM.f==="prem"?all.filter(u=>u.prem):ADM.f==="bdacik"?bdAcik:ADM.f==="bdkapali"?bdKapali:ADM.f==="dg"?all.filter(u=>u.dg):ADM.f==="dgist"?all.filter(u=>(R.ekipList||[]).some(x=>x.id===u.uid&&/rozet/i.test(x.last||""))):all;
    if(q)list=list.filter(u=>lowTR(u.n||"").includes(q));
    list=[...list].sort((a,b)=>b.seen-a.seen);
    const row=u=>{const on=now-u.seen<ONLINE_MS,z=Z[u.s]||{g:"",n:""},op=ADM.open===u.uid,pv=ADM.priv[u.uid];
      return `<div class="au ${op?"op":""}"><button class="au-row" data-au="${u.uid}" aria-expanded="${op}">
        <span class="au-av" style="background:${esc(u.c||"#7CC4FF")}">${esc((u.n||"?").charAt(0).toLocaleUpperCase("tr"))}<i class="${on?"on":""}"></i></span>
        <span class="au-main"><b>${esc(u.n||"?")}${u.me?" <em>sen</em>":""}${u.prem?` <em class="pr">Premium</em>`:""}${u.dg?` <span class="dg" title="Doğrulanmış">✓</span>`:""}${R.bans&&R.bans.has(u.uid)?`<span class="adm-ban">Banlı</span>`:""}${R.bdDurum?(bd[u.uid]&&bd[u.uid].acik?` <span class="au-bd on" title="Bildirim açık: ${esc(bd[u.uid].cihaz.join(", "))}">🔔</span>`:` <span class="au-bd" title="Bildirim kapalı">🔕</span>`):""}</b><small>${z.g} ${z.n} · ${esc(u.g||"—")} · ${esc(u.age||"—")}</small></span>
        <span class="au-side"><span class="${on?"au-on":""}">${on?"Şu an sitede":relTime(u.seen)}</span><small>${u.posts} itiraf</small></span></button>
        ${op?`<div class="au-det">
          <dl><div><dt>Kayıt</dt><dd>${fmtDate(u.created)}</dd></div><div><dt>Son görülme</dt><dd>${on?"Şu an sitede":fmtDate(u.seen)}</dd></div>
          ${pv===undefined?`<div><dt>Gizli bilgiler</dt><dd class="muted">Yükleniyor…</dd></div>`:pv===null?`<div><dt>Gizli bilgiler</dt><dd class="muted">Görülemedi</dd></div>`:
          `<div><dt>Ad soyad</dt><dd>${esc((pv.ad||"")+" "+(pv.soyad||""))||"—"}</dd></div><div><dt>E-posta</dt><dd>${esc(pv.email||"—")}</dd></div><div><dt>Doğum tarihi</dt><dd>${pv.b?`${pv.b.d} ${AYLAR[pv.b.m-1]} ${pv.b.y}`:"—"}</dd></div><div><dt>Giriş</dt><dd>${{google:"Google",email:"E-posta bağlantısı",apple:"Apple"}[pv.provider]||esc(pv.provider||"—")}</dd></div>`}
          <div><dt>Telefon bildirimi</dt><dd>${!R.bdDurum?"Yükleniyor…":bd[u.uid]&&bd[u.uid].acik?"Açık ("+esc(bd[u.uid].cihaz.join(", "))+")":"Kapalı"}</dd></div>
          <div><dt>Kullanıcı kimliği</dt><dd class="au-id">${u.uid}</dd></div></dl>
          ${u.me?"":`<button class="btn line sm" data-audu="${u.uid}" style="margin:8px 0">Bildirim gönder</button>`}
          ${u.me?"":ADM.confirm===u.uid?`<div class="au-del"><p>Silmek için takma adı yaz: <b>${esc(u.n)}</b></p><div class="adm-add"><input class="city-search" id="auDelIn" autocomplete="off" maxlength="20"><button class="btn au-danger-fill" id="auDelGo" disabled>Kalıcı sil</button></div><button class="dice" id="auDelX" style="margin-top:8px">Vazgeç</button></div>`
            :`<button class="btn line" data-admdm="${u.uid}" style="height:40px;margin-top:12px;margin-right:8px">Mesaj gönder</button><button class="btn line" data-audg="${u.uid}" style="height:40px;margin-top:12px;margin-right:8px">${((R.usersRaw||[]).find(x=>x.id===u.uid)||{}).dg?"Doğrulama rozetini kaldır":"✓ Doğrulanmış rozeti ver"}</button>${R.bans&&R.bans.has(u.uid)?`<button class="btn line" data-auunban="${u.uid}" style="height:40px;margin-top:12px;margin-right:8px">Banı kaldır</button>`:(R.mods||[]).includes(u.uid)?"":`<button class="btn line" data-auban="${u.uid}" style="height:40px;margin-top:12px;margin-right:8px;color:var(--nar)">Banla</button>`}<button class="btn line" data-aureal="${u.uid}" style="height:40px;margin-top:12px;margin-right:8px">Perde fotoğrafını sil</button><button class="btn line au-danger" data-audel="${u.uid}" style="height:40px;margin-top:12px">Hesabı sil</button>`}
        </div>`:""}</div>`};
    body=`<div class="adm-stats au-stats">
      <div><b>${all.length}</b><small>Toplam üye</small><i>son 200 kayıt</i></div>
      <div><b class="g">${online.length}</b><small>Şu an sitede</small><i>son 5 dakika</i></div>
      <div><b>${activeToday.length}</b><small>Bugün giren</small><i>gece yarısından beri</i></div>
      <div><b>${newToday.length}</b><small>Bugün kayıt</small><i>bu hafta ${newWeek.length}</i></div>
      <div><b class="g">${R.bdDurum?bdAcik.length:"…"}</b><small>Bildirimi açık</small><i>${R.bdDurum?`kapalı ${bdKapali.length}`:"yükleniyor"}</i></div></div>
      <input class="city-search" id="auQ" placeholder="Takma adla ara" value="${esc(ADM.q)}" autocomplete="off" style="margin:14px 0 8px">
      <div class="au-chips">${[["hepsi","Hepsi",all.length],["online","Şu an sitede",online.length],["bugun","Bugün giren",activeToday.length],["yeni","Son 7 gün kayıt",newWeek.length],["prem","Premium",all.filter(u=>u.prem).length],["bdacik","🔔 Bildirim açık",R.bdDurum?bdAcik.length:"…"],["bdkapali","🔕 Bildirim kapalı",R.bdDurum?bdKapali.length:"…"],["dg","✓ Doğrulanmış",all.filter(u=>u.dg).length],["dgist","Rozet isteyen",all.filter(u=>(R.ekipList||[]).some(x=>x.id===u.uid&&/rozet/i.test(x.last||""))).length]].map(([k,n,c])=>`<button class="c" data-auf="${k}" aria-pressed="${ADM.f===k}">${n} <span>${c}</span></button>`).join("")}</div>
      <div class="au-list">${list.length?list.map(row).join(""):`<p class="muted" style="font-size:14px;padding:18px 4px">Bu filtrede kullanıcı yok.</p>`}</div>`;
  } else if(ADM.tab==="sikayet"){
    const done=reps.filter(r=>r.status!=="bekliyor").slice(0,30);
    const nameOf=id=>{if(!id)return "?";if(id===R.uid)return state.me.n;const u=(R.usersRaw||[]).find(x=>x.id===id);return u?u.n:(U[id]&&U[id].n)||id.slice(0,8)+"…"};
    const repRow=r=>{
      // önce şikâyet anında kaydedilen önizleme: yöneticinin kendi sohbeti değil, bildirenin gördüğü içerik
      let pv;const m=r.preview&&String(r.preview).match(/^([^:]*): ([^|]*) \| ([\s\S]*)$/);
      if(m)pv={kind:m[1],who:m[2],text:m[3]};else{pv=reportPreview(r.key);if(r.key.startsWith("k:"))pv.text="(önizleme yok)"}
      const t=r.key.split(":")[0],tg=r.target||((t==="u"||t==="k")?r.key.split(":")[1]:null);
      const tgStaff=tg&&((R.mods||[]).includes(tg)||tg===R.uid),tgBanned=tg&&R.bans&&R.bans.has(tg);
      const canRemove=t==="p"||t==="c"||(t==="k"&&r.cid&&r.mids&&r.mids.length);
      const st={kaldirildi:"Kaldırıldı",yoksayildi:"Yoksayıldı",banlandi:"Banlandı"}[r.status]||r.status;
      return `<div class="adm-rep ${r.status!=="bekliyor"?"done":""}"><div class="adm-rh"><span class="adm-k">${esc(pv.kind)}</span><b>${esc(pv.who)}</b>${tgBanned?`<span class="adm-ban">Banlı</span>`:""}<span class="adm-reason">${esc(r.reason)}</span><small>${relTime(r.ts)}</small></div>
      <div class="adm-by">Bildiren: ${esc(nameOf(r.by))}${t==="k"&&r.mids?` · ${r.mids.length} mesaj`:""}</div>
      <p>${esc(pv.text).slice(0,400)}</p>
      ${t==="k"&&r.msgs&&r.msgs.length?`<button class="dice" data-adm="konus:${r.id}" style="margin:2px 0 10px">${ADM.conv===r.id?"Konuşmayı gizle":`Konuşmayı gör (${r.msgs.length} mesaj)`}</button>${ADM.conv===r.id?convHTML(r,nameOf):""}`:t==="k"?`<p class="adm-by">Bu şikâyet eski sürümden geldi, konuşma kaydı yok.</p>`:""}
      ${r.status==="bekliyor"?(ADM.ban===r.id?`<div class="adm-cf"><b>${esc(pv.who)}</b> banlansın mı? Hesabı kapanır, giriş yapamaz ve hiçbir şey yazamaz.<div class="adm-acts" style="margin-top:8px"><button class="btn" data-adm="banok:${r.id}" style="background:var(--nar);color:var(--on-nar)">Evet, banla</button><button class="btn line" data-adm="banno:${r.id}">Vazgeç</button></div></div>`
        :`<div class="adm-acts">${canRemove?`<button class="btn" data-adm="kaldir:${r.id}" style="background:var(--nar);color:var(--on-nar)">${t==="k"?"Mesajları kaldır":"İçeriği kaldır"}</button>`:""}${t==="u"&&R.admin&&/foto/i.test(r.reason)?`<button class="btn" data-adm="foto:${r.id}" style="background:var(--nar);color:var(--on-nar)">Perde fotoğrafını sil</button>`:""}${tg&&!tgStaff&&!tgBanned?`<button class="btn line" data-adm="ban:${r.id}" style="color:var(--nar);border-color:rgba(var(--nar-rgb),.45)">Kişiyi banla</button>`:""}<button class="btn line" data-adm="yoksay:${r.id}">Yoksay</button></div>`)
        :`<small class="adm-st">${st}</small>`}
        <div class="adm-acts" style="margin-top:6px">${tg&&!tgStaff?`<button class="dice" data-admdm="${tg}">Bildirilene yaz</button>`:""}${r.by&&r.by!==R.uid?`<button class="dice" data-admdm="${r.by}">Bildirene yaz</button>`:""}</div></div>`};
    body=`${openReps.length?openReps.map(repRow).join(""):`<p class="muted" style="font-size:14px;padding:18px 4px">Bekleyen şikâyet yok.</p>`}
      ${done.length?`<details class="adm-done"><summary>Sonuçlananlar (${done.length})</summary>${done.map(repRow).join("")}</details>`:""}`;
  } else if(ADM.tab==="destek"){
    const l=R.ekipList||[];
    body=`<p class="hint" style="margin:0 0 10px">Kulis Ekibi olarak kullanıcılarla yazışmaların. Kullanıcı seni "Kulis Ekibi · ${R.admin?"Yönetici":"Moderatör"}" olarak görür, takma adını görmez. Yeni yazışmayı ${R.admin?"Kullanıcılar sekmesinden ya da ":""}şikâyet kartlarından başlatabilirsin.</p>
      ${l.length?l.map(x=>`<button class="adm-rep ek-row" data-ekt="${x.id}"><div class="adm-rh"><b>${esc(admName(x.id))}</b>${x.staffUnread?`<span class="adm-ban" style="background:rgba(212,175,90,.2);color:#E9C77A">Yeni cevap</span>`:""}<small>${relTime(x.lastAt)}</small></div><p style="margin:4px 0 0">${x.lastStaff?"Ekip: ":""}${esc(x.last||"")}</p></button>`).join(""):`<p class="muted" style="font-size:14px;padding:18px 4px">Henüz yazışma yok.</p>`}`;
  } else if(ADM.tab==="mod"){
    const mods=R.mods||[];const nm=id=>{const u=(R.usersRaw||[]).find(x=>x.id===id);return u?u.n:id.slice(0,8)+"…"};
    body=`<p class="hint" style="margin:0 0 10px">Moderatörler itirafları 24 saat öne çıkarabilir, şikâyetleri görüp sonuçlandırabilir, itiraf ve yorum silebilir. Kullanıcıların gizli bilgilerini göremezler. Paneli açmak için onlar da logoya 5 kez dokunur.</p>
    ${mods.length?mods.map(id=>`<div class="adm-rep" style="display:flex;align-items:center;gap:10px"><b style="flex:1">${esc(nm(id))}</b><button class="btn line" data-modx="${id}" style="height:36px;font-size:13.5px">Çıkar</button></div>`).join(""):`<p class="muted" style="font-size:14px;padding:8px 4px">Henüz moderatör yok.</p>`}
    <div class="adm-add"><input class="city-search" id="modN" placeholder="Takma ad" maxlength="20" autocomplete="off"><button class="btn" id="modAdd">Moderatör yap</button></div>`;
  } else if(ADM.tab==="duyuru"){
    body=duyuruHTML(all);
  } else if(ADM.tab==="dogru"){
    body=dogrulamaHTML();
  } else if(ADM.tab==="huni"){
    body=huniHTML(all);
  } else if(ADM.tab==="hata"){
    body=errs.length?`<div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button class="dice" id="errClr">Hepsini temizle</button></div>${errs.map(e=>{const u=(R.usersRaw||[]).find(x=>x.id===e.uid);return `<div class="adm-rep"><div class="adm-rh"><span class="adm-k">${esc(e.where||"site")}</span><b>${esc(u?u.n:"?")}</b><small>${relTime(e.ts)}</small></div><p style="font-family:inherit;font-size:13.5px;overflow-wrap:anywhere">${esc(e.msg)}</p><small class="adm-st" style="overflow-wrap:anywhere">${esc(e.ua||"")}</small></div>`}).join("")}`
      :`<p class="muted" style="font-size:14px;padding:18px 4px">Hata kaydı yok. Kullanıcıların tarayıcısında bir şey bozulursa burada görünür.</p>`;
  } else {
    const banned=bannedList(),onServer=!!(R.mod&&Array.isArray(R.mod.words));
    body=`<p class="hint" style="margin:0 0 10px">Bu kelimeler itiraf, yorum, mesaj, takma ad ve profil yazısında engellenir. Kelimenin başı eşleşir. ${onServer?"Liste sunucuda: eklediğin kelime anında herkese uygulanır.":"Liste henüz sunucuda değil."}</p>
    ${onServer?"":`<button class="btn wide" id="modSeed" style="margin-bottom:12px">Listeyi sunucuya yükle ve herkese uygula</button>`}
    <div class="adm-words">${banned.map((w,i)=>`<span>${esc(w)}<button data-adm="sil:${i}" aria-label="${esc(w)} kelimesini kaldır">${IC.close}</button></span>`).join("")}</div>
    <div class="adm-add"><input class="city-search" id="admW" placeholder="Kelime ekle" maxlength="40"><button class="btn" id="admWAdd">Ekle</button></div>
    <button class="dice" id="admReset" style="margin-top:8px">Varsayılan listeye dön</button>`;
  }
  if(ADM.dm){const uid=ADM.dm;
    body=`<div class="adm-dm"><button class="dice" id="admDmBack" style="margin-bottom:10px">← Geri</button>
      <h3 style="margin:0 0 2px">${esc(admName(uid))}</h3><p class="hint" style="margin:0 0 10px">Kullanıcı seni "Kulis Ekibi · ${R.admin?"Yönetici":"Moderatör"}" olarak görür.</p>
      <div class="ek-box" id="admEkBox">${ekipMsgsHTML(ADM.dmMsgs||[],true,uid)}</div>
      <div class="box ek-in"><textarea id="admEkIn" rows="2" maxlength="1000" placeholder="Kulis Ekibi olarak yaz" aria-label="Mesaj">${esc(ADM.dmDraft||"")}</textarea><button class="go" id="admEkGo">Gönder</button></div></div>`}
  const admY=el._admSekme===ADM.tab&&el.classList.contains("open")?el.scrollTop:0;el._admSekme=ADM.tab;// data-tab DEĞİL: o ad alt menü sekmeleri için ayrılmış
  el.innerHTML=`<div class="adm-in"><div class="adm-top"><h2>Yönetici paneli</h2><button class="icon-btn" id="admX" aria-label="Kapat">${IC.close}</button></div>
    ${R.admin?`<div class="ac-adm"><span><b>Açılış dönemi: herkese ücretsiz Premium</b><small>${R.acilis?"Açık: herkes her şeyi ücretsiz kullanıyor":"Kapalı: ücretsiz sınırlar ve Premium satışı geçerli"}</small></span><button class="btn ${R.acilis?"line":""} sm" id="acAnahtar">${R.acilis?"Kapat":"Aç"}</button></div>`:""}
    <div class="adm-tabs" role="tablist">${tabs.map(([k,n,c])=>`<button role="tab" data-admt="${k}" aria-selected="${ADM.tab===k}">${n}${c?` <span>${c}</span>`:""}</button>`).join("")}</div>${body}</div>`;
  el.classList.add("open");document.body.style.overflow="hidden";if(admY)el.scrollTop=admY;
  $("#admX").onclick=closeAdmin;
  setTimeout(()=>{const a=$("#acAnahtar");if(a&&!a.dataset.b){a.dataset.b=1;a.onclick=async()=>{const yeni=!R.acilis;
    if(!confirm(yeni?"Açılış dönemi açılsın mı?\n\nHerkes Kulis Tam gibi kullanır: sınırsız mesaj, arama, Eşleş. Premium satış ekranları gizlenir.":"Açılış dönemi kapansın mı?\n\nÜcretsiz sınırlar geri gelir, Premium satışı yeniden görünür."))return;
    a.disabled=true;try{await KDB.setAcilis(yeni);toast(yeni?"Açılış dönemi açık":"Açılış dönemi kapandı")}catch(e){toast("Değiştirilemedi: "+(e.code||e.message))}finally{a.disabled=false}}}},0);
  const openDm=uid=>{ADM.dm=uid;ADM.dmMsgs=[];ADM.dmDraft="";ADM.dmFocus=true;el.scrollTop=0;KDB.listenEkipMsgs(uid,l=>{if(ADM.dm!==uid)return;ADM.dmMsgs=l;const box=$("#admEkBox");if(box){box.innerHTML=ekipMsgsHTML(l,true,uid);box.scrollTop=box.scrollHeight}
    const th=(R.ekipList||[]).find(x=>x.id===uid);if(th&&th.staffUnread)KDB.ekipRead(uid,true)});openAdminRemote()};
  el.querySelectorAll("[data-admdm]").forEach(b=>b.onclick=()=>openDm(b.dataset.admdm));
  el.querySelectorAll("[data-ekt]").forEach(b=>b.onclick=()=>openDm(b.dataset.ekt));
  const dmB=$("#admDmBack");if(dmB)dmB.onclick=()=>{ADM.dm=null;KDB.stopEkipMsgs();openAdminRemote()};
  const eb=$("#admEkBox");if(eb)eb.scrollTop=eb.scrollHeight;
  const ei=$("#admEkIn"),eg=$("#admEkGo");if(ei){ei.oninput=()=>{ADM.dmDraft=ei.value};
    ei.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();eg.click()}};
    if(ADM.dmFocus){ADM.dmFocus=false;ei.focus()}
    eg.onclick=()=>{const v=ei.value.trim();if(!v)return;eg.disabled=true;KDB.ekipSend(ADM.dm,v,R.admin?"Yönetici":"Moderatör").then(()=>{ADM.dmDraft="";const x=$("#admEkIn");if(x){x.value="";x.focus()}const y=$("#admEkGo");if(y)y.disabled=false}).catch(e=>{eg.disabled=false;toast("Gönderilemedi: "+(e.code||e.message))})}}
  el.querySelectorAll("[data-admt]").forEach(b=>b.onclick=()=>{if(ADM.dm){ADM.dm=null;KDB.stopEkipMsgs()}ADM.tab=b.dataset.admt;ADM.open=null;ADM.confirm=null;openAdminRemote();el.scrollTop=0});
  const q=$("#auQ");if(q)q.oninput=()=>{ADM.q=q.value;const p=q.selectionStart;openAdminRemote();const n=$("#auQ");n.focus();n.setSelectionRange(p,p)};
  el.querySelectorAll("[data-auf]").forEach(b=>b.onclick=()=>{ADM.f=b.dataset.auf;openAdminRemote()});
  el.querySelectorAll("[data-audu]").forEach(b=>b.onclick=()=>{ADM.tab="duyuru";ADM.kime="kisi";ADM.duyUid=b.dataset.audu;openAdminRemote();setTimeout(()=>{const t=$("#duyMetin");if(t)t.focus()},50)});
  el.querySelectorAll("[data-au]").forEach(b=>b.onclick=()=>{const id=b.dataset.au;ADM.confirm=null;ADM.open=ADM.open===id?null:id;
    if(ADM.open&&!(id in ADM.priv))KDB.adminPrivate(id).then(p=>{ADM.priv[id]=p;if(ADM.open===id)openAdminRemote()}).catch(()=>{ADM.priv[id]=null;if(ADM.open===id)openAdminRemote()});
    openAdminRemote()});
  el.querySelectorAll("[data-auban]").forEach(b=>b.onclick=()=>{const id=b.dataset.auban,u=(R.usersRaw||[]).find(x=>x.id===id);
    if(b.dataset.sure!=="1"){b.dataset.sure="1";b.textContent="Emin misin? Tekrar bas";return}
    b.disabled=true;b.textContent="Banlanıyor…";KDB.ban(id,"Yönetici kararı").then(()=>toast(`${u?u.n:"Kişi"} banlandı`)).catch(e=>{b.disabled=false;b.textContent="Banla";toast("Olmadı: "+(e.message||e.code))})});
  el.querySelectorAll("[data-audg]").forEach(b=>b.onclick=()=>{const id=b.dataset.audg,x=(R.usersRaw||[]).find(z=>z.id===id),on=!(x&&x.dg);b.disabled=true;
    KDB.setVerified(id,on).then(()=>{if(x)x.dg=on;if(U[id])U[id].dg=on;toast(on?"Doğrulanmış rozeti verildi":"Rozet kaldırıldı");openAdminRemote()}).catch(e=>{b.disabled=false;toast("Olmadı: "+(e.code||e.message))})});
  el.querySelectorAll("[data-auunban]").forEach(b=>b.onclick=()=>{b.disabled=true;KDB.unban(b.dataset.auunban).then(()=>toast("Ban kaldırıldı")).catch(e=>{b.disabled=false;toast("Olmadı: "+(e.message||e.code))})});
  el.querySelectorAll("[data-aureal]").forEach(b=>b.onclick=()=>{b.disabled=true;KDB.adminDelReal(b.dataset.aureal).then(()=>toast("Perde fotoğrafı silindi")).catch(e=>{b.disabled=false;toast("Silinemedi: "+(e.code||e.message))})});
  el.querySelectorAll("[data-audel]").forEach(b=>b.onclick=()=>{ADM.confirm=b.dataset.audel;openAdminRemote();setTimeout(()=>{const i=$("#auDelIn");i&&i.focus()},30)});
  const dx=$("#auDelX");if(dx)dx.onclick=()=>{ADM.confirm=null;openAdminRemote()};
  const di=$("#auDelIn"),dg=$("#auDelGo");
  if(di){const u=all.find(x=>x.uid===ADM.confirm);di.oninput=()=>{dg.disabled=lowTR(di.value.trim())!==lowTR(u.n||"")};
    dg.onclick=async()=>{dg.disabled=true;dg.textContent="Siliniyor…";try{await KDB.adminDeleteUser(u.uid,u.n);R.usersRaw=(R.usersRaw||[]).filter(x=>x.id!==u.uid);delete U[u.uid];ADM.open=null;ADM.confirm=null;toast(`${u.n} silindi`);openAdminRemote()}
      catch(e){dg.disabled=false;dg.textContent="Kalıcı sil";toast("Silinemedi: "+(e.code||e.message))}}}
  el.querySelectorAll("[data-adm]").forEach(b=>b.onclick=()=>{const[a,id]=b.dataset.adm.split(":");
    if(a==="sil"){const l=[...bannedList()];l.splice(+id,1);saveBanned(l).then(openAdminRemote);return}
    const r=reps.find(x=>x.id===id);if(!r)return;
    if(a==="ban"){ADM.ban=id;openAdminRemote();return}
    if(a==="konus"){ADM.conv=ADM.conv===id?null:id;openAdminRemote();return}
    if(a==="banno"){ADM.ban=null;openAdminRemote();return}
    const[t,pid,ci]=r.key.split(":"),tg=r.target||((t==="u"||t==="k")?pid:null);
    let job,st,msg;
    if(a==="kaldir"){st="kaldirildi";msg=t==="k"?"Mesajlar kaldırıldı":"İçerik kaldırıldı";
      if(t==="p")job=KDB.deletePost(pid);
      else if(t==="c"){const c=(R.cm[pid]||[])[+ci];job=c?KDB.deleteComment(pid,c.id):Promise.reject(new Error("yorum bulunamadı, itirafı açıp tekrar dene"))}
      else if(t==="k")job=KDB.modDeleteMsgs(r.cid,r.mids);
      else job=Promise.reject(new Error("bu şikâyette kaldırılacak içerik yok"))}
    else if(a==="foto"){st="kaldirildi";msg="Perde fotoğrafı silindi";job=KDB.adminDelReal(tg)}
    else if(a==="banok"){st="banlandi";msg="Kişi banlandı";ADM.ban=null;job=KDB.ban(tg,r.reason)}
    else{st="yoksayildi";msg="Şikâyet yoksayıldı";job=Promise.resolve()}
    b.disabled=true;
    job.then(()=>KDB.setReport(id,st)).then(()=>{toast(msg);setTimeout(openAdminRemote,300)}).catch(e=>{b.disabled=false;toast("Olmadı: "+(e.message||e.code))})});
  const w=$("#admW");if(w){const add=()=>{const v=w.value.trim();if(!v)return;const l=[...bannedList()];if(!l.map(lowTR).includes(lowTR(v)))l.push(v);saveBanned(l).then(openAdminRemote)};$("#admWAdd").onclick=add;w.onkeydown=e=>{if(e.key==="Enter")add()};$("#admReset").onclick=()=>saveBanned([...DEFAULT_BANNED]).then(openAdminRemote)}
  const ms=$("#modSeed");if(ms)ms.onclick=()=>saveBanned([...new Set([...DEFAULT_BANNED,...(()=>{try{return JSON.parse(localStorage.getItem("arcana_banned")||"[]")}catch(e){return []}})()])]);
  const ma=$("#modAdd");if(ma)ma.onclick=()=>{const n=lowTR($("#modN").value.trim());const u=(R.usersRaw||[]).find(x=>lowTR(x.n||"")===n);if(!u){toast("Bu takma adla kullanıcı yok");return}
    const l=[...new Set([...(R.mods||[]),u.id])];KDB.setMods(l).then(()=>toast(`${u.n} artık moderatör`)).catch(e=>toast("Olmadı: "+(e.code||e.message)))};
  el.querySelectorAll("[data-modx]").forEach(b=>b.onclick=()=>{const l=(R.mods||[]).filter(x=>x!==b.dataset.modx);KDB.setMods(l).then(()=>toast("Moderatörlükten çıkarıldı")).catch(e=>toast("Olmadı: "+(e.code||e.message)))});
  const ec=$("#errClr");if(ec)ec.onclick=async()=>{ec.disabled=true;for(const e of errs)await KDB.deleteError(e.id).catch(()=>{});toast("Hata kayıtları temizlendi")};
}
// ---- Kayıt hunisi: misafir → üyelik penceresi → kayıt ekranı → üye → itiraf → ertesi gün dönüş ----
function huniHTML(all){
  if(!R.ist&&!R.istYuk){R.istYuk=true;KDB.istatistik(90).then(l=>{R.ist=l;R.istYuk=false;if($("#adm.open")&&ADM.tab==="huni")openAdminRemote()}).catch(e=>{R.istYuk=false;R.ist=[];toast("İstatistik okunamadı: "+(e.code||e.message))})}
  const gun=ADM.hg||7,now=Date.now(),bas=new Date(now-(gun-1)*864e5);bas.setHours(0,0,0,0);
  const gunKey=t=>new Date(t+3*36e5).toISOString().slice(0,10),basKey=gunKey(bas.getTime());
  const ist=(R.ist||[]).filter(x=>x.gun>=basKey),top=k=>ist.reduce((a,x)=>a+(x[k]||0),0);
  const yeni=all.filter(u=>u.created>=bas.getTime());
  const itiraf=yeni.filter(u=>u.posts>0);
  const uygun=yeni.filter(u=>now-u.created>=24*36e5),dondu=uygun.filter(u=>u.seen-u.created>=20*36e5);
  const adim=[["Üye olmadan siteye girdi",top("misafir"),"Misafir vitrini açıldı"],["Üyelik penceresini gördü",top("duvar"),"Bir yere dokundu ya da sona kaydırdı"],["Kayıt ekranını açtı",top("kayitAc"),"Google / e-posta düğmesine bastı"],
    ["Üye oldu",yeni.length,"Bu dönemde açılan hesap"],["İtiraf yazdı",itiraf.length,"Yeni üyelerden (anonimler hariç)"]];
  const enCok=Math.max(1,...adim.map(a=>a[1]));
  const yuz=(a,b)=>b?Math.round(a*100/b)+"%":"—";
  const satir=adim.map((a,i)=>`<div class="hn-s"><div class="hn-t"><b>${a[0]}</b><small>${a[2]}</small></div><div class="hn-bar"><i style="width:${Math.max(2,a[1]*100/enCok)}%"></i></div><div class="hn-n"><b>${a[1]}</b>${i?`<small>${yuz(a[1],adim[i-1][1])} önceki adımdan</small>`:""}</div></div>`).join("");
  const gunler=[];for(let i=gun-1;i>=0;i--){const t=now-i*864e5,k=gunKey(t),x=(R.ist||[]).find(z=>z.gun===k)||{},d0=new Date(t);d0.setHours(0,0,0,0);
    gunler.push({k,m:x.misafir||0,d:x.duvar||0,ka:x.kayitAc||0,u:all.filter(u=>u.created>=d0.getTime()&&u.created<d0.getTime()+864e5).length})}
const ilkA=[["Üye oldu",yeni.length,"Bu dönemde açılan hesap"],["İlk tepkisini verdi",top("ilkTepki"),"Bir itirafa tepki bıraktı"],["İlk itirafını yazdı",top("ilkItiraf"),"İlk adımlar listesinden"],["Keşfet'te ilk beğeni",top("ilkBegeni"),"Birini sağa kaydırdı"],["Üç adımı bitirdi",top("ilkBitti"),"Listenin tamamı"]];
  const ilkEn=Math.max(1,...ilkA.map(a=>a[1]));
  const ilkSatir=ilkA.map((a,i)=>`<div class="hn-s"><div class="hn-t"><b>${a[0]}</b><small>${a[2]}</small></div><div class="hn-bar"><i style="width:${Math.max(2,a[1]*100/ilkEn)}%"></i></div><div class="hn-n"><b>${a[1]}</b>${i?`<small>${yuz(a[1],ilkA[0][1])} üyelerin</small>`:""}</div></div>`).join("");
    return `<div class="hn-ust"><div class="seg3" style="max-width:260px">${[[7,"7 gün"],[30,"30 gün"],[90,"90 gün"]].map(([g,l])=>`<button aria-checked="${gun===g}" onclick="ADM.hg=${g};R.ist=null;openAdminRemote()">${l}</button>`).join("")}</div>
    ${R.ist?"":`<small class="muted">Sayaçlar yükleniyor…</small>`}</div>
    <div class="hn">${satir}
      <div class="hn-s hn-don"><div class="hn-t"><b>Ertesi gün geri döndü</b><small>Üye olduktan 20+ saat sonra tekrar girdi (24 saati dolanlar arasından)</small></div><div class="hn-bar"><i style="width:${uygun.length?dondu.length*100/uygun.length:0}%"></i></div><div class="hn-n"><b>${dondu.length}/${uygun.length}</b><small>${yuz(dondu.length,uygun.length)}</small></div></div></div>
    <h3 class="hn-h" style="font-size:17px;margin:18px 2px 6px">Yeni üyenin ilk adımları</h3><div class="hn">${ilkSatir}</div><p class="hint" style="margin:6px 2px 10px">İlk adım sayaçları 25 Kasım 2026'dan sonra üye olanlar için tutuluyor.</p>
    <p class="hint" style="margin:10px 2px">Misafir sayaçları 24 Kasım 2026'dan itibaren tutuluyor. Son görülmesini gizleyenler "geri döndü" hesabında eksik kalabilir. Üye sayısı son 200 üyeden hesaplanır.</p>
    <table class="hn-tab"><thead><tr><th>Gün</th><th>Misafir</th><th>Pencere</th><th>Kayıt ekranı</th><th>Üye</th></tr></thead><tbody>${gunler.reverse().slice(0,30).map(g=>`<tr><td>${new Date(g.k+"T12:00:00").toLocaleDateString("tr-TR",{day:"numeric",month:"short"})}</td><td>${g.m}</td><td>${g.d}</td><td>${g.ka}</td><td>${g.u}</td></tr>`).join("")}</tbody></table>`;
}

// ---- Bildirim gönder: yönetici yazar, önce kendine dener, sonra herkese yollar ----
function duyuruHTML(all){
  if(!R.duyG&&!R.duyY){R.duyY=true;KDB.duyuruGecmis().then(l=>{R.duyG=l;R.duyY=false;if($("#adm.open")&&ADM.tab==="duyuru")duyuruGecmisCiz()}).catch(()=>{R.duyG=[];R.duyY=false})}
  setTimeout(duyuruBagla,0);
  return `<p class="hint" style="margin:0 0 10px">Yazdığın metin üyelerin bildirimlerine düşer ve bildirime izin verenlerin telefonuna gider. "Kulis duyurularını" kapatanlara ve sessiz saatindeki kişilere telefon bildirimi gitmez. Kısa ve net yaz.</p>
    <textarea id="duyMetin" class="city-search" rows="3" maxlength="180" placeholder="Örnek: Bu akşamın sorusu geldi: En son ne zaman ağladın? Gel cevapla 👀" style="width:100%;resize:vertical;padding:12px;font:inherit"></textarea>
    <div style="display:flex;justify-content:space-between;font-size:12px;opacity:.65;margin:4px 2px 12px"><span>Başlık: "Kulis"</span><span id="duySay">0/180</span></div>
    <div class="seg duy-kime" role="tablist" aria-label="Kime gidecek"><button role="tab" data-kime="herkes" class="${ADM.kime!=="kisi"?"on":""}">Herkese</button><button role="tab" data-kime="kisi" class="${ADM.kime==="kisi"?"on":""}">Bir kişiye</button></div>
    <div id="duyKisiAlan" ${ADM.kime==="kisi"?"":"hidden"}>
      <div id="duySecili"></div>
      <input id="duyAra" class="city-search" type="search" placeholder="Takma adla ara" autocomplete="off" style="width:100%;padding:11px 12px;margin-top:8px">
      <div id="duyListe" class="duy-liste"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"><button class="btn line" id="duyDene">Önce bana gönder</button><button class="btn" id="duyHerkes">${ADM.kime==="kisi"?"Ona gönder":"Herkese gönder"}</button></div>
    <h3 class="ayar-h" style="margin-top:18px">Son gönderilenler</h3><div id="duyGecmis"><p class="hint">Yükleniyor…</p></div>`;
}
function duyuruGecmisCiz(){const b=$("#duyGecmis");if(!b)return;const l=R.duyG||[];
  b.innerHTML=l.length?l.map(d=>`<div class="adm-rep"><div class="adm-rh"><b>${d.hedef?"Sadece "+esc(d.hedefN||"bir kişi"):d.kisi+" kişi"}</b><small>${relTime(d.ts)}</small></div><p style="margin:4px 0 0">${esc(d.metin)}</p></div>`).join(""):`<p class="hint">Henüz duyuru gönderilmedi.</p>`}
function duyuruBagla(){
  const t=$("#duyMetin");if(!t||t.dataset.bagli)return;t.dataset.bagli=1;duyuruGecmisCiz();
  t.oninput=()=>{$("#duySay").textContent=t.value.length+"/180"};
  const gonder=async(hedef,btn)=>{const m=t.value.trim();if(m.length<3){toast("Önce metni yaz");return}
    const kisi=hedef==="kisi"?admUsers().find(u=>u.uid===ADM.duyUid):null;
    if(hedef==="kisi"&&!kisi){toast("Önce kişiyi seç");return}
    if(hedef==="herkes"&&!confirm(`Bu bildirim bütün üyelere gidecek:\n\n"${m}"\n\nGönderilsin mi?`))return;
    if(hedef==="kisi"&&!confirm(`Bu bildirim sadece ${kisi.n} adlı üyeye gidecek:\n\n"${m}"\n\nGönderilsin mi?`))return;
    btn.disabled=true;try{const r=await KDB.duyuru(m,hedef,kisi&&kisi.uid);
      toast(hedef==="deneme"?"Sana gönderildi, telefonuna bak":hedef==="kisi"?(r.telefon?`${kisi.n} kişisine gönderildi, telefonuna da gitti`:`${kisi.n} kişisine gönderildi. Telefonu bildirime kayıtlı değil, uygulamayı açınca görecek`):`${r.gitti} kişiye gönderildi`);
      if(hedef!=="deneme"){t.value="";R.duyG=null;openAdminRemote()}}
    catch(e){toast("Gönderilemedi: "+(e.code||e.message))}finally{btn.disabled=false}};
  $("#duyDene").onclick=e=>gonder("deneme",e.currentTarget);$("#duyHerkes").onclick=e=>gonder(ADM.kime==="kisi"?"kisi":"herkes",e.currentTarget);
  document.querySelectorAll("[data-kime]").forEach(b=>b.onclick=()=>{ADM.kime=b.dataset.kime;const m=t.value;openAdminRemote();const t2=$("#duyMetin");if(t2){t2.value=m;t2.oninput&&t2.oninput()}});
  duyuruKisiCiz();
}
function duyuruKisiCiz(){
  const ara=$("#duyAra"),liste=$("#duyListe"),sec=$("#duySecili");if(!ara||!liste)return;
  const tum=admUsers().filter(u=>!u.me).sort((a,b)=>b.seen-a.seen);
  const s=tum.find(u=>u.uid===ADM.duyUid);
  sec.innerHTML=s?`<div class="duy-sec"><span class="au-av" style="background:${esc(s.c||"#7CC4FF")};width:34px;height:34px">${esc((s.n||"?").charAt(0).toLocaleUpperCase("tr"))}</span><span><b>${esc(s.n||"İsimsiz")}</b><small>${s.seen?"Son görülme "+relTime(s.seen):""}</small></span><button class="ib" id="duySecX" aria-label="Seçimi kaldır">${IC.close}</button></div>`:"";
  const sx=$("#duySecX");if(sx)sx.onclick=()=>{ADM.duyUid=null;duyuruKisiCiz()};
  ara.style.display=s?"none":"";
  const ciz=()=>{if(s){liste.innerHTML="";return}
    const q=ara.value.trim().toLocaleLowerCase("tr");
    const l=tum.filter(u=>!q||(u.n||"").toLocaleLowerCase("tr").includes(q)).slice(0,30);
    liste.innerHTML=l.length?l.map(u=>`<button class="duy-k" data-duyu="${u.uid}"><span class="au-av" style="background:${esc(u.c||"#7CC4FF")};width:30px;height:30px">${esc((u.n||"?").charAt(0).toLocaleUpperCase("tr"))}</span><span><b>${esc(u.n||"İsimsiz")}</b><small>${u.seen?relTime(u.seen):""}</small></span></button>`).join(""):`<p class="hint">Bu adla üye yok.</p>`;
    liste.querySelectorAll("[data-duyu]").forEach(b=>b.onclick=()=>{ADM.duyUid=b.dataset.duyu;duyuruKisiCiz()})};
  ara.oninput=ciz;ciz();
}

// ---- Selfie doğrulama: bekleyen başvurular, selfie ve perde arkasındaki profil fotoğrafı yan yana ----
function dogrulamaHTML(){
  if(!R.dgBek&&!R.dgYuk){R.dgYuk=true;KDB.dogrulamaBekleyen().then(l=>{R.dgBek=l;R.dgYuk=false;if($("#adm.open")&&ADM.tab==="dogru")openAdminRemote()}).catch(e=>{R.dgYuk=false;R.dgBek=[];toast("Başvurular okunamadı: "+(e.code||e.message))})}
  setTimeout(dogrulamaBagla,0);
  const l=R.dgBek||[];
  if(!R.dgBek)return `<p class="hint">Yükleniyor…</p>`;
  return `<p class="hint" style="margin:0 0 10px">Selfie'deki kişi profil fotoğrafıyla aynı mı ve istenen pozu veriyor mu? İkisi de uyuyorsa onayla; mavi rozet verilir, kişiye bildirim gider ve selfie silinir.</p>
    ${l.length?l.map(d=>`<div class="adm-rep dg-k" data-dgk="${d.uid}"><div class="dg-ust"><b>${esc((U[d.uid]||{}).n||d.uid.slice(0,8))}</b><small>İstenen poz: ${esc(d.poz||"")} · ${agoOf(d.ts)}</small></div>
      <div class="dg-fotolar"><figure><div class="dg-f" data-dgf="selfie">Yükle</div><figcaption>Selfie</figcaption></figure><figure><div class="dg-f" data-dgf="profil"></div><figcaption>Perde arkası profil fotoğrafı</figcaption></figure></div>
      <div class="dg-b"><button class="btn line" onclick="dogrulamaGoster('${d.uid}',this)">Fotoğrafları göster</button><button class="btn" onclick="dogrulamaKararVer('${d.uid}',true,this)">Onayla</button><button class="btn line" onclick="dogrulamaKararVer('${d.uid}',false,this)">Reddet</button></div></div>`).join("")
      :`<p class="empty">Bekleyen doğrulama başvurusu yok.</p>`}
    <button class="dice" onclick="R.dgBek=null;openAdminRemote()" style="margin:10px auto 0;display:flex">Yenile</button>`;
}
function dogrulamaBagla(){}
async function dogrulamaGoster(uid,b){
  b.disabled=true;b.textContent="Yükleniyor…";
  try{const r=await KDB.dogrulamaFoto(uid),k=document.querySelector(`[data-dgk="${uid}"]`);if(!k)return;
    ["selfie","profil"].forEach(t=>{const f=k.querySelector(`[data-dgf="${t}"]`);f.innerHTML=r[t]?`<img src="${r[t]}" alt="${t==="selfie"?"Doğrulama selfie'si":"Profil fotoğrafı"}">`:`<span>${t==="selfie"?"Selfie okunamadı":"Gerçek fotoğraf yüklememiş"}</span>`});
    b.remove()}
  catch(e){b.disabled=false;b.textContent="Fotoğrafları göster";toast("Açılamadı: "+(e.code||e.message))}
}
async function dogrulamaKararVer(uid,onay,b){
  b.disabled=true;
  try{await KDB.dogrulamaKarar(uid,onay);R.dgBek=(R.dgBek||[]).filter(x=>x.uid!==uid);toast(onay?"Onaylandı, rozet verildi":"Reddedildi, kişiye bildirim gitti");openAdminRemote()}
  catch(e){b.disabled=false;toast("Olmadı: "+(e.code||e.message))}
}
