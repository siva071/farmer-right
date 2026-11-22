import { t } from "../../i18n.js";
import { CARD, GROUP_PILL, SUPERSEDED_TEXT, SUPERSEDED_TEXT_TE } from "../../lib/resultsConfig.js";
import {
  bi,
  formatVerified,
  formatVerifiedTe,
  groupLabel,
  money,
  stepsFor,
  wholeDaysLeft,
} from "../../lib/resultsHelpers.js";

export default function SchemeCard({ r, s, lang, tenure, crop }) {
  const name = bi(lang, s?.name_te, s?.name_en) || r.id;
  const other = lang === "en" ? s?.name_te : s?.name_en;
  const benefitText =
    r.group === "superseded"
      ? (lang === "te" ? SUPERSEDED_TEXT_TE : SUPERSEDED_TEXT)
      : bi(lang, s?.benefit_text_te, s?.benefit_text_en);
  // Paddy farmers use deadline_paddy when it is set. No deadline means no countdown.
  const deadlineIso = s?.deadline ? (crop === "paddy" && s.deadline_paddy) || s.deadline : null;
  const days = deadlineIso ? wholeDaysLeft(deadlineIso) : null;
  const steps = stepsFor(s, tenure);

  return (
    <article className={`${CARD} space-y-2`}>
      <span
        className={`inline-block rounded-full px-3 py-1 text-[14px] font-semibold ${GROUP_PILL[r.group]}`}
      >
        {groupLabel(lang, r.group)}
      </span>
      <h3 className="text-[20px] font-semibold leading-7 text-ink">{name}</h3>
      {other && other !== name && <p className="text-[14px] text-muted">{other}</p>}
      {r.benefit_per_year > 0 && (
        <p className="text-[17px] font-semibold text-ink">
          {money(r.benefit_per_year)} {t("per_year", lang)}
        </p>
      )}
      {days !== null && (
        <p className="text-[17px] font-semibold text-[#92400E]">
          {days < 0
            ? t("deadline_passed", lang)
            : t("deadline_left", lang)
                .replace("{date}", deadlineIso)
                .replace("{days}", String(days))}
        </p>
      )}
      {days !== null && r.id === "pmfby" && (
        <p className="text-[14px] leading-5 text-muted">{t("pmfby_district_note", lang)}</p>
      )}
      {benefitText && <p className="text-[17px] leading-6 text-muted">{benefitText}</p>}
      {r.reasons.map((x, i) => (
        <p key={i} className="text-[17px] leading-6 text-ink">
          {t("why_label", lang)} {bi(lang, x.te, x.en)}
        </p>
      ))}
      {r.group === "not" &&
        r.fixes.map((x, i) => (
          <p key={`fix-${i}`} className="text-[17px] leading-6 text-ink">
            {t("fix_label", lang)} {bi(lang, x.te, x.en)}
          </p>
        ))}
      <div className="space-y-1">
        <p className="text-[14px] font-semibold text-muted">{t("how_to_apply", lang)}</p>
        {steps.length > 0 ? (
          <ol className="list-decimal pl-5 text-[17px] leading-6 text-ink">
            {steps.map((x, i) => (
              <li key={i}>{bi(lang, x.te, x.en)}</li>
            ))}
          </ol>
        ) : (
          <p className="text-[17px] leading-6 text-muted">{t("no_steps", lang)}</p>
        )}
      </div>
      {s?.official_link && (
        <p className="text-[17px] leading-6 text-ink">
          {s?.official_link && (
            <a
              href={s.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-semibold text-[#1B5E20] underline"
            >
              {s.official_link}
            </a>
          )}
          <span className="block text-[14px] text-muted">{s?.last_verified ? (lang === "te" ? `${t("last_verified_label", lang)} ${formatVerifiedTe(s.last_verified)}` : `Last verified ${formatVerified(s.last_verified)}`) : t("last_verified", lang)}</span>
        </p>
      )}
    </article>
  );
}

