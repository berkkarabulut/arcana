/* ============ PROFİLİM KISAYOLLARI ============
   Profilim'de istatistiklerin altında 4 kutucuk: günlük seri, anonim sorular, profiline bakanlar, seni beğenenler.
   Ayrıca yeni bildirim türlerinin simgeleri ve bildirim ayarları. */
NIC.soru="dm";NIC.super="spark";NIC.dogrula="spark";
NOTIF_KINDS.splice(NOTIF_KINDS.findIndex(k=>k[0]==="like")+1,0,["soru","Anonim sorular"]);
{const lk=NOTIF_KINDS.find(k=>k[0]==="like");if(lk)lk[1]="Beğeniler ve süper beğeniler"}
{const hz=NOTIF_KINDS.find(k=>k[0]==="hatirla");if(hz)hz[1]="Hatırlatmalar (birkaç gün girmeyince, serin bozulmak üzereyken)"}
{const reaZ=remoteEnterApp;remoteEnterApp=function(a,b){const r=reaZ(a,b);
  if(window.KDB&&KDB.listenZiyaret)KDB.listenZiyaret(l=>{ZIYARET=l;const t=$("#ziyTile");if(t)t.outerHTML=ziyTileHTML()});
  return r}}
function ziyTileHTML(){const n=ziyaretSon7().length;return `<button class="pk" id="ziyTile" data-pk="ziyaret"><b>${n}</b><span>profiline baktı</span></button>`}
function begTileHTML(){const n=begenenler().length;return `<button class="pk${n?" yeni":""}" id="begTile" data-pk="begenen"><b>${n}</b><span>seni beğendi</span></button>`}
function profilKisayol(){
  const st=$("#view .pro-wrap .stats");if(!st||$("#pkRow")||!state.me)return;
  const el=document.createElement("div");el.className="pk-row";el.id="pkRow";
  el.innerHTML=seriTileHTML()+(REMOTE?soruTileHTML()+ziyTileHTML():"")+begTileHTML();
  st.after(el);
}
{const vBenPk=vBen;vBen=function(){vBenPk();try{profilKisayol()}catch(e){}}}
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-pk]");if(!b)return;
  const k=b.dataset.pk;track("kisayol_"+k);
  if(k==="seri")showSeri();else if(k==="soru")showSorular();else if(k==="ziyaret")showZiyaretciler();else if(k==="begenen")showBegenenler()});
