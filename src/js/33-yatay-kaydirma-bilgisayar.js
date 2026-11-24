/* ============ YATAY KAYDIRMA (bilgisayar) ============ */
const HS_SEL=".cats,.picker";
function enhanceScroller(el){
  if(el.dataset.hs)return;el.dataset.hs="1";
  const wrap=document.createElement("div");wrap.className="hs-wrap";el.parentNode.insertBefore(wrap,el);wrap.appendChild(el);
  const mk=(dir)=>{const b=document.createElement("button");b.type="button";b.className="hs-btn hs-"+dir;b.tabIndex=-1;b.setAttribute("aria-hidden","true");
    b.innerHTML=dir==="l"?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 18l-6-6 6-6"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg>';
    b.onclick=e=>{e.stopPropagation();el.scrollBy({left:(dir==="l"?-1:1)*Math.max(160,el.clientWidth*.7),behavior:"smooth"})};wrap.appendChild(b);return b};
  mk("l");mk("r");
  const upd=()=>{const max=el.scrollWidth-el.clientWidth-2;wrap.classList.toggle("can-l",el.scrollLeft>2);wrap.classList.toggle("can-r",el.scrollLeft<max)};
  el.addEventListener("scroll",upd,{passive:true});requestAnimationFrame(upd);
  if(window.ResizeObserver)new ResizeObserver(upd).observe(el);
  el.addEventListener("wheel",e=>{if(Math.abs(e.deltaY)<=Math.abs(e.deltaX))return;const max=el.scrollWidth-el.clientWidth;if(max<=0)return;
    if((e.deltaY>0&&el.scrollLeft<max-1)||(e.deltaY<0&&el.scrollLeft>1)){e.preventDefault();el.scrollLeft+=e.deltaY}},{passive:false});
  let moved=false;
  el.addEventListener("pointerdown",e=>{if(e.pointerType!=="mouse"||e.button!==0)return;const sx=e.clientX,sl=el.scrollLeft;moved=false;
    const mv=ev=>{const dx=ev.clientX-sx;if(!moved&&Math.abs(dx)>5){moved=true;el.classList.add("dragging")}if(moved)el.scrollLeft=sl-dx};
    const up=()=>{removeEventListener("pointermove",mv);removeEventListener("pointerup",up);setTimeout(()=>el.classList.remove("dragging"),0)};
    addEventListener("pointermove",mv);addEventListener("pointerup",up)});
  el.addEventListener("click",e=>{if(moved){e.preventDefault();e.stopPropagation();moved=false}},true);
  el.addEventListener("dragstart",e=>e.preventDefault());
}
function enhanceAll(){document.querySelectorAll(HS_SEL).forEach(enhanceScroller)}
new MutationObserver(()=>enhanceAll()).observe(document.body,{childList:true,subtree:true});
