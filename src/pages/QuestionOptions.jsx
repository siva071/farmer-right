// Answer controls for one question step: option buttons, district select, notes box.
import { t } from "../i18n.js";
import { CATEGORY, GENDER, labelOf } from "../lib/questionSteps.js";

export default function QuestionOptions({
  step,
  lang,
  answers,
  districts,
  promptText,
  choose,
  isSelected,
  pickSingle,
  patch,
}) {
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
}
