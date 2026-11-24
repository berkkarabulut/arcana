/* ============ KALICI KAYIT (bu cihazda) ============ */
const dayKey=()=>{const d=new Date();return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()};
function agoOf(ts){if(!ts)return "Şimdi";const m=Math.floor((Date.now()-ts)/60000);if(m<1)return "Şimdi";if(m<60)return m+" dk";const h=Math.floor(m/60);if(h<24)return h+" sa";const d=Math.floor(h/24);return d===1?"Dün":d+" gün"}
function saveData(){
  if(!state.me)return;try{if(!localStorage.getItem("itiraf_me"))return}catch(e){return}
  try{localStorage.setItem("arcana_data",JSON.stringify({v:1,day:dayKey(),seeded,
    myPosts:state.myPosts,myComments:state.myComments,requests:state.requests,notifs:state.notifs.slice(0,60),premium:state.premium,react:state.react,
    replied:[...state.replied],hidden:[...state.hidden],
    chats:state.chats.map(c=>({...c,typing:false,msgs:c.msgs.map(m=>m.src&&String(m.src).startsWith("blob:")?{...m,src:null}:m)})),
    posts:Object.fromEntries(POSTS.map(p=>[p.id,{r:p.r,cm:p.cm}])),
    sw:{done:[...sw.done],hist:sw.hist,used:sw.used,matched:[...sw.matched]}}))}catch(e){}
}
function loadData(){
  try{const d=JSON.parse(localStorage.getItem("arcana_data")||"null");if(!d||d.v!==1)return;
    const today=d.day===dayKey();
    Object.assign(state,{notifs:d.notifs||[],myPosts:d.myPosts||[],myComments:d.myComments||[],requests:d.requests||[],premium:!!d.premium,react:d.react||{},chats:d.chats||[],
      replied:new Set(today?d.replied||[]:[]),hidden:new Set(d.hidden||[])});
    state.myPosts.forEach(p=>{p.today=p.day===dayKey();if(p.ts)p.ago=agoOf(p.ts)});
    POSTS.forEach(p=>{const o=d.posts&&d.posts[p.id];if(o){p.r=o.r;p.cm=o.cm}});
    [...POSTS,...state.myPosts].forEach(p=>p.cm.forEach(c=>{if(c.ts)c.ago=agoOf(c.ts)}));
    if(d.sw){sw.done=new Set(d.sw.done||[]);sw.hist=d.sw.hist||[];sw.used=today?d.sw.used||0:0;sw.matched=new Set(d.sw.matched||[])}
    seeded=!!d.seeded;
    state.chats.forEach(c=>{if(c.status==="wait")setTimeout(()=>{c.status="open";c.unread=true;c.msgs.push({me:false,t:replyFor(c)});toast(`${U[c.u].n} isteğini kabul etti`);render();if(openIdx===state.chats.indexOf(c))drawChat()},4000)});
  }catch(e){}
}
LS("arcana_removed",[]).forEach(k=>state.hidden.add(k));
{let taps=0,tt=0;document.querySelector(".logo").addEventListener("click",()=>{const n=Date.now();taps=n-tt<700?taps+1:1;tt=n;if(taps>=5){taps=0;if(state.me)openAdmin()}})}
{const r0=render,d0=drawChat,e0=vEsles;render=function(){r0();saveData()};drawChat=function(){d0();saveData()};vEsles=function(){e0();saveData()}}
addEventListener("pagehide",saveData);document.addEventListener("visibilitychange",()=>{if(document.hidden)saveData()});
