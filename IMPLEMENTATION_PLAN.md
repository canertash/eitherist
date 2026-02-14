# Eitherist – Firebase Entegrasyonu İş Planı

## Genel Akış

```
[Kullanıcı] → Soru + Seçenekler yazar → "Karar Ver" tıklar
       ↓
[Firestore] ← Frontend: decisions/{id} oluşturur (status: pending)
       ↓
[Cloud Function] ← onCreate tetiklenir
       ↓
[AI API] ← Function AI’ı çağırır
       ↓
[Firestore] ← Function result yazar (status: done)
       ↓
[Frontend] ← Listener güncellemeyi alır → Ekranda gösterir
```

---

## Faz 1: Firebase Projesi ve Temel Kurulum

| # | Görev | Detay |
|---|-------|-------|
| 1.1 | Firebase Console’da proje oluştur | [console.firebase.google.com](https://console.firebase.google.com) |
| 1.2 | Firestore Database’i etkinleştir | Test modunda başla (sonra production rules) |
| 1.3 | Web uygulaması ekle | `eitherist` – SDK config al |
| 1.4 | Proje kökünde Firebase CLI | `npm install -g firebase-tools` + `firebase login` |
| 1.5 | Firebase’i projeye bağla | `firebase init` → Firestore + Functions seç |

**Çıktı:** `firebase.json`, `firestore.rules`, `functions/` klasörü, `firebaseConfig` değerleri

---

## Faz 2: Firestore Yapısı ve Güvenlik

### 2.1 Koleksiyon Şeması

```
decisions/
  {docId}/
    question: string
    options: string[]
    mode: string
    status: "pending" | "done" | "error"
    result: string | null
    errorMessage: string | null   (status: error iken)
    createdAt: timestamp
    updatedAt: timestamp
```

### 2.2 Security Rules

- Kullanıcılar sadece **yeni belge oluşturabilir**
- Kullanıcılar sadece **kendi belgesini okuyabilir** (docId session/client’a özel)
- **update** sadece Cloud Function (Admin SDK) tarafından yapılacak

İlk aşamada anonim erişim için basit rules; sonra auth zorunlu hale getirilebilir.

---

## Faz 3: Cloud Function (AI Tetikleyici)

| # | Görev | Detay |
|---|-------|-------|
| 3.1 | `functions/` içinde AI dependency | OpenAI SDK veya fetch ile API çağrısı |
| 3.2 | `onDecisionCreated` | `decisions` koleksiyonunda `onCreate` tetikleyici |
| 3.3 | AI çağrısı | question + options + mode → API’ye gönder |
| 3.4 | Sonucu yaz | `update(docRef, { result, status: "done", updatedAt })` |
| 3.5 | Hata durumu | `update(docRef, { status: "error", errorMessage })` |
| 3.6 | Rate limit (opsiyonel) | Aynı IP/client için istek sınırı |

**Çıktı:** AI API key sadece Functions’da, Firestore’a yazılan sonuç

---

## Faz 4: Frontend Entegrasyonu

| # | Görev | Detay |
|---|-------|-------|
| 4.1 | Firebase SDK ekle | `firebase-app`, `firebase-firestore` (CDN veya npm) |
| 4.2 | Config | `firebaseConfig` ile `initializeApp` |
| 4.3 | `handleDecide` değişikliği | `getAIDecision` yerine Firestore’a yaz |
| 4.4 | Doc oluştur | `addDoc(decisionsRef, { question, options, mode, status: "pending", ... })` |
| 4.5 | Listener | `onSnapshot(docRef, snapshot => ...)` – result geldiğinde `showResult()` |
| 4.6 | Loading state | "Düşünüyorum..." → listener sonucu geldiğinde güncelle |
| 4.7 | Cleanup | Listener’ı gerekirse unsubscribe et (navigasyon vb.) |

**Çıktı:** Karar ver → Firestore’a yaz → Dinle → Sonuç ekranda görünür

---

## Faz 5: Konfigürasyon ve Güvenlik

| # | Görev | Detay |
|---|-------|-------|
| 5.1 | Environment variables | `functions/.env` veya Firebase config – `OPENAI_API_KEY` |
| 5.2 | Firestore Rules prod | Auth zorunlu veya document ID ile scope’la |
| 5.3 | CORS / Domain kısıtı | Firebase otomatik halleder; deploy domain’i kontrol et |

---

## Faz 6: Test ve Yayın

| # | Görev | Detay |
|---|-------|-------|
| 6.1 | Deploy | `firebase deploy --only firestore,functions` |
| 6.2 | Canlı test | Soru gönder → Cloud Function tetiklenir → Ekranda cevap görünür |
| 6.3 | Gemini API | `firebase functions:secrets:set GEMINI_API_KEY` – Rastgele hariç tüm modlarda AI cevap verir |
| 6.4 | Eski simülasyon | CONFIG’te fallback: Firestore/AI yoksa mevcut simülasyon çalışsın |

---

## Dosya Değişiklikleri Özeti

| Dosya | Değişiklik |
|-------|------------|
| `index.html` | Firebase SDK script’leri, config |
| `app.js` | Firestore init, `handleDecide` → Firestore write + listener, fallback mantığı |
| Yeni: `firebase.json` | Firebase proje config |
| Yeni: `firestore.rules` | Güvenlik kuralları |
| Yeni: `functions/index.js` | onCreate Cloud Function |
| Yeni: `functions/package.json` | Dependencies |

---

## Tahmini Süre

| Faz | Süre |
|-----|------|
| Faz 1 | ~30 dk |
| Faz 2 | ~20 dk |
| Faz 3 | ~45 dk |
| Faz 4 | ~40 dk |
| Faz 5–6 | ~30 dk |
| **Toplam** | ~2.5 saat |

---

## Başlangıç Sırası

1. **Faz 1** – Firebase projesi ve CLI
2. **Faz 2** – Firestore şeması + rules
3. **Faz 3** – Cloud Function
4. **Faz 4** – Frontend
5. **Faz 5–6** – Config, test, deploy

İstersen bir sonraki adımda Faz 1’den kod seviyesinde detaya inebiliriz.
