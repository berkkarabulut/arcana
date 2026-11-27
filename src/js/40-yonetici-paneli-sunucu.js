/* ============ YÖNETİCİ PANELİ (sunucu) ============ */
const ADM={tab:"uye",q:"",f:"hepsi",open:null,priv:{},confirm:null,ban:null,conv:null};

const WEL=REMOTE?{U:Object.assign({},U),P:POSTS.slice()}:null;
if(REMOTE){
  // örnek kullanıcıları kaldır
  Object.keys(U).forEach(k=>delete U[k]);
  U.anon={n:"Anonim",s:"koc",c:"#8A93A6",g:null,age:"",bio:"",stat:[0,0,0],since:""};
  POSTS.length=0;
  allPosts=function(){if(R.admin&&LS("kulis_adm_hepsi",true))return (R.mapped||[]).slice();// yönetici: cinsiyet ayrımı olmadan hepsi
    return (R.mapped||[]).filter(p=>p.u==="me"||(p.anon?(()=>{const t=swTarget();return !t||p.ag===t})():genderOk(p.uid)))};
  seedDemo=function(){seeded=true};
  // yerel kayıt: sadece bu cihaza ait küçük tercihler (tepkilerim, kaydırdıklarım)
  const LKEY="kulis_beta_local";
  save=function(){remoteSyncMe()};
  saveData=function(){if(!state.me)return;LSset(LKEY,{day:dayKey(),react:state.react,replied:[...state.replied],sw:{done:[...sw.done],used:sw.used,hist:sw.hist}})};
  loadData=function(){const d=LS(LKEY,null);if(!d)return;const today=d.day===dayKey();state.react=d.react||{};state.replied=new Set(today?d.replied||[]:[]);if(d.sw){sw.done=new Set(d.sw.done||[]);sw.used=today?d.sw.used||0:0;sw.hist=d.sw.hist||[]}};
  loadData();
  // Eşleş havuzu: karşı cinsin gerçek itirafları
  swipePool=function(){const tg=swTarget();return (R.mapped||[]).filter(p=>p.u!=="me"&&U[p.uid]&&U[p.uid].g===tg&&!sw.done.has(p.id)&&!state.hidden.has("p:"+p.id)&&!state.hidden.has("u:"+p.uid)).map(p=>({id:p.id,u:p.uid,cat:p.cat,t:p.t}))};
  // yorumlar canlı
  const showPost0=showPost;
  showPost=function(id){
    if(R.cmPid!==id){R.cmPid=id;KDB.listenComments(id,list=>{R.cm[id]=list.map(c=>{if(c.uid!==R.uid&&c.a)putUser(c.uid,c.a);return {id:c.id,u:c.uid===R.uid?"me":c.uid,uid:c.uid,t:c.t,ts:c.ts,ago:agoOf(c.ts),re:c.re||null}});
      const p=(R.mapped||[]).find(x=>x.id===id);if(p)p.cm=R.cm[id];
      const t=$("#cmIn");if(R.cmPid===id&&$("#scrim").classList.contains("open")&&(!t||!t.value))showPost0(id)})}
    const p=(R.mapped||[]).find(x=>x.id===id);if(p)p.cm=R.cm[id]||[];
    showPost0(id);
  };
  const close0=closeSheet;closeSheet=function(){if(R.cmPid){KDB.stopComments();R.cmPid=null}close0()};
  // sohbet aç/kapa: mesajları canlı dinle
  const open0=openChat;
  openChat=function(i){const c=state.chats[i];if(!c)return;open0(i);
    const seen=LS("kulis_seen",{});seen[c.id]=Date.now();LSset("kulis_seen",seen);
    KDB.listenMsgs(c.id,list=>{c.msgs=list.map(m=>({id:m.id,me:m.uid===R.uid,t:m.t,ts:m.ts,mod:!!m.mod,tp:m.tp||null,re:m.re||null,kind:m.img?"img":m.aud?"voice":m.g?"gif":undefined,src:m.img||m.aud,g:m.g||null,dur:m.dur}));const s=LS("kulis_seen",{});s[c.id]=Date.now();LSset("kulis_seen",s);if(state.chats[openIdx]===c)drawChat()})};
  const closeC0=closeChat;closeChat=function(){KDB.stopMsgs();closeC0()};
  // bildirimleri okundu say
  const notifs0=showNotifs;showNotifs=function(){const ids=state.notifs.filter(n=>!n.read).map(n=>n.id);notifs0();if(ids.length)KDB.markNotifsRead(ids).catch(()=>{})};
  // yerel sahte bildirim üretme
  notify=function(){};
}

if(REMOTE)remoteInit();else
try{const s=JSON.parse(localStorage.getItem("itiraf_me")||"null");if(s&&s.n&&s.s){state.me=s;loadData();render();seedDemo()}else startOnb()}catch(e){startOnb()}
