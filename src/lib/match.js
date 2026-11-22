// Rythu Hakku matching engine. Pure functions, no dependencies.
// Answers: tenure, area_band, excluded[], crop, has_ccrc, always.
// Date/region helpers live in matchDates.js and are re-exported here.
export { seasonFromDate, daysUntil, regionForDistrict } from "./matchDates.js";
import { blockingReason, failedMatchReason } from "./matchReasons.js";

const AREA_LOWER_ACRES = { lt_10c: 0, "10c_5a": 0.1, "5_10a": 5, gt_10a: 10 };
const CROP_MIN_ACRES = { betelvine: 0.1, vegetables: 0.5, horticulture: 0.5 };
const DEFAULT_MIN_ACRES = 1.0;
const PM_KISAN_FALLBACK = 6000;

// Tenant minimum area. The area band is a range, so its LOWER bound is used
// as the farmer's acreage. Passes only if that lower bound is above zero and
// meets the crop's minimum.
export function tenantMinOk(areaBand, crop) {
  const lower = AREA_LOWER_ACRES[areaBand] ?? 0;
  const min = CROP_MIN_ACRES[crop] ?? DEFAULT_MIN_ACRES;
  return lower > 0 && lower >= min;
}

// Adds derived fields used by rules. Tenant-only checks are gated on
// tenure === "tenant" so owners are not failed by tenant rules.
// The 10c_5a band straddles the tenant minimum, so a failed minimum there is
// tenant_min_uncertain (a maybe), not tenant_min_fail (a hard no).
function withDerived(answers) {
  const isTenant = answers.tenure === "tenant";
  const hasCcrc = Boolean(answers.has_ccrc);
  const tenantMin = isTenant ? tenantMinOk(answers.area_band, answers.crop) : true;
  const straddles = answers.area_band === "10c_5a";
  return {
    ...answers,
    always: true,
    tenant_min_ok: tenantMin,
    tenant_min_fail: isTenant && !tenantMin && !straddles,
    tenant_min_uncertain: isTenant && !tenantMin && straddles,
    tenant_ccrc: isTenant && hasCcrc,
    tenant_no_ccrc: isTenant && !hasCcrc,
  };
}

function anyIn(actual, list) {
  if (Array.isArray(actual)) return actual.some((v) => list.includes(v));
  return list.includes(actual);
}

// Rule ops: in | not_in | eq | is_true. is_true matches when the answer's
// truthiness equals the rule value (value false = fires when falsy).
function evalRule(rule, ctx) {
  const actual = ctx[rule.field];
  switch (rule.op) {
    case "in":
      return anyIn(actual, rule.value);
    case "not_in":
      return !anyIn(actual, rule.value);
    case "eq":
      return actual === rule.value;
    case "is_true":
      return Boolean(actual) === Boolean(rule.value);
    default:
      return false;
  }
}

function evaluateOne(scheme, ctx) {
  const rules = scheme.rules ?? {};
  const match = rules.match ?? [];
  const notMatch = rules.not_match ?? [];

  const passing = match.filter((r) => evalRule(r, ctx));
  const failing = match.filter((r) => !evalRule(r, ctx));
  const firedNot = notMatch.filter((r) => evalRule(r, ctx));
  // An uncertain not_match rule (uncertain: true) gives "maybe", never "not".
  const firedHard = firedNot.filter((r) => !r.uncertain);
  const firedUncertain = firedNot.filter((r) => r.uncertain);

  let matchOk;
  if (match.length === 0) matchOk = true;
  else if (scheme.match_any) matchOk = passing.length > 0;
  else matchOk = failing.length === 0;

  let group;
  if (scheme.status === "closed") group = "closed";
  else if (scheme.status === "superseded") group = "superseded";
  else if (firedHard.length > 0 || !matchOk) group = "not";
  else if (firedUncertain.length > 0 || passing.some((r) => r.unresolved) || scheme.status === "open_ask_rsk") group = "maybe";
  else group = "likely";

  // "not" results name only what blocked them: fired not_match rules and failed
  // match rules. Passing rules are left out. Other groups keep the passing reasons,
  // plus the reason of any uncertain rule.
  const reasons =
    group === "not"
      ? [
          ...firedHard.filter((r) => r.hide_why !== true).map(blockingReason),
          ...failing.filter((r) => r.hide_why !== true).map(failedMatchReason).filter(Boolean),
        ]
      : [
          ...passing.filter((r) => r.hide_why !== true).map((r) => ({ te: r.reason_te, en: r.reason_en, rule_id: r.id })),
          ...firedUncertain.map((r) => ({ te: r.reason_te, en: r.reason_en, rule_id: r.id })),
        ];

  let fixes = firedNot
    .filter((r) => r.fix_te || r.fix_en)
    .map((r) => ({ te: r.fix_te, en: r.fix_en }));
  if (group === "not" && fixes.length === 0 && failing.length > 0) {
    // A failed match rule's own fix_* is used before the generic RSK line.
    const failingFixes = failing
      .filter((r) => r.fix_te || r.fix_en)
      .map((r) => ({ te: r.fix_te, en: r.fix_en }));
    fixes = failingFixes.length > 0 ? failingFixes : [{
      te: "మీ రైతు సేవా కేంద్రం (RSK) వద్ద తదుపరి చర్యలు తనిఖీ చేయండి",
      en: "Check at your Rythu Seva Kendram (RSK) for what to do next"
    }];
  }

  const docs = scheme.documents ?? [];
  const isReady = (d) => d.ready_when != null && evalRule(d.ready_when, ctx);
  const documents = {
    ready: docs.filter(isReady).map((d) => ({ te: d.te, en: d.en })),
    still_needed: docs.filter((d) => !isReady(d)).map((d) => ({ te: d.te, en: d.en })),
  };

  return { id: scheme.id, group, reasons, fixes, documents, _scheme: scheme };
}

function annadataBenefit(scheme, ctx, pmKisanLikely, pmKisanAmount) {
  const byTenure = scheme.benefit_by_tenure ?? {};
  if (ctx.tenant_ccrc) return byTenure.tenant_ccrc ?? 0;
  return byTenure.own ?? 0; // state share only; PM-KISAN ₹6,000 is counted on its own card
}

function annadataBlocked(scheme, ctx) {
  const byTenure = scheme.benefit_by_tenure ?? {};
  if (ctx.tenant_ccrc || ctx.tenure === "tenant") return byTenure.tenant_ccrc ?? 0;
  if (ctx.tenure === "own" || ctx.tenure === "rofr") return byTenure.own ?? 0;
  return 0;
}

// `now` is accepted for the public signature; deadline checks use daysUntil.
export function evaluateSchemes(answers, schemes, now = new Date()) {
  void now;
  const list = Array.isArray(schemes) ? schemes : schemes.schemes;
  const ctx = withDerived(answers);

  const base = list.map((s) => evaluateOne(s, ctx));
  const pmKisan = list.find((s) => s.id === "pm_kisan");
  const pmKisanAmount = pmKisan?.benefit_per_year ?? PM_KISAN_FALLBACK;
  const pmKisanLikely = base.some((r) => r.id === "pm_kisan" && r.group === "likely");

  return base.map((r) => {
    const s = r._scheme;
    const isAnnadata = s.benefit_by_tenure != null;
    let benefit = 0;
    let blocked = 0;

    if (s.counts_as_cash) {
      if (r.group === "likely") {
        benefit = isAnnadata
          ? annadataBenefit(s, ctx, pmKisanLikely, pmKisanAmount)
          : s.benefit_per_year ?? 0;
      }
      if (r.group === "not") {
        blocked = isAnnadata ? annadataBlocked(s, ctx) : s.benefit_per_year ?? 0;
      }
    }

    return {
      id: r.id,
      group: r.group,
      reasons: r.reasons,
      fixes: r.fixes,
      benefit_per_year: benefit,
      blocked_per_year: blocked,
      documents: r.documents,
    };
  });
}

export function totalCashPerYear(results) {
  return results.reduce((sum, r) => sum + (r.benefit_per_year || 0), 0);
}

export function blockersRanked(results) {
  return results
    .filter((r) => r.group === "not" && r.blocked_per_year > 0)
    .sort((a, b) => b.blocked_per_year - a.blocked_per_year);
}
