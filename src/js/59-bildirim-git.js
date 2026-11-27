/* ============ BİLDİRİME DOKUNUNCA DOĞRU YERE GİT ============
   Hem uygulama içindeki bildirim listesinde hem telefona gelen bildirimde aynı yönlendirme çalışır:
   mesaj → o sohbet, yorum/tepki → o itiraf, istek → Mesajlar, soru → Sorularım, beğeni → Seni beğenenler, duyuru → Bildirimler.
   Telefon bildirimi siteyi ?nf=<bildirim kimliği> ile açar (ya da açık sayfaya mesaj yollar), site bildirimi bulup buraya verir. */
async function itirafiAc(id){
  if(allPosts().some(x=>x.id===id)){showPost(id);return}
  if(REMOTE&&window.KDB&&KDB.getPost){try{const x=await KDB.getPost(id);if(x){const p=mapPost(x);if(R.mapped&&!R.mapped.some(y=>y.id===id))R.mapped.push(p);showPost(id);return}}catch(e){}}
  toast("Bu itiraf artık yok");
}
function sohbeteGit(k,n){
  if(openIdx>=0)closeChat();
  let i=state.chats.findIndex(c=>c.u===k);
  if(i<0&&n&&n.u)i=state.chats.findIndex(c=>c.u===n.u);// eski bildirimlerde hedef yanlış kaydedilmişti: gönderen üzerinden bul
  state.tab="mesajlar";render();scrollTo(0,0);
  if(i>=0){openChat(i);return true}
  return false;
}
function bildirimeGit(n){
  if(!n)return;
  if(!n.read){n.read=true;if(REMOTE&&window.KDB&&KDB.markNotifsRead)KDB.markNotifsRead([n.id]).catch(()=>{})}
  closeSheet();const g=n.go||{};
  if(g.chat){if(sohbeteGit(g.chat,n))return;if(n.type==="req"||n.type==="dm")return;}
  if(g.post){render();itirafiAc(g.post);return}
  if(g.soru||n.type==="soru"){state.tab="ben";render();if(typeof showSorular==="function")showSorular();return}
  if(n.type==="like"&&typeof showBegenenler==="function"){state.tab="ben";render();showBegenenler();return}
  if(n.type==="req"){if(openIdx>=0)closeChat();state.tab="mesajlar";render();scrollTo(0,0);return}
  if(g.confess){render();showConfess();return}
  if(g.tab){if(openIdx>=0)closeChat();state.tab=g.tab;if(g.tab==="kesfet"||g.kesfet)sw.mode="eslesme";render();scrollTo(0,0);return}
  if(g.kesfet){sw.mode="eslesme";state.tab="kesfet";render();return}
  // gidecek yeri olmayan (duyuru gibi): bildirimler açılsın, metin orada okunur
  showNotifs();
}
// adres ya da açık sayfaya gelen mesajdaki yönlendirmeyi uygula
function bildirimLinki(link){
  let q;try{q=new URL(link,location.href).searchParams}catch(e){return}
  const nf=q.get("nf"),git=q.get("git");
  if(git){
    if(git==="itiraf"){state.tab="akis";render();showConfess();return}
    if(git==="gorev"&&typeof showGorevler==="function"){showGorevler();return}
    state.tab=["akis","kesfet","mesajlar","ben"].includes(git)?git:"akis";if(openIdx>=0)closeChat();render();scrollTo(0,0);return;
  }
  if(!nf)return;
  // bildirim listesi gelene kadar bekle (en fazla ~10 sn), bulamazsa bildirimleri aç
  let deneme=0;const t=setInterval(()=>{deneme++;
    const n=(state.notifs||[]).find(x=>x.id===nf);
    if(n){clearInterval(t);bildirimeGit(n);return}
    if(deneme>=20){clearInterval(t);if(state.me)showNotifs()}
  },500);
}
// soğuk açılış: kulistr.com/?nf=… ya da ?git=…
{const q=new URLSearchParams(location.search);
  if(q.get("nf")||q.get("git")){const link=location.href;try{history.replaceState(null,"",location.pathname)}catch(e){}
    const t=setInterval(()=>{if(!state.me||(REMOTE&&!R.uid))return;clearInterval(t);setTimeout(()=>bildirimLinki(link),600)},400);setTimeout(()=>clearInterval(t),20000)}}
// sayfa zaten açıkken bildirime dokunulursa
if("serviceWorker" in navigator)navigator.serviceWorker.addEventListener("message",e=>{const d=e.data||{};if(d.tip==="bildirim-git"&&d.link)bildirimLinki(d.link)});
