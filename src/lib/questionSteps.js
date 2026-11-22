// Question steps and bilingual option lists for the farmer questionnaire.
// Option labels are stored bilingual. `k` overrides the answer key for
// options in a combined screen (gender + category on one screen).

export const TENURE = [
  { value: "own", te: "పట్టా/సొంత భూమి", en: "Own land in your name" },
  { value: "rofr", te: "RoFR", en: "ROFR (forest-rights land record)" },
  { value: "tenant", te: "కౌలు", en: "Leased (tenant)" },
  { value: "none", te: "భూమి లేదు", en: "No land" },
];

export const AREA = [
  { value: "lt_10c", te: "10 సెంట్ల కంటే తక్కువ", en: "Less than 10 cents" },
  { value: "10c_5a", te: "10 సెంట్లు – 5 ఎకరాలు", en: "10 cents – 5 acres" },
  { value: "5_10a", te: "5–10 ఎకరాలు", en: "5–10 acres" },
  { value: "gt_10a", te: "10 ఎకరాల కంటే ఎక్కువ (సొంత + కౌలు)", en: "More than 10 acres (own + leased)" },
];

export const EXCLUDED = [
  { value: "govt_job", te: "ప్రభుత్వ ఉద్యోగం", en: "Government job" },
  { value: "pension_10k", te: "₹10,000+ నెలవారీ పెన్షన్", en: "₹10,000+ monthly pension" },
  { value: "income_tax", te: "ఆదాయ పన్ను చెల్లిస్తారు", en: "Pays income tax" },
  { value: "professional", te: "ప్రాక్టీసింగ్ ప్రొఫెషనల్", en: "Practising professional" },
  {
    value: "none",
    te: "ఎవరూ లేరు — రైతు + భార్య/భర్త + మైనర్ పిల్లలు మాత్రమే",
    en: "No one — applicant + spouse + minor children only",
  },
];

export const GENDER = [
  { k: "gender", value: "woman", te: "మహిళ", en: "Woman" },
  { k: "gender", value: "man", te: "పురుషుడు", en: "Man" },
];

export const CATEGORY = [
  { k: "category", value: "sc", te: "SC", en: "SC" },
  { k: "category", value: "st", te: "ST", en: "ST" },
  { k: "category", value: "bc", te: "BC", en: "BC" },
  { k: "category", value: "minority", te: "మైనారిటీ", en: "Minority" },
  { k: "category", value: "oc", te: "OC (ఓసి)", en: "OC (General)" },
];

export const CCRC = [
  { value: true, te: "అవును", en: "Yes" },
  { value: false, te: "లేదు", en: "No" },
];

export const CROPS = [
  { value: "paddy", te: "వరి", en: "Paddy" },
  { value: "cotton", te: "పత్తి", en: "Cotton" },
  { value: "chilli", te: "మిర్చి", en: "Chilli" },
  { value: "groundnut", te: "వేరుశనగ", en: "Groundnut" },
  { value: "maize", te: "మొక్కజొన్న", en: "Maize" },
  { value: "redgram", te: "కంది", en: "Redgram" },
  { value: "horticulture", te: "ఉద్యాన పంటలు", en: "Horticulture" },
  { value: "vegetables", te: "కూరగాయలు", en: "Vegetables" },
  { value: "betelvine", te: "తమలపాకు", en: "Betelvine" },
  { value: "other", te: "ఇతర పంట", en: "Other" },
  { value: "nocrop", te: "ఈ సీజన్‌లో పంట లేదు", en: "No crop this season" },
];

export const WATER = [
  { value: "borewell_nogrid", te: "బోర్‌వెల్ — గ్రిడ్ విద్యుత్ లేదు", en: "Borewell — no grid power" },
  { value: "borewell_pump", te: "బోర్‌వెల్ + విద్యుత్ పంపు", en: "Borewell + electric pump" },
  { value: "canal", te: "కాలువ", en: "Canal" },
  { value: "rainfed", te: "వర్షాధారం", en: "Rainfed" },
  { value: "solar", te: "సోలార్ పంపు", en: "Solar pump" },
];

export const HELP = [
  { value: "loan", te: "రుణం", en: "Loan" },
  { value: "insurance", te: "పంటల బీమా", en: "Crop insurance" },
  { value: "soiltest", te: "మట్టి పరీక్ష", en: "Soil test" },
  { value: "solarpump", te: "సోలార్ పంపు", en: "Solar pump" },
  { value: "drip", te: "బిందు సేద్యం", en: "Drip irrigation" },
  { value: "machinery", te: "వ్యవసాయ యంత్రాలు", en: "Farm machinery" },
];

// Step order is fixed: tenure, [ccrc, tenants only], area, excluded, about (gender+category),
// crop, district, water, help (+ free text). A step with `when` is shown only
// when `when(answers)` is true.
export const STEPS = [
  { id: "tenure", key: "tenure", type: "single", options: TENURE,
    prompt: { te: "మీ భూమి విషయంలో ఏది నిజం?", en: "Which is true for your land?" } },
  { id: "ccrc", key: "has_ccrc", type: "bool", options: CCRC,
    when: (a) => a.tenure === "tenant",
    prompt: { te: "మీ దగ్గర CCRC కార్డు ఉందా?", en: "Do you have a CCRC card?" } },
  { id: "area", key: "area_band", type: "single", options: AREA,
    prompt: { te: "ఎంత భూమి సాగు చేస్తున్నారు?", en: "How much land do you cultivate?" } },
  { id: "excluded", key: "excluded", type: "multi", exclusive: "none", options: EXCLUDED,
    prompt: { te: "మీ ఇంట్లో ఎవరైనా ఉన్నారా?", en: "Does anyone in your household have any of these?" } },
  { id: "about", type: "about",
    prompt: { te: "మీరు?", en: "Which option describes you?" } },
  { id: "crop", key: "crop", type: "single", options: CROPS,
    prompt: { te: "ఈ సీజన్‌లో ప్రధాన పంట ఏది?", en: "Which is your main crop this season?" } },
  { id: "district", key: "district", type: "district",
    prompt: { te: "మీ జిల్లా ఏది?", en: "Which district?" } },
  { id: "water", key: "water", type: "single", options: WATER,
    prompt: { te: "నీరు + విద్యుత్తు పరిస్థితి ఏది?", en: "What is your water and power situation?" } },
  { id: "help", key: "help", type: "multi", options: HELP, textarea: true,
    prompt: { te: "ఏ సహాయం కావాలి?", en: "What help do you need?" } },
];

export function labelOf(opt, lang) {
  return lang === "en" ? opt.en : opt.te;
}
