# Eitherist

Karar vermekte zorlananlar için tasarlanmış, rastgele veya yapay zeka destekli karar verme asistanı.

## Özellikler

- **Modlar**: Rastgele (simülasyon), Akılcı, Eğlenceli, Mantıklı, Hızlı, Düşünceli, Yaratıcı, Spontan
- **Gemini AI** entegrasyonu (Rastgele hariç tüm modlarda)
- **Firebase** – Firestore + Cloud Functions
- Açık / Koyu / Loş tema modları
- Responsive arayüz

## Kendi Eitherist'inizi Kurun

### 1. Projeyi klonlayın

```bash
git clone https://github.com/YOUR_USERNAME/eitherist.git
cd eitherist
```

### 2. Firebase projesi oluşturun

1. [Firebase Console](https://console.firebase.google.com) → Yeni proje oluşturun
2. Firestore Database ve Cloud Functions'ı etkinleştirin
3. Web uygulaması ekleyin → Config değerlerini kopyalayın

### 3. Firebase yapılandırması

```bash
cp firebase-config.example.js firebase-config.js
```

`firebase-config.js` dosyasını açın ve kendi Firebase config değerlerinizi yapıştırın.

### 4. Firebase CLI ile projeyi bağlayın

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # Projenizi seçin
cp .firebaserc.example .firebaserc   # İlk kurulumda gerekebilir
```

### 5. Gemini API anahtarı (AI modları için)

1. [Google AI Studio](https://aistudio.google.com/apikey) → API anahtarı oluşturun
2. `firebase functions:secrets:set GEMINI_API_KEY` komutu ile ekleyin

### 6. Deploy

```bash
firebase deploy
```

Canlı adres: `https://YOUR_PROJECT_ID.web.app`

## Yerel geliştirme

```bash
npx serve .
```

Tarayıcıda `http://localhost:3000` açın. `firebase-config.js` yoksa veya placeholders doluysa sadece Rastgele modu (simülasyon) çalışır.

## Proje yapısı

```
eitherist/
├── index.html
├── app.js
├── styles.css
├── firebase-config.example.js   # Şablon – firebase-config.js olarak kopyalayın
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── functions/                  # Cloud Functions
│   └── index.js
└── assets/
```

## Güvenlik

- `firebase-config.js` ve `.firebaserc` `.gitignore`'da – asla commit etmeyin
- Firestore Rules ve Cloud Function limitleri sunucu tarafında uygulanır
- Gemini API anahtarı Firebase Secrets'ta saklanır

## Lisans

MIT
