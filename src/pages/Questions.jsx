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
    onPick: (opt) => choose(step, opt),
    onNote: (text) => patch({ notes: text }),
  });

  const goNext = () => {
    if (index >= total - 1) onDone();
    else setIndex((i) => i + 1);
  };

  const goBack = () => {
    if (index === 0) onBack();
    else setIndex((i) => i - 1);
  };

  const canContinue = isAnswered(step) || Boolean(step.textarea && (answers.notes || "").trim());
  const promptText = labelOf(step.prompt, lang);

  return (
    <div ref={cardRef} className="max-w-[390px] mx-auto px-4 py-6 pb-40 space-y-6">
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

      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[20px] leading-7 font-semibold text-ink">{promptText}</h2>
        <button
          type="button"
          onClick={speakButton}
          className="shrink-0 min-h-[48px] px-3 rounded-full border border-[#1B5E20] text-[15px] font-semibold text-[#1B5E20]"
        >
          {speaking ? t("speaking", lang) : `🔊 ${t("speak_question", lang)}`}
        </button>
      </div>
      {speakMsg && <p className="text-sm">{speakMsg}</p>}

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

      {heard && (
        <p className="text-[17px] leading-6 text-ink">
          {t("heard_label", lang)} {heard}
        </p>
      )}

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
            {listening || speaking ? "…" : "🎤"}
          </button>
          <span className="text-sm font-semibold text-ink bg-surface rounded px-2 py-0.5 shadow-sm">
            {speaking
              ? t("speaking", lang)
              : listening
                ? t("mic_listening", lang)
                : t("mic_label", lang)}
          </span>
          {voiceMsg && <p className="text-sm">{voiceMsg}</p>}
        </div>
      )}
    </div>
  );
}
