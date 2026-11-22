import { t } from "../../i18n.js";
import { CARD } from "../../lib/resultsConfig.js";
import { bi, money } from "../../lib/resultsHelpers.js";

// "Fix first" section: schemes blocked by missing items, ranked by money at stake.
export default function BlockersSection({ blockers, blockedTotal, schemes, lang }) {
  return (
    <section className={`${CARD} space-y-4`}>
      <div className="space-y-1">
        <p className="section-kicker">{t("analysis_title", lang)}</p>
        <h2 className="section-heading">{t("fix_first", lang).replace("{amount}", money(blockedTotal))}</h2>
      </div>
      <div className="space-y-3">
        {blockers.map((r) => (
          <article key={r.id} className="soft-panel space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[17px] font-bold text-ink">
                {bi(lang, schemes[r.id]?.name_te, schemes[r.id]?.name_en) || r.id}
              </h3>
              <span className="chip bg-[#FEE2E2] text-[#B91C1C]">
                {money(r.blocked_per_year)}/{t("year_unit", lang)}
              </span>
            </div>
            <ul className="space-y-1">
              {r.fixes.map((x, i) => (
                <li key={i} className="text-[16px] leading-6 text-ink">
                  <span className="font-bold text-primary">{t("fix_label", lang)}</span>{" "}
                  {bi(lang, x.te, x.en)}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
