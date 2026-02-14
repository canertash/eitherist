# Eitherist Log Sunucusu Örneği

Bu klasör, Eitherist uygulamasından gelen soru, seçenek ve karar verilerini toplamak için basit bir Node.js sunucusu örneğidir.

## Kurulum

```bash
cd server-example
npm install
npm start
```

Sunucu `http://localhost:3333` adresinde çalışır.

## Frontend bağlantısı

`index.html` içinde, `app.js`'den **önce** config ekleyin:

```html
<script>
  window.EITHERIST_CONFIG = {
    LOG_URL: "http://localhost:3333/log",
    LOG_KEY: "opsiyonel-api-anahtar"
  };
</script>
<script src="app.js"></script>
```

Canlı ortamda `https://api.erktas.net/eitherist/log` gibi gerçek URL kullanın.

## API

| Metod | Endpoint | Açıklama |
|-------|----------|----------|
| POST | `/log` | Eitherist verisini alır ve `logs.json` dosyasına yazar |
| GET | `/log` | Tüm kayıtları JSON olarak döner |

### POST /log gönderilen payload

```json
{
  "question": "Bugün ne yemek yesem?",
  "options": ["Pizza", "Makarna", "Salata"],
  "mode": "rastgele",
  "result": "**Pizza** seçeneğine gidelim.",
  "ts": "2026-02-13T12:00:00.000Z"
}
```

## Veritabanı kullanımı

`logs.json` yerine MongoDB, PostgreSQL vb. kullanmak için `server.js` içindeki `loadLogs`/`saveLogs` fonksiyonlarını ilgili veritabanı çağrılarıyla değiştirin.

## CORS

Geliştirme için CORS tüm origin’lere açıktır. Canlı ortamda `cors({ origin: "https://erktas.net" })` gibi kısıtlamalar ekleyin.
