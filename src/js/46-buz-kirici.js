/* ============ BUZ KIRICI ============
   Yeni bir sohbette henüz hiç yazmadıysan, yazı kutusunun üstünde 3 hazır ilk cümle çıkar.
   Sohbet bir itiraf üzerinden açıldıysa öneriler o itirafa göre, değilse profile göre seçilir. Dokununca kutuya gelir, istersen değiştirip gönderirsin. */
function buzOneriler(c){
  const u=U[c.u]||{},z=Z[u.s]?Z[u.s].n:"";
  if(c.from){
    const ilk=c.from.split(/[.!?…]/)[0].trim(),kisa=ilk.length>42?ilk.slice(0,40).trim()+"…":ilk;
    return [`“${kisa}” kısmı bana çok tanıdık geldi. Sonra ne oldu?`,
      "Bunu yazmak cesaret ister. Şu an bu konuda nasılsın?",
      "Ben de benzer bir şey yaşadım, anlatayım mı?"];
  }
  return [z?`Bir ${z} ile ilk kez konuşuyorum, söylenenler doğru mu? 😄`:"Selam! Bugün nasıl geçiyor?",
    "Bugün Kulis'te okuduğun en ilginç itiraf neydi?",
    "Hiç itiraf etmediğin bir şey olsa, ilk ne aklına gelir?"];
}
function buzKirici(){
  const c=state.chats[openIdx];if(!c||c.status!=="open")return;
  const kutu=$("#chatIn .composer .box"),t=$("#mIn");if(!kutu||!t)return;
  if($("#buzK")){if(c.msgs.some(m=>m.me))$("#buzK").remove();return}
  if(c.msgs.some(m=>m.me)||t.value.trim()){const b=$("#buzK");if(b&&c.msgs.some(m=>m.me))b.remove();return}
  const el=document.createElement("div");el.className="buz";el.id="buzK";el.setAttribute("aria-label","İlk mesaj önerileri");
  el.innerHTML=buzOneriler(c).map(o=>`<button class="buz-c" type="button">${esc(o)}</button>`).join("");
  kutu.before(el);
  el.querySelectorAll(".buz-c").forEach(b=>b.onclick=()=>{t.value=b.textContent;t.dispatchEvent(new Event("input"));t.focus();track("buz_kirici");el.remove()});
}
{const dcBuz=drawChat;drawChat=function(){dcBuz();try{buzKirici()}catch(e){}}}
