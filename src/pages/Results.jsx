import { useEffect, useRef, useState } from "react";
import {
  evaluateSchemes,
  totalCashPerYear,
  blockersRanked,
  seasonFromDate,
} from "../lib/match.js";

import { t } from "../i18n.js";
import { getTeluguVoice } from "../lib/voice.js";

const MS_PER_DAY = 86400000;
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
const SUPERSEDED_TEXT_TE = "ఈ పథకం ఇప్పుడు లేదు — అన్నదాత సుఖీభవ చూడండి";
const DECODER = [
  {
    issue: "eKYC pending",
    issue_te: "eKYC పెండింగ్‌లో ఉంది",
    office: "Rythu Seva Kendram / VAA",
    office_te: "రైతు సేవా కేంద్రం / VAA",
    document: { en: "eKYC completed status", te: "eKYC పూర్తయిన స్థితి" },
  },
  {
    issue: "Land seeding pending",
    issue_te: "భూమి లింకింగ్ పెండింగ్‌లో ఉంది",
    office: "Rythu Seva Kendram / VAA",
    office_te: "రైతు సేవా కేంద్రం / VAA",
    document: { en: "Pattadar passbook", te: "పట్టాదారు పాస్‌బుక్" },
  },
  {
    issue: "NPCI (bank Aadhaar mapping) pending",
    issue_te: "NPCI (బ్యాంక్-ఆధార్ మ్యాపింగ్) పెండింగ్‌లో ఉంది",
    office: "The bank branch",
    office_te: "బ్యాంక్ శాఖ",
    document: { en: "Aadhaar-linked bank account", te: "ఆధార్-లింక్ బ్యాంక్ ఖాతా" },
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

// Owners hold the land (own / rofr); anyone else is treated as a tenant.
const isOwnerTenure = (tenure) => tenure === "own" || tenure === "rofr";

// Land documents: owners see the pattadar passbook, tenants see the CCRC card.
const LAND_DOC_EN = [
  "Land records / pattadar passbook or CCRC",
  "Land record or CCRC",
  "Pattadar passbook",
];
function docForTenure(d, tenure) {
  if (!LAND_DOC_EN.includes(d.en)) return d;
  return isOwnerTenure(tenure)
    ? { te: t("pattadar_passbook", "te"), en: "Pattadar passbook" }
    : { te: t("ccrc_card", "te"), en: "CCRC card" };
}

// Owners do not get the tenant-only "Get CCRC (tenants)" step.
function stepsFor(s, tenure) {
  return (s?.steps ?? []).filter((x) => !(isOwnerTenure(tenure) && x.en === "Get CCRC (tenants)"));
}

// Whole days from today (local calendar date) to a YYYY-MM-DD date. Negative once passed.
function wholeDaysLeft(iso) {
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
function formatVerifiedTe(v) {
  const m = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(v || "");
  if (!m) return v;
  const mon = MONTHS_TE[Number(m[2]) - 1];
  return mon ? `${mon} ${m[1]}` : v;
}
// "2026-11" or "2026-11-15" -> "Nov 2026"; any other value is returned unchanged.
function formatVerified(v) {
  const m = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(v || "");
  if (!m) return v;
  const mon = MONTHS_EN[Number(m[2]) - 1];
  return mon ? `${mon} ${m[1]}` : v;
}

function SchemeCard({ r, s, lang, tenure, crop }) {
  const name = bi(lang, s?.name_te, s?.name_en) || r.id;
  const other = lang === "en" ? s?.name_te : s?.name_en;
  const benefitText =
    r.group === "superseded"
      ? (lang === "te" ? SUPERSEDED_TEXT_TE : SUPERSEDED_TEXT)
      : bi(lang, s?.benefit_text_te, s?.benefit_text_en);
  // Paddy farmers use deadline_paddy when it is set. No deadline means no countdown.
  const deadlineIso = s?.deadline ? (crop === "paddy" && s.deadline_paddy) || s.deadline : null;
  const days = deadlineIso ? wholeDaysLeft(deadlineIso) : null;
  const steps = stepsFor(s, tenure);

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
        <p className="text-[17px] font-semibold text-ink">
          {money(r.benefit_per_year)} {t("per_year", lang)}
        </p>
      )}
      {days !== null && (
        <p className="text-[17px] font-semibold text-[#92400E]">
          {days < 0
            ? t("deadline_passed", lang)
            : t("deadline_left", lang)
                .replace("{date}", deadlineIso)
                .replace("{days}", String(days))}
        </p>
      )}
      {days !== null && r.id === "pmfby" && (
        <p className="text-[14px] leading-5 text-muted">{t("pmfby_district_note", lang)}</p>
      )}
      {benefitText && <p className="text-[17px] leading-6 text-muted">{benefitText}</p>}
      {r.reasons.map((x, i) => (
        <p key={i} className="text-[17px] leading-6 text-ink">
          {t("why_label", lang)} {bi(lang, x.te, x.en)}
        </p>
      ))}
      {r.group === "not" &&
        r.fixes.map((x, i) => (
          <p key={`fix-${i}`} className="text-[17px] leading-6 text-ink">
            {t("fix_label", lang)} {bi(lang, x.te, x.en)}
          </p>
        ))}
      <div className="space-y-1">
        <p className="text-[14px] font-semibold text-muted">{t("how_to_apply", lang)}</p>
        {steps.length > 0 ? (
          <ol className="list-decimal pl-5 text-[17px] leading-6 text-ink">
            {steps.map((x, i) => (
              <li key={i}>{bi(lang, x.te, x.en)}</li>
            ))}
          </ol>
        ) : (
          <p className="text-[17px] leading-6 text-muted">{t("no_steps", lang)}</p>
        )}
      </div>
      {(s?.official_link || (s?.id?.startsWith("custom-") && s?.last_verified)) && (
        <p className="text-[17px] leading-6 text-ink">
          {s?.official_link && (
            <a
              href={s.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-semibold text-[#1B5E20] underline"
            >
              {s.official_link}
            </a>
          )}
          <span className="block text-[14px] text-muted">{s?.last_verified ? (lang === "te" ? `${t("last_verified_label", lang)} ${formatVerifiedTe(s.last_verified)}` : `Last verified ${formatVerified(s.last_verified)}`) : t("last_verified", lang)}</span>
        </p>
      )}
    </article>
  );
}


export default function Results({ lang, answers, onNavigate }) {
  const hasAnswers = Boolean(answers) && Object.keys(answers).length > 0;
  const voiceHelpOn = localStorage.getItem("rh.voiceHelp") === "yes";
  const [state, setState] = useState({ status: "loading", results: [], schemes: {}, message: "" });
  const [helper, setHelper] = useState(readHelper);
  // Document tap state: key is `${schemeId}:${index}`, true = Ready. All start Still needed.
  const [docDone, setDocDone] = useState({});
  // Speech and print status shown near their buttons.
  const [speaking, setSpeaking] = useState(false);
  const [speechMsg, setSpeechMsg] = useState("");
  const utterRef = useRef(null);
  // Bumped by each Listen tap and by Stop, so a pending voice lookup can be dropped.
  const summaryReqRef = useRef(0);
  const [printMsg, setPrintMsg] = useState("");
  const heroRef = useRef(null);

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

  // Hero renders only once results are ready, so the scroll waits for that (runs once).
  const heroReady = hasAnswers && state.status === "ready";
  useEffect(() => {
    if (!heroReady) return;
    heroRef.current && heroRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [heroReady]);

  if (!hasAnswers) {
    return (
      <div className="max-w-[390px] mx-auto px-4 py-6 space-y-6">
        <p className="text-[17px] leading-6 text-muted">
          {t("no_answers", lang)}
        </p>
        <button type="button" onClick={() => onNavigate("home")} className={OUTLINE_BTN}>
          {t("btn_back_home", lang)}
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
  const { label: season, season: seasonWord } = seasonFromDate(new Date());
  const seasonShown = season.replace(seasonWord, t(`season_${seasonWord.toLowerCase()}`, lang));

  const total = totalCashPerYear(results);
  const blockers = blockersRanked(results);
  const blockedTotal = blockers.reduce((sum, r) => sum + r.blocked_per_year, 0);
  const likelyNames = groups.likely.map((r) => bi(lang, schemes[r.id]?.name_te, schemes[r.id]?.name_en) || r.id);
  const tenure = answers?.tenure;
  // Documents shown per farmer tenure: a document limited to certain tenures is
  // hidden for others, and the CCRC card is hidden for owners.
  const docsFor = (r) =>
    (schemes[r.id]?.documents ?? []).filter((d) => {
      const w = d.ready_when;
      if (!w) return true;
      if (w.field === "tenure") return w.value.includes(tenure);
      if (w.field === "tenant_ccrc") return tenure !== "own" && tenure !== "rofr";
      return true;
    });
  const docResults = ordered.filter((r) => docsFor(r).length > 0);



  const summaryText = `${season}. Total ${money(total)} per year. Likely eligible: ${
    likelyNames.join(", ") || "none"
  }.`;
  async function speakSummary() {
    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) {
      setSpeechMsg(t("voice_unavailable", lang));
      return;
    }
    setSpeechMsg("");
    const synth = window.speechSynthesis;
    synth.cancel();
    const req = ++summaryReqRef.current;
    // Waits for the voice list to load before choosing a voice.
    const teVoice = await getTeluguVoice(synth);
    if (req !== summaryReqRef.current) return;
    const u = new window.SpeechSynthesisUtterance(summaryText);
    if (teVoice) {
      u.voice = teVoice;
      u.lang = "te-IN";
    } else {
      // No Telugu voice: say so, then speak the English summary for this tap only.
      u.lang = "en-IN";
      setSpeechMsg(t("telugu_voice_missing", lang));
    }
    utterRef.current = u;
    // Only the current utterance may clear the speaking state (a cancel fires onerror on the old one).
    u.onend = () => {
      if (utterRef.current !== u) return;
      utterRef.current = null;
      setSpeaking(false);
    };
    u.onerror = (e) => {
      if (utterRef.current !== u) return;
      utterRef.current = null;
      setSpeaking(false);
      if (e?.error !== "interrupted" && e?.error !== "canceled") {
        setSpeechMsg(t("voice_unavailable", lang));
      }
    };
    try {
      setSpeaking(true);
      synth.speak(u);
    } catch {
      utterRef.current = null;
      setSpeaking(false);
      setSpeechMsg(t("voice_unavailable", lang));
    }
  }

  function stopSpeaking() {
    summaryReqRef.current += 1;
    utterRef.current = null;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  function printChecklist() {
    const w = window.open("", "_blank");
    if (!w) {
      setPrintMsg(t("print_no_popup", lang));
      return;
    }
    setPrintMsg("");
    const esc = (v) =>
      String(v ?? "").replace(
        /[&<>"']/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
      );
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

  function toggleDoc(key) {
    setDocDone((prev) => ({ ...prev, [key]: !prev[key] }));
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
      <h1 className="text-[24px] leading-8 font-bold text-ink">{seasonShown}</h1>

      {/* Hero: yearly cash only */}
      <section ref={heroRef} className="rounded-[20px] border border-[#E3E6DF] bg-surface p-4 space-y-1">
        <p className="text-[44px] leading-[52px] font-bold text-ink">{money(total)}</p>
        <p className="text-[17px] text-muted">{t("per_year", lang)}</p>
        <p className="text-[14px] leading-5 text-muted">{t("pmfby_kcc_note", lang)}</p>
      </section>


      {/* Blockers */}
      {blockers.length > 0 && (
        <section className={`${CARD} space-y-3`}>
          <h2 className="text-[20px] font-semibold leading-7 text-ink">
            {t("fix_first", lang).replace("{amount}", money(blockedTotal))}
          </h2>
          {blockers.map((r) => (
            <div key={r.id} className="space-y-1">
              <p className="text-[17px] font-semibold text-ink">
                {bi(lang, schemes[r.id]?.name_te, schemes[r.id]?.name_en) || r.id} —{" "}
                {money(r.blocked_per_year)}/{t("year_unit", lang)}
              </p>
              {r.fixes.map((x, i) => (
                <p key={i} className="text-[17px] leading-6 text-ink">
                  {t("fix_label", lang)} {bi(lang, x.te, x.en)}
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
            <SchemeCard key={r.id} r={r} s={schemes[r.id]} lang={lang} tenure={tenure} crop={answers?.crop} />
          ))}
        </section>
      ))}

      {/* Documents */}
      {docResults.length > 0 && (
        <section className={`${CARD} space-y-4`}>
          <h2 className="text-[20px] font-semibold leading-7 text-ink">{t("documents", lang)}</h2>
          <p className="text-[14px] leading-5 text-muted">{t("docs_hint", lang)}</p>
          {docResults.map((r) => {
            const docs = docsFor(r);
            const allReady = docs.every((_, i) => docDone[`${r.id}:${i}`]);
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
                    const ready = Boolean(docDone[key]);
                    const doc = docForTenure(d, tenure);
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          aria-pressed={ready}
                          onClick={() => toggleDoc(key)}
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
      )}





      {/* Status decoder */}
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

      {/* Actions */}
      <section className="space-y-3">
        <button
          type="button"
          onClick={shareWhatsApp}
          className="w-full h-14 rounded-full bg-[#1B5E20] text-[17px] font-semibold text-white"
        >
          {t("btn_whatsapp", lang)}
        </button>
        <button type="button" onClick={printChecklist} className={OUTLINE_BTN}>
          {t("btn_checklist", lang)}
        </button>
        {printMsg && <p className="text-[14px] text-muted">{printMsg}</p>}
        <button
          type="button"
          onClick={speakSummary}
          className={voiceHelpOn ? `${OUTLINE_BTN} ring-2 ring-[#1B5E20]` : OUTLINE_BTN}
        >
          {speaking ? t("speaking", lang) : t("btn_listen", lang)}
        </button>
        {speaking && (
          <button type="button" onClick={stopSpeaking} className={OUTLINE_BTN}>
            {t("stop_speaking", lang)}
          </button>
        )}
        {speechMsg && <p className="text-[14px] text-muted">{speechMsg}</p>}
        <button
          type="button"
          aria-pressed={helper}
          onClick={toggleHelper}
          className={OUTLINE_BTN}
        >
          {t("helper_toggle", lang)}
        </button>
        {helper && (
          <p className="text-[17px] leading-6 text-muted">{t("helper_on", lang)}</p>
        )}
        <button type="button" onClick={startAgain} className={OUTLINE_BTN}>
          {t("btn_start_again", lang)}
        </button>
      </section>

    </div>
  );
}
