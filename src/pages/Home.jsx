import { useState } from "react";
import { t } from "../i18n.js";

import { PERSONAS } from "../lib/personas.js";

// Voice-help choice in localStorage: "yes" or "no". Absent means no choice yet.
const VOICE_KEY = "rh.voiceHelp";
function readVoiceHelpChoice() {
  try {
    const v = localStorage.getItem(VOICE_KEY);
    return v === "yes" || v === "no" ? v : null;
  } catch {
    return null;
  }
}

export default function Home({ lang, setLang, onStart, onPersona }) {
  const [helperOpen, setHelperOpen] = useState(false);
  const [voiceHelp, setVoiceHelp] = useState(readVoiceHelpChoice);

  const chooseVoiceHelp = (v) => {
    try {
      localStorage.setItem(VOICE_KEY, v);
    } catch {
      // storage unavailable; choice still applies for this session
    }
    setVoiceHelp(v);
  };

  return (
    <div className="max-w-[390px] mx-auto px-4 py-6 space-y-6">
      <section className="space-y-2">
        <h1 className="text-[28px] leading-9 font-bold text-ink">
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
        aria-pressed={voiceHelp === "yes"}
        onClick={() => chooseVoiceHelp(voiceHelp === "yes" ? "no" : "yes")}
        className="w-full min-h-[48px] p-4 rounded-2xl border border-outline bg-surface text-left text-[15px] font-semibold text-ink"
      >
        {t("voice_help_toggle", lang)}: {voiceHelp === "yes" ? t("voice_help_on", lang) : t("voice_help_off", lang)}
      </button>

      {voiceHelp === null && (
        <section className="space-y-3">
          <p className="text-[17px] leading-6 font-semibold text-ink">{t("voice_help_q", lang)}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => chooseVoiceHelp("yes")}
              className="min-h-[56px] text-[18px] rounded-full bg-primary text-white font-semibold"
            >
              {t("voice_yes", lang)}
            </button>
            <button
              type="button"
              onClick={() => chooseVoiceHelp("no")}
              className="min-h-[56px] text-[18px] rounded-full border border-outline bg-surface text-ink font-semibold"
            >
              {t("voice_no", lang)}
            </button>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={onStart}
        className="w-full min-h-[56px] text-[18px] rounded-full bg-primary text-white font-semibold"
      >
        {t("start", lang)}
      </button>
    </div>
  );
}
