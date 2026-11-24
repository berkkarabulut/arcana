/* ============ VERİ ============ */
const SIGNS=[["koc","Koç","♈",0],["boga","Boğa","♉",1],["ikizler","İkizler","♊",2],["yengec","Yengeç","♋",3],["aslan","Aslan","♌",0],["basak","Başak","♍",1],["terazi","Terazi","♎",2],["akrep","Akrep","♏",3],["yay","Yay","♐",0],["oglak","Oğlak","♑",1],["kova","Kova","♒",2],["balik","Balık","♓",3]].map(([k,n,g,e],i)=>({k,n,g:g+"︎",e,i}));
const Z=Object.fromEntries(SIGNS.map(s=>[s.k,s]));
const EL=["Ateş","Toprak","Hava","Su"];
function signOf(m,d){const c=[[1,20,"oglak","kova"],[2,19,"kova","balik"],[3,21,"balik","koc"],[4,20,"koc","boga"],[5,21,"boga","ikizler"],[6,21,"ikizler","yengec"],[7,23,"yengec","aslan"],[8,23,"aslan","basak"],[9,23,"basak","terazi"],[10,23,"terazi","akrep"],[11,22,"akrep","yay"],[12,22,"yay","oglak"]][m-1];return d<c[1]?c[2]:c[3]}
const AYLAR=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const COLORS=["#FF8A65","#7CC4FF","#2FBF97","#B39CFF","#FF7EA8","#F5B84B"];
const CATS=[["hepsi","Hepsi"],["soru","Günün sorusu"],["ask","Aşk"],["is","İş"],["aile","Aile"],["arkadas","Arkadaşlık"],["kimse","Kimseye söylemedim"]];
const CATN=Object.fromEntries(CATS);
const REACTS=[["bende","Ben de","meToo"],["saril","Sarıl","hug"],["yok","Yok artık","wow"]];

const U={ // örnek kullanıcılar
 gecekusu:{prem:1,banner:"preset:b1",photo:"preset:k1",n:"gecekuşu",s:"akrep",age:"25-29",g:"Kadın",c:"#C79AF2",bio:"Gece 3'ten sonra dürüst olurum.",since:"Eylül 2026",stat:[12,48,302]},
 mavimerdiven:{banner:"preset:b4",n:"mavimerdiven",s:"basak",age:"25-29",g:"Erkek",c:"#86A8F0",bio:"Her şeyi planlarım, kalbim hariç.",since:"Ekim 2026",stat:[5,31,140]},
 sessizlimon:{prem:1,banner:"preset:b5",photo:"preset:k4",n:"sessizlimon",s:"terazi",age:"20-24",g:"Kadın",c:"#E9B96E",bio:"Kararsızım ama bu konuda değil.",since:"Ağustos 2026",stat:[9,77,415]},
 yorgunkaptan:{prem:1,banner:"preset:b3",photo:"preset:e2",n:"yorgunkaptan",s:"oglak",age:"30-34",g:"Erkek",c:"#7CC6A4",bio:"Plazada çalışıyorum, ruhum Kaş'ta.",since:"Haziran 2026",stat:[3,12,61]},
 kirmiziceket:{prem:1,n:"kırmızıceket",s:"koc",age:"20-24",g:"Kadın",c:"#E8505B",bio:"Önce yaparım, sonra itiraf ederim.",since:"Kasım 2026",stat:[7,22,190]},
 eskiplak:{prem:1,banner:"preset:b6",photo:"preset:e4",n:"eskiplak",s:"balik",age:"25-29",g:"Erkek",c:"#F29A7C",bio:"Hâlâ 2016'dayım bazı konularda.",since:"Temmuz 2026",stat:[14,60,388]},
 kumsaati:{prem:1,photo:"preset:k5",n:"kumsaati",s:"yengec",age:"30-34",g:"Kadın",c:"#86A8F0",bio:"Annemle aramdaki her şey burada.",since:"Mayıs 2026",stat:[4,19,97]},
 ucuncukat:{prem:1,n:"üçüncükat",s:"ikizler",age:"20-24",g:"Erkek",c:"#C79AF2",bio:"Komşular beni tanır, burada kimse tanımaz.",since:"Ekim 2026",stat:[6,40,155]},
 kedikahve:{prem:1,banner:"preset:b2",photo:"preset:k3",n:"kedikahve",s:"yay",age:"25-29",g:"Kadın",c:"#7CC6A4",bio:"Plansız biletler, uzun mesajlar.",since:"Eylül 2026",stat:[8,35,222]},
 dumanli:{photo:"preset:e5",n:"dumanlı",s:"kova",age:"30-34",g:"Erkek",c:"#E9B96E",bio:"Kimseyi kırmadan dürüst olmayı deniyorum.",since:"Ağustos 2026",stat:[2,58,120]},
};
const POSTS=[
 {id:"p1",u:"gecekusu",cat:"ask",t:"Üç yıldır en yakın arkadaşımın sevgilisine aşığım. İkisinin düğününde nedime olacağım. Kimse bilmiyor, o bile.",ago:"18 dk",r:{bende:214,saril:388,yok:96},cm:[
   {u:"eskiplak",t:"Bunu taşımak çok ağır. Düğünden sonra biraz uzaklaşmak sana iyi gelebilir.",ago:"12 dk"},
   {u:"sessizlimon",t:"Ben de benzerini yaşadım. Zaman gerçekten geçiriyor, söz.",ago:"9 dk"},
   {u:"dumanli",t:"Nedimeliği bırakmak bir seçenek mi? Kendini korumak bencillik değil.",ago:"4 dk"}]},
 {id:"p2",u:"yorgunkaptan",cat:"is",t:"İşyerinde herkes beni çok çalışkan sanıyor. Aslında iki aydır her gün öğle arasında arabada uyuyorum.",ago:"42 dk",r:{bende:520,saril:61,yok:44},cm:[
   {u:"mavimerdiven",t:"Arabada uyumayan plaza çalışanı yoktur zaten.",ago:"30 dk"},
   {u:"kedikahve",t:"İki aydır yorgunsan bir de tükenmişlik açısından bak bence.",ago:"21 dk"}]},
 {id:"p3",u:"kumsaati",cat:"aile",t:"Annemin aradığını görünce telefonu sessize alıyorum. Sonra bütün gece suçluluk duyuyorum.",ago:"1 sa",r:{bende:640,saril:410,yok:12},cm:[
   {u:"ucuncukat",t:"Bu itirafı okuyan herkes kendini gördü.",ago:"50 dk"}]},
 {id:"p4",u:"kirmiziceket",cat:"arkadas",t:"Arkadaş grubunda doğum günümü kimse hatırlamadı. Ben de söylemedim. Hâlâ söylemedim.",ago:"2 sa",r:{bende:188,saril:502,yok:73},cm:[
   {u:"gecekusu",t:"Söyle. Unutmaları senin değersiz olduğun anlamına gelmiyor ama söylemezsen hep içinde kalır.",ago:"1 sa"},
   {u:"dumanli",t:"Geç kalmış doğum günü kutlaması da kutlamadır.",ago:"1 sa"}]},
 {id:"p5",u:"ucuncukat",cat:"kimse",t:"Üniversiteyi bitirdiğimi söylüyorum ama son dönemdeki iki dersi hiç vermedim. Diploma töreninde fotoğraf bile çektirdim.",ago:"3 sa",r:{bende:77,saril:95,yok:631},cm:[
   {u:"yorgunkaptan",t:"İki ders az değil ama hâlâ verilebilir. Yaz okulunu araştır.",ago:"2 sa"}]},
 {id:"p6",u:"eskiplak",cat:"ask",t:"Eski sevgilimin Spotify çalma listesini hâlâ takip ediyorum. Yeni şarkı ekleyince kime eklediğini düşünüyorum.",ago:"5 sa",r:{bende:702,saril:120,yok:88},cm:[
   {u:"kirmiziceket",t:"Takibi bırak. Bunu yazmak bile cesaretti, şimdi sil.",ago:"4 sa"},
   {u:"sessizlimon",t:"Ben de yapıyordum. Bıraktığım gün hafifledim.",ago:"3 sa"}]},
 {id:"p7",u:"sessizlimon",cat:"ask",t:"Sevgilim beni Terazi diye kararsız sanıyor. Aslında üç aydır ayrılmaya karar vermiş durumdayım, sadece söyleyemiyorum.",ago:"6 sa",r:{bende:233,saril:301,yok:140},cm:[]},
 {id:"p8",u:"kedikahve",cat:"kimse",t:"Annemlere iş gezisi dedim, tek başıma Mardin'e gittim. Hayatımın en iyi üç günüydü.",ago:"Dün",r:{bende:310,saril:84,yok:52},cm:[
   {u:"mavimerdiven",t:"Yalan ama güzel yalan.",ago:"Dün"}]},
];
// kullanıcıların başka yerlerdeki cevapları (profil için)
const EXTRA_COMMENTS={gecekusu:[{on:"Kardeşimin harçlığını yıllardır ben veriyorum, annemler bilmiyor.",t:"Sen iyi bir ablasın, bunu bil."}],mavimerdiven:[{on:"Her sabah aynı kahveciye o kız için gidiyorum.",t:"Bir gün selam ver, en kötü kahve içmiş olursun."}]};

const state={notifs:[],replied:new Set(),sort:"populer",hidden:new Set(),me:null,tab:"akis",cat:"hepsi",open:null,react:{},chats:[],requests:[],premium:false,myPosts:[],myComments:[],explore:"populer"};
const FREE_LIMIT=20, FREE_CHATS=3;

