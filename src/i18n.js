// UI strings. Every key has Telugu (te) and English (en).
export const STRINGS = {
  app_name: { te: "రైతు హక్కు", en: "Rythu Hakku" },
  start: { te: "ప్రారంభించండి", en: "Start" },
  continue: { te: "కొనసాగించండి", en: "Continue" },
  back: { te: "వెనక్కి", en: "Back" },
  admin: { te: "అడ్మిన్", en: "Admin" },
  footer_free: {
    te: "దరఖాస్తు ఉచితం — ఎవరికీ డబ్బు ఇవ్వవద్దు",
    en: "Applying is free — never pay anyone",
  },
  footer_forever: {
    te: "రైతులకు ఎప్పటికీ ఉచితం — NGOలు, CSR, బ్యాంకులు చెల్లిస్తాయి",
    en: "Farmer ki free, forever — NGOs, CSR, banks pay",
  },
  home_headline: {
    te: "మీ హక్కులు, మీ పథకాలు — ఒకే చోట",
    en: "Your rights, your schemes — in one place",
  },
  home_pick: {
    te: "ఒక రైతు ఉదాహరణ ఎంచుకోండి, లేదా ప్రారంభించండి",
    en: "Pick a farmer example, or start",
  },
  helper_toggle: {
    te: "Nenu farmer ki help chesthunna",
    en: "Nenu farmer ki help chesthunna",
  },
  helper_text: {
    te: "ఇది రైతుల కోసం ఉచిత సహాయం. లాగిన్ లేదు. ఆధార్ లేదా బ్యాంక్ నంబర్ అడగదు.",
    en: "Free help for farmers. No login. Never asks for Aadhaar or bank numbers.",
  },
  mic_label: { te: "Matladandi / Speak", en: "Matladandi / Speak" },
  mic_listening: { te: "వింటున్నాను...", en: "Listening..." },
  naa_placeholder: { te: "Naa gurinchi cheptha", en: "Naa gurinchi cheptha" },
  results_title: { te: "ఫలితాలు", en: "Results" },
  results_loading: { te: "లోడ్ అవుతోంది...", en: "Loading..." },
  results_error: { te: "పథకాల డేటా లోడ్ కాలేదు", en: "Could not load scheme data" },
  results_back: { te: "ప్రశ్నలకు తిరిగి వెళ్ళు", en: "Back to questions" },
  group_likely: { te: "అర్హత ఉండవచ్చు", en: "Likely eligible" },
  group_maybe: { te: "నిర్ధారణ అవసరం", en: "Needs checking" },
  group_not: { te: "ప్రస్తుతం అర్హత లేదు", en: "Not eligible now" },
  group_closed: { te: "ఇప్పుడు తెరిచి లేదు", en: "Closed now" },
  group_superseded: { te: "ఇకపై లేదు", en: "No longer active" },
  admin_title: { te: "అడ్మిన్", en: "Admin" },
  admin_soon: { te: "త్వరలో వస్తుంది", en: "Coming next" },
  step_of: { te: "ప్రశ్న", en: "Question" },
};

const LANG_KEY = "rh.lang";

export function getStoredLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === "en" || v === "te" ? v : "te";
  } catch {
    return "te";
  }
}

export function setStoredLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // storage unavailable; language still applies for this session
  }
}

export function t(key, lang) {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] || entry.en || entry.te || key;
}
