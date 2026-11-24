/* ============ YARDIMCI ============ */
const $=s=>document.querySelector(s), view=$("#view");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("show"),2800)}
function openSheet(h,keepGuard){if(!keepGuard)sheetGuard=null;const sh=$("#sheet"),y=keepGuard&&$("#scrim").classList.contains("open")?sh.scrollTop:0;sh.innerHTML='<div class="grab"></div>'+h;$("#scrim").classList.add("open");sh.scrollTop=y}
let sheetGuard=null;
function closeSheet(){sheetGuard=null;$("#scrim").classList.remove("open")}
function tryCloseSheet(){if(sheetGuard&&sheetGuard())return;closeSheet()}
$("#scrim").addEventListener("click",e=>{if(e.target.id==="scrim")tryCloseSheet()});
document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(!$("#onb").hidden)return;if($("#chat").classList.contains("open"))closeChat();else tryCloseSheet()});
function grow(t){t.style.height="auto";t.style.height=Math.min(t.scrollHeight,150)+"px"}
function save(){try{localStorage.setItem("itiraf_me",JSON.stringify(state.me))}catch(e){}}
const userOf=k=>k==="me"?state.me:U[k];
function av(k,size=36,noZ){const u=userOf(k),ph=(k!=="me"&&u.realAv)||u.photo;return `<span class="av" style="width:${size}px;height:${size}px;background:${ph?"var(--yuzey2)":u.c};font-size:${size*.42}px">${ph?`<img src="${presetURI(ph)}" alt="">`:esc(u.n.charAt(0).toLocaleUpperCase("tr"))}${noZ?"":`<span class="z glyph">${Z[u.s].g}</span>`}</span>`}
const isPrem=k=>k==="me"?state.premium:!!(U[k]&&U[k].prem);
const PB='<svg class="pb" viewBox="0 0 24 24" aria-label="Premium üye" role="img"><title>Premium üye</title><path fill="#E9B96E" d="M4 8l4.5 4L12 5l3.5 7L20 8l-1.6 10H5.6z"/><rect x="5.5" y="19" width="13" height="2" rx="1" fill="#E9B96E"/></svg>';
const pb=k=>isPrem(k)?PB:"";
function who(k,sub){const u=userOf(k);return `<button class="who" data-prof="${k}">${av(k)}<span><b>${esc(u.n)}${pb(k)}</b><small>${Z[u.s].n}${sub?", "+sub:""}</small></span></button>`}
const IC={
 share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
 meToo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 11V6.5a1.5 1.5 0 0 1 3 0V11m0-1.5V5a1.5 1.5 0 0 1 3 0v4.5m0 0V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a6 6 0 0 1-5-2.7L3.8 14a1.5 1.5 0 0 1 2.4-1.8L8 14"/></svg>',
 hug:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
 wow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><circle cx="9" cy="10" r=".9" fill="currentColor"/><circle cx="15" cy="10" r=".9" fill="currentColor"/><ellipse cx="12" cy="15.5" rx="2" ry="2.4"/></svg>',
 more:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>',
 close:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 block:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/></svg>',
 link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
 camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
 edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
 chev:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
 spark:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/></svg>',

 flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 21V4h11l-1.5 4L16 12H5"/></svg>',
 cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8.5 6l1.5-2h4l1.5 2"/></svg>',
 mic:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
 phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
 video:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="13" height="12" rx="3"/><path d="M16 10.5l5-3v9l-5-3z"/></svg>',
 end:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 14.5c5-4.7 13-4.7 18 0l-2.3 2.6-3.4-1.4v-2.4a12 12 0 0 0-6.6 0v2.4l-3.4 1.4z"/></svg>',
 play:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z"/></svg>',

 dm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v11H9l-5 4z"/></svg>',
 cm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/></svg>',
 back:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>',
 chk:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
 lock:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
 dice:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/></svg>'};

// burç uyumu: element bazlı
// Burç uyumu: iki burç arasındaki açıya göre taban puan + her ikiliye özel sabit sapma (aynı ikili hep aynı puanı alır)
const SIGN_IDX=Object.fromEntries(SIGNS.map((x,i)=>[x.k,i]));
const ASPECT_BASE=[71,38,77,27,86,21,62];
function uyum(a,b){
  const ia=SIGN_IDX[a],ib=SIGN_IDX[b];if(ia==null||ib==null)return 50;
  let d=Math.abs(ia-ib);if(d>6)d=12-d;
  const key=ia<ib?a+b:b+a;let h=7;for(const ch of key)h=(h*31+ch.charCodeAt(0))%1009;
  return Math.max(11,Math.min(97,ASPECT_BASE[d]+(h%19)-9));
}
function uyumText(a,b,p){const ea=EL[Z[a].e],eb=EL[Z[b].e];
  if(a===b)return `İkiniz de ${Z[a].n}. Birbirinizi çok iyi anlarsınız ama aynı inatla da karşılaşırsınız.`;
  if(Z[a].e===Z[b].e)return `İkiniz de ${ea} grubundasınız. Aynı dili konuşursunuz, sohbet kendiliğinden akar.`;
  return p>=75?`${ea} ile ${eb} birbirini besler. Sohbetiniz hızlı ısınır.`:p>=50?`${ea} ile ${eb} farklı tempolarda gider. İlk mesajlar biraz yoklama olur, sonra açılır.`:`${ea} ile ${eb} pek aynı telden çalmaz. Zorlu ama sürprizli bir ikili, belki zıtlar birbirini çeker.`}
function ringSVG(p){const r=24,c=2*Math.PI*r;return `<svg class="ring" viewBox="0 0 58 58"><circle cx="29" cy="29" r="${r}" fill="none" stroke="var(--yuzey2)" stroke-width="5"/><circle cx="29" cy="29" r="${r}" fill="none" stroke="var(--acc,var(--nar))" stroke-width="5" stroke-linecap="round" stroke-dasharray="${c*p/100} ${c}" transform="rotate(-90 29 29)"/><text x="29" y="30" text-anchor="middle" dominant-baseline="middle" fill="var(--kagit)" font-size="14" font-weight="800" font-family="Figtree">%${p}</text></svg>`}

// iletişim bilgisi filtresi
function contactBlock(t){
  const low=t.toLocaleLowerCase("tr");
  const digits=low.replace(/[^0-9]/g,"");
  if(/(\+?90|0)?\s*5\d{2}/.test(low.replace(/[\s.\-()]/g,""))&&digits.length>=9)return "telefon numarası";
  if(digits.length>=10)return "telefon numarası";
  const yazili=["sıfır","beş","bes","dokuz","sifir"];if(yazili.filter(w=>low.includes(w)).length>=3)return "yazıyla telefon numarası";
  const flat=low.replace(/[^a-zçğıöşü0-9]/g,"");
  const kw=[["instagram","Instagram"],["insta","Instagram"],["ınsta","Instagram"],["snapchat","Snapchat"],["snap","Snapchat"],["telegram","Telegram"],["whatsapp","WhatsApp"],["watsap","WhatsApp"],["vatsap","WhatsApp"],["wpden","WhatsApp"],["discord","Discord"],["tiktok","TikTok"],["twitter","X"],["gmail","e-posta"],["hotmail","e-posta"]];
  for(const[w,n]of kw)if(flat.includes(w))return n+" adresi";
  if(/@[a-z0-9_.]{3,}/i.test(t))return "kullanıcı adı";
  if(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(t))return "e-posta";
  return null;
}
