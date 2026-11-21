import { useState } from "react";
import { t } from "../i18n.js";

// Answers use the keys read by src/lib/match.js: tenure, area_band, excluded,
// crop, has_ccrc, plus district, water, gender, category, help.
const PERSONAS = [
  {
    id: "ramesh",
    name: { te: "రమేష్", en: "Ramesh" },
    age: 45,
    place: { te: "చిత్తూరు", en: "Chittoor" },
    desc: {
      te: "2 ఎకరాలు సొంత భూమి · వేరుశనగ + టమాటా · బోర్‌వెల్ + విద్యుత్ పంపు",
      en: "2 acres own · groundnut + tomato · borewell + electric pump",
    },
    answers: {
      tenure: "own",
      area_band: "10c_5a",
      crop: "groundnut",
      district: "Chittoor",
      water: "borewell_pump",
      excluded: ["none"],
    },
  },
  {
    id: "lakshmi",
    name: { te: "లక్ష్మి", en: "Lakshmi" },
    age: 38,
    place: { te: "అనంతపురం", en: "Anantapur" },
    desc: {
      te: "0.8 ఎకరం సొంత భూమి · చిరుధాన్యాలు · వర్షాధారం",
      en: "0.8 acre own · millets · rainfed",
    },
    answers: {
      tenure: "own",
      area_band: "10c_5a",
      gender: "woman",
      category: "sc",
      crop: "other",
      district: "Anantapur",
      water: "rainfed",
      excluded: ["none"],
    },
  },
  {
    id: "venkatesh",
    name: { te: "వెంకటేశ్", en: "Venkatesh" },
    age: 52,
    place: { te: "కడప", en: "Kadapa" },
    desc: {
      te: "6 ఎకరాలు కౌలు · CCRC ఉంది · వేరుశనగ · కాలువ",
      en: "6 acres tenant with CCRC · groundnut · canal",
    },
    answers: {
      tenure: "tenant",
      has_ccrc: true,
      area_band: "5_10a",
      gender: "man",
      category: "sc",
      crop: "groundnut",
      district: "YSR Kadapa",
      water: "canal",
      excluded: ["none"],
    },
  },
  {
    id: "kiran",
    name: { te: "కిరణ్", en: "Kiran" },
    age: 28,
    place: { te: "కడప", en: "Kadapa" },
    desc: {
      te: "IT ఉద్యోగి · వారసత్వంగా 3 ఎకరాలు · వరి · వర్షాధారం",
      en: "IT job · inherited 3 acres · paddy · rainfed",
    },
    answers: {
      tenure: "own",
      area_band: "5_10a",
      crop: "paddy",
      district: "YSR Kadapa",
      water: "rainfed",
      excluded: ["income_tax", "professional"],
    },
  },
];

export default function Home({ lang, setLang, onStart, onPersona }) {
  const [helperOpen, setHelperOpen] = useState(false);

  return (
    <div className="max-w-[390px] mx-auto px-4 py-6 space-y-6">
      <section className="space-y-2">
        <h1 className="text-[24px] leading-8 font-bold text-ink">
          {t("home_headline", lang)}
        </h1>
        <p className="text-[17px] leading-6 text-muted">{t("home_pick", lang)}</p>
      </section>

      <div role="group" aria-label="Language" className="flex gap-2">
        {["te", "en"].map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={lang === l}
            onClick={() => setLang(l)}
            className={`min-h-[48px] px-4 rounded-full border text-[15px] font-semibold ${
              lang === l
                ? "bg-primary-container border-primary text-primary"
                : "bg-surface border-outline text-muted"
            }`}
          >
            {l === "te" ? "తెలుగు" : "English"}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPersona(p.answers)}
            className="min-h-[48px] text-left p-4 rounded-2xl border border-outline bg-surface space-y-1"
          >
            <span className="block text-[17px] font-semibold text-ink">
              {p.name[lang] || p.name.en}
            </span>
            <span className="block text-[14px] text-muted">
              {p.age} · {p.place[lang] || p.place.en}
            </span>
            <span className="block text-[13px] leading-5 text-muted">
              {p.desc[lang] || p.desc.en}
            </span>
          </button>
        ))}
      </section>

      <section className="space-y-3">
        <button
          type="button"
          aria-expanded={helperOpen}
          onClick={() => setHelperOpen((v) => !v)}
          className="w-full min-h-[48px] p-4 rounded-2xl border border-outline bg-surface text-left text-[15px] font-semibold text-ink"
        >
          {t("helper_toggle", lang)}
        </button>
        {helperOpen && (
          <p className="text-[15px] leading-6 text-muted px-1">{t("helper_text", lang)}</p>
        )}
      </section>

      <button
        type="button"
        onClick={onStart}
        className="w-full h-14 rounded-full bg-primary text-white font-semibold text-[17px]"
      >
        {t("start", lang)}
      </button>
    </div>
  );
}
