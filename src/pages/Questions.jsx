import { useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { CATEGORY, GENDER, STEPS, labelOf } from "../lib/questionSteps.js";
import { useDistricts } from "../lib/useDistricts.js";
import { useVoiceAnswers } from "../lib/useVoiceAnswers.js";
import QuestionOptions from "./QuestionOptions.jsx";

export default function Questions({ lang, answers, setAnswers, onBack, onDone }) {
  const [index, setIndex] = useState(0);
  const districts = useDistricts();
  const cardRef = useRef(null);
  const prevIndexRef = useRef(index);

  // Smooth-scroll the question card into view when the step changes (not on first render).
  useEffect(() => {
    if (prevIndexRef.current === index) return;
    prevIndexRef.current = index;
    cardRef.current && cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [index]);

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

  // District is picked from a select, so it is not read or matched by voice.
  const spokenOptions = step.type === "district" ? [] : optionsFor(step);

  const goNext = () => {
    if (index >= total - 1) onDone();
    else setIndex((i) => i + 1);
  };

  const goBack = () => {
    if (index === 0) onBack();
    else setIndex((i) => i - 1);
  };

  const voicePick = (opt) => {
    choose(step, opt);
    const completesAbout =
      step.type === "about" &&
      ((opt.k === "gender" && answers.category) || (opt.k === "category" && answers.gender));
    if (step.type === "single" || step.type === "bool" || completesAbout) goNext();
  };

  const {
    SR,
    listening,
    voiceMsg,
    speaking,
    speakMsg,
    heard,
    speakButton,
    startVoice,
  } = useVoiceAnswers({
    lang,
    step,
    index,
    options: spokenOptions,
    onPick: voicePick,
    onNote: (text) => patch({ notes: text }),
  });

  const canContinue = isAnswered(step) || Boolean(step.textarea && (answers.notes || "").trim());
  const promptText = labelOf(step.prompt, lang);

  return (
    <div ref={cardRef} className="app-page max-w-[390px] mx-auto">
      <section className="surface-card space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-muted">
              {t("step_of", lang)} {index + 1}/{total}
            </span>
            <span className="chip bg-primary-container text-primary">
              {Math.round(((index + 1) / total) * 100)}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={index + 1}
            className="h-2.5 w-full overflow-hidden rounded-full bg-[#E7EBE3]"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="section-kicker">{t("step_of", lang)} {index + 1}</p>
            <h2 className="text-[22px] leading-8 font-bold text-ink">{promptText}</h2>
          </div>
          <button
            type="button"
            onClick={speakButton}
            className="shrink-0 min-h-[48px] rounded-full border border-primary bg-primary-container px-4 text-[15px] font-bold text-primary"
          >
            {speaking ? t("speaking", lang) : `🔊 ${t("speak_question", lang)}`}
          </button>
        </div>
        {speakMsg && <p className="text-sm font-medium text-muted">{speakMsg}</p>}
      </section>

      <QuestionOptions
        step={step}
        lang={lang}
        answers={answers}
        districts={districts}
        promptText={promptText}
        choose={choose}
        isSelected={isSelected}
        pickSingle={pickSingle}
        patch={patch}
      />

      {(heard || voiceMsg) && (
        <section className="soft-panel space-y-2">
          {heard && (
            <p className="text-[16px] leading-6 text-ink">
              <span className="font-bold">{t("heard_label", lang)}</span> {heard}
            </p>
          )}
          {voiceMsg && <p className="text-[15px] leading-6 text-muted">{voiceMsg}</p>}
        </section>
      )}

      <div className="bottom-action-bar mt-auto flex items-center gap-3">
        <button type="button" onClick={goBack} className="ghost-button shrink-0 px-2">
          {t("back", lang)}
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={!canContinue}
          className="primary-button flex-1"
        >
          {t("continue", lang)}
        </button>
        {SR && (
          <button
            type="button"
            onClick={startVoice}
            aria-label={t("mic_label", lang)}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-[22px] text-white shadow-[0_10px_24px_rgba(27,94,32,0.22)] transition"
          >
            {listening || speaking ? "…" : "🎤"}
          </button>
        )}
      </div>

      {SR && (listening || speaking) && (
        <p className="text-center text-sm font-semibold text-primary">
          {speaking
            ? t("speaking", lang)
            : listening
              ? t("mic_listening", lang)
              : t("mic_label", lang)}
        </p>
      )}
    </div>
  );
}
