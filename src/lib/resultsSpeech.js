// Builds the full spoken Results summary: every scheme's name, status, yearly amount,
// why/fix notes, documents still needed and deadline, plus the total and fix-first items.
import { t } from "../i18n.js";
import {
  bi,
  docForTenure,
  documentsFor,
  formatDay,
  groupLabel,
  money,
  wholeDaysLeft,
} from "./resultsHelpers.js";

function deadlineSpeech(s, crop, lang) {
  const iso = s?.deadline ? (crop === "paddy" && s.deadline_paddy) || s.deadline : null;
  if (!iso) return "";
  const days = wholeDaysLeft(iso);
  if (days === null) return formatDay(iso, lang);
  if (days < 0) return t("deadline_passed", lang);
  return t("deadline_left", lang)
    .replace("{date}", formatDay(iso, lang))
    .replace("{days}", String(days));
}

function schemeSpeech(r, s, lang, tenure, crop, isDocReady) {
  const parts = [];
  const name = bi(lang, s?.name_te, s?.name_en) || r.id;
  parts.push(`${name}. ${groupLabel(lang, r.group)}.`);
  if (r.benefit_per_year > 0) parts.push(`${money(r.benefit_per_year)} ${t("per_year", lang)}.`);
  const why = r.reasons.map((x) => bi(lang, x.te, x.en)).filter(Boolean).join("; ");
  if (why) parts.push(`${t("why_label", lang)} ${why}.`);
  const fix = r.fixes.map((x) => bi(lang, x.te, x.en)).filter(Boolean).join("; ");
  if (fix) parts.push(`${t("fix_label", lang)} ${fix}.`);
  const docs = documentsFor(s, tenure);
  if (docs.length > 0) {
    const needed = docs
      .filter((d, i) => !isDocReady(`${r.id}:${i}`, d))
      .map((d) => {
        const x = docForTenure(d, tenure);
        return bi(lang, x.te, x.en);
      });
    parts.push(`${t("documents", lang)}: ${needed.length ? needed.join(", ") : t("ready", lang)}.`);
  }
  const dl = deadlineSpeech(s, crop, lang);
  if (dl) parts.push(dl);
  return parts.join(" ");
}

function build(lang, data) {
  const { summary, ordered, schemes, tenure, crop, blockers, blockedTotal, isDocReady } = data;
  const out = [summary[lang]];
  for (const r of ordered) {
    const text = schemeSpeech(r, schemes[r.id], lang, tenure, crop, isDocReady);
    if (text) out.push(text);
  }
  if (blockers.length > 0) {
    const head = t("fix_first", lang).replace("{amount}", money(blockedTotal));
    const items = blockers
      .map((r) => {
        const name = bi(lang, schemes[r.id]?.name_te, schemes[r.id]?.name_en) || r.id;
        const fix = r.fixes.map((x) => bi(lang, x.te, x.en)).filter(Boolean).join("; ");
        return `${name} — ${fix} (${money(r.blocked_per_year)}/${t("year_unit", lang)})`;
      })
      .join(". ");
    out.push(`${head}: ${items}.`);
  }
  return out.filter(Boolean).join(" ");
}

// Returns { te, en } spoken summaries for the Listen button.
export function buildSpokenSummary(data) {
  return { te: build("te", data), en: build("en", data) };
}
