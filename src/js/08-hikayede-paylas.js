/* ============ HİKÂYEDE PAYLAŞ ============ */
const SITE_URL="kulistr.com";
function wrapLines(ctx,text,maxW){
  const words=text.split(/\s+/),lines=[];let line="";
  for(const w of words){const t=line?line+" "+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w}else line=t}
  if(line)lines.push(line);return lines;
}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}

/* Kulis logosu: K'nin bacağı fısıltı noktalarıyla kalpli kulağa uzanıyor (icons/logo.svg ile aynı) */
function drawLogo(x,px,py,size){
  x.save();x.translate(px,py);x.scale(size/512,size/512);
  rr(x,0,0,512,512,112);x.clip();x.fillStyle="#0B1220";x.fillRect(0,0,512,512);
  const g=x.createRadialGradient(400,92,0,400,92,435);g.addColorStop(0,"#3B2B3D");g.addColorStop(1,"rgba(11,18,32,0)");x.fillStyle=g;x.fillRect(0,0,512,512);
  x.lineCap="round";x.lineJoin="round";
  const line=(d,c,w)=>{x.strokeStyle=c;x.lineWidth=w;x.stroke(new Path2D(d))};
  line("M140 112V396","#EEF3FF",38);line("M152 292L272 132","#EEF3FF",38);line("M200 244C232 300 262 350 300 380C332 404 372 400 392 372","#EEF3FF",38);
  [[404,334,13,1],[410,300,10,.8],[412,270,8,.6]].forEach(([cx,cy,r,o])=>{x.globalAlpha=o;x.fillStyle="#FF8A65";x.beginPath();x.arc(cx,cy,r,0,7);x.fill()});x.globalAlpha=1;
  line("M372 238C368 196 392 164 426 166C462 168 478 206 466 236C456 258 440 266 436 286","#FF8A65",22);
  x.translate(430,214);x.scale(.55,.55);x.fillStyle="#E25C8F";x.fill(new Path2D("M0 22s-22-13-22-29a12 12 0 0 1 22-6 12 12 0 0 1 22 6c0 16-22 29-22 29z"));
  x.restore();
}
async function storyCanvas(p){
  try{await Promise.all(['italic 400 100px Newsreader','400 64px Newsreader','700 34px Figtree','800 30px Figtree'].map(f=>document.fonts.load(f)))}catch(e){}
  const W=1080,H=1920,cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");
  const u=p.anon?U.anon:userOf(p.u),mine=p.u==="me"&&!p.anon,acc=u.c||"#FF8A65",SERIF='Newsreader, "Crimson Text", Georgia, serif',SANS='Figtree, "DM Sans", system-ui, sans-serif';
  x.fillStyle="#0B1220";x.fillRect(0,0,W,H);
  const glow=(cx,cy,r,c)=>{const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,c);g.addColorStop(1,"rgba(11,18,32,0)");x.fillStyle=g;x.fillRect(0,0,W,H)};
  glow(930,260,760,"rgba(255,138,101,.30)");glow(120,1760,760,"rgba(124,196,255,.18)");glow(160,300,520,"rgba(70,100,190,.20)");
  let seed=p.id.split("").reduce((a,c)=>a+c.charCodeAt(0),7);const rnd=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
  for(let i=0;i<70;i++){x.globalAlpha=.15+rnd()*.45;x.fillStyle="#EEF3FF";x.beginPath();x.arc(rnd()*W,rnd()*H,1+rnd()*2.2,0,7);x.fill()}x.globalAlpha=1;
  // logo
  drawLogo(x,W/2-60,80,120);
  x.translate(0,110);
  x.textAlign="center";x.textBaseline="alphabetic";x.fillStyle="#EEF3FF";x.font=`italic 400 112px ${SERIF}`;
  const lw=x.measureText("Kulis").width;x.fillText("Kulis",W/2-12,250);
  x.fillStyle="#FF8A65";x.beginPath();x.arc(W/2+lw/2+4,236,13,0,7);x.fill();
  x.fillStyle="#7CC4FF";x.font=`700 34px ${SANS}`;x.fillText("İtiraf & Sohbet",W/2,315);x.translate(0,-110);
  // kart
  const cx=84,cw=W-168,pad=64;let fs=66,lines;
  x.font=`400 ${fs}px ${SERIF}`;
  for(;fs>=40;fs-=2){x.font=`400 ${fs}px ${SERIF}`;lines=wrapLines(x,"“"+p.t+"”",cw-pad*2);if(lines.length*fs*1.32<=760)break}
  const lh=fs*1.32,qh=lines.length*lh,ch=170+qh+150,cy=Math.max(490,(H-ch)/2+70);
  x.save();x.shadowColor="rgba(0,0,0,.5)";x.shadowBlur=60;x.shadowOffsetY=30;rr(x,cx,cy,cw,ch,56);x.fillStyle="#131D33";x.fill();x.restore();
  x.save();rr(x,cx,cy,cw,ch,56);x.clip();const g=x.createRadialGradient(cx+cw,cy,0,cx+cw,cy,cw*.9);g.addColorStop(0,acc+"55");g.addColorStop(1,"rgba(19,29,51,0)");x.fillStyle=g;x.fillRect(cx,cy,cw,ch);x.restore();
  rr(x,cx,cy,cw,ch,56);x.strokeStyle="rgba(238,243,255,.12)";x.lineWidth=2;x.stroke();
  // kart başı
  const hy=cy+pad+38;x.fillStyle=acc;x.beginPath();x.arc(cx+pad+38,hy,38,0,7);x.fill();
  x.fillStyle="#fff";x.font=`400 40px ${SANS}`;x.textAlign="center";x.textBaseline="middle";x.fillText(Z[u.s].g+"︎",cx+pad+38,hy+2);
  x.textAlign="left";x.textBaseline="alphabetic";x.fillStyle="#EEF3FF";x.font=`800 36px ${SANS}`;
  x.fillText(mine?u.n:`Bir ${Z[u.s].n} itiraf etti`,cx+pad+96,hy-4);
  x.fillStyle="rgba(238,243,255,.6)";x.font=`600 28px ${SANS}`;x.fillText(mine?`${Z[u.s].n}${u.age?", "+u.age:""}`:"Takma adı gizli",cx+pad+96,hy+36);
  const cat=CATN[p.cat]||"";x.font=`800 26px ${SANS}`;const tw=x.measureText(cat).width+40;rr(x,cx+cw-pad-tw,hy-26,tw,52,26);x.fillStyle="rgba(238,243,255,.08)";x.fill();
  x.fillStyle="rgba(238,243,255,.8)";x.textAlign="center";x.fillText(cat,cx+cw-pad-tw/2,hy+9);
  // itiraf
  x.textAlign="left";x.fillStyle="#EEF3FF";x.font=`400 ${fs}px ${SERIF}`;
  lines.forEach((l,i)=>x.fillText(l,cx+pad,cy+170+fs+i*lh));
  // alt satır
  const fy=cy+ch-pad-6;x.strokeStyle="rgba(238,243,255,.10)";x.beginPath();x.moveTo(cx+pad,fy-58);x.lineTo(cx+cw-pad,fy-58);x.stroke();
  x.fillStyle="#FFB199";x.font=`800 30px ${SANS}`;const tot=reactTotal(p)+(!REMOTE&&state.react[p.id]?1:0);
  x.fillText(`♥ ${tot} tepki`,cx+pad,fy);x.fillStyle="#7CC4FF";x.fillText(`${p.cm.length} yorum`,cx+pad+x.measureText(`♥ ${tot} tepki`).width+40,fy);
  // çağrı
  x.textAlign="center";x.fillStyle="#EEF3FF";x.font=`italic 400 60px ${SERIF}`;x.fillText("Senin itirafın ne?",W/2,H-318);x.font=`italic 400 44px ${SERIF}`;x.fillStyle="#7CC4FF";x.fillText("Aramızda.",W/2,H-254);x.fillStyle="#EEF3FF";
  x.font=`700 32px ${SANS}`;const uw=x.measureText(SITE_URL).width+80;rr(x,W/2-uw/2,H-200,uw,76,38);x.fillStyle="rgba(255,138,101,.18)";x.fill();x.strokeStyle="rgba(255,138,101,.5)";x.stroke();
  x.fillStyle="#EEF3FF";x.fillText(SITE_URL,W/2,H-150);
  return cv;
}
async function showShare(id){
  const p=allPosts().find(x=>x.id===id);if(!p)return;
  openSheet(`<div class="sheet-head"><h2>Hikâyede paylaş</h2></div><div class="sh-prev"><div class="sh-load">Görsel hazırlanıyor…</div></div>`);
  const cv=await storyCanvas(p);
  const blob=await new Promise(r=>cv.toBlob(r,"image/jpeg",.9));
  const file=new File([blob],"kulis-itiraf.jpg",{type:"image/jpeg"}),url=URL.createObjectURL(blob);
  const canShare=!!(navigator.canShare&&navigator.canShare({files:[file]}));
  const box=$("#sheet .sh-prev");if(!box)return;
  box.innerHTML=`<img src="${url}" alt="Paylaşılacak hikâye görseli">`;
  box.insertAdjacentHTML("afterend",`<p class="hint" style="margin:12px 0">${p.u==="me"?"Takma adın görselde görünür, gerçek adın asla görünmez.":"Başkasının itirafında takma ad görünmez, sadece burcu yazar."}</p>
    <div style="display:grid;gap:8px">${canShare?`<button class="btn wide" id="shGo">${IC.share}Paylaş</button>`:""}<a class="btn ${canShare?"line":""} wide" id="shDl" href="${url}" download="kulis-itiraf.jpg">Görseli indir</a></div>`);
  const go=$("#shGo");if(go)go.onclick=async()=>{track("paylas");try{await navigator.share({files:[file],text:"Kulis'te itiraf et: https://"+SITE_URL})}catch(e){}};
  $("#shDl").onclick=()=>{track("paylas");toast("Görsel indiriliyor")};
}

