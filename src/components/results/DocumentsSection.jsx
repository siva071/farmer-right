import { t } from "../../i18n.js";
import { CARD } from "../../lib/resultsConfig.js";
import { bi, docForTenure } from "../../lib/resultsHelpers.js";

// Documents for the schemes a farmer may apply to. Tap a row to mark it Ready / Still needed.
export default function DocumentsSection({
  docResults,
  docsFor,
  schemes,
  tenure,
  lang,
  isDocReady,
  toggleDoc,
}) {
  return (
    <section className={`${CARD} space-y-4`}>
      <h2 className="text-[20px] font-semibold leading-7 text-ink">{t("documents", lang)}</h2>
      <p className="text-[14px] leading-5 text-muted">{t("docs_hint", lang)}</p>
      {docResults.map((r) => {
        const docs = docsFor(r);
        const allReady = docs.every((d, i) => isDocReady(`${r.id}:${i}`, d));
        return (
          <div key={r.id} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[17px] font-semibold text-ink">
                {bi(lang, schemes[r.id]?.name_te, schemes[r.id]?.name_en) || r.id}
              </p>
              {r.group === "likely" && allReady && (
                <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-[14px] font-semibold text-[#15803D]">
                  {t("ready_to_apply", lang)}
                </span>
              )}
            </div>
            <ul className="space-y-2">
              {docs.map((d, i) => {
                const key = `${r.id}:${i}`;
                const ready = Boolean(isDocReady(key, d));
                const doc = docForTenure(d, tenure);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      aria-pressed={ready}
                      onClick={() => toggleDoc(key, ready)}
                      className="flex w-full min-h-[48px] items-center justify-between gap-2 rounded-xl border border-[#E3E6DF] bg-surface px-3 py-2 text-left text-[17px] leading-6 text-ink"
                    >
                      <span>{bi(lang, doc.te, doc.en)}</span>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[14px] font-semibold ${
                          ready ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#F5F5F4] text-[#57534E]"
                        }`}
                      >
                        {ready ? t("ready", lang) : t("still_needed", lang)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

