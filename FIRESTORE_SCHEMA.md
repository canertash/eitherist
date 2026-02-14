# Firestore Tablo Yapısı – Eitherist

## Koleksiyon: `decisions`

Karar istekleri ve AI cevapları.

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `question` | string | ✓ | Kullanıcının sorduğu soru |
| `options` | array\<string\> | ✓ | Seçenek listesi (boş array olabilir) |
| `mode` | string | ✓ | Mod adı: rastgele, akılcı, eğlenceli, mantıklı, hızlı, düşünceli, yaratıcı, spontan veya özel mod metni |
| `status` | string | ✓ | `pending` \| `done` \| `error` |
| `result` | string \| null | - | AI cevabı; status=done iken dolu |
| `errorMessage` | string \| null | - | Hata detayı; status=error iken dolu |
| `createdAt` | timestamp | ✓ | Oluşturulma zamanı |
| `updatedAt` | timestamp | - | Son güncelleme (Function tarafından) |

### Belge ID
- Otomatik: `docRef.id` (Firestore `addDoc` ile)
- İstemci bu ID ile `onSnapshot` dinler

### Akış
1. **Frontend** → `addDoc` ile oluşturur: `{ question, options, mode, status: "pending", createdAt }`
2. **Cloud Function** (onCreate) → AI çağırır → `update` ile yazar: `{ result, status: "done", updatedAt }` veya hata için `{ errorMessage, status: "error", updatedAt }`
3. **Frontend** → `onSnapshot` ile değişikliği alır → `showResult(result)`

---

## Örnek Belge

```json
{
  "question": "Bugün ne yemek yesem?",
  "options": ["Pizza", "Makarna", "Salata"],
  "mode": "rastgele",
  "status": "done",
  "result": "**Pizza** seçeneğine gidelim.",
  "errorMessage": null,
  "createdAt": "2026-02-14T00:00:00.000Z",
  "updatedAt": "2026-02-14T00:00:05.000Z"
}
```

---

## İndeksler

`firestore.indexes.json` içinde tanımlı. Şu an tek doküman okuma (docId) için ek indeks gerekmez. Gelecekte admin paneli için:

- `createdAt` DESC – son kararları listeleme
- `status` + `createdAt` – filtreleme
