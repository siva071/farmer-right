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
    <div className="app-page max-w-[390px] mx-auto">
      <section className="page-hero space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="chip bg-white/15 text-white">{t("app_name", lang)}</span>
          <div role="group" aria-label="Language" className="flex rounded-full bg-white/15 p-1">
            {["te", "en"].map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
                className={`min-h-[40px] px-4 rounded-full text-sm font-bold transition ${
                  lang === l ? "bg-white text-primary" : "text-white/80"
                }`}
              >
                {l === "te" ? "తె" : "EN"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-[30px] leading-10 font-bold">{t("home_headline", lang)}</h1>
          <p className="text-[16px] leading-6 text-white/85">{t("home_pick", lang)}</p>
        </div>
      </section>

      <section className="surface-card space-y-4">
        <div className="space-y-1">
          <p className="section-kicker">{t("home_examples", lang)}</p>
          <h2 className="section-heading">{t("home_pick", lang)}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPersona(p.answers)}
              className="min-h-[132px] text-left p-4 rounded-[20px] border border-outline bg-[#F8FAF5] space-y-2 transition hover:border-primary/50 hover:bg-primary-container/50"
            >
              <span className="block text-[16px] font-bold text-ink">
                {p.name[lang] || p.name.en}
              </span>
              <span className="block text-[13px] font-semibold text-primary">
                {p.age} · {p.place[lang] || p.place.en}
              </span>
              <span className="block text-[13px] leading-5 text-muted">
                {p.desc[lang] || p.desc.en}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card space-y-3">
        <button
          type="button"
          aria-expanded={helperOpen}
          onClick={() => setHelperOpen((v) => !v)}
          className="flex min-h-[48px] w-full items-center justify-between gap-3 text-left"
        >
          <span className="text-[16px] font-bold text-ink">{t("helper_toggle", lang)}</span>
          <span className="chip bg-primary-container text-primary">{helperOpen ? "−" : "+"}</span>
        </button>
        {helperOpen && (
          <p className="text-[15px] leading-6 text-muted">{t("helper_text", lang)}</p>
        )}
      </section>

      <section className="surface-card space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-kicker">{t("voice_help_toggle", lang)}</p>
            <h2 className="section-heading">
              {voiceHelp === "yes" ? t("voice_help_on", lang) : t("voice_help_off", lang)}
            </h2>
          </div>
          <button
            type="button"
            aria-pressed={voiceHelp === "yes"}
            onClick={() => chooseVoiceHelp(voiceHelp === "yes" ? "no" : "yes")}
            className={`relative h-12 w-[72px] rounded-full transition ${
              voiceHelp === "yes" ? "bg-primary" : "bg-outline"
            }`}
          >
            <span
              className={`absolute top-3 h-6 w-6 rounded-full bg-white shadow transition-all ${
                voiceHelp === "yes" ? "left-11" : "left-1"
              }`}
            />
          </button>
        </div>

        {voiceHelp === null && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => chooseVoiceHelp("yes")}
              className="secondary-button"
            >
              {t("voice_yes", lang)}
            </button>
            <button
              type="button"
              onClick={() => chooseVoiceHelp("no")}
              className="secondary-button"
            >
              {t("voice_no", lang)}
            </button>
          </div>
        )}
      </section>

      <button type="button" onClick={onStart} className="primary-button">
        {t("start", lang)}
      </button>
    </div>
  );
}
