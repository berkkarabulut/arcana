// Kulis Moderatörü resmi hesabını kurar ve başlangıç paylaşımlarını yapar (bir kez; tekrar çalışırsa yeni paylaşım eklemez)
import admin from "firebase-admin";
admin.initializeApp({ projectId: "kulis-1647d" });
const db = admin.firestore();
const UID = "kulismoderator";
const profil = {
  n: "Kulis Moderatörü", c: "#FF8A65", s: "terazi", g: null, age: "", dg: true, resmi: true,
  bio: "Kulis'in resmi hesabı. Burada nöbetteyim: soru, öneri ya da şikâyetin olursa \"Özelden yaz\", doğrudan Kulis Ekibi'ne ulaşır.",
  av: null, banner: null
};
const a = { n: profil.n, c: profil.c, s: profil.s, g: null, age: "", av: null };
const POSTLAR = [
  ["kimse", "Merhaba, ben Kulis'in moderatörüyüm. Burası herkesin kulisi: sahnede söyleyemediğini burada söylüyorsun. Takma adla ya da tamamen anonim. Kimse kim olduğunu bilmiyor, kimse yargılamıyor. İlk itirafı yazan sen ol, ben buradayım. 🌙"],
  ["ask", "Bu haftanın sorusu: Hiç gönderemediğin bir mesaj var mı? Yazıp yazıp sildiğin o cümle... Buraya bırak. Belki okuyan biri \"ben de\" der, belki o kişi de buradadır."],
  ["aile", "Ailene anlatamadıkların için de burası var. Baskı, beklenti, söylenmemiş kırgınlıklar... Adını vermeden yaz. Bazen sadece yazmak bile omzundaki yükü hafifletir."],
  ["arkadas", "Arkadaşına söyleyemediğin bir şey var mı? Özlediğini, kırıldığını, kıskandığını... İtirafını bırak. Altına \"Ben de\" diyenleri görünce yalnız olmadığını anlayacaksın."],
  ["is", "İş yerinde herkes güçlü görünüyor ama kulis başka. Patronuna, iş arkadaşına, kendine bile itiraf edemediğin ne varsa burada söyle. Kimse CV'ne bakmıyor."],
  ["kimse", "Gecenin sorusu: En son ne zaman gerçekten ağladın ve kimse bilmiyor? Cevabını itiraf olarak yaz. Kimin olduğunu kimse görmeyecek, ama kaç kişinin seni anladığını göreceksin."],
  ["kimse", "Kulis'te kurallar basit: adres, telefon, gerçek isim yok. Sohbetler sitede kalır, istemediğin kimse sana yazamaz, tek dokunuşla engellersin. Rahat ol, kendin ol."],
  ["ask", "Bir itiraf kalbine dokunduysa altındaki \"Özelden yaz\"a bas. Karşı taraf kabul ederse sohbet açılır. Burada insanlar önce birbirinin kalbini tanıyor, sonra yüzünü. Perdeyi ne zaman açacağına ikiniz karar veriyorsunuz."],
  ["kimse", "Açılış dönemindeyiz: mesajlaşma, sesli ve görüntülü arama, Eşleş, hepsi şu an tamamen ücretsiz. Şimdi katılanlar Kurucu üye rozeti alıyor, kurucu görevlerini bitirene uygulamalar çıkınca 1 ay Premium da hediye. 🎁"],
  ["arkadas", "Küçük bir ipucu: Profilindeki anonim soru linkini hikâyende paylaş. Arkadaşların sana adlarını vermeden soru sorsun, sen de cevabını burada itiraf olarak yayınla. Bakalım seni en çok ne merak ediyorlar? 👀"]
];
await db.doc(`users/${UID}`).set(profil, { merge: true });
await db.doc(`users/${UID}/private/info`).set({ ad: "Kulis", soyad: "Moderatörü", provider: "sistem" }, { merge: true });
const var_ = await db.collection("posts").where("uid", "==", UID).get();
if (!var_.empty) { console.log("Zaten", var_.size, "paylaşım var, yenisi eklenmedi."); process.exit(0); }
const simdi = Date.now();
// en eski en altta kalsın diye: ilk paylaşım en yeni olacak şekilde birkaç dakika arayla
for (let i = POSTLAR.length - 1; i >= 0; i--) {
  const [cat, t] = POSTLAR[i];
  await db.collection("posts").add({ uid: UID, t, cat, r: { bende: 0, saril: 0, yok: 0 }, cm: 0, ts: admin.firestore.Timestamp.fromMillis(simdi - i * 4 * 60e3), a, resmi: true });
}
console.log("Kulis Moderatörü hesabı hazır,", POSTLAR.length, "paylaşım eklendi. Sitedeki toplam itiraf:", (await db.collection("posts").count().get()).data().count);
