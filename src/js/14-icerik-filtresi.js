/* ============ İÇERİK FİLTRESİ ============ */
const TR_NAMES=new Set("Mehmet Mustafa Ahmet Ali Hüseyin Hasan İbrahim İsmail Osman Yusuf Murat Ömer Ramazan Halil Süleyman Abdullah Mahmut Recep Emre Burak Kemal Fatih Serkan Hakan Kadir Orhan Can Cem Deniz Berk Arda Kerem Emir Eren Efe Mert Onur Tolga Volkan Uğur Okan Barış Batuhan Furkan Enes Yasin Oğuz Serdar Selim Tuncay Yiğit Kaan Alp Ege Baran Umut Sinan Erkan Gökhan Taner Cengiz Levent Erdem Engin Ercan Tarık Anıl Berkay Doğukan Görkem Halit Emirhan Metehan Alperen Ozan Tuna Koray Sercan Fatma Ayşe Emine Hatice Zeynep Elif Meryem Şerife Zehra Sultan Hanife Merve Esra Özlem Büşra Kübra Ebru Gizem Tuğba Ece Ceren Selin Cansu İrem Damla Buse Dilara Melis Ezgi Derya Seda Sibel Gamze Aslı Burcu Pınar Yasemin Gül Gülşen Nur Esma Beyza Sude Nisa Ecrin Defne Duru Eylül Azra Asya Ela Melike Sevgi Hande Tuba Nihan Nazlı Başak Didem Şeyma Rabia Hilal Aylin Berna Dilek Filiz Songül Yeliz Neslihan Gülay Hülya Serpil Sevda Şule Tuğçe Yağmur Begüm İpek Nehir Ada Lara".split(" "));
const NAME_OK_NEXT=new Set(["Bey","Hanım","Abi","Abla","Hoca","Hocam","Teyze","Amca","Dayı","Enişte","Yenge"]);
const DEFAULT_BANNED=["orospu","ibne","yarrak","yarak","amcık","sikiş","sikerim","sikeyim","pezevenk","kahpe","porno","nude","çıplak foto"];
function bannedList(){if(REMOTE&&typeof R!=="undefined"&&R.mod&&Array.isArray(R.mod.words))return R.mod.words;try{const l=JSON.parse(localStorage.getItem("arcana_banned")||"null");if(Array.isArray(l))return l}catch(e){}return DEFAULT_BANNED}
const lowTR=t=>t.toLocaleLowerCase("tr");
// sunucu kuralının kullandığı düzenli ifade: kelimenin başı eşleşir (istemci filtresiyle aynı mantık)
function bannedRegex(words){const ks=[...new Set(words.map(w=>lowTR(w).trim()).filter(Boolean))].map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));return ks.length?"(^|[^a-zçğıöşü0-9])("+ks.join("|")+")":""}
async function saveBanned(list){if(!REMOTE){LSset("arcana_banned",list);return}try{await KDB.setModeration(list,bannedRegex(list));toast("Kelime listesi herkese uygulandı")}catch(e){toast("Kaydedilemedi: "+(e.code||e.message))}}
// sunucunun reddettiği yazmalar için anlaşılır mesaj
function writeErr(e,kind){const c=e&&e.code||"";if(c==="permission-denied")return {itiraf:"İki itiraf arasında en az 15 dakika olmalı. Biraz sonra tekrar dene.",yorum:"Biraz yavaş: iki yorum arasında birkaç saniye beklemelisin.",mesaj:"Mesajın gitmedi. Biraz yavaş yaz ya da karşı taraf seni engellemiş olabilir.",istek:"İstek gönderilemedi. Yeni bir istek için biraz bekle ya da bu kişi seni engellemiş olabilir.",perde:"Perde isteği gönderilemedi. Sohbet henüz kabul edilmemiş ya da zaten bir istek var."}[kind]||"Bu işlem şu an yapılamadı.";return "Olmadı: "+(c||e&&e.message||"bilinmeyen hata")}
function bannedHit(t){
  const low=lowTR(t);
  for(const w of bannedList()){const k=lowTR(w).trim();if(!k)continue;
    const re=new RegExp("(^|[^a-zçğıöşü0-9])"+k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));if(re.test(low))return w}
  return null;
}
function nameHit(t){
  const words=t.split(/[\s,.;:!?()"“”'’…-]+/).filter(Boolean);
  for(let i=0;i<words.length-1;i++){const a=words[i],b=words[i+1];
    if(TR_NAMES.has(a)&&/^[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}$/.test(b)&&!NAME_OK_NEXT.has(b)&&!TR_NAMES.has(b))return a+" "+b;
    if(TR_NAMES.has(a)&&TR_NAMES.has(b)&&i+2<words.length&&/^[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}$/.test(words[i+2])&&!NAME_OK_NEXT.has(words[i+2]))return a+" "+b+" "+words[i+2];}
  return null;
}
const INST_RE=/(?:[A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü]+\s+){1,4}(?:Lisesi|Koleji|Üniversitesi|Ortaokulu|İlkokulu|Okulları|Okulu|Hastanesi|Holding|Bankası|Belediyesi|Fakültesi|Yurdu|Dershanesi|Kursu|Şirketi|Mağazası|Market|Kafe|Cafe)(?![a-zçğıöşü])|\bA\.?Ş\.?(?=\s|$)/;
/* kind: "itiraf" | "yorum" | "mesaj". Uygunsa null, değilse kullanıcıya gösterilecek açıklama döner. */
function modCheck(t,kind){
  const w=bannedHit(t);
  if(w){track("filtre_kelime");return `“${esc(w)}” Kulis'te kullanılamıyor. Cinsel içerik ve hakaret içeren kelimeler engelleniyor.`}
  if(kind==="mesaj")return null;
  if(/(^|\s)@[A-Za-z0-9_.]{3,}/.test(t)){track("filtre_kullaniciadi");return "Başka birinin kullanıcı adını yazamazsın. Kimseyi etiketleme, ifşa etme."}
  const n=nameHit(t);
  if(n){track("filtre_isim");return `“${esc(n)}” gerçek bir ad soyad gibi görünüyor. ${kind==="itiraf"?"İtiraflarda":"Yorumlarda"} kimsenin adını soyadını yazamazsın, kimseyi ifşa etmeden anlat.`}
  const m=t.match(INST_RE);
  if(m){track("filtre_kurum");return `“${esc(m[0].trim())}” bir okul ya da iş yeri adı gibi görünüyor. Kimsenin tanınmasına yol açacak yer adı yazma.`}
  return null;
}

