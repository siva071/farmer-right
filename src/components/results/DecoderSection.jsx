import { t } from "../../i18n.js";
import { CARD, DECODER } from "../../lib/resultsConfig.js";
import { bi, docForTenure } from "../../lib/resultsHelpers.js";

// Status decoder: what each pending issue means, where to go, and which document to bring.
export default function DecoderSection({ lang, tenure }) {
  return (
    <section className={`${CARD} space-y-3`}>
      <h2 className="text-[20px] font-semibold leading-7 text-ink">{t("decoder_title", lang)}</h2>
      <ul className="space-y-3">
        {DECODER.map((row) => {
          const doc = docForTenure(row.document, tenure);
          return (
            <li key={row.issue} className="space-y-1">
              <p className="text-[17px] font-semibold text-ink">{bi(lang, row.issue_te, row.issue)}</p>
              <p className="text-[17px] leading-6 text-ink">
                {t("office_label", lang)} {bi(lang, row.office_te, row.office)}
              </p>
              <p className="text-[17px] leading-6 text-ink">
                {t("document_label", lang)} {bi(lang, doc.te, doc.en)}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

