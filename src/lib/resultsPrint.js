import { t } from "../i18n.js";
import { bi, docForTenure, stepsFor } from "./resultsHelpers.js";

const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

// Opens a print window with the documents checklist and steps.
// Returns "" on success, or the message to show when the browser blocked the popup.
export function openChecklistWindow({ lang, tenure, docResults, docsFor, ordered, schemes }) {
  const w = window.open("", "_blank");
  if (!w) return t("print_no_popup", lang);
  const docItems = docResults
    .flatMap((r) =>
      docsFor(r).map((d) => {
        const doc = docForTenure(d, tenure);
        return `<li>${esc(bi(lang, doc.te, doc.en))}</li>`;
      }),
    )
    .join("");
  const stepsHtml = ordered
    .map((r) => {
      const s = schemes[r.id];
      const name = bi(lang, s?.name_te, s?.name_en) || r.id;
      const steps = stepsFor(s, tenure)
        .map((x) => `<li>${esc(bi(lang, x.te, x.en))}</li>`)
        .join("");
      return `<h2>${esc(name)}</h2><ol>${steps || `<li>${esc(t("no_steps", lang))}</li>`}</ol>`;
    })
    .join("");
  const html =
    `<html><head><meta charset="utf-8"><title>${esc(t("checklist_title", lang))}</title><style>body{font-family:sans-serif;color:#000;background:#fff;padding:20px} li{margin:6px 0}</style></head><body>` +
    `<h1>${esc(t("documents_checklist", lang))}</h1>` +
    `<ul>${docItems}</ul>` +
    `<h1>${esc(t("how_to_apply", lang))}</h1>` +
    stepsHtml +
    "</body></html>";

  w.document.write(html);
  w.document.close();
  return "";
}
