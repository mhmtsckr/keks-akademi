# KEKS Akademi Native Mobile

KEKS Akademi'nin Android ve iOS kabuğu Capacitor ile aynı production web uygulamasını kullanır. Böylece hesap, abonelik, öğrenci/koç/veli yetkileri ve API güvenliği tek backend üzerinden yürür.

## Kimlik
- App name: KEKS Akademi
- Bundle/Application ID: `com.keksakademi.app`
- Production origin: `https://keksakademi.vercel.app`

## İlk kurulum
```bash
npm install
npm run mobile:add:android
npm run mobile:add:ios
npm run mobile:sync
```

Android Studio:
```bash
npm run mobile:android
```

Xcode (macOS gerekir):
```bash
npm run mobile:ios
```

## Mağaza yayınlama öncesi
Google Play için Android signing keystore, Play Console uygulama kaydı, gizlilik/veri güvenliği beyanı, ekran görüntüleri ve AAB gerekir.

Apple App Store için Apple Developer üyeliği, App Store Connect kaydı, signing/provisioning, Privacy Nutrition Labels, ekran görüntüleri ve archive upload gerekir.

Ödeme politikası mağaza incelemesinden önce ayrıca doğrulanmalıdır. Native uygulama içinde dijital abonelik satın alma akışı Google Play Billing / Apple In-App Purchase kurallarına tabi olabilir; web PayTR checkout'u mağaza uygulamasında varsayılan satın alma akışı olarak kabul edilmemelidir.
