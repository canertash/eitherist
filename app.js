/**
 * Eitherist – Karar Verme Asistanı
 * Tüm cihazlarda çalışan, açık/koyu/loş modlu web uygulaması
 */

// ========================================
// Firebase
// ========================================
// firebase-config.js dosyasında window.EITHERIST_FIREBASE_CONFIG tanımlayın.
// Örnek: firebase-config.example.js dosyasını firebase-config.js olarak kopyalayıp doldurun.
const firebaseConfig = window.EITHERIST_FIREBASE_CONFIG || {};
const hasValidConfig = firebaseConfig.apiKey && firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes("YOUR_");

let firebaseApp, firestoreDb, firebaseAnalytics;

if (typeof firebase !== "undefined" && hasValidConfig) {
  firebaseApp = firebase.initializeApp(firebaseConfig);
  firestoreDb = firebase.firestore();
  firebaseAnalytics = firebase.analytics();
}

// ========================================
// Limits
// ========================================
const LIMITS = {
  question: 200,
  option: 100,
  mode: 50
};

// ========================================
// Config
// ========================================
// window.EITHERIST_CONFIG ile yapılandırma:
//   API_URL   – Karar verme API endpoint (opsiyonel)
//   API_KEY   – API kimlik doğrulama (opsiyonel)
//   LOG_URL   – Yazılanları toplamak için log endpoint (opsiyonel)
//   LOG_KEY   – Log endpoint kimlik doğrulama (opsiyonel)
// Örn: window.EITHERIST_CONFIG = { LOG_URL: "https://api.example.com/log", LOG_KEY: "..." }
const CONFIG = window.EITHERIST_CONFIG || {};

// ========================================
// State
// ========================================

const state = {
  selectedMode: "rastgele",
  customMode: ""
};

// ========================================
// DOM Elements
// ========================================

const searchInput = document.getElementById("searchInput");
const searchWrapper = document.getElementById("searchWrapper");
const searchError = document.getElementById("searchError");
const clearSearch = document.getElementById("clearSearch");
const optionsFooter = document.getElementById("optionsFooter");
const optionsError = document.getElementById("optionsError");
const optionsContainer = document.getElementById("optionsContainer");
const addOptionBtn = document.getElementById("addOptionBtn");
const modeDropdownBtn = document.getElementById("modeDropdownBtn");
const modeDropdownIcon = document.getElementById("modeDropdownIcon");
const modeDropdownLabel = document.getElementById("modeDropdownLabel");
const modeChipsDropdown = document.getElementById("modeChipsDropdown");
const modeChips = document.querySelectorAll(".mode-chip");
const customModeInput = document.querySelector(".custom-mode-input");
const decideBtn = document.getElementById("decideBtn");
const actionButtons = document.querySelector(".action-buttons");
const optionsActions = document.getElementById("optionsActions");
const optionsAddSlot = document.getElementById("optionsAddSlot");
const resultArea = document.getElementById("resultArea");
const resultContent = document.getElementById("resultContent");

const MODE_LABELS = {
  rastgele: "Rastgele",
  akılcı: "Akılcı",
  eğlenceli: "Eğlenceli",
  mantıklı: "Mantıklı",
  hızlı: "Hızlı",
  düşünceli: "Düşünceli",
  yaratıcı: "Yaratıcı",
  spontan: "Spontan",
  custom: "Özel"
};

const MODE_ICONS = {
  rastgele: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  akılcı: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>',
  eğlenceli: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
  mantıklı: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18"/><path d="M8 8l4-4 4 4M8 16l4 4 4-4"/></svg>',
  hızlı: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  düşünceli: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  yaratıcı: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/></svg>',
  spontan: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
  custom: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
};

function getModeDisplayName() {
  if (state.selectedMode === "custom" && state.customMode) {
    return state.customMode;
  }
  return MODE_LABELS[state.selectedMode] || state.selectedMode;
}

function updateModeDropdownLabel() {
  if (modeDropdownLabel) modeDropdownLabel.textContent = getModeDisplayName();
}

function updateModeDropdownIcon() {
  const mode = state.selectedMode;
  const iconSvg = MODE_ICONS[mode] || MODE_ICONS.rastgele;
  if (modeDropdownIcon) modeDropdownIcon.innerHTML = iconSvg;
}

function initModeIcons() {
  document.querySelectorAll(".mode-chip-icon[data-icon]").forEach((el) => {
    const iconKey = el.dataset.icon;
    el.innerHTML = MODE_ICONS[iconKey] || "";
  });
  updateModeDropdownIcon();
}

function toggleModeDropdown() {
  const isOpen = modeChipsDropdown?.classList.toggle("open");
  modeDropdownBtn?.setAttribute("aria-expanded", isOpen);
}

function closeModeDropdown() {
  modeChipsDropdown?.classList.remove("open");
  modeDropdownBtn?.setAttribute("aria-expanded", "false");
}

function selectMode(mode, closeDropdown = true) {
  state.selectedMode = mode;
  state.customMode = mode === "custom" ? (customModeInput?.value?.trim() || "") : "";

  modeChips?.forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.mode === mode);
  });

  updateModeDropdownLabel();
  updateModeDropdownIcon();
  if (closeDropdown) closeModeDropdown();
}

function addOptionBars(count = 1) {
  const barCountBefore = optionsContainer?.querySelectorAll(".option-bar").length || 0;
  for (let i = 0; i < count; i++) {
    const bar = document.createElement("div");
    bar.className = "option-bar";
    bar.innerHTML = `
      <span class="option-bar-icon">1</span>
      <input type="text" class="option-bar-input" placeholder="Seçenek" data-option-index="" maxlength="${LIMITS.option}">
      <button type="button" class="option-bar-remove" aria-label="Seçeneği kaldır">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </button>
    `;
    if (barCountBefore === 0 && i === 1) {
      bar.style.animationDelay = "0.2s";
    }
    const input = bar.querySelector(".option-bar-input");
    const removeBtn = bar.querySelector(".option-bar-remove");

    input.addEventListener("input", () => {
      optionsFooter?.classList.remove("error");
      optionsError?.replaceChildren();
    });

    removeBtn.addEventListener("click", () => {
      bar.remove();
      updateOptionNumbers();
      ensureAddBar();
      updateOptionsLayout();
    });

    optionsContainer.appendChild(bar);
  }
  updateOptionNumbers();
  ensureAddBar();
  updateOptionsLayout();
  const bars = optionsContainer?.querySelectorAll(".option-bar");
  const lastInput = bars?.length ? bars[bars.length - 1]?.querySelector(".option-bar-input") : null;
  lastInput?.focus();
}

function updateOptionsLayout() {
  const barCount = optionsContainer?.querySelectorAll(".option-bar").length || 0;

  if (barCount > 0) {
    actionButtons?.classList.add("hidden");
    if (!document.getElementById("decideBtnBelow")) {
      const decideClone = decideBtn?.cloneNode(true);
      if (decideClone && optionsActions) {
        decideClone.id = "decideBtnBelow";
        decideClone.classList.remove("hidden");
        decideClone.addEventListener("click", handleDecide);
        optionsActions.appendChild(decideClone);
      }
    }
  } else {
    actionButtons?.classList.remove("hidden");
    document.getElementById("decideBtnBelow")?.remove();
  }
}

function getDecideBtn() {
  return document.getElementById("decideBtnBelow") || document.getElementById("decideBtn");
}

function ensureAddBar() {
  const addBar = optionsAddSlot?.querySelector(".option-bar-add");
  const barCount = optionsContainer?.querySelectorAll(".option-bar").length || 0;

  if (barCount > 0 && !addBar) {
    const newAddBar = document.createElement("button");
    newAddBar.type = "button";
    newAddBar.className = "option-bar-add";
    newAddBar.innerHTML = `
      <span class="option-bar-add-icon">+</span>
      <span class="option-bar-add-text">Seçenek ekle</span>
    `;
    newAddBar.addEventListener("click", () => addOptionBars(1));
    optionsAddSlot?.appendChild(newAddBar);
  } else if (barCount === 0 && addBar) {
    addBar.remove();
  }
}

function updateOptionNumbers() {
  const bars = optionsContainer?.querySelectorAll(".option-bar");
  bars?.forEach((bar, i) => {
    const icon = bar.querySelector(".option-bar-icon");
    const input = bar.querySelector(".option-bar-input");
    if (icon) icon.textContent = String(i + 1);
    if (input) {
      input.placeholder = `Seçenek ${i + 1}`;
      input.dataset.optionIndex = String(i);
    }
  });
}


// ========================================
// Input Handlers
// ========================================

function getOptions() {
  const inputs = optionsContainer?.querySelectorAll(".option-bar .option-bar-input");
  if (!inputs) return [];
  return Array.from(inputs)
    .map((el) => el.value.trim())
    .filter(Boolean);
}

function clearErrors() {
  searchWrapper?.classList.remove("error");
  searchError?.replaceChildren();
  optionsFooter?.classList.remove("error");
  optionsError?.replaceChildren();
  if (searchInput?.dataset.placeholderDefault) {
    searchInput.placeholder = searchInput.dataset.placeholderDefault;
  }
}

function showSearchError(message) {
  clearErrors();
  resultContent?.classList.remove("visible");
  if (searchError) searchError.textContent = message;
  searchWrapper?.classList.add("error");
  searchInput?.focus();
}

function showOptionsError(message) {
  clearErrors();
  resultContent?.classList.remove("visible");
  if (optionsError) optionsError.textContent = message;
  optionsFooter?.classList.add("error");
}

function validateInputs() {
  const question = searchInput.value.trim();
  const options = getOptions();
  const modeText = state.selectedMode === "custom" ? (state.customMode || customModeInput?.value?.trim() || "") : "";

  clearErrors();

  if (!question) {
    showSearchError("Lütfen karar vermek istediğin konuyu yaz.");
    return false;
  }

  if (question.length > LIMITS.question) {
    showSearchError(`Soru en fazla ${LIMITS.question} karakter olabilir. (${question.length}/${LIMITS.question})`);
    return false;
  }

  if (state.selectedMode === "custom" && modeText.length > LIMITS.mode) {
    showSearchError(`Mod adı en fazla ${LIMITS.mode} karakter olabilir.`);
    return false;
  }

  if (options.length < 2) {
    showSearchError("En az 2 seçenek ekle.");
    return false;
  }

  const longOption = options.find((o) => o.length > LIMITS.option);
  if (longOption) {
    showOptionsError(`Her seçenek en fazla ${LIMITS.option} karakter olabilir.`);
    return false;
  }

  return true;
}

// ========================================
// Decision Logic
// ========================================

function getRandomChoice(options) {
  return options[Math.floor(Math.random() * options.length)];
}

// Moda göre cevap şablonları
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

// Seçenek yokken genel cevaplar
const NO_OPTION_ANSWERS = [
  "Evet, bunu yapmanı öneriyorum.",
  "Hayır, şimdilik beklemek daha iyi olabilir.",
  "Küçük bir test ile başla, sonra karar ver.",
  "Sezgine güven.",
];

/**
 * Yazılanları sunucuya gönderir (CONFIG.LOG_URL tanımlıysa)
 * Fire-and-forget: kararı bloke etmez, hata sessizce yutulur
 */
function logToServer(payload) {
  if (!CONFIG.LOG_URL) return;
  const headers = { "Content-Type": "application/json" };
  if (CONFIG.LOG_KEY) headers["Authorization"] = `Bearer ${CONFIG.LOG_KEY}`;
  fetch(CONFIG.LOG_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    keepalive: true
  }).catch(() => {});
}

/**
 * Gerçek AI API'ye istek atar (CONFIG tanımlıysa)
 */
async function callDecideAPI(question, options, mode) {
  if (!CONFIG.API_URL) return null;
  const headers = { "Content-Type": "application/json" };
  if (CONFIG.API_KEY) headers["Authorization"] = `Bearer ${CONFIG.API_KEY}`;
  const res = await fetch(CONFIG.API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ question, options, mode: state.customMode || mode })
  });
  if (!res.ok) throw new Error("API hatası");
  const data = await res.json();
  return data.answer || data.text || data.result || String(data);
}

/**
 * Karar üretir: API varsa API kullanır, yoksa moda göre simülasyon
 */
async function getAIDecision(question, options, mode) {
  if (CONFIG.API_URL) {
    try {
      const answer = await callDecideAPI(question, options, mode);
      if (answer) return answer;
    } catch (err) {
      console.warn("API hatası, simülasyon kullanılıyor:", err);
    }
  }

  // Simülasyon: kısa gecikme
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

  const modeText = state.customMode || mode;
  const templates = MODE_RESPONSES[mode] || MODE_RESPONSES.rastgele;
  const hasOptions = options.length >= 2;

  if (hasOptions) {
    const chosen = getRandomChoice(options);
    const template = getRandomChoice(templates);
    return template.replace("{choice}", chosen);
  }

  const answer = getRandomChoice(NO_OPTION_ANSWERS);
  return `${answer} (${modeText})`;
}

function showResult(text, isSuccess = true) {
  if (!resultContent) return;
  resultContent.innerHTML = text.replace(/\*\*(.+?)\*\*/g, '<span class="highlight">$1</span>');
  resultContent.classList.add("visible");
  resultArea?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ========================================
// Decide Button
// ========================================

function resetDecideButton() {
  const btn = getDecideBtn();
  if (btn) {
    btn.disabled = false;
    btn.classList.remove("loading");
    const btnText = btn.querySelector(".decide-btn-text");
    if (btnText) btnText.textContent = "Karar Ver";
  }
}

async function handleDecide() {
  if (!validateInputs()) return;

  const question = searchInput.value.trim();
  const options = getOptions();
  const mode = state.selectedMode;
  const modeText = state.selectedMode === "custom" ? state.customMode : mode;

  const btn = getDecideBtn();
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add("loading");
  const btnText = btn.querySelector(".decide-btn-text");
  if (btnText) btnText.textContent = "Düşünüyorum...";

  // Firestore varsa: yaz → dinle → sonuç gelince göster
  if (firestoreDb) {
    try {
      const docRef = await firestoreDb.collection("decisions").add({
        question,
        options,
        mode: modeText || mode,
        status: "pending",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      const unsub = docRef.onSnapshot((snap) => {
        const d = snap.data();
        if (!d || d.status === "pending") return;
        unsub();
        if (d.status === "done" && d.result) {
          showResult(d.result);
          logToServer({ question, options, mode: modeText, result: d.result, ts: new Date().toISOString() });
        } else if (d.status === "error" && d.errorMessage) {
          showResult("Bir hata oluştu: " + d.errorMessage, false);
        }
        resetDecideButton();
      });
    } catch (err) {
      console.warn("Firestore hatası, simülasyona geçildi:", err);
      const answer = await getAIDecision(question, options, mode);
      showResult(answer);
      logToServer({ question, options, mode: modeText, result: answer, ts: new Date().toISOString() });
      resetDecideButton();
    }
    return;
  }

  // Firestore yoksa: mevcut simülasyon/API
  try {
    const answer = await getAIDecision(question, options, mode);
    showResult(answer);
    logToServer({ question, options, mode: modeText, result: answer, ts: new Date().toISOString() });
  } finally {
    resetDecideButton();
  }
}

// ========================================
// Search Clear
// ========================================

function updateClearButton() {
  if (clearSearch && searchInput) clearSearch.style.display = searchInput.value ? "block" : "none";
}

// ========================================
// Event Listeners
// ========================================

searchInput?.addEventListener("input", () => {
  updateClearButton();
  searchWrapper?.classList.remove("error");
  searchError?.replaceChildren();
});
searchInput?.addEventListener("focus", () => {
  searchWrapper?.classList.remove("error");
  searchError?.replaceChildren();
});
searchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleDecide();
});

clearSearch?.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.focus();
  updateClearButton();
});

addOptionBtn?.addEventListener("click", () => {
  addOptionBars(1);
  optionsFooter?.classList.remove("error");
  optionsError?.replaceChildren();
});

modeDropdownBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleModeDropdown();
});

document.addEventListener("click", (e) => {
  if (modeChipsDropdown?.classList.contains("open") && !modeChipsDropdown.contains(e.target) && !modeDropdownBtn?.contains(e.target)) {
    closeModeDropdown();
  }
});

modeChipsDropdown?.addEventListener("click", (e) => {
  e.stopPropagation();
});

modeChips?.forEach((chip) => {
  chip.addEventListener("click", (e) => {
    if (chip.classList.contains("disabled")) return;
    if (chip.dataset.mode === "custom") {
      e.stopPropagation();
      chip.classList.add("active");
      state.selectedMode = "custom";
      modeChips.forEach((c) => {
        if (c !== chip) c.classList.remove("active");
      });
      customModeInput?.focus();
    } else {
      selectMode(chip.dataset.mode);
    }
  });
});

customModeInput?.addEventListener("input", () => {
  state.customMode = customModeInput.value.trim();
  updateModeDropdownLabel();
});
customModeInput?.addEventListener("focus", () => {
  selectMode("custom", false);
});
customModeInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    state.customMode = customModeInput.value.trim();
    updateModeDropdownLabel();
    closeModeDropdown();
  }
});

decideBtn?.addEventListener("click", handleDecide);

// ========================================
// Init
// ========================================

function init() {
  try {
    initModeIcons();
    updateClearButton();
  } catch (err) {
    console.error("Eitherist init error:", err);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
