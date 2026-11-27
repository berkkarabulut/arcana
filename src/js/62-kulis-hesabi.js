/* ============ KULİS MODERATÖRÜ HESABI ============
   Resmi hesaba "Özelden yaz" denirse mesaj isteği yerine Kulis Ekibi destek sohbeti açılır (orayı yönetici okuyor). */
{const sd0=startDM;startDM=function(k){if(k===KULIS_HESAP){closeSheet();if(typeof openEkip==="function"){if(openIdx>=0)closeChat();state.tab="mesajlar";render();openEkip()}return}return sd0.apply(this,arguments)}}
