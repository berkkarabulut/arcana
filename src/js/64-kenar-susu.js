/* ============ KENAR SÜSÜ ============
   Bilgisayarda sitenin iki yanındaki boşluğa süs. Ayarlar > Görünüm'den seçilir (localStorage kulis_kenar).
   Açık ve koyu temaya göre renkleri değişir. Telefonda (dar ekranda) hiç çizilmez. */
const KENAR_LISTE=[["yok","Yok"],["perde","Perde"],["fisilti","Fısıltı"],["sahne","Sahne ışığı"],["pencere","Gece pencereleri"],["yildiz","Takımyıldızlar"],["balon","Yazıyor…"],["mektup","Mektuplar"],["logo","Dev K?"],["aurora","Aurora"],["not","İtiraf notları"]];
const kenarPref=()=>{try{return localStorage.getItem("kulis_kenar")||"perde"}catch(e){return "perde"}};
const kenarAcikMi=()=>document.documentElement.getAttribute("data-theme")==="light";
function kenarSVG(k,acik,dikey){
  const W=1900,H=930,C="#FF8A65",P="#E25C8F",I="#6C7BFF";
  const Q=acik?{bg:"#F1F7F5",ink:"#1E2B3A",yuz:"#FFFFFF",koyu:"#D6E3DF",koyu2:"#E6EEEB",pen:"#EEF4F2"}:{bg:"#0B1220",ink:"#EEF3FF",yuz:"#151F38",koyu:"#141D33",koyu2:"#1A2440",pen:"#1D2846"};
  let tohum=42;const rnd=()=>(tohum=(tohum*16807)%2147483647)/2147483647;
  const X=(sol,x)=>sol?x:W-x,yan=f=>f(true)+f(false);
  let defs="",s="";
  if(k==="perde"){
    defs=acik?`<linearGradient id="ks0" x1="0" x2="1"><stop offset="0" stop-color="#EBC9CF"/><stop offset=".5" stop-color="#F6DFE2"/><stop offset="1" stop-color="#E2BCC3"/></linearGradient><linearGradient id="ks1" x1="0" x2="1"><stop offset="0" stop-color="#E2BCC3"/><stop offset=".55" stop-color="#F3D8DC"/><stop offset="1" stop-color="#E7C3C9"/></linearGradient>`
      :`<linearGradient id="ks0" x1="0" x2="1"><stop offset="0" stop-color="#2A1424"/><stop offset=".5" stop-color="#4A2236"/><stop offset="1" stop-color="#1A0F1E"/></linearGradient><linearGradient id="ks1" x1="0" x2="1"><stop offset="0" stop-color="#1A0F1E"/><stop offset=".55" stop-color="#3B1B2D"/><stop offset="1" stop-color="#22121F"/></linearGradient>`;
    s=yan(sol=>{let o="";for(let i=0;i<9;i++){const x=X(sol,i*62);o+=`<rect x="${sol?x:x-62}" y="-20" width="62" height="${H+40}" fill="url(#ks${i%2})" opacity="${.9-i*.08}"/>`}
      return o+`<path d="M${X(sol,0)} 0 Q ${X(sol,420)} 300 ${X(sol,520)} ${H}" stroke="${C}" stroke-opacity=".3" stroke-width="2" fill="none"/><path d="M${X(sol,20)} 520 C ${X(sol,140)} 580, ${X(sol,260)} 590, ${X(sol,340)} 560" stroke="${C}" stroke-opacity=".6" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${X(sol,340)} 560 l ${sol?6:-6} 70" stroke="${C}" stroke-opacity=".55" stroke-width="3"/><path d="M${X(sol,328)} 630 h ${sol?24:-24} l ${sol?-4:4} 34 h ${sol?-16:16} z" fill="${C}" opacity=".55"/>`});
  }else if(k==="fisilti"){
    s=yan(sol=>{let o="";for(let j=0;j<5;j++){const y0=80+j*180;for(let i=0;i<22;i++){const t=i/21,y=y0+Math.sin(t*Math.PI*1.6+j)*60;o+=`<circle cx="${X(sol,40+t*560)}" cy="${y.toFixed(0)}" r="${(1.5+t*5).toFixed(1)}" fill="${j%2?P:C}" opacity="${(.12+t*.55).toFixed(2)}"/>`}}return o});
  }else if(k==="sahne"){
    defs=`<linearGradient id="ksIsik" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${acik?"#FFB38A":"#FFD9C9"}" stop-opacity="${acik?.45:.35}"/><stop offset="1" stop-color="${C}" stop-opacity="0"/></linearGradient><filter id="ksBul" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="30"/></filter>`;
    s=yan(sol=>`<polygon points="${X(sol,60)},-10 ${X(sol,140)},-10 ${X(sol,640)},${H} ${X(sol,180)},${H}" fill="url(#ksIsik)"/><ellipse cx="${X(sol,410)}" cy="${H-20}" rx="260" ry="40" fill="${C}" opacity=".14" filter="url(#ksBul)"/><rect x="${sol?40:W-160}" y="-6" width="120" height="34" rx="8" fill="${acik?"#C9D8D3":"#1B2440"}"/><circle cx="${X(sol,100)}" cy="28" r="12" fill="${C}" opacity=".9"/>`)
      +Array.from({length:14},(_,i)=>`<line x1="0" x2="${W}" y1="${H-130+i*10}" y2="${H-130+i*10}" stroke="${acik?"#CFDDD8":"#1C2742"}" stroke-opacity="${(i/14*.8).toFixed(2)}"/>`).join("");
  }else if(k==="pencere"){
    s=acik?`<circle cx="1660" cy="140" r="52" fill="#FFC9A8" opacity=".7"/><circle cx="1660" cy="140" r="90" fill="#FFC9A8" opacity=".18"/>`:`<circle cx="1660" cy="140" r="46" fill="#F3E7D3" opacity=".85"/><circle cx="1680" cy="128" r="44" fill="${Q.bg}"/>`;
    if(!acik)for(let i=0;i<70;i++)s+=`<circle cx="${(rnd()*W).toFixed(0)}" cy="${(rnd()*420).toFixed(0)}" r="${(rnd()*1.4+.3).toFixed(1)}" fill="${Q.ink}" opacity="${(rnd()*.6+.2).toFixed(2)}"/>`;
    for(const [x,w,h] of [[0,150,380],[150,120,520],[270,170,300],[440,110,430],[1360,130,350],[1490,160,560],[1650,120,410],[1770,140,300]]){s+=`<rect x="${x}" y="${H-h}" width="${w}" height="${h}" fill="${Q.koyu}"/>`;for(let yy=H-h+20;yy<H-20;yy+=34)for(let xx=x+14;xx<x+w-20;xx+=30){const yanik=rnd()<.13;s+=`<rect x="${xx}" y="${yy}" width="14" height="18" rx="2" fill="${yanik?"#FFB38A":Q.pen}" opacity="${yanik?.85:1}"/>`}}
  }else if(k==="yildiz"){
    const yil=(pts,lab,lx,ly)=>{let o=`<polyline points="${pts.map(p=>p.join(",")).join(" ")}" fill="none" stroke="${Q.ink}" stroke-opacity=".22" stroke-width="1.2"/>`;pts.forEach((p,i)=>o+=`<circle cx="${p[0]}" cy="${p[1]}" r="${i%3?2.4:3.6}" fill="${Q.ink}" opacity="${acik?.55:.8}"/><circle cx="${p[0]}" cy="${p[1]}" r="10" fill="${C}" opacity=".1"/>`);return o+`<text x="${lx}" y="${ly}" fill="${Q.ink}" fill-opacity=".35" font-family="Newsreader,Georgia,serif" font-style="italic" font-size="22">${lab}</text>`};
    s=yil([[140,170],[260,120],[380,160],[450,250]],"Koç",150,290)+yil([[120,520],[230,470],[330,540],[230,620],[120,520]],"Terazi",120,680)+yil([[1480,180],[1560,260],[1660,230],[1760,320],[1700,400]],"Akrep",1520,450)+yil([[1500,640],[1610,580],[1720,640],[1820,600]],"Kova",1600,720);
    for(let i=0;i<120;i++){const x=rnd()<.5?rnd()*620:W-rnd()*620;s+=`<circle cx="${x.toFixed(0)}" cy="${(rnd()*H).toFixed(0)}" r="${(rnd()*1.1+.3).toFixed(1)}" fill="${Q.ink}" opacity="${(rnd()*(acik?.25:.45)+.08).toFixed(2)}"/>`}
  }else if(k==="balon"){
    const bal=(x,y,w,h,dolu,o)=>`<g opacity="${o}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h/2}" fill="${dolu?Q.koyu2:"none"}" stroke="${dolu?"none":C}" stroke-width="2"/><path d="M${dolu?x+w-30:x+24} ${y+h-4} l ${dolu?16:-12} 16 l ${dolu?-2:10} -18" fill="${dolu?Q.koyu2:"none"}" stroke="${dolu?"none":C}" stroke-width="2"/>${[0,1,2].map(i=>`<circle cx="${x+w/2-18+i*18}" cy="${y+h/2}" r="5" fill="${dolu?Q.ink:C}" opacity="${.4+i*.2}"/>`).join("")}</g>`;
    for(const a of [[90,110,170,64,0,.5],[300,260,130,52,1,.6],[120,430,210,74,1,.45],[380,600,140,54,0,.35],[60,760,160,60,0,.3],[1420,90,150,58,1,.55],[1640,250,190,70,0,.5],[1480,440,140,54,0,.4],[1680,610,170,64,1,.45],[1450,780,200,70,1,.3]])s+=bal(...a);
  }else if(k==="mektup"){
    const zarf=(x,y,r,k2,o)=>`<g transform="translate(${x} ${y}) rotate(${r}) scale(${k2})" opacity="${o}"><rect x="-70" y="-46" width="140" height="92" rx="8" fill="${Q.yuz}" stroke="${Q.ink}" stroke-opacity=".22" stroke-width="1.5"/><path d="M-70 -44 L0 8 L70 -44" fill="none" stroke="${Q.ink}" stroke-opacity=".28" stroke-width="1.5"/><path d="M0 12 s-14 -8 -14 -18 a8 8 0 0 1 14 -4 a8 8 0 0 1 14 4 c0 10 -14 18 -14 18z" fill="${P}"/></g>`;
    for(const a of [[200,160,-12,1.1,.8],[420,380,8,.8,.55],[150,560,-4,1.3,.7],[380,780,14,.9,.5],[1700,150,10,1,.75],[1480,360,-10,.85,.5],[1720,560,6,1.25,.7],[1500,770,-14,.9,.5]])s+=zarf(...a);
    s+=yan(sol=>`<path d="M${X(sol,40)} 900 C ${X(sol,200)} 700, ${X(sol,120)} 400, ${X(sol,380)} 60" fill="none" stroke="${C}" stroke-opacity=".25" stroke-width="1.5" stroke-dasharray="2 10" stroke-linecap="round"/>`);
  }else if(k==="logo"){
    s=`<g transform="translate(-140 60) scale(1.7)" fill="none" stroke="${Q.ink}" stroke-opacity="${acik?.06:.07}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"><path d="M140 112V396"/><path d="M152 292L272 132"/><path d="M200 244C232 300 262 350 300 380C332 404 372 400 392 372"/></g><g transform="translate(860 -140) scale(2.2)"><path d="M372 238C368 196 392 164 426 166C462 168 478 206 466 236C456 258 440 266 436 286" stroke="${C}" stroke-opacity=".2" stroke-width="14" fill="none" stroke-linecap="round"/><circle cx="404" cy="334" r="8" fill="${C}" opacity=".28"/><circle cx="410" cy="300" r="6" fill="${C}" opacity=".22"/><circle cx="412" cy="270" r="5" fill="${C}" opacity=".16"/><path transform="translate(430 214) scale(0.55)" d="M0 22s-22-13-22-29a12 12 0 0 1 22-6 12 12 0 0 1 22 6c0 16-22 29-22 29z" fill="${P}" opacity=".35"/></g>`;
  }else if(k==="aurora"){
    defs=`<filter id="ksBul2" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="80"/></filter>`;const o=acik?.75:1;
    s=`<circle cx="160" cy="220" r="260" fill="${C}" opacity="${.22*o}" filter="url(#ksBul2)"/><circle cx="420" cy="760" r="240" fill="${I}" opacity="${.18*o}" filter="url(#ksBul2)"/><circle cx="1760" cy="160" r="230" fill="${I}" opacity="${.2*o}" filter="url(#ksBul2)"/><circle cx="1560" cy="700" r="280" fill="${P}" opacity="${.2*o}" filter="url(#ksBul2)"/>`
      +[[90,560],[470,140],[1450,300],[1830,820],[300,880]].map(([x,y],i)=>`<g transform="translate(${x} ${y}) scale(${1+i%2*.6})" opacity="${acik?.4:.55}"><path d="M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5z" fill="${acik?C:Q.ink}"/></g>`).join("");
  }else if(k==="not"){
    defs=`<filter id="ksYum"><feGaussianBlur stdDeviation=".6"/></filter>`;const yazi=["Kimseye söylemedim ama…","Annem bilmiyor","Hâlâ onu düşünüyorum","İstifa etmek istiyorum","Keşke o gün…","Aslında çok yalnızım","Ben de seni…","Bir gün söyleyeceğim"],rk=["#FFD3C2","#F7C6D9","#DCE3FF","#FFE7B8"];
    [[110,120,-8],[330,330,6],[90,560,4],[340,700,-6],[1440,110,7],[1650,320,-5],[1470,560,-3],[1680,720,8]].forEach(([x,y,r],i)=>{s+=`<g transform="translate(${x} ${y}) rotate(${r})" opacity="${acik?.85:.55}"><rect width="200" height="150" rx="4" fill="${rk[i%4]}"${acik?` stroke="#1E2B3A" stroke-opacity=".06"`:""}/><circle cx="100" cy="10" r="6" fill="${C}"/><text x="16" y="64" font-family="'Comic Sans MS',cursive" font-size="17" fill="#3A2530" filter="url(#ksYum)">${yazi[i]}</text><line x1="18" x2="${140+i*5}" y1="100" y2="100" stroke="#3A2530" stroke-opacity=".25" stroke-width="3"/></g>`});
  }
  // dikey: sohbet arka planı için sol yarının dikey kesiti, mesajlar okunsun diye soluk
  if(dikey)return `<svg width="640" height="930" viewBox="0 0 640 930" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs><g opacity="${k==="perde"?.32:k==="aurora"?.8:.5}">${s}</g></svg>`;
  return `<svg width="100%" height="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>${s}</svg>`;
}
/* sohbet ekranının arka planı: aynı süs, dikey ve soluk (telefonda da görünür) */
function sohbetDuvarCiz(){const ch=document.getElementById("chat");if(!ch)return;const k=kenarPref(),imza=k+(kenarAcikMi()?"-a":"-k");if(ch._dz===imza)return;ch._dz=imza;
  if(k==="yok"){ch.style.removeProperty("--sohbet-dz");ch.classList.remove("dz-var");return}
  ch.style.setProperty("--sohbet-dz",`url("data:image/svg+xml,${encodeURIComponent(kenarSVG(k,kenarAcikMi(),true))}")`);ch.classList.add("dz-var")}
function kenarCiz(){
  sohbetDuvarCiz();
  let el=document.getElementById("kenarSus");const k=kenarPref();
  if(k==="yok"||innerWidth<900){if(el)el.remove();return}
  if(!el){el=document.createElement("div");el.id="kenarSus";el.setAttribute("aria-hidden","true");document.body.prepend(el)}
  const imza=k+(kenarAcikMi()?"-a":"-k");if(el._imza===imza)return;el._imza=imza;el.innerHTML=kenarSVG(k,kenarAcikMi());
}
function setKenar(k){try{localStorage.setItem("kulis_kenar",k)}catch(e){}kenarCiz();if(typeof track==="function")track("kenar_"+k);if(state.me&&state.tab==="ben")render()}
/* Görünüm penceresi: üst çubuktaki palet simgesinden ya da Profilim > Görünüm satırından açılır */
const PALET='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a5 5 0 0 0 5-5c0-3.9-4-7.2-9-7.2z"/><circle cx="7.5" cy="11.5" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="15" cy="7.8" r="1.2" fill="currentColor"/></svg>';
const tp0=themePicker;
function gorunumHTML(){const k=kenarPref(),ac=kenarAcikMi();
  return `<div class="sheet-head" id="gorSheet"><h2>Görünüm</h2></div>${tp0().replace('<div class="ayar-h">Görünüm</div>','')}
  <div class="kenar-pick"><div class="kp-b">Arka plan süsü <small>Sohbetlerin arka planında, bilgisayarda sitenin iki yanında da görünür</small></div><div class="kp-l" role="group" aria-label="Arka plan süsü">${KENAR_LISTE.map(([id,ad])=>`<button data-kenar="${id}" aria-pressed="${k===id}" title="${ad}"><span class="kp-o">${id==="yok"?"":kenarSVG(id,ac,true).replace(/width="640" height="930" /,'width="100%" height="100%" ').replace(/<g opacity="[.0-9]+">/,'<g>')}</span><span class="kp-a">${ad}</span></button>`).join("")}</div></div>`}
function openGorunum(){openSheet(gorunumHTML())}
const gorAcikMi=()=>!!document.getElementById("gorSheet")&&$("#scrim").classList.contains("open");
/* Profilim'de uzun bölüm yerine tek satır */
themePicker=function(){const t=temaPref(),k=kenarPref();const ta={sistem:"Sistem",acik:"Açık",koyu:"Koyu"}[t]||"Sistem",ka=(KENAR_LISTE.find(x=>x[0]===k)||["","Yok"])[1];
  return `<button class="gor-satir" id="gorAc">${PALET}<span><b>Görünüm</b><small>${ta} tema, ${ka}</small></span><i aria-hidden="true">›</i></button>`};
document.addEventListener("click",e=>{
  if(e.target.closest("#topGor,#gorAc")){openGorunum();return}
  const b=e.target.closest("[data-kenar]");if(b)setKenar(b.dataset.kenar);
  if((b||e.target.closest("[data-tema]"))&&gorAcikMi())setTimeout(()=>openSheet(gorunumHTML(),true),0);
});
{const at0=applyTheme;applyTheme=function(){const s=at0.apply(this,arguments);kenarCiz();return s}}
lightMQ.addEventListener?lightMQ.addEventListener("change",()=>setTimeout(kenarCiz,0)):0;
addEventListener("resize",()=>{clearTimeout(kenarCiz._t);kenarCiz._t=setTimeout(kenarCiz,200)});
kenarCiz();
