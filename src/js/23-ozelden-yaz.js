/* ============ ÖZELDEN YAZ ============ */
function startDM(k,fromId){
  const ex=state.chats.findIndex(c=>c.u===k); if(ex>=0){closeSheet();openChat(ex);return}
  if(!state.premium&&state.chats.length>=FREE_CHATS){showPremium("sohbet");return}
  const p=fromId?allPosts().find(x=>x.id===fromId):null;
  openSheet(`<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">${av(k,46)}<div><h2 style="font-size:24px">${esc(U[k].n)}'e yaz</h2><p class="muted" style="font-size:13px">İlk mesajın istek olarak gider. Kabul ederse sohbet açılır.</p></div></div>
   ${p?`<p class="muted" style="font-size:13px">Bu itiraf üzerinden yazıyorsun:</p><p style="font-family:var(--display);font-style:italic;font-size:17px;margin:4px 0 14px">“${esc(p.t)}”</p>`:""}
   <div class="box"><textarea id="dmIn" rows="2" maxlength="300" placeholder="Kendini kısaca anlat, neden yazdığını söyle"></textarea></div>
   <div id="dmWarn"></div>
   <button class="btn wide" id="dmGo" disabled style="margin-top:10px">İsteği gönder</button>
   <p class="hint" style="text-align:center">Numara, Instagram ve benzeri iletişim bilgileri otomatik engellenir.</p>`);
  const t=$("#dmIn"),g=$("#dmGo");
  t.oninput=()=>{grow(t);g.disabled=t.value.trim().length<3;$("#dmWarn").innerHTML=""};
  g.onclick=()=>{const v=t.value.trim(),bad=contactBlock(v),mc=modCheck(v,"mesaj");if(mc){$("#dmWarn").innerHTML=`<p class="warn">${mc}</p>`;return}if(bad){$("#dmWarn").innerHTML=`<p class="warn">Mesajında ${bad} var gibi görünüyor. Güvenliğin için iletişim bilgisi paylaşılamaz.</p>`;return}
    if(REMOTE){g.disabled=true;KDB.startChat(k,p?p.t:null,v).then(()=>{closeSheet();askPushOnce("mesaj");KDB.logAccess&&KDB.logAccess("mesaj");toast(`İstek gönderildi. ${U[k].n} kabul edince sohbet açılır.`);KDB.notify(k,"req","sana mesaj isteği gönderdi",{tab:"mesajlar"})}).catch(e=>{g.disabled=false;toast(writeErr(e,"istek"))});return}
    const c={u:k,from:p?p.t:null,msgs:[{me:true,t:v}],status:"wait",unread:false};state.chats.unshift(c);closeSheet();render();
    toast(`İstek gönderildi. ${U[k].n} kabul edince sohbet açılır.`);
    setTimeout(()=>{c.status="open";c.unread=true;c.msgs.push({me:false,t:replyFor(c)});notify("dm",k,"mesaj isteğini kabul etti",{chat:k});toast(`${U[k].n} isteğini kabul etti`);render();if(openIdx===state.chats.indexOf(c))drawChat()},4500);};
}
const SCRIPT=["Selam, mesajın beni şaşırttı açıkçası. İtirafımı okuyup yazan pek olmuyor.","Haha haklısın. Sen nerelisin bu arada, il söylemen yeter.","Ben de geceleri burada takılıyorum, gündüz yapamıyorum bunları.","Burcun ne? Profilde görmüştüm ama unuttum.","Bu arada senin itirafın var mı, okumak isterim.","Bazen yabancıya anlatmak daha kolay oluyor, değil mi?","Bugün işten çok yoruldum ama seninle konuşmak iyi geldi.","Ciddi soruyorum, sen olsan ne yapardın?","Tamam, buna gülmekten öldüm.","Yarın da burada mısın?"];
function replyFor(c){const n=c.msgs.filter(m=>!m.me).length;return SCRIPT[n%SCRIPT.length]}
