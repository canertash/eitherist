/**
 * Eitherist – Cloud Functions
 * decisions onCreate → AI cevabı üret → Firestore güncelle
 * Rastgele modu: simülasyon. Diğer modlar: Gemini AI.
 */
/* eslint-disable max-len, require-jsdoc, indent, operator-linebreak */

const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {defineSecret} = require("firebase-functions/params");
const {setGlobalOptions} = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

setGlobalOptions({maxInstances: 10});

const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Moda göre cevap şablonları (sadece rastgele modunda kullanılır)
const MODE_RESPONSES = {
  rastgele: ["**{choice}** seçeneğine gidelim.", "Bence **{choice}**.", "**{choice}** – rastgele seçtim."],
  akılcı: ["Mantıken **{choice}** daha uygun görünüyor.", "**{choice}** seçeneği daha mantıklı.", "**{choice}** – akılcı bir tercih."],
  eğlenceli: ["**{choice}** olsun, eğlenceli olur!", "Hadi **{choice}** diyelim – keyifli olsun.", "**{choice}** – bu eğlenceli!"],
  mantıklı: ["**{choice}** daha mantıklı duruyor.", "**{choice}** ile devam et.", "Mantıklı seçim: **{choice}**."],
  hızlı: ["**{choice}** – hızlı karar!", "**{choice}** olsun.", "**{choice}**."],
  düşünceli: ["Biraz düşündüm… **{choice}** diyorum.", "**{choice}** – bu seçenek üzerinde dur.", "**{choice}** daha düşünülmüş bir tercih."],
  yaratıcı: ["**{choice}** – yaratıcı bir seçim!", "**{choice}** ile farklı bir yol izle.", "**{choice}** – sıra dışı olsun."],
  spontan: ["**{choice}** – anlık karar!", "Hızlıca **{choice}** diyorum.", "**{choice}** olsun."],
};

const LIMITS = {question: 200, option: 100, mode: 50, result: 400};

const NO_OPTION_ANSWERS = [
  "Evet, bunu yapmanı öneriyorum.",
  "Hayır, şimdilik beklemek daha iyi olabilir.",
  "Küçük bir test ile başla, sonra karar ver.",
  "Sezgine güven.",
];

function getRandomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function callGemini(apiKey, question, options, mode) {
  if (!apiKey) return null;
  const hasOptions = Array.isArray(options) && options.length >= 2;
  const optionsStr = hasOptions ? options.join(", ") : "yok";
  const prompt = hasOptions
    ? `Sen bir karar verme asistanısın. Kullanıcı şu kararı vermek istiyor: "${question}". Seçenekler: ${optionsStr}. Mod: ${mode}. Bu moda uygun, kısa (1-2 cümle), samimi bir Türkçe cevap ver. Mutlaka seçtiğin seçeneği **kalın** (çift yıldız) ile belirt. Cevabın mutlaka 400 karakteri geçmesin.`
    : `Sen bir karar verme asistanısın. Kullanıcı şu kararı vermek istiyor: "${question}". Mod: ${mode}. Seçenek yok. Evet/hayır veya kısa tavsiye ver (Türkçe, 1-2 cümle). Cevabın mutlaka 400 karakteri geçmesin.`;

  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = {
        contents: [{parts: [{text: prompt}]}],
        generationConfig: {maxOutputTokens: 200, temperature: 0.7},
        safetySettings: [
          {category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE"},
          {category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE"},
          {category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE"},
          {category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE"},
        ],
      };
      const res = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        const errMsg = (data.error && data.error.message) || JSON.stringify(data);
        logger.warn("Gemini API hata", {model, status: res.status, error: errMsg});
        continue;
      }

      const cand = data.candidates && data.candidates[0];
      if (!cand) {
        const fb = data.promptFeedback;
        logger.warn("Gemini boş candidates", {model, promptFeedback: fb});
        continue;
      }

      const blockReason = cand.finishReason;
      if (blockReason && blockReason !== "STOP" && blockReason !== "MAX_TOKENS") {
        logger.warn("Gemini block", {model, finishReason: blockReason});
        continue;
      }

      const part = cand.content && cand.content.parts && cand.content.parts[0];
      let text = part && part.text ? part.text.trim() : null;
      if (text) {
        if (text.length > LIMITS.result) text = text.slice(0, LIMITS.result).trim();
        logger.info("Gemini başarılı", {model});
        return text;
      }
    } catch (err) {
      logger.warn("Gemini model denemesi başarısız", {model, error: err.message});
    }
  }
  return null;
}

function generateDecision(question, options, mode) {
  const templates = MODE_RESPONSES[mode] || MODE_RESPONSES.rastgele;
  const hasOptions = Array.isArray(options) && options.length >= 2;

  if (hasOptions) {
    const chosen = getRandomChoice(options);
    const template = getRandomChoice(templates);
    return template.replace("{choice}", chosen);
  }

  const answer = getRandomChoice(NO_OPTION_ANSWERS);
  return `${answer} (${mode})`;
}

exports.onDecisionCreated = onDocumentCreated(
  {document: "decisions/{docId}", secrets: [geminiApiKey]},
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const docId = event.params.docId;
    const data = snap.data();
    const {question, options, mode, status} = data || {};
    const modeVal = mode || "rastgele";

    if (status !== "pending") return;

    const db = admin.firestore();
    const docRef = db.collection("decisions").doc(docId);
    const now = admin.firestore.FieldValue.serverTimestamp();

    const q = String(question || "").trim();
    const opts = Array.isArray(options) ? options.map((o) => String(o).trim()).filter(Boolean) : [];
    const m = String(modeVal).trim();

    if (opts.length < 2) {
      await docRef.update({
        status: "error",
        errorMessage: "En az 2 seçenek eklenmeli.",
        updatedAt: now,
      });
      return;
    }
    if (q.length > LIMITS.question) {
      await docRef.update({
        status: "error",
        errorMessage: `Soru en fazla ${LIMITS.question} karakter olabilir.`,
        updatedAt: now,
      });
      return;
    }
    const longOpt = opts.find((o) => o.length > LIMITS.option);
    if (longOpt) {
      await docRef.update({
        status: "error",
        errorMessage: `Her seçenek en fazla ${LIMITS.option} karakter olabilir.`,
        updatedAt: now,
      });
      return;
    }
    if (m.length > LIMITS.mode) {
      await docRef.update({
        status: "error",
        errorMessage: `Mod adı en fazla ${LIMITS.mode} karakter olabilir.`,
        updatedAt: now,
      });
      return;
    }

    try {
      let result = null;

      if (modeVal === "rastgele") {
        result = generateDecision(q, opts, modeVal);
      } else {
        const apiKey = geminiApiKey.value();
        try {
          result = await callGemini(apiKey, q, opts, modeVal);
        } catch (err) {
          logger.warn("Gemini hatası, simülasyona geçildi", err);
        }
        if (!result) {
          result = generateDecision(q, opts, modeVal);
        }
      }
      if (result && result.length > LIMITS.result) {
        result = result.slice(0, LIMITS.result).trim();
      }

      await docRef.update({
        result,
        status: "done",
        updatedAt: now,
      });
      logger.info("Decision completed", {docId, mode: modeVal});
    } catch (err) {
      logger.error("Decision failed", {docId, error: err.message});
      await docRef.update({
        status: "error",
        errorMessage: err.message || "Bilinmeyen hata",
        updatedAt: now,
      });
    }
  },
);
