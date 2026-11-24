/* ============ AYARLAR: DEMO ve İSTATİSTİK ============ */
// DEMO=true iken sahte kullanıcılar cevap verir, beğenir, eşleşir. Sunucu bağlanıp gerçek kullanıcıya açılınca false yapılacak.
const DEMO=!REMOTE&&(()=>{try{return localStorage.getItem("arcana_demo")!=="0"}catch(e){return true}})();
// İstatistik: olaylar burada toplanır. Sayaç servisi (GoatCounter/Umami) hesabı açılınca STATS_URL doldurulacak.
const STATS_URL="";
function track(ev,data){
  try{const k="arcana_stats",d=JSON.parse(localStorage.getItem(k)||"{}"),day=dayKey();d[day]=d[day]||{};d[day][ev]=(d[day][ev]||0)+1;localStorage.setItem(k,JSON.stringify(d))}catch(e){}
  if(window.gtag){try{gtag("event",ev,data||{})}catch(e){}}
  if(STATS_URL&&navigator.sendBeacon){try{navigator.sendBeacon(STATS_URL,JSON.stringify({ev,data:data||null,t:Date.now(),path:location.pathname}))}catch(e){}}
}

