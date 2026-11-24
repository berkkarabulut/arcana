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


function showInvite(){
  if(REMOTE&&window.KDB&&KDB.uid)return showInviteRemote();
  const url="https://kulistr.com/",text="Kulis'te takma adla itiraf ediliyor, burç uyumuna göre eşleşiliyor. Gel bak: "+url;
  track("davet");
  if(navigator.share){navigator.share({title:"Kulis",text,url}).catch(()=>{});return}
  try{navigator.clipboard.writeText(text);toast("Davet linki kopyalandı")}catch(e){toast(url)}
}
