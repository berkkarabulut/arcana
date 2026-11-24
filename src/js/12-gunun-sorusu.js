/* ============ GÜNÜN SORUSU ============ */
const QUESTIONS=["En son kime yalan söyledin ve neden?","Hâlâ unutamadığın bir cümle var mı?","Kimseye söylemediğin bir korkun ne?","Geri dönebilsen hangi gün olurdu?","Birinden hâlâ özür bekliyor musun?","En son ne zaman ağladın?","İlk aşkın şimdi ne yapıyor sence?","Ailene hiç söyleyemediğin şey ne?","Şu an aklından geçen kişi kim, adını vermeden anlat.","Hayatında en çok pişman olduğun karar?","Bir günlüğüne görünmez olsan ne yapardın?","En son kimi kıskandın?","Biri sana ‘seni seviyorum’ dese şu an kim olmasını isterdin?","İş yerinde/okulda kimseye söyleyemediğin şey ne?","Eski sevgiline son bir mesaj atabilsen ne yazardın?","En utanç verici anın hangisi?","Kimsenin bilmediği bir yeteneğin var mı?","Bir arkadaşına hiç söylemediğin gerçek ne?","Gece uyumadan önce en çok ne düşünüyorsun?","Hayatında birine ‘keşke’ dediğin an?","Telefonunda kimseye göstermediğin şey ne?","Bugün seni gülümseten küçük bir şey?","Birine hâlâ kızgın mısın? Neden?","İlk görüşte aşka inanır mısın, yaşadın mı?","En son ne zaman yalnız hissettin?","Kendinde değiştirmek istediğin tek şey ne?","Hiç kimseye anlatmadığın bir sırrın?","Annene/babana söyleyemediğin bir teşekkür var mı?","Gizlice hâlâ takip ettiğin biri var mı?","Bir günlüğüne başka biri olsan kim olurdun?","En büyük hayalin ne, kimse bilmiyor olsa bile?","Bugün kimseye anlatamadığın ne oldu?","Bir ilişkide asla affetmeyeceğin şey ne?","Seni en son kim şaşırttı?","Bir mesajı yazıp silip göndermediğin oldu mu? Kime?","Çocukken sakladığın bir şey var mı?","Kendine en son ne zaman ‘aferin’ dedin?","Hiç birinin mesajını görüp cevap vermedin mi? Neden?","En çok özlediğin koku ne?","Şu an hayatında bir şeyi bırakabilsen ne olurdu?","Bir yabancıya söylemesi daha kolay olan şey ne?","En sevdiğin ama utandığın şarkı hangisi?","Kimsenin bilmediği bir alışkanlığın?","Birine hiç söylemediğin bir iltifat var mı?","Sence seni en iyi kim tanıyor?"];
function todayQ(){const d=new Date(Date.now()+3*3600e3);const n=Math.floor(d.getTime()/864e5);return {i:n%QUESTIONS.length,t:QUESTIONS[n%QUESTIONS.length],day:n}}
function qCard(){
  if(!state.me)return "";const q=todayQ();
  const n=allPosts().filter(p=>p.cat==="soru"&&p.q===q.t).length;
  return `<div class="qc"><small>Günün sorusu</small><b>${esc(q.t)}</b><div class="qc-f"><span>${n?`${n} cevap`:"İlk cevabı sen yaz"}</span>${n?`<button class="qc-see" data-cat="soru">Cevapları gör</button>`:""}<button class="btn sm" id="qcGo">Cevapla</button></div></div>`;
}
function dailyCard(){
  const me=state.me;if(!me)return "";const r=daily(me.s);
  return `<button class="dh" id="dhCard" style="--acc:${me.c||"#E8505B"}"><span class="dh-z">${Z[me.s].g}</span><span class="dh-t"><small>${Z[me.s].n} için bugün</small><span>${r.genel}</span></span><span class="dh-go">${IC.chev}</span></button>`;
}
function dots(n){return `<span class="dh-dots" aria-label="5 üzerinden ${n}">${[1,2,3,4,5].map(i=>`<i class="${i<=n?"on":""}"></i>`).join("")}</span>`}
function showDaily(sign){
  sign=sign||state.me.s;const r=daily(sign),z=Z[sign],d=new Date();
  openSheet(`<div class="sheet-head"><h2>Günlük burç yorumu</h2></div>
    <p class="muted" style="font-size:13px;margin:-6px 0 14px">${d.getDate()} ${AYLAR[d.getMonth()]} ${GUNLER[d.getDay()]}</p>
    <div class="dh-pick" role="group" aria-label="Burç seç">${SIGNS.map(x=>`<button data-dhs="${x.k}" aria-pressed="${x.k===sign}" aria-label="${x.n}" title="${x.n}">${x.g}</button>`).join("")}</div>
    <div class="dh-hero"><span class="dh-big">${z.g}</span><div><h3>${z.n}</h3><small>${EL[z.e]} grubu${sign===state.me.s?", senin burcun":""}</small></div></div>
    <p class="dh-genel">${r.genel}</p>
    <div class="dh-sec"><div class="dh-st"><b>Aşk</b>${dots(r.puan.ask)}</div><p>${r.ask}</p></div>
    <div class="dh-sec"><div class="dh-st"><b>İş ve para</b>${dots(r.puan.is)}</div><p>${r.is}</p></div>
    <div class="dh-sec"><div class="dh-st"><b>Ruh hali</b>${dots(r.puan.ruh)}</div><p>${r.ruh}</p></div>
    <div class="dh-chips"><div><small>Şanslı renk</small><b>${r.renk}</b></div><div><small>Şanslı sayı</small><b>${r.sayi}</b></div><div><small>Günün uyumu</small><b>${Z[r.uyum].g} ${Z[r.uyum].n}</b></div></div>
    <p class="hint" style="margin-top:14px;text-align:center">Yorumlar her gün yenilenir ve eğlence amaçlıdır.</p>`);
  $("#sheet").querySelectorAll("[data-dhs]").forEach(b=>b.onclick=()=>showDaily(b.dataset.dhs));
}

