// Reason builders used by evaluateOne in match.js. Split out to keep match.js under 200 lines.

// A fired not_match rule blocks: use its blocked_* text, else its reason_*.
export function blockingReason(r) {
  const hasBlocked = Boolean(r.blocked_en || r.blocked_te);
  return {
    te: hasBlocked ? r.blocked_te : r.reason_te,
    en: hasBlocked ? r.blocked_en : r.reason_en,
    rule_id: r.id,
  };
}

// A failed match rule blocks only via blocked_* text, else its fix_* text.
// Its reason_* describes the passing condition, so it is never used here.
export function failedMatchReason(r) {
  if (r.blocked_en || r.blocked_te) {
    return { te: r.blocked_te, en: r.blocked_en, rule_id: r.id };
  }
  if (r.fix_en || r.fix_te) {
    return { te: r.fix_te, en: r.fix_en, rule_id: r.id };
  }
  return null;
}
