import { t } from "../../i18n.js";
import { CARD, GROUP_PILL, SUPERSEDED_TEXT, SUPERSEDED_TEXT_TE } from "../../lib/resultsConfig.js";
import {
  bi,
  formatDay,
  formatVerified,
  formatVerifiedTe,
  groupLabel,
  money,
  stepsFor,
  wholeDaysLeft,
} from "../../lib/resultsHelpers.js";

export default function SchemeCard({ r, s, lang, tenure, crop, applied = [], onToggleApplied }) {
  const name = bi(lang, s?.name_te, s?.name_en) || r.id;
  const trackable = r.group === "likely" || r.group === "maybe";
  const isApplied = trackable && applied.includes(r.id);
  const other = lang === "en" ? s?.name_te : s?.name_en;
  const benefitText =
    r.group === "superseded"
      ? (lang === "te" ? SUPERSEDED_TEXT_TE : SUPERSEDED_TEXT)
      : r.group === "not"
        ? ""
        : bi(lang, s?.benefit_text_te, s?.benefit_text_en);
  // Paddy farmers use deadline_paddy when it is set. No deadline means no countdown.
  const deadlineIso = s?.deadline ? (crop === "paddy" && s.deadline_paddy) || s.deadline : null;
  const deadlineText = deadlineIso ? formatDay(deadlineIso, lang) : null;
  const days = deadlineIso ? wholeDaysLeft(deadlineIso) : null;
  const steps = stepsFor(s, tenure);

  return (
    <article className={`${CARD} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`chip ${GROUP_PILL[r.group]}`}>{groupLabel(lang, r.group)}</span>
        {r.benefit_per_year > 0 && (
          <span className="chip bg-primary-container text-primary">
            {money(r.benefit_per_year)} {t("per_year", lang)}
          </span>
        )}
      </div>

      {trackable && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-outline bg-[#F8FAF5] px-3 py-2">
          {isApplied ? (
            <span className="chip bg-[#DCFCE7] text-[#15803D]">{t("applied_status", lang)}</span>
          ) : (
            <span className="text-[14px] font-semibold text-muted">{t("mark_applied_hint", lang)}</span>
          )}
          <button
            type="button"
            onClick={() => onToggleApplied?.(r.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[14px] font-bold transition ${
              isApplied
                ? "border border-primary bg-primary text-white"
                : "border border-primary bg-surface text-primary"
            }`}
          >
            {isApplied ? t("undo_applied", lang) : t("mark_applied", lang)}
          </button>
        </div>
      )}

      <div className="space-y-1">
        <h3 className="text-[21px] font-bold leading-8 text-ink">{name}</h3>
        {other && other !== name && <p className="text-[14px] font-medium text-muted">{other}</p>}
      </div>

      {days !== null && (
        <div className={`rounded-2xl p-3 ${days < 0 ? "bg-[#F5F5F4] text-[#57534E]" : "bg-[#FEF3C7] text-[#92400E]"}`}>
          <p className="text-[16px] font-bold">
            {days < 0
              ? t("deadline_passed", lang)
              : t("deadline_left", lang)
                  .replace("{date}", deadlineText)
                  .replace("{days}", String(days))}
          </p>
          {r.id === "pmfby" && (
            <p className="mt-1 text-[13px] leading-5 text-muted">{t("pmfby_district_note", lang)}</p>
          )}
        </div>
      )}

      {benefitText && <p className="text-[16px] leading-6 text-muted">{benefitText}</p>}

      {(r.reasons.length > 0 || (r.group === "not" && r.fixes.length > 0)) && (
        <div className="soft-panel space-y-2">
          {r.reasons.map((x, i) => (
            <p key={i} className="text-[16px] leading-6 text-ink">
              <span className="font-bold text-primary">{t("why_label", lang)}</span>{" "}
              {bi(lang, x.te, x.en)}
            </p>
          ))}
          {r.group === "not" &&
            r.fixes.map((x, i) => (
              <p key={`fix-${i}`} className="text-[16px] leading-6 text-ink">
                <span className="font-bold text-primary">{t("fix_label", lang)}</span>{" "}
                {bi(lang, x.te, x.en)}
              </p>
            ))}
        </div>
      )}

      <div className="soft-panel space-y-2">
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted">
          {t("how_to_apply", lang)}
        </p>
        {steps.length > 0 ? (
          <ol className="list-decimal space-y-1 pl-5 text-[16px] leading-6 text-ink marker:font-bold marker:text-primary">
            {steps.map((x, i) => (
              <li key={i}>{bi(lang, x.te, x.en)}</li>
            ))}
          </ol>
        ) : (
          <p className="text-[16px] leading-6 text-muted">{t("no_steps", lang)}</p>
        )}
      </div>

      {s?.official_link && (
        <div className="space-y-1">
          <a
            href={s.official_link}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-[16px] font-bold text-primary underline"
          >
            {s.official_link}
          </a>
          <p className="text-[13px] leading-5 text-muted">
            {s?.last_verified
              ? lang === "te"
                ? `${t("last_verified_label", lang)} ${formatVerifiedTe(s.last_verified)}`
                : `Last verified ${formatVerified(s.last_verified)}`
              : t("last_verified", lang)}
          </p>
        </div>
      )}
    </article>
  );
}
