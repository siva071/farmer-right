import { t } from "../../i18n.js";
import { CARD, DECODER } from "../../lib/resultsConfig.js";
import { bi, docForTenure } from "../../lib/resultsHelpers.js";

// Status decoder: what each pending issue means, where to go, and which document to bring.
export default function DecoderSection({ lang, tenure }) {
  return (
    <section className={`${CARD} space-y-4`}>
      <div className="space-y-1">
        <p className="section-kicker">{t("analysis_title", lang)}</p>
        <h2 className="section-heading">{t("decoder_title", lang)}</h2>
      </div>
      <ul className="space-y-3">
        {DECODER.map((row) => {
          const doc = docForTenure(row.document, tenure);
          return (
            <li key={row.issue} className="soft-panel space-y-2">
              <p className="text-[17px] font-bold text-ink">{bi(lang, row.issue_te, row.issue)}</p>
              <p className="text-[15px] leading-6 text-ink">
                <span className="font-bold text-primary">{t("office_label", lang)}</span>{" "}
                {bi(lang, row.office_te, row.office)}
              </p>
              <p className="text-[15px] leading-6 text-ink">
                <span className="font-bold text-primary">{t("document_label", lang)}</span>{" "}
                {bi(lang, doc.te, doc.en)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
