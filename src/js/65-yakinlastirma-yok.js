/* ============ YAKINLAŞTIRMA KAPALI ============
   iPhone Safari "user-scalable=no"yu yok sayıyor: iki parmakla büyütme ve çift dokunarak büyütme burada engelleniyor.
   Kaydırma, yazı yazma ve tek dokunuş etkilenmez. */
{
  const dur=e=>{if(e.cancelable)e.preventDefault()};
  ["gesturestart","gesturechange","gestureend"].forEach(t=>document.addEventListener(t,dur,{passive:false}));
  document.addEventListener("touchmove",e=>{if(e.touches&&e.touches.length>1)dur(e)},{passive:false});
  // çift dokunarak büyütme CSS'teki touch-action ile kapalı (hızlı art arda dokunuşları bozmasın diye burada engellenmiyor)
}
/* üst çubuktaki ayarlar simgesi: Ayarlar penceresini açar (demo modda Görünüm'ü) */
document.addEventListener("click",e=>{if(!e.target.closest("#topAyar"))return;if(REMOTE&&typeof showSettings==="function")showSettings();else if(typeof openGorunum==="function")openGorunum()});
