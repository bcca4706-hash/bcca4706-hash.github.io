# Tavla — Proje Planı

## Vizyon
Google Play'de yayınlanacak, uzun yıllar geliştirilebilecek profesyonel tavla oyunu.
Önce **sağlam offline sürüm yayınla**, ardından çevrimiçi katmanı sağlıklı biçimde ekle.

## Teknoloji
Phaser 3 · JavaScript (ES Modules) · Vite · HTML5/CSS · PWA · Capacitor (Android AAB) ·
GitHub Actions. Çevrimiçi katman (Faz 2): WebSocket + REST + JWT (barındırılan servis, telefondan self-host değil).

## Yol Haritası

### v1 — Offline Yayın (öncelik)
- [x] Çekirdek kural motoru (uluslararası kurallar, zorunlu hamle, toplama, mars/gammon/backgammon)
- [x] Yapay zeka: Kolay / Normal / Zor
- [x] Build/PWA/Capacitor/CI iskeleti
- [ ] Phaser sahneleri: Boot, Menu, Game, UI (referans: koyu+altın, ahşap 2D)
- [ ] Ses (taş/zar/buton/müzik) + titreşim + animasyon (zar/taş/konfeti)
- [ ] Yerel 2 kişi + Eğitim modu
- [ ] Profil, coin, günlük 7 gün ödül, kozmetik kilit açma (zar/taş/tahta)
- [ ] AdMob (interstitial + rewarded)
- [ ] Play Store: adaptive icon, feature graphic, splash, gizlilik/ToS, imzalı AAB

### Faz 2 — Çevrimiçi
- Sunucu-otoriter oyun (zar ve hamle doğrulaması sunucuda = anti-cheat temeli)
- Matchmaking, dereceli/derecesiz, arkadaşla oyna, oda kur/katıl
- Yeniden bağlanma, ping, çevrimiçi durum, arkadaş/engelleme/raporlama
- ELO ve ligler (Bronz→Büyük Usta), global/ülke liderlik

### Faz 3 — Genişleme
- Turnuvalar (günlük/haftalık), sezonlar
- Mağaza/IAP, ek diller, uzman AI, admin panel, analytics, bulut kayıt

## Kapsam Dışı (v1 gerekçeleri)
- Telefondan self-host Node+PostgreSQL+Docker (sürdürülemez; Faz 2'de barındırılan servis)
- Tam anti-cheat paketi (online olmadan anlamsız)
- 4K PBR "fotogerçekçi" (düşük RAM + 60fps ile çelişir; kaliteli 2D hedeflenir)

## Dosya Yapısı
```
src/core/   kural motoru (framework-bağımsız): constants, board, rules, dice, game
src/ai/     yapay zeka (motoru kullanır)
src/i18n/   çeviriler (tr, en) + t()
src/        main.js (geçici demo kabuğu → Phaser sahneleriyle değişecek), styles.css
public/     manifest, service worker, ikonlar
tests/      motor testleri (node)
.github/    CI (web build+test, imzalı AAB)
docs/       plan ve dökümanlar
```

## Sürümleme
SemVer. v0.x geliştirme, v1.0.0 ilk Play yayını.
