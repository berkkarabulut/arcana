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
  return (R.usersRaw||[]).map(u=>({uid:u.id,n:u.n,c:u.c,s:u.s,g:u.g,age:u.age,av:u.av,prem:!!u.prem,created:u.createdAt||0,seen:Math.max(u.lastSeen||0,u.createdAt||0),posts:posts[u.id]||0,me:u.id===R.uid}));
}
function openAdminRemote(){
  if(!R.admin&&!R.isMod){toast("Bu panel sadece yöneticiler için");return}
  if(!R.admin&&!["sikayet","destek"].includes(ADM.tab))ADM.tab="sikayet";
  let el=$("#adm");if(!el){el=document.createElement("div");el.id="adm";el.setAttribute("role","dialog");el.setAttribute("aria-label","Yönetici paneli");document.body.appendChild(el)}
  const now=Date.now(),today=dayStart(),all=admUsers();
  const online=all.filter(u=>now-u.seen<ONLINE_MS),activeToday=all.filter(u=>u.seen>=today),newToday=all.filter(u=>u.created>=today),newWeek=all.filter(u=>now-u.created<7*864e5);
  const reps=(R.reports||[]).map(r=>Object.assign({},r,{status:r.status||"bekliyor"})),openReps=reps.filter(r=>r.status==="bekliyor");
  const errs=R.errors||[];
  const tabs=R.admin?[["uye","Kullanıcılar",all.length],["sikayet","Şikâyetler",openReps.length],["mod","Moderatörler",(R.mods||[]).length||null],["destek","Destek",(R.ekipList||[]).filter(x=>x.staffUnread).length||null],["kelime","Kelimeler",null],["hata","Hatalar",errs.length]]:[["sikayet","Şikâyetler",openReps.length],["destek","Destek",(R.ekipList||[]).filter(x=>x.staffUnread).length||null]];
  let body="";
  if(ADM.tab==="uye"){
    const q=lowTR(ADM.q.trim());
    let list=ADM.f==="online"?online:ADM.f==="bugun"?activeToday:ADM.f==="yeni"?newWeek:ADM.f==="prem"?all.filter(u=>u.prem):all;
    if(q)list=list.filter(u=>lowTR(u.n||"").includes(q));
    list=[...list].sort((a,b)=>b.seen-a.seen);
    const row=u=>{const on=now-u.seen<ONLINE_MS,z=Z[u.s]||{g:"",n:""},op=ADM.open===u.uid,pv=ADM.priv[u.uid];
      return `<div class="au ${op?"op":""}"><button class="au-row" data-au="${u.uid}" aria-expanded="${op}">
        <span class="au-av" style="background:${esc(u.c||"#7CC4FF")}">${esc((u.n||"?").charAt(0).toLocaleUpperCase("tr"))}<i class="${on?"on":""}"></i></span>
        <span class="au-main"><b>${esc(u.n||"?")}${u.me?" <em>sen</em>":""}${u.prem?` <em class="pr">Premium</em>`:""}${R.bans&&R.bans.has(u.uid)?`<span class="adm-ban">Banlı</span>`:""}</b><small>${z.g} ${z.n} · ${esc(u.g||"—")} · ${esc(u.age||"—")}</small></span>
        <span class="au-side"><span class="${on?"au-on":""}">${on?"Şu an sitede":relTime(u.seen)}</span><small>${u.posts} itiraf</small></span></button>
        ${op?`<div class="au-det">
          <dl><div><dt>Kayıt</dt><dd>${fmtDate(u.created)}</dd></div><div><dt>Son görülme</dt><dd>${on?"Şu an sitede":fmtDate(u.seen)}</dd></div>
          ${pv===undefined?`<div><dt>Gizli bilgiler</dt><dd class="muted">Yükleniyor…</dd></div>`:pv===null?`<div><dt>Gizli bilgiler</dt><dd class="muted">Görülemedi</dd></div>`:
          `<div><dt>Ad soyad</dt><dd>${esc((pv.ad||"")+" "+(pv.soyad||""))||"—"}</dd></div><div><dt>E-posta</dt><dd>${esc(pv.email||"—")}</dd></div><div><dt>Doğum tarihi</dt><dd>${pv.b?`${pv.b.d} ${AYLAR[pv.b.m-1]} ${pv.b.y}`:"—"}</dd></div><div><dt>Giriş</dt><dd>${{google:"Google",email:"E-posta bağlantısı",apple:"Apple"}[pv.provider]||esc(pv.provider||"—")}</dd></div>`}
          <div><dt>Kullanıcı kimliği</dt><dd class="au-id">${u.uid}</dd></div></dl>
          ${u.me?"":ADM.confirm===u.uid?`<div class="au-del"><p>Silmek için takma adı yaz: <b>${esc(u.n)}</b></p><div class="adm-add"><input class="city-search" id="auDelIn" autocomplete="off" maxlength="20"><button class="btn au-danger-fill" id="auDelGo" disabled>Kalıcı sil</button></div><button class="dice" id="auDelX" style="margin-top:8px">Vazgeç</button></div>`
            :`<button class="btn line" data-admdm="${u.uid}" style="height:40px;margin-top:12px;margin-right:8px">Mesaj gönder</button><button class="btn line" data-audg="${u.uid}" style="height:40px;margin-top:12px;margin-right:8px">${((R.usersRaw||[]).find(x=>x.id===u.uid)||{}).dg?"Doğrulama rozetini kaldır":"✓ Doğrulanmış rozeti ver"}</button>${R.bans&&R.bans.has(u.uid)?`<button class="btn line" data-auunban="${u.uid}" style="height:40px;margin-top:12px;margin-right:8px">Banı kaldır</button>`:(R.mods||[]).includes(u.uid)?"":`<button class="btn line" data-auban="${u.uid}" style="height:40px;margin-top:12px;margin-right:8px;color:var(--nar)">Banla</button>`}<button class="btn line" data-aureal="${u.uid}" style="height:40px;margin-top:12px;margin-right:8px">Perde fotoğrafını sil</button><button class="btn line au-danger" data-audel="${u.uid}" style="height:40px;margin-top:12px">Hesabı sil</button>`}
        </div>`:""}</div>`};
    body=`<div class="adm-stats au-stats">
      <div><b>${all.length}</b><small>Toplam üye</small><i>son 200 kayıt</i></div>
      <div><b class="g">${online.length}</b><small>Şu an sitede</small><i>son 5 dakika</i></div>
      <div><b>${activeToday.length}</b><small>Bugün giren</small><i>gece yarısından beri</i></div>
      <div><b>${newToday.length}</b><small>Bugün kayıt</small><i>bu hafta ${newWeek.length}</i></div></div>
      <input class="city-search" id="auQ" placeholder="Takma adla ara" value="${esc(ADM.q)}" autocomplete="off" style="margin:14px 0 8px">
      <div class="au-chips">${[["hepsi","Hepsi",all.length],["online","Şu an sitede",online.length],["bugun","Bugün giren",activeToday.length],["yeni","Son 7 gün kayıt",newWeek.length],["prem","Premium",all.filter(u=>u.prem).length]].map(([k,n,c])=>`<button class="c" data-auf="${k}" aria-pressed="${ADM.f===k}">${n} <span>${c}</span></button>`).join("")}</div>
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
  el.innerHTML=`<div class="adm-in"><div class="adm-top"><h2>Yönetici paneli</h2><button class="icon-btn" id="admX" aria-label="Kapat">${IC.close}</button></div>
    <div class="adm-tabs" role="tablist">${tabs.map(([k,n,c])=>`<button role="tab" data-admt="${k}" aria-selected="${ADM.tab===k}">${n}${c?` <span>${c}</span>`:""}</button>`).join("")}</div>${body}</div>`;
  el.classList.add("open");document.body.style.overflow="hidden";
  $("#admX").onclick=closeAdmin;
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