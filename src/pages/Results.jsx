import { useEffect, useState } from "react";
import {
  evaluateSchemes,
  totalCashPerYear,
  blockersRanked,
  seasonFromDate,
  daysUntil,
} from "../lib/match.js";
import { t } from "../i18n.js";

const ANSWERS_KEY = "rh.answers";
const CUSTOM_KEY = "rh.customSchemes";
const HELPER_KEY = "rh.helper";

// Display order of groups. Closed and superseded come last.
const GROUP_ORDER = ["likely", "maybe", "not", "closed", "superseded"];
const GROUP_EN = {
  likely: "Likely eligible",
  maybe: "May be eligible",
  not: "Not eligible",
  closed: "Not open now",
  superseded: "No longer active",
};
const GROUP_PILL = {
  likely: "bg-[#DCFCE7] text-[#15803D]",
  maybe: "bg-[#FEF3C7] text-[#92400E]",
  not: "bg-[#F5F5F4] text-[#57534E]",
  closed: "bg-[#F5F5F4] text-[#57534E]",
  superseded: "bg-[#F5F5F4] text-[#57534E]",
};
const SUPERSEDED_TEXT = "Ee scheme ippudu ledhu — Annadata Sukhibhava chudandi.";
const DECODER = [
  {
    issue: "eKYC pending",
    office: "Rythu Seva Kendram / VAA",
    document: "eKYC completed status",
  },
  {
    issue: "Land seeding pending",
    office: "Rythu Seva Kendram / VAA",
    document: "Pattadar passbook",
  },
  {
    issue: "NPCI (bank Aadhaar mapping) pending",
    office: "The bank branch",
    document: "Aadhaar-linked bank account",
  },
];

const CARD = "rounded-2xl border border-[#E3E6DF] bg-surface p-4";
const OUTLINE_BTN =
  "w-full min-h-[48px] rounded-full border border-[#1B5E20] bg-surface px-4 text-[17px] font-semibold text-[#1B5E20]";

function readCustomSchemes() {
  try {
    const v = JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function readHelper() {
  try {
    return localStorage.getItem(HELPER_KEY) === "1";
  } catch {
    return false;
  }
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

// Picks the Telugu or English field for the current language, with fallback.
function bi(lang, te, en) {
  return (lang === "en" ? en : te) || en || te || "";
}

function groupLabel(lang, g) {
  return lang === "te" ? t(`group_${g}`, "te") : GROUP_EN[g];
}

function SchemeCard({ r, s, lang }) {
  const name = bi(lang, s?.name_te, s?.name_en) || r.id;
  const other = lang === "en" ? s?.name_te : s?.name_en;
  const benefitText =
    r.group === "superseded"
      ? SUPERSEDED_TEXT
      : bi(lang, s?.benefit_text_te, s?.benefit_text_en);

  return (
    <article className={`${CARD} space-y-2`}>
      <span
        className={`inline-block rounded-full px-3 py-1 text-[14px] font-semibold ${GROUP_PILL[r.group]}`}
      >
        {groupLabel(lang, r.group)}
      </span>
      <h3 className="text-[20px] font-semibold leading-7 text-ink">{name}</h3>
      {other && other !== name && <p className="text-[14px] text-muted">{other}</p>}
      {r.benefit_per_year > 0 && (
        <p className="text-[17px] font-semibold text-ink">{money(r.benefit_per_year)} per year</p>
      )}
      {benefitText && <p className="text-[17px] leading-6 text-muted">{benefitText}</p>}
      {r.reasons.map((x, i) => (
        <p key={i} className="text-[17px] leading-6 text-ink">
          Why: {bi(lang, x.te, x.en)}
        </p>
      ))}
      {r.group === "not" &&
        r.fixes.map((x, i) => (
          <p key={`fix-${i}`} className="text-[17px] leading-6 text-ink">
            FIX: {bi(lang, x.te, x.en)}
          </p>
        ))}
    </article>
  );
}

export default function Results({ lang, answers, onNavigate }) {
  const hasAnswers = Boolean(answers) && Object.keys(answers).length > 0;
  const [state, setState] = useState({ status: "loading", results: [], schemes: {}, message: "" });
  const [helper, setHelper] = useState(readHelper);

  useEffect(() => {
    if (!answers || Object.keys(answers).length === 0) return undefined;
    let cancelled = false;
    fetch("/schemes.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json) => {
        if (cancelled) return;
        const list = [...json.schemes, ...readCustomSchemes()];
        const byId = Object.fromEntries(list.map((s) => [s.id, s]));
        const results = evaluateSchemes(answers, list);
        setState({ status: "ready", results, schemes: byId, message: "" });
      })
      .catch((err) => {
        if (!cancelled)
          setState({ status: "error", results: [], schemes: {}, message: String(err.message) });
      });
    return () => {
      cancelled = true;
    };
  }, [answers]);

  if (!hasAnswers) {
    return (
      <div className="max-w-[390px] mx-auto px-4 py-6 space-y-6">
        <p className="text-[17px] leading-6 text-muted">
          No answers yet. Answer a few questions first, then your results will show here.
        </p>
        <button type="button" onClick={() => onNavigate("home")} className={OUTLINE_BTN}>
          Back to home
        </button>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="max-w-[390px] mx-auto px-4 py-6">
        <p className="text-[17px] text-muted">{t("results_loading", lang)}</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="max-w-[390px] mx-auto px-4 py-6">
        <p className="text-[17px] text-ink">
          {t("results_error", lang)} ({state.message})
        </p>
      </div>
    );
  }

  const { results, schemes } = state;
  const groups = Object.fromEntries(
    GROUP_ORDER.map((g) => [g, results.filter((r) => r.group === g)]),
  );
  const ordered = GROUP_ORDER.flatMap((g) => groups[g]);
  const { label: season } = seasonFromDate(new Date());
  const total = totalCashPerYear(results);
  const blockers = blockersRanked(results);
  const blockedTotal = blockers.reduce((sum, r) => sum + r.blocked_per_year, 0);
  const likelyNames = groups.likely.map((r) => bi(lang, schemes[r.id]?.name_te, schemes[r.id]?.name_en) || r.id);
  const docResults = ordered.filter(
    (r) => r.documents.ready.length + r.documents.still_needed.length > 0,
  );
  const deadlines = ordered.filter((r) => schemes[r.id]?.deadline);

  const summaryText = `${season}. Total ${money(total)} per year. Likely eligible: ${
    likelyNames.join(", ") || "none"
  }.`;
  const speechOk =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  function speakSummary() {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new window.SpeechSynthesisUtterance(summaryText);
    u.lang = "te-IN";
    synth.speak(u);
  }

  function shareWhatsApp() {
    const text = `Rythu Hakku ${season}: likely eligible — ${
      likelyNames.join(", ") || "none yet"
    }. ${t("footer_free", "en")}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  function toggleHelper() {
    const next = !helper;
    setHelper(next);
    try {
      localStorage.setItem(HELPER_KEY, next ? "1" : "0");
    } catch {
      // storage unavailable; toggle still works for this session
    }
  }

  function startAgain() {
    try {
      localStorage.removeItem(ANSWERS_KEY);
    } catch {
      // storage unavailable
    }
    onNavigate("home");
  }

  return (
    <div className="max-w-[390px] mx-auto px-4 py-6 space-y-6">
      <h1 className="text-[24px] leading-8 font-bold text-ink">{season}</h1>

      {/* Hero: yearly cash only */}
      <section className="rounded-[20px] border border-[#E3E6DF] bg-surface p-4 space-y-1">
        <p className="text-[44px] leading-[52px] font-bold text-ink">{money(total)}</p>
        <p className="text-[17px] text-muted">per year</p>
        <p className="text-[14px] leading-5 text-muted">
          PMFBY insurance and KCC loan are not counted here — they are not yearly cash.
        </p>
      </section>

      {/* Blockers */}
      {blockers.length > 0 && (
        <section className={`${CARD} space-y-3`}>
          <h2 className="text-[20px] font-semibold leading-7 text-ink">
            Fix these first — {money(blockedTotal)}/year blocked
          </h2>
          {blockers.map((r) => (
            <div key={r.id} className="space-y-1">
              <p className="text-[17px] font-semibold text-ink">
                {bi(lang, schemes[r.id]?.name_te, schemes[r.id]?.name_en) || r.id} —{" "}
                {money(r.blocked_per_year)}/year
              </p>
              {r.fixes.map((x, i) => (
                <p key={i} className="text-[17px] leading-6 text-ink">
                  FIX: {bi(lang, x.te, x.en)}
                </p>
              ))}
            </div>
          ))}
        </section>
      )}

      {/* Scheme groups */}
      {GROUP_ORDER.filter((g) => groups[g].length > 0).map((g) => (
        <section key={g} className="space-y-3">
          <h2 className="text-[20px] font-semibold leading-7 text-ink">{groupLabel(lang, g)}</h2>
          {groups[g].map((r) => (
            <SchemeCard key={r.id} r={r} s={schemes[r.id]} lang={lang} />
          ))}
        </section>
      ))}

      {/* Documents */}
      {docResults.length > 0 && (
        <section className={`${CARD} space-y-4`}>
          <h2 className="text-[20px] font-semibold leading-7 text-ink">Documents</h2>
          {docResults.map((r) => (
            <div key={r.id} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[17px] font-semibold text-ink">
                  {bi(lang, schemes[r.id]?.name_te, schemes[r.id]?.name_en) || r.id}
                </p>
                {r.group === "likely" && r.documents.still_needed.length === 0 && (
                  <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-[14px] font-semibold text-[#15803D]">
                    Ready to apply
                  </span>
                )}
              </div>
              {r.documents.ready.length > 0 && (
                <div>
                  <p className="text-[14px] font-semibold text-muted">Ready</p>
                  <ul className="list-disc pl-5 text-[17px] leading-6 text-ink">
                    {r.documents.ready.map((d, i) => (
                      <li key={i}>{bi(lang, d.te, d.en)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {r.documents.still_needed.length > 0 && (
                <div>
                  <p className="text-[14px] font-semibold text-muted">Still needed</p>
                  <ul className="list-disc pl-5 text-[17px] leading-6 text-ink">
                    {r.documents.still_needed.map((d, i) => (
                      <li key={i}>{bi(lang, d.te, d.en)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Deadlines */}
      {deadlines.length > 0 && (
        <section className={`${CARD} space-y-2`}>
          <h2 className="text-[20px] font-semibold leading-7 text-ink">Deadline</h2>
          {deadlines.map((r) => {
            const days = daysUntil(schemes[r.id].deadline);
            return (
              <p key={r.id} className="text-[17px] text-ink">
                {bi(lang, schemes[r.id].name_te, schemes[r.id].name_en)} —{" "}
                {days < 0 ? "Deadline passed" : `${days} days left`}
              </p>
            );
          })}
        </section>
      )}

      {/* Status decoder */}
      <section className={`${CARD} space-y-3`}>
        <h2 className="text-[20px] font-semibold leading-7 text-ink">Naa ₹2,000 enduku raledu?</h2>
        <ul className="space-y-3">
          {DECODER.map((row) => (
            <li key={row.issue} className="space-y-1">
              <p className="text-[17px] font-semibold text-ink">{row.issue}</p>
              <p className="text-[17px] leading-6 text-ink">Office: {row.office}</p>
              <p className="text-[17px] leading-6 text-ink">Document: {row.document}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Actions */}
      <section className="space-y-3">
        <button
          type="button"
          onClick={shareWhatsApp}
          className="w-full h-14 rounded-full bg-[#1B5E20] text-[17px] font-semibold text-white"
        >
          WhatsApp share
        </button>
        <button type="button" onClick={() => window.print()} className={OUTLINE_BTN}>
          Printable checklist
        </button>
        {speechOk && (
          <button type="button" onClick={speakSummary} className={OUTLINE_BTN}>
            Listen to summary
          </button>
        )}
        <button
          type="button"
          aria-pressed={helper}
          onClick={toggleHelper}
          className={OUTLINE_BTN}
        >
          {t("helper_toggle", lang)}
        </button>
        {helper && (
          <p className="text-[17px] leading-6 text-muted">
            Helper mode on: explain each step to the farmer
          </p>
        )}
        <button type="button" onClick={startAgain} className={OUTLINE_BTN}>
          Start again
        </button>
      </section>

      <footer className="space-y-1">
        <p className="text-[14px] leading-5 text-muted">{t("footer_free", lang)}</p>
        <p className="text-[14px] leading-5 text-muted">{t("footer_forever", lang)}</p>
      </footer>
    </div>
  );
}
