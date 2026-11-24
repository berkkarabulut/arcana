# Kulis kaynak kodu

Siteyi değiştirmek için **sadece bu klasördeki** dosyalar düzenlenir. Kökteki `index.html` ve `beta/` derlemenin çıktısıdır, elle düzenlenmez.

- `index.html`: sayfa iskeleti. `{{CSS}}`, `{{APP_JS}}`, `{{DB_JS}}`, `{{VER}}` derlemede doldurulur.
- `css/`: stiller, `sira.json`'daki sırayla birleştirilir.
- `js/`: uygulama kodu, `sira.json`'daki sırayla tek dosyada birleştirilir (aynı genel kapsamı paylaşır).
- `kulis-db.js`: Firebase bağlantısı (modül).
- `sw.js`: service worker. Önbellek adı derleme sürümünden gelir.

Derleme: `node build/derle.mjs --out dist [--min]`. Bekçiler (sözdizimi, aynı isimli fonksiyon, stil çakışması, olmayan id) hata bulursa derleme durur.
GitHub'a gönderilince `.github/workflows/derle.yml` önce **beta**'ya yayınlar ve gerçek tarayıcıyla test eder. Canlıya alma elle: Actions → "Derle ve yayınla" → hedef `canli`.
