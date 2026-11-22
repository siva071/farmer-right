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
        className={`option-button ${selected ? "option-button-selected" : ""}`}
      >
        <span className="flex w-full items-center justify-between gap-3">
          <span>{labelOf(opt, lang)}</span>
          <span
            className={`h-6 w-6 shrink-0 rounded-full border-2 transition ${
              selected ? "border-primary bg-primary" : "border-outline bg-surface"
            }`}
          >
            {selected && <span className="block h-full w-full scale-50 rounded-full bg-white" />}
          </span>
        </span>
      </button>
    );
  };

  if (step.type === "district") {
    return (
      <select
        aria-label={promptText}
        value={answers.district || ""}
        onChange={(e) => pickSingle("district", e.target.value)}
        className="w-full min-h-[60px] rounded-[18px] border-2 border-outline bg-surface px-4 text-[17px] font-semibold text-ink outline-none transition focus:border-primary"
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
      <div className="space-y-4">
        <div className="soft-panel space-y-3">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">
            {t("gender_label", lang)}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {GENDER.map((o) => optionButton(step, o))}
          </div>
        </div>
        <div className="soft-panel space-y-3">
          <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">
            {t("category_label", lang)}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORY.map((o) => optionButton(step, o))}
          </div>
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
          rows={4}
          className="w-full rounded-[18px] border-2 border-outline bg-surface px-4 py-3 text-[17px] leading-6 text-ink outline-none transition placeholder:text-muted/70 focus:border-primary"
        />
      )}
    </div>
  );
}
