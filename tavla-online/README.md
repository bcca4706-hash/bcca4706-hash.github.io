# Tavla — Klasik Strateji

Phaser 3 + Vite + Capacitor ile geliştirilen, Google Play hedefli profesyonel tavla oyunu.
Açık kaynak (MIT). Termux + GitHub Actions uyumlu.

## Durum
- ✅ Çekirdek kural motoru (uluslararası kurallar) — testlerle doğrulandı
- ✅ Yapay zeka (Kolay/Normal/Zor)
- ✅ PWA + Capacitor + CI iskeleti
- ✅ Çalışır demo kabuk (`npm run dev` → Beyaz sen, Siyah AI)
- ⏳ Phaser sahneleri, ses, profil/mağaza, AdMob, çevrimiçi (yol haritası: `docs/PROJECT_PLAN.md`)

## Kurulum (Termux)
```bash
npm install
npm run dev          # tarayıcıda http://localhost:5173
npm test             # motor testleri
npm run build        # dist/ üretir (PWA)
```

## Android (Capacitor)
```bash
npm run build
npx cap add android      # ilk sefer
npx cap sync android
# AAB: GitHub Actions "Build" workflow'unu manuel tetikle (imzalı)
```
Gerekli GitHub Secrets: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

## Mimari
`src/core` saf JavaScript kural motorudur; UI (Phaser), AI ve ileride sunucu
**aynı motoru** kullanır. Çevrimiçi modda sunucu bu motoru çalıştırıp istemci
hamlelerini doğrular (sunucu-otoriter = anti-cheat temeli).

Ayrıntılar: `docs/PROJECT_PLAN.md`
