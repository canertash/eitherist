/**
 * Eitherist – Log toplama sunucusu örneği
 *
 * Kurulum: cd server-example && npm install && npm start
 * Port: 3333 (LOG_URL ile test için)
 *
 * Frontend'de index.html'den önce:
 * <script>window.EITHERIST_CONFIG = { LOG_URL: "http://localhost:3333/log" };</script>
 */

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3333;
const LOG_FILE = path.join(__dirname, "logs.json");

app.use(cors());
app.use(express.json());

// Kayıtları yükle veya boş dizi
function loadLogs() {
  try {
    const data = fs.readFileSync(LOG_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Kayıtları kaydet
function saveLogs(logs) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), "utf8");
}

// POST /log – Eitherist'ten gelen veriyi al ve dosyaya yaz
app.post("/log", (req, res) => {
  const { question, options, mode, result, ts } = req.body;
  if (!question && !options?.length && !result) {
    return res.status(400).json({ ok: false, error: "Geçersiz payload" });
  }
  const logs = loadLogs();
  logs.push({
    question: question || "",
    options: options || [],
    mode: mode || "",
    result: result || "",
    ts: ts || new Date().toISOString()
  });
  saveLogs(logs);
  res.json({ ok: true });
});

// GET /log – Tüm kayıtları listele (test için)
app.get("/log", (req, res) => {
  res.json(loadLogs());
});

app.listen(PORT, () => {
  console.log(`Eitherist log sunucusu: http://localhost:${PORT}`);
  console.log(`POST /log – veri gönder`);
  console.log(`GET  /log – kayıtları listele`);
});
