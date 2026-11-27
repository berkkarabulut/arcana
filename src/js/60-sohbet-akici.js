/* ============ AKICI SOHBET ============
   Eskiden sohbet ekranı her değişiklikte (yeni mesaj, yazıyor…, çevrimiçi) baştan çiziliyordu:
   yazı kutusu yeniden oluştuğu için klavye kapanıyor, liste en alta zıplıyor, fotoğraflar yeniden yükleniyordu.
   Şimdi: başlık sadece değişince, mesajlar tek tek (aynı kalanlara dokunulmaz), yazı kutusu sadece türü değişince
   (istek kabul edildi, sınır doldu gibi) yenilenir. Klavye açık kalır, okuduğun yer korunur.
   Ayrıca iPhone/Android klavyesi açılınca sohbet, görünen alana tam oturur (ekran zıplamaz). */
let SOHBET_ZORLA_ALTA=false,SOHBET_SON_ALTA=false;
function sohbetEnAlta(){SOHBET_ZORLA_ALTA=true;const m=$("#msgs");if(m)m.scrollTop=m.scrollHeight}
function sohbetYerlestir(c,html){
  const kutu=$("#chatIn"),sablon=document.createElement("template");sablon.innerHTML=html;
  const yH=sablon.content.querySelector(".chat-h"),yM=sablon.content.querySelector(".msgs"),yC=sablon.content.querySelector(".composer");
  const eH=kutu.querySelector(":scope>.chat-h"),eM=kutu.querySelector(":scope>.msgs"),eC=kutu.querySelector(":scope>.composer");
  // farklı sohbete geçildiyse ya da yapı yoksa: baştan çiz, en alta in
  if(kutu.dataset.cid!==String(c.id||c.u)||!eH||!eM||!eC||!yH||!yM||!yC){
    [...yM.children].forEach(x=>x._sb=1);
    kutu.innerHTML="";kutu.append(sablon.content);kutu.dataset.cid=String(c.id||c.u);
    const k=$("#chatIn .composer");if(k&&yC)k.dataset.imza=imzaAl(k);
    SOHBET_SON_ALTA=true;return true;
  }
  // okuyucu en alttaysa yeni mesajda aşağı kayar; yukarıda eski mesaj okuyorsa yerinde bırakılır
  const altta=eM.scrollHeight-eM.scrollTop-eM.clientHeight<120,eskiSon=eM.lastElementChild;
  // başlık
  if(eH.outerHTML!==yH.outerHTML)eH.replaceWith(yH);
  // mesajlar: aynı sıradaki aynı mesaja dokunma, sadece farklı olanları değiştir/ekle/çıkar
  // başka özelliklerin sonradan eklediği kutuları (uyarı vb.) karşılaştırmaya katma: kaldır, onlar kendini yeniden ekler
  [...eM.children].forEach(x=>{if(!x._sb)x.remove()});
  const eski=[...eM.children],yeni=[...yM.children];yeni.forEach(x=>x._sb=1);
  for(let i=0;i<yeni.length;i++){
    const e=eski[i],y=yeni[i];
    if(!e){eM.appendChild(y);continue}
    if(e.outerHTML!==y.outerHTML)e.replaceWith(y);
  }
  for(let i=yeni.length;i<eski.length;i++)eski[i].remove();
  // yazı kutusu: türü aynıysa (aynı düğmeler, aynı durum) olduğu gibi kalsın → odak ve klavye korunur
  const imza=imzaAl(yC);
  if(eC.dataset.imza!==imza){yC.dataset.imza=imza;eC.replaceWith(yC)}
  const yeniSon=eM.lastElementChild,benimYeni=yeniSon&&yeniSon!==eskiSon&&yeniSon.classList&&yeniSon.classList.contains("me");
  const alta=SOHBET_ZORLA_ALTA||altta||benimYeni;SOHBET_ZORLA_ALTA=false;SOHBET_SON_ALTA=alta;
  return alta;
}
function imzaAl(el){const k=el.cloneNode(true);k.querySelectorAll("#gifB,#buzK,#cvBar").forEach(x=>x.remove());const t=k.querySelector("textarea");if(t)t.value="";return k.innerHTML.replace(/\s+/g," ")}
// Gönder düğmesine basınca liste en alta insin (gönderen hep kendi mesajını görür)
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("#mGo"))SOHBET_ZORLA_ALTA=true},true);
// Gönder düğmesine dokununca yazı kutusu odağı kaybetmesin (klavye kapanmasın)
document.addEventListener("mousedown",e=>{if(e.target.closest&&e.target.closest("#mGo"))e.preventDefault()},true);
document.addEventListener("pointerdown",e=>{if(e.target.closest&&e.target.closest("#mGo")&&document.activeElement&&document.activeElement.id==="mIn")e.preventDefault()},true);
// Klavye açılınca sohbet ekranı görünen alana otursun (iPhone'da sayfa yukarı kaymasın)
{const vv=window.visualViewport;
  if(vv){const ayarla=()=>{const ch=$("#chat");if(!ch)return;
      if(!ch.classList.contains("open")){ch.style.height="";ch.style.transform="";return}
      ch.style.height=vv.height+"px";if(vv.scale<=1.01&&vv.offsetLeft)scrollTo(0,scrollY);// yana kaymışsa geri al
      ch.style.transform=(vv.offsetTop||vv.offsetLeft)?`translate(${vv.offsetLeft}px,${vv.offsetTop}px)`:"";
      const m=$("#msgs");if(m&&document.activeElement&&document.activeElement.id==="mIn"&&m.scrollHeight-m.scrollTop-m.clientHeight<200)m.scrollTop=m.scrollHeight};
    vv.addEventListener("resize",ayarla);vv.addEventListener("scroll",ayarla);
    {const oc=openChat,cc=closeChat;openChat=function(){const k=$("#chatIn");if(k)k.dataset.cid="";const r=oc.apply(this,arguments);document.documentElement.classList.add("sohbet-acik");ayarla();return r};
      closeChat=function(){const r=cc.apply(this,arguments);document.documentElement.classList.remove("sohbet-acik");const ch=$("#chat");if(ch){ch.style.height="";ch.style.transform=""}return r}}
  }}
// Diğer özellikler (uyarı, yazıyor, cevap çubuğu) sohbete ekleme yaptıktan SONRA son kez en alta in
{const dcSon=drawChat;drawChat=function(){SOHBET_SON_ALTA=false;const r=dcSon.apply(this,arguments);if(SOHBET_SON_ALTA){const m=$("#msgs");if(m)m.scrollTop=m.scrollHeight}return r}}
