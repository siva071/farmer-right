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
      <div className="space-y-1">
        <h2 className="section-heading">{t("documents", lang)}</h2>
        <p className="text-[14px] leading-5 text-muted">{t("docs_hint", lang)}</p>
      </div>
      <div className="space-y-4">
        {docResults.map((r) => {
          const docs = docsFor(r);
          const allReady = docs.every((d, i) => isDocReady(`${r.id}:${i}`, d));
          return (
            <article key={r.id} className="soft-panel space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[17px] font-bold text-ink">
                  {bi(lang, schemes[r.id]?.name_te, schemes[r.id]?.name_en) || r.id}
                </h3>
                {r.group === "likely" && allReady && (
                  <span className="chip bg-[#DCFCE7] text-[#15803D]">{t("ready_to_apply", lang)}</span>
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
                        className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-[16px] border px-3 py-2 text-left text-[16px] leading-6 transition ${
                          ready
                            ? "border-primary/40 bg-primary-container text-ink"
                            : "border-outline bg-surface text-ink hover:border-primary/40"
                        }`}
                      >
                        <span className="font-semibold">{bi(lang, doc.te, doc.en)}</span>
                        <span
                          className={`chip shrink-0 ${
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
            </article>
          );
        })}
      </div>
    </section>
  );
}
