/* ============ KULİS EKİBİ YAZIŞMASI ============ */
function admName(id){if(!id)return "?";if(id===R.uid)return state.me.n;const u=(R.usersRaw||[]).find(x=>x.id===id);return u?u.n:(U[id]&&U[id].n)||id.slice(0,8)+"…"}
function ekipMsgsHTML(msgs,staffView,uid){
  if(!msgs.length)return `<p class="muted" style="font-size:13.5px;text-align:center;padding:16px 4px">${staffView?"Henüz yazışma yok. İlk mesajı sen yaz.":"Henüz mesaj yok."}</p>`;
  return msgs.map(m=>{const mine=staffView?m.staff:!m.staff;
    const who=m.staff?(staffView&&m.from===R.uid?`Kulis Ekibi · ${m.role||"Ekip"} (sen)`:`Kulis Ekibi · ${m.role||"Ekip"}`):(staffView?admName(uid):"Sen");
    return `<div class="ek-m ${mine?"ek-sag":"ek-sol"} ${m.staff?"ek-ekip":""}"><small>${esc(who)} · ${new Date(m.ts).toLocaleString("tr-TR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</small><div class="ek-b">${esc(m.t).replace(/\n/g,"<br>")}</div></div>`}).join("")}
// kullanıcı tarafı: Mesajlar'daki sabit "Kulis Ekibi" sohbeti
function openEkip(){
  let msgs=[];const draw=()=>{const box=$("#ekBox");if(!box)return;box.innerHTML=ekipMsgsHTML(msgs,false);box.scrollTop=box.scrollHeight};
  openSheet(`<div class="sheet-head"><h2>🛡️ Kulis Ekibi</h2><button class="x" id="ekX" aria-label="Kapat">${IC.close}</button></div>
    <p class="hint" style="margin:0 0 10px">Kulis yöneticileri ve moderatörleriyle yazışman. Bunu sadece sen ve Kulis ekibi görür.</p>
    <div class="ek-box" id="ekBox"><p class="muted" style="text-align:center">Yükleniyor…</p></div>
    <div class="box ek-in"><textarea id="ekIn" rows="1" maxlength="1000" placeholder="Cevap yaz" aria-label="Cevap yaz"></textarea><button class="go" id="ekGo" disabled>Gönder</button></div>`,true);
  const stopL=()=>{KDB.stopEkipMsgs();return false};sheetGuard=stopL;
  $("#ekX").onclick=()=>{stopL();closeSheet()};
  KDB.listenEkipMsgs(R.uid,l=>{msgs=l;draw();if(R.ekip&&R.ekip.userUnread)KDB.ekipRead(R.uid,false)});
  const t=$("#ekIn"),g=$("#ekGo");t.oninput=()=>{grow(t);g.disabled=!t.value.trim()};
  t.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();g.click()}};
  g.onclick=()=>{const v=t.value.trim();if(!v)return;const mc=modCheck(v,"mesaj");if(mc){toast(mc);return}g.disabled=true;
    KDB.ekipSend(R.uid,v).then(()=>{t.value="";grow(t)}).catch(e=>{g.disabled=false;toast(writeErr(e,"mesaj"))})};
}
function onEkipThread(th){const prev=R.ekip;R.ekip=th;
  if(th&&th.lastStaff&&th.userUnread&&prev!==undefined&&(!prev||prev.lastAt!==th.lastAt))toast("🛡️ Kulis Ekibi'nden yeni mesajın var");
  if(state.tab==="mesajlar")render();else{const pip=$("#pip");if(pip&&th&&th.userUnread)pip.hidden=false}}
