/* ============ KAYIT ============ */
const ADJ=["gece","sessiz","mavi","yorgun","kırmızı","eski","yarım","uykusuz","gizli","son"],NOUN=["kuşu","limon","plak","kaptan","mektup","vapur","fener","defter","sokak","bilet"];
const rndNick=()=>ADJ[Math.floor(Math.random()*ADJ.length)]+NOUN[Math.floor(Math.random()*NOUN.length)];
const ob={step:0,provider:null,email:"",ad:"",soyad:"",tel:"",kod:"",codeSent:false,n:"",c:COLORS[0],d:12,m:3,y:1997,g:null,ok:false,inst:true};
const STEPS=5;
const range=(a,b,f=x=>x)=>Array.from({length:b-a+1},(_,i)=>[a+i,f(a+i)]);
function wheel(id,items,sel){return `<div class="wheel" id="${id}" tabindex="0" aria-label="${id}"><div class="pad"></div>${items.map(([v,l])=>`<button data-v="${v}" class="${v==sel?"sel":""}" tabindex="-1">${l}</button>`).join("")}<div class="pad"></div></div>`}
function bindWheel(id,cb){const w=document.getElementById(id);if(!w)return;const bs=[...w.querySelectorAll("button")];w.scrollTop=Math.max(0,bs.findIndex(b=>b.classList.contains("sel")))*40;let tm;
  w.addEventListener("scroll",()=>{const i=Math.min(bs.length-1,Math.max(0,Math.round(w.scrollTop/40)));bs.forEach((b,j)=>b.classList.toggle("sel",j===i));clearTimeout(tm);tm=setTimeout(()=>cb(+bs[i].dataset.v),90)},{passive:true});
  bs.forEach((b,j)=>b.onclick=()=>w.scrollTo({top:j*40,behavior:"smooth"}));
  w.addEventListener("keydown",e=>{const i=Math.round(w.scrollTop/40);if(e.key==="ArrowDown"){e.preventDefault();w.scrollTo({top:(i+1)*40,behavior:"smooth"})}if(e.key==="ArrowUp"){e.preventDefault();w.scrollTo({top:(i-1)*40,behavior:"smooth"})}})}
function ageOf(y,m,d){const n=new Date();let a=n.getFullYear()-y;if(n.getMonth()+1<m||(n.getMonth()+1===m&&n.getDate()<d))a--;return a}
const ageBand=a=>a<20?"18-19":a<25?"20-24":a<30?"25-29":a<35?"30-34":a<40?"35-39":"40+";
function startOnb(edit){ob.editing=!!(edit&&state.me);if(edit&&state.me)Object.assign(ob,{step:1,n:state.me.n,c:state.me.c,g:state.me.g,ok:true,ad:state.me.ad||"",soyad:state.me.soyad||"",email:state.me.email||"",provider:state.me.provider||"email",codeSent:true,kod:"000000",photo:state.me.photo},state.me.b);$("#onb").hidden=false;drawOnb()}
function drawOnb(){
  if(ob.g&&ob.g!=="Kadın"&&ob.g!=="Erkek")ob.g=null;
  const s=ob.step;let body="",cta="Devam",ok=true;
  if(s===0){const emOk=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ob.email.trim()),nameOk=ob.ad.trim().length>=2&&ob.soyad.trim().length>=2;
    if(!ob.provider){
      body=`${welcomeHero()}
      <p class="lead wel-lead">Adın ve e-postan gizli kalır, herkes seni takma adınla görür.</p>
      <div style="display:grid;gap:10px;margin-top:12px">
       <button class="btn line wide" data-prov="google" style="height:54px;gap:12px"><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Google ile devam et</button>
       <button class="btn line wide" data-prov="apple" style="height:54px;gap:12px"><svg width="18" height="20" viewBox="0 0 17 20" fill="currentColor"><path d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2.1-.9-3.4-.9C3.6 4.8 2 5.8 1.1 7.3c-1.9 3.2-.5 8 1.3 10.6.9 1.3 1.9 2.7 3.3 2.6 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.4-2.9 1.4-3-.1 0-2.9-1.1-3-4.3zM11.5 3c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z"/></svg>Apple ile devam et</button>
       <div style="display:flex;align-items:center;gap:10px;color:var(--soluk);font-size:13px;margin:6px 0"><i style="flex:1;height:1px;background:var(--cizgi)"></i>veya<i style="flex:1;height:1px;background:var(--cizgi)"></i></div>
       <button class="btn line wide" data-prov="email" style="height:54px">E-posta ile üye ol</button></div>
      <p class="hint" style="margin-top:18px">Devam ederek <a href="kosullar.html" data-legal="kosullar">kullanım koşullarını</a> kabul etmiş olursun. Verilerinin nasıl işlendiğini <a href="gizlilik.html" data-legal="kvkk">KVKK aydınlatma metninde</a> bulabilirsin.</p>
      `;
      cta="";ok=false;
    } else {
      const pn={google:"Google",apple:"Apple",email:"E-posta"}[ob.provider];
      body=`<h1>Bilgilerin</h1><p class="lead">${ob.provider==="email"?(REMOTE?(window.KDB&&KDB.uid?"E-postan doğrulandı.":"E-postana bir giriş bağlantısı göndereceğiz."):"E-postana bir doğrulama kodu göndereceğiz."):`${pn} hesabından gelen bilgileri kontrol et.`} Bu bilgiler hiçbir kullanıcıya gösterilmez.</p>
      <label class="lbl" for="ad">Ad</label><input class="city-search" style="margin-top:6px" id="ad" value="${esc(ob.ad)}" autocomplete="given-name" maxlength="30">
      <label class="lbl" for="soyad">Soyad</label><input class="city-search" style="margin-top:6px" id="soyad" value="${esc(ob.soyad)}" autocomplete="family-name" maxlength="30">
      <label class="lbl" for="email">E-posta</label><input class="city-search" style="margin-top:6px" id="email" type="email" value="${esc(ob.email)}" autocomplete="email" maxlength="80" ${ob.provider!=="email"&&ob.email?"readonly":""}>
      ${ob.provider==="email"&&ob.codeSent&&!REMOTE?`<label class="lbl" for="kod">E-postana gelen 6 haneli kod</label><input class="city-search" style="margin-top:6px;letter-spacing:.4em;font-size:20px;text-align:center" id="kod" inputmode="numeric" maxlength="6" value="${esc(ob.kod)}">`:""}
      <p class="hint" style="margin-top:12px" ${REMOTE?"hidden":""}>Prototip: gerçek sürümde ${ob.provider==="email"?"kod e-postana gelir":`bu alanlar ${pn} hesabından otomatik dolar`}. ${ob.provider==="email"?"Şimdilik herhangi 6 rakam kabul edilir.":""}</p>
      <button class="dice" id="chg" style="margin-top:6px">Başka yöntemle giriş yap</button>`;
      if(ob.provider==="email"&&!ob.codeSent){cta=REMOTE?"Giriş bağlantısı gönder":"Doğrulama kodu gönder";ok=nameOk&&emOk}
      else if(ob.provider==="email"){cta="Doğrula";ok=nameOk&&emOk&&/^\d{6}$/.test(ob.kod)}
      else {cta="Devam";ok=nameOk&&emOk}
    }}
  if(s===1){body=`<h1>Söyleyemediklerin burada.</h1><p class="lead">Takma adınla itiraf et, başkalarının itiraflarını oku, seni anlayanla özelden yazış. Gerçek adın hiçbir yerde görünmez.</p>
    <label class="lbl" for="nk">Takma adın</label><div class="nick"><input id="nk" maxlength="16" placeholder="Takma adını yaz" value="${esc(ob.n)}" autocomplete="off"></div><p class="hint" style="margin-top:6px">En az 3 karakter, boşluksuz. Herkes seni bu adla görür.</p>
    <label class="lbl">Profil rengin</label><div class="swatches">${COLORS.map(c=>`<button class="sw" style="background:${c}" data-c="${c}" aria-pressed="${ob.c===c}" aria-label="Renk"></button>`).join("")}</div>
    <p class="hint" style="margin-top:16px">Profil fotoğrafını ve kapak görselini kayıttan sonra Profilim'den seçebilirsin.</p>`;ok=ob.n.trim().length>=3;}
  if(s===2){const days=new Date(ob.y,ob.m,0).getDate();if(ob.d>days)ob.d=days;const sign=Z[signOf(ob.m,ob.d)];
    body=`<h1>Doğum tarihin</h1><p class="lead">Burcun profilinde görünür, doğum tarihin görünmez. Yaşın sadece aralık olarak görünür.</p>
    <div class="wheels" style="grid-template-columns:1fr 2fr 1.3fr">${wheel("gun",range(1,days),ob.d)}${wheel("ay",range(1,12,i=>AYLAR[i-1]),ob.m)}${wheel("yil",range(1950,new Date().getFullYear()-18),ob.y)}</div>
    <div class="wlab" style="grid-template-columns:1fr 2fr 1.3fr"><span>Gün</span><span>Ay</span><span>Yıl</span></div>
    <div class="sign-big" id="sb"><div class="g glyph">${sign.g}</div><div><b style="font-size:17px">${sign.n}</b><div class="muted" style="font-size:13px">${EL[sign.e]} grubu</div></div></div>
    <p class="warn" id="ageWarn" ${ageOf(ob.y,ob.m,ob.d)>=18?"hidden":""} style="margin-top:12px">Kulis'i kullanmak için 18 yaşını doldurmuş olman gerekiyor.</p>`;ok=ageOf(ob.y,ob.m,ob.d)>=18;}
  if(s===3){body=`<h1>Biraz daha</h1><p class="lead">Profilinde görünür, sohbet önerilerinde kullanılır.</p>
    <label class="lbl">Cinsiyet</label><div class="choice">${["Kadın","Erkek"].map(g=>`<button data-g="${g}" aria-pressed="${ob.g===g}">${g}</button>`).join("")}</div>`;ok=!!ob.g;}
  if(s===4){body=`<h1>Burada kurallar kısa</h1>
    <div class="rules"><div>${IC.chk}<span>Numara, Instagram ve benzeri iletişim bilgileri otomatik engellenir.</span></div>
    <div>${IC.chk}<span>Kimsenin gerçek adını, okulunu, iş yerini yazma. Başkasını ifşa eden itiraf silinir.</span></div>
    <div>${IC.chk}<span>Cinsel içerik ve müstehcen paylaşım yasak, görülen içerik kaldırılır.</span></div>
    <div>${IC.chk}<span>Rahatsız olursan tek dokunuşla engelle ve şikâyet et.</span></div></div>
    <button class="check" id="ck" role="checkbox" aria-checked="${ob.ok}"><span class="bx">${ob.ok?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M5 12.5l4.2 4.2L19 7"/></svg>':""}</span><span style="font-size:14.5px">18 yaşından büyüğüm. <a href="kurallar.html" data-legal="kurallar">Topluluk kurallarını</a> ve <a href="kosullar.html" data-legal="kosullar">kullanım koşullarını</a> kabul ediyorum, <a href="gizlilik.html" data-legal="kvkk">KVKK aydınlatma metnini</a> okudum.</span></button>${!ob.editing&&!isStandalone()&&(instEvt||isIOS())?`<button class="check" id="ckI" role="checkbox" aria-checked="${ob.inst}" style="margin-top:10px"><span class="bx">${ob.inst?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M5 12.5l4.2 4.2L19 7"/></svg>':""}</span><span style="font-size:14.5px">Kulis'i ana ekranıma ekle<small style="display:block;color:var(--soluk,#8a8f98);font-size:13px;margin-top:3px;line-height:1.4">Uygulama gibi tam ekran açılır, tek dokunuşla girersin. Bildirimler de telefonuna gelir.</small></span></button>`:""}`;
    ok=ob.ok;cta=ob.editing?"Değişiklikleri kaydet":"İtiraflara gir";}
  $("#onbIn").classList.toggle("wel",s===0&&!ob.provider);
  $("#onbIn").innerHTML=`${ob.editing?`<button class="ob-back show" id="obX" style="float:right">Vazgeç</button>`:""}<button class="ob-back ${(s>0||ob.provider)&&!(ob.editing&&s===1)?"show":""}" id="obB">${IC.back}Geri</button><div class="steps">${Array.from({length:STEPS},(_,i)=>`<i class="${i<=s?"on":""}"></i>`).join("")}</div>
   <div class="step">${body}</div><div class="ob-foot">${cta?`<button class="btn wide" id="obN" ${ok?"":"disabled"}>${cta}</button>`:`<button id="obN" hidden></button>`}</div>`;
  $("#obB").onclick=()=>{if(ob.step===0){ob.provider=null}else{ob.step--;if(ob.step===0&&ob.provider==="guest")ob.provider=null}drawOnb()};
  const sk=$("#skipBtn");if(sk)sk.onclick=()=>{ob.provider="guest";ob.ad="";ob.soyad="";ob.email="";ob.step=1;drawOnb();$("#onb").scrollTop=0};
  const ox=$("#obX");if(ox)ox.onclick=()=>{const box=$("#onbIn");box.innerHTML=`<div class="step" style="padding-top:40px"><h1>Değişiklikler kaydedilmedi</h1><p class="lead">Hesap bilgilerinde yaptığın değişiklikleri kaydetmeden çıkarsan hepsi kaybolur.</p></div>
      <div class="ob-foot" style="display:grid;gap:8px"><button class="btn wide" id="oq1">Düzenlemeye dön</button><button class="btn line wide" id="oq2">Kaydetmeden çık</button></div>`;
    $("#oq1").onclick=drawOnb;$("#oq2").onclick=()=>{ob.editing=false;$("#onb").hidden=true;toast("Değişiklikler kaydedilmedi")}};$("#obN").onclick=obNext;
  if(s===0){document.querySelectorAll("[data-prov]").forEach(b=>b.onclick=()=>{ob.provider=b.dataset.prov;ob.codeSent=false;ob.kod="";drawOnb()});
    if(ob.provider){const upd=()=>{const emOk=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ob.email.trim()),nameOk=ob.ad.trim().length>=2&&ob.soyad.trim().length>=2;$("#obN").disabled=!(nameOk&&emOk&&(ob.provider!=="email"||!ob.codeSent||/^\d{6}$/.test(ob.kod)))};
      $("#ad").oninput=e=>{ob.ad=e.target.value;upd()};$("#soyad").oninput=e=>{ob.soyad=e.target.value;upd()};
      $("#email").oninput=e=>{ob.email=e.target.value;if(ob.codeSent){ob.codeSent=false;ob.kod="";drawOnb();return}upd()};
      const k=$("#kod");if(k)k.oninput=e=>{ob.kod=e.target.value.replace(/\D/g,"");e.target.value=ob.kod;upd()};
      $("#chg").onclick=()=>{ob.provider=null;drawOnb()};
      if(!ob.ad)setTimeout(()=>{const a=$("#ad");a&&a.focus()},120)}}
  if(s===1){const n=$("#nk");n.oninput=()=>{ob.n=n.value.replace(/\s/g,"").toLocaleLowerCase("tr");if(n.value!==ob.n)n.value=ob.n;$("#obN").disabled=ob.n.length<3};
    document.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{ob.c=b.dataset.c;drawOnb()});if(!ob.n)setTimeout(()=>n.focus(),120)}
  if(s===2){const upd=()=>{if(!$("#sb"))return;const ad=ageOf(ob.y,ob.m,ob.d)>=18;const w=$("#ageWarn");if(w)w.hidden=ad;const nb=$("#obN");if(nb)nb.disabled=!ad;const sign=Z[signOf(ob.m,ob.d)];$("#sb").innerHTML=`<div class="g glyph">${sign.g}</div><div><b style="font-size:17px">${sign.n}</b><div class="muted" style="font-size:13px">${EL[sign.e]} grubu</div></div>`};
    bindWheel("gun",v=>{ob.d=v;upd()});bindWheel("ay",v=>{ob.m=v;fixDays();upd()});bindWheel("yil",v=>{ob.y=v;fixDays();upd()})}
  if(s===3)document.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>{ob.g=b.dataset.g;drawOnb()});
  if(s===4){$("#ck").onclick=()=>{ob.ok=!ob.ok;drawOnb()};const ci=$("#ckI");if(ci)ci.onclick=()=>{ob.inst=!ob.inst;drawOnb()}}
}
function fixDays(){const days=new Date(ob.y,ob.m,0).getDate();const w=$("#gun");if(w&&w.querySelectorAll("button").length!==days){if(ob.d>days)ob.d=days;drawOnb()}}
function confirmIdentity(){
  const g=document.createElement("div");g.className="cf-scrim";g.setAttribute("role","dialog");g.setAttribute("aria-modal","true");
  g.innerHTML=`<div class="cf"><div class="cf-ic">${IC.lock}</div><h2>Bilgilerin doğru mu?</h2>
    <p class="muted" style="font-size:14px;margin:6px 0 14px">Aşağıdaki bilgileri <b style="color:var(--kagit)">daha sonra değiştiremezsin</b>. Doğruluğundan emin misin?</p>
    <div class="cf-list">${ob.provider==="guest"?"":`<div><span>Ad soyad</span><b>${esc(ob.ad.trim())} ${esc(ob.soyad.trim())}</b></div><div><span>E-posta</span><b>${esc(ob.email.trim())}</b></div>`}<div><span>Doğum tarihi</span><b>${ob.d} ${AYLAR[ob.m-1]} ${ob.y}</b></div><div><span>Cinsiyet</span><b>${esc(ob.g)}</b></div></div>
    <p class="hint" style="margin:10px 0 14px">Bu bilgiler diğer kullanıcılara gösterilmez. Takma adın, profil fotoğrafın ve profil cümlen ise istediğin zaman değiştirilebilir.</p>
    <div style="display:grid;gap:8px"><button class="btn wide" id="cfY">Evet, eminim</button><button class="btn line wide" id="cfN">Geri dön ve düzelt</button></div></div>`;
  document.body.appendChild(g);
  g.querySelector("#cfY").onclick=()=>{g.remove();ob.confirmed=true;obNext()};
  g.querySelector("#cfN").onclick=()=>{g.remove();ob.step=0;drawOnb();$("#onb").scrollTop=0};
  setTimeout(()=>g.querySelector("#cfY").focus(),50);
}
function obNext(){
  if(ob.step===STEPS-1&&!ob.editing&&!ob.confirmed){confirmIdentity();return}
  if(REMOTE&&ob.step===0&&ob.provider==="email"&&!(window.KDB&&KDB.uid)){const em=ob.email.trim();$("#obN").disabled=true;
    KDB.sendLink(em).then(()=>{LSset("kulis_ob",{ad:ob.ad,soyad:ob.soyad,email:em});$("#onbIn").innerHTML=`<div class="step" style="padding-top:40px"><h1>Mailine bak</h1><p class="lead">${esc(em)} adresine bir giriş bağlantısı gönderdik. Bağlantıya bu cihazda tıklayınca kayıt kaldığın yerden devam eder.</p><p class="hint">Gelmediyse spam klasörüne de bak.</p></div><div class="ob-foot"><button class="btn line wide" id="obRe">Başka yöntemle giriş yap</button></div>`;$("#obRe").onclick=()=>{ob.provider=null;drawOnb()}})
    .catch(e=>{$("#obN").disabled=false;toast("Bağlantı gönderilemedi: "+(e.code||e.message))});return}
  if(ob.step===0&&ob.provider==="email"&&!ob.codeSent){ob.codeSent=true;drawOnb();toast("Doğrulama kodu e-postana gönderildi");setTimeout(()=>{const k=$("#kod");k&&k.focus()},150);return}
  if(ob.step<STEPS-1){ob.step++;drawOnb();$("#onb").scrollTop=0;return}
  const bio=state.me?state.me.bio:"";
  if(ageOf(ob.y,ob.m,ob.d)<18){ob.step=2;drawOnb();toast("18 yaşından küçükler kayıt olamaz");return}
  if(!ob.editing&&ob.inst&&!isStandalone()){
    if(instEvt){const ev=instEvt;instEvt=null;try{ev.prompt();ev.userChoice.then(r=>{if(r&&r.outcome==="accepted")toast("Kulis ana ekranına ekleniyor")}).catch(()=>{})}catch(e){}}
    else if(isIOS()){try{sessionStorage.setItem("kulis_ios_now","1")}catch(e){}}
  }
  if(REMOTE&&!ob.editing){remoteFinishOnb();return}
  if(!ob.editing)track("kayit",{yontem:ob.provider});
  state.me={n:ob.n,c:ob.c,s:signOf(ob.m,ob.d),g:ob.g,age:ageBand(ageOf(ob.y,ob.m,ob.d)),bio,b:{d:ob.d,m:ob.m,y:ob.y},ad:ob.ad.trim(),soyad:ob.soyad.trim(),email:ob.email.trim(),provider:ob.provider,photo:state.me?state.me.photo:undefined,banner:state.me?state.me.banner:undefined};
  save();$("#onb").hidden=true;render();toast(ob.editing?"Bilgilerin kaydedildi":`Hoş geldin ${ob.n}`);ob.editing=false;seedDemo();
}
let seeded=false;
function seedDemo(){ if(seeded)return;seeded=true;
  if(!DEMO){notify("sys",null,"Kulis'e hoş geldin. İlk itirafını yaz, insanlar seni yazdıklarınla tanısın.",{confess:1});render();return}
  // 20 mesaj sınırını görmek için neredeyse dolmuş örnek sohbet
  const t=["Selam, Mardin itirafını okudum. Ben de aynısını Kapadokya için yapmıştım.","Ciddi mi? Kime ne dedin?","Arkadaşımın düğünü var dedim, üç gün balon izledim.","Hahaha klasik. Yakalandın mı peki?","Annem fotoğrafları Instagram'da gördü. Tabii ki yakalandım.","Ben bu yüzden hiçbir şey paylaşmıyorum zaten.","Akıllıca. Sen nerede yaşıyorsun, il söyle yeter.","Ankara. Sen?","İzmir. Ama Ankara'ya çok geliyorum iş için.","Ankara'da gece gezilecek yer yok, uyarayım.","Kızılay'da bir yer biliyorum ama, gece 2'ye kadar açık.","Bak bu ilginç. Neresi?","Söylersem gelirsin diye korkuyorum şimdi.","Haha korkma, sadece merak ettim.","Peki. Bir dahaki gelişinde anlatırım.","Anlaştık. Bu arada burcun ne?","Yay. Belli değil mi?",`Çok belli. Ben ${Z[state.me.s].n}, bakalım anlaşabilecek miyiz.`];
  state.chats.push({u:"kedikahve",from:POSTS[7].t,msgs:t.map((x,i)=>({me:i%2===1,t:x})),status:"open",unread:false});
  state.requests.push({u:"gecekusu",first:"Profilini gördüm, burçlarımız uyumlu çıktı. Selam :)",from:null});
  const now=Date.now();
  notify("sys",null,"Kulis'e hoş geldin. İlk itirafını yaz, insanlar seni yazdıklarınla tanısın.",{confess:1},now-60000);
  const tg=swTarget();if(tg){const n=[...LIKED_ME].filter(k=>U[k].g===tg).length;notify("like",null,`${n} kişi seni beğendi. Eşleş'te kartlarını kaydır, eşleşirsen sohbet açılır.`,{tab:"kesfet"},now-40000)}
  notify("req","gecekusu","sana mesaj isteği gönderdi",{tab:"mesajlar"},now-20000);
  render();
}

