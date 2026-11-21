import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "../i18n.js";

// Option labels are stored bilingual. `k` overrides the answer key for
// options in a combined screen (gender + category on one screen).
const TENURE = [
  { value: "own", te: "పట్టా/సొంత భూమి", en: "Own land (pattadar)" },
  { value: "rofr", te: "RoFR", en: "RoFR" },
  { value: "tenant", te: "కౌలు", en: "Leased (tenant)" },
  { value: "none", te: "భూమి లేదు", en: "No land" },
];

const AREA = [
  { value: "lt_10c", te: "10 సెంట్ల కంటే తక్కువ", en: "Less than 10 cents" },
  { value: "10c_5a", te: "10 సెంట్లు – 5 ఎకరాలు", en: "10 cents – 5 acres" },
  { value: "5_10a", te: "5–10 ఎకరాలు", en: "5–10 acres" },
  { value: "gt_10a", te: "10 ఎకరాల కంటే ఎక్కువ (సొంత + కౌలు)", en: "More than 10 acres (own + leased)" },
];

const EXCLUDED = [
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

const GENDER = [
  { k: "gender", value: "woman", te: "మహిళ", en: "Woman" },
  { k: "gender", value: "man", te: "పురుషుడు", en: "Man" },
];

const CATEGORY = [
  { k: "category", value: "sc", te: "SC", en: "SC" },
  { k: "category", value: "st", te: "ST", en: "ST" },
  { k: "category", value: "bc", te: "BC", en: "BC" },
  { k: "category", value: "minority", te: "మైనారిటీ", en: "Minority" },
  { k: "category", value: "oc", te: "OC (ఓసి)", en: "OC (General)" },
];

const CCRC = [
  { value: true, te: "అవును", en: "Yes" },
  { value: false, te: "లేదు", en: "No" },
];

const CROPS = [
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

const WATER = [
  { value: "borewell_nogrid", te: "బోర్‌వెల్ — గ్రిడ్ విద్యుత్ లేదు", en: "Borewell — no grid power" },
  { value: "borewell_pump", te: "బోర్‌వెల్ + విద్యుత్ పంపు", en: "Borewell + electric pump" },
  { value: "canal", te: "కాలువ", en: "Canal" },
  { value: "rainfed", te: "వర్షాధారం", en: "Rainfed" },
  { value: "solar", te: "సోలార్ పంపు", en: "Solar pump" },
];

const HELP = [
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
const STEPS = [
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
    prompt: { te: "మీరు?", en: "You are?" } },
  { id: "crop", key: "crop", type: "single", options: CROPS,
    prompt: { te: "ఈ సీజన్‌లో ప్రధాన పంట ఏది?", en: "Which is your main crop this season?" } },
  { id: "district", key: "district", type: "district",
    prompt: { te: "మీ జిల్లా ఏది?", en: "Which district?" } },
  { id: "water", key: "water", type: "single", options: WATER,
    prompt: { te: "నీరు + విద్యుత్తు పరిస్థితి ఏది?", en: "What is your water and power situation?" } },
  { id: "help", key: "help", type: "multi", options: HELP, textarea: true,
    prompt: { te: "ఏ సహాయం కావాలి?", en: "What help do you need?" } },
];

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

function labelOf(opt, lang) {
  return lang === "en" ? opt.en : opt.te;
}

export default function Questions({ lang, answers, setAnswers, onBack, onDone }) {
  const [index, setIndex] = useState(0);
  const [districts, setDistricts] = useState([]);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  useEffect(() => {
    let cancelled = false;
    fetch("/schemes.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json) => {
        if (cancelled) return;
        const te = json.district_te || {};
        const list = Object.keys(json.district_region || {}).map((name) => ({
          value: name,
          te: te[name] || name,
          en: name,
        }));
        setDistricts(list);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => recRef.current?.abort?.(), []);

  const visibleSteps = STEPS.filter((s) => !s.when || s.when(answers));
  const step = visibleSteps[index];
  const total = visibleSteps.length;

  const optionsFor = (s) => {
    if (s.type === "district") return districts;
    if (s.type === "about") return [...GENDER, ...CATEGORY];
    return s.options;
  };

  const isAnswered = (s) => {
    switch (s.type) {
      case "about":
        return Boolean(answers.gender && answers.category);
      case "multi":
        return (answers[s.key] || []).length > 0;
      case "bool":
        return typeof answers[s.key] === "boolean";
      default:
        return Boolean(answers[s.key]);
    }
  };

  const patch = (p) => setAnswers((prev) => ({ ...prev, ...p }));

  const pickSingle = (key, value) => patch({ [key]: value });

  const toggleMulti = (s, value) => {
    setAnswers((prev) => {
      const current = prev[s.key] || [];
      let next;
      if (s.exclusive && value === s.exclusive) {
        next = current.includes(value) ? [] : [value];
      } else {
        const base = current.filter((v) => v !== s.exclusive);
        next = base.includes(value) ? base.filter((v) => v !== value) : [...base, value];
      }
      return { ...prev, [s.key]: next };
    });
  };

  const choose = (s, opt) => {
    if (s.type === "multi") toggleMulti(s, opt.value);
    else pickSingle(opt.k || s.key, opt.value);
  };

  const isSelected = (s, opt) => {
    if (s.type === "multi") return (answers[s.key] || []).includes(opt.value);
    return answers[opt.k || s.key] === opt.value;
  };

  const handleVoice = (text) => {
    const q = norm(text);
    if (!q) return;
    const s = step;
    const opts = optionsFor(s);
    const hit = opts.find((o) => {
      const en = norm(o.en);
      const te = norm(o.te);
      return q === en || q === te || (en.length > 2 && (q.includes(en) || en.includes(q)));
    });
    if (hit) {
      choose(s, hit);
      return;
    }
    if (s.textarea) patch({ notes: text });
  };

  const startVoice = () => {
    if (!SR) return;
    const rec = new SR();
    rec.lang = "te-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => handleVoice(e.results?.[0]?.[0]?.transcript ?? "");
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const goNext = () => {
    if (index >= total - 1) onDone();
    else setIndex((i) => i + 1);
  };

  const goBack = () => {
    if (index === 0) onBack();
    else setIndex((i) => i - 1);
  };

  const optionButton = (s, opt, keyPrefix = "") => {
    const selected = isSelected(s, opt);
    return (
      <button
        key={keyPrefix + (opt.k || "") + opt.value}
        type="button"
        aria-pressed={selected}
        onClick={() => choose(s, opt)}
        className={`min-h-[72px] w-full px-4 py-3 rounded-[16px] border text-left text-[18px] font-semibold leading-6 ${
          selected
            ? "border-primary bg-primary-container text-ink"
            : "border-outline bg-surface text-ink"
        }`}
      >
        {labelOf(opt, lang)}
      </button>
    );
  };

  const renderBody = () => {
    if (step.type === "district") {
      return (
        <select
          aria-label={promptText}
          value={answers.district || ""}
          onChange={(e) => pickSingle("district", e.target.value)}
          className="w-full min-h-[56px] px-4 rounded-[16px] border border-outline bg-surface text-[18px] font-semibold text-ink"
        >
          <option value="" disabled>
            {lang === "en" ? "Choose district" : "జిల్లా ఎంచుకోండి"}
          </option>
          {districts.map((d) => (
            <option key={d.value} value={d.value}>
              {d.te}
            </option>
          ))}
        </select>
      );
    }

    if (step.type === "about") {
      return (
        <div className="space-y-5">
          <div className="space-y-3">
            {GENDER.map((o) => optionButton(step, o))}
          </div>
          <div className="space-y-3">
            {CATEGORY.map((o) => optionButton(step, o))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {step.options.map((o) => optionButton(step, o))}
        {step.textarea && (
          <textarea
            aria-label={promptText}
            value={answers.notes || ""}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder={t("naa_placeholder", lang)}
            rows={3}
            className="w-full px-4 py-3 rounded-[16px] border border-outline bg-surface text-[17px] text-ink"
          />
        )}
      </div>
    );
  };

  const canContinue = isAnswered(step);
  const promptText = labelOf(step.prompt, lang);

  return (
    <div className="max-w-[390px] mx-auto px-4 py-6 pb-40 space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted">
          <span>{t("step_of", lang)} {index + 1}/{total}</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          className="h-2 w-full rounded-full bg-outline overflow-hidden"
        >
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="text-[20px] leading-7 font-semibold text-ink">{promptText}</h2>

      {renderBody()}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={goBack}
          className="min-h-[48px] px-2 text-muted underline"
        >
          {t("back", lang)}
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!canContinue}
          className="min-h-[48px] px-6 rounded-full bg-primary text-white font-semibold text-[17px] disabled:bg-outline disabled:text-muted"
        >
          {t("continue", lang)}
        </button>
      </div>

      {SR && (
        <div className="fixed bottom-4 right-4 flex flex-col items-center gap-1 z-10">
          <button
            type="button"
            onClick={startVoice}
            aria-label={t("mic_label", lang)}
            className="w-16 h-16 rounded-full bg-primary text-white text-[22px] shadow-md flex items-center justify-center"
          >
            {listening ? "…" : "🎤"}
          </button>
          <span className="text-xs text-muted bg-surface rounded px-2 py-0.5 shadow-sm">
            {listening ? t("mic_listening", lang) : t("mic_label", lang)}
          </span>
        </div>
      )}
    </div>
  );
}
