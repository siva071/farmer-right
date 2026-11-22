import { t } from "../../i18n.js";
import { CARD } from "../../lib/resultsConfig.js";
import { bi, money } from "../../lib/resultsHelpers.js";

// "Fix first" section: schemes blocked by missing items, ranked by money at stake.
export default function BlockersSection({ blockers, blockedTotal, schemes, lang }) {
  return (
    <section className={`${CARD} space-y-3`}>
      <h2 className="text-[20px] font-semibold leading-7 text-ink">
        {t("fix_first", lang).replace("{amount}", money(blockedTotal))}
      </h2>
      {blockers.map((r) => (
        <div key={r.id} className="space-y-1">
          <p className="text-[17px] font-semibold text-ink">
            {bi(lang, schemes[r.id]?.name_te, schemes[r.id]?.name_en) || r.id} —{" "}
            {money(r.blocked_per_year)}/{t("year_unit", lang)}
          </p>
          {r.fixes.map((x, i) => (
            <p key={i} className="text-[17px] leading-6 text-ink">
              {t("fix_label", lang)} {bi(lang, x.te, x.en)}
            </p>
          ))}
        </div>
      ))}
    </section>
  );
}

