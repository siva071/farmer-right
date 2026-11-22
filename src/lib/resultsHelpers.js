import { t } from "../i18n.js";
import { GROUP_EN, HELPER_KEY } from "./resultsConfig.js";

const MS_PER_DAY = 86400000;

export function readHelper() {
  try {
    return localStorage.getItem(HELPER_KEY) === "1";
  } catch {
    return false;
  }
}

export function money(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

// Picks the Telugu or English field for the current language, with fallback.
export function bi(lang, te, en) {
  return (lang === "en" ? en : te) || en || te || "";
}

export function groupLabel(lang, g) {
  return lang === "te" ? t(`group_${g}`, "te") : GROUP_EN[g];
}

// Owners hold the land (own / rofr); anyone else is treated as a tenant.
export const isOwnerTenure = (tenure) => tenure === "own" || tenure === "rofr";

// Land documents: owners see the land ownership passbook, tenants see the CCRC card.
const LAND_DOC_EN = [
  "Land records / land ownership passbook or CCRC",
  "Land record or CCRC",
  "Land ownership passbook",
];
export function docForTenure(d, tenure) {
  if (!LAND_DOC_EN.includes(d.en)) return d;
  return isOwnerTenure(tenure)
    ? { te: t("pattadar_passbook", "te"), en: "Land ownership passbook" }
    : { te: t("ccrc_card", "te"), en: "CCRC card" };
}

// Owners do not get tenant-only steps such as the CCRC step.
export function stepsFor(s, tenure) {
  return (s?.steps ?? []).filter((x) => !(isOwnerTenure(tenure) && x.tenant_only));
}

// Whole days from today (local calendar date) to a YYYY-MM-DD date. Negative once passed.
export function wholeDaysLeft(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return null;
  const target = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / MS_PER_DAY);
}

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_TE = ["జనవరి", "ఫిబ్రవరి", "మార్చి", "ఏప్రిల్", "మే", "జూన్", "జులై", "ఆగస్టు", "సెప్టెంబర్", "అక్టోబర్", "నవంబర్", "డిసెంబర్"];
// "2026-11" or "2026-11-15" -> "నవంబర్ 2026"; any other value is returned unchanged. Used only in Telugu mode.
export function formatVerifiedTe(v) {
  const m = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(v || "");
  if (!m) return v;
  const mon = MONTHS_TE[Number(m[2]) - 1];
  return mon ? `${mon} ${m[1]}` : v;
}
// "2026-11" or "2026-11-15" -> "Nov 2026"; any other value is returned unchanged.
export function formatVerified(v) {
  const m = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(v || "");
  if (!m) return v;
  const mon = MONTHS_EN[Number(m[2]) - 1];
  return mon ? `${mon} ${m[1]}` : v;
}

// "2026-12-15" -> "15 Dec 2026" (en) or "15 డిసెంబర్ 2026" (te).
export function formatDay(iso, lang) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return iso;
  const months = lang === "te" ? MONTHS_TE : MONTHS_EN;
  const mon = months[Number(m[2]) - 1];
  return mon ? `${Number(m[3])} ${mon} ${m[1]}` : iso;
}

// Documents shown per farmer tenure: a document limited to certain tenures is
// hidden for others, and the CCRC card is hidden for owners.
export function documentsFor(scheme, tenure) {
  return (scheme?.documents ?? []).filter((d) => {
    const w = d.ready_when;
    if (!w) return true;
    if (w.field === "tenure") return w.value.includes(tenure);
    if (w.field === "tenant_ccrc") return tenure !== "own" && tenure !== "rofr";
    return true;
  });
}

