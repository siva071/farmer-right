import { useEffect, useRef, useState } from "react";
import {
  evaluateSchemes,
  totalCashPerYear,
  blockersRanked,
  seasonFromDate,
} from "../lib/match.js";
import { t } from "../i18n.js";
import { scrollScreenToElement } from "../lib/scrollScreen.js";
import { ANSWERS_KEY, GROUP_ORDER, HELPER_KEY, OUTLINE_BTN } from "../lib/resultsConfig.js";
import { bi, docForTenure, documentsFor, money, readHelper } from "../lib/resultsHelpers.js";
import { openChecklistWindow } from "../lib/resultsPrint.js";
import { useResultsSpeech } from "../lib/useResultsSpeech.js";
import BlockersSection from "../components/results/BlockersSection.jsx";
import SchemeGroups from "../components/results/SchemeGroups.jsx";
import DocumentsSection from "../components/results/DocumentsSection.jsx";
import DecoderSection from "../components/results/DecoderSection.jsx";
import ActionsSection from "../components/results/ActionsSection.jsx";

export default function Results({ lang, answers, onNavigate }) {
  const hasAnswers = Boolean(answers) && Object.keys(answers).length > 0;
  const voiceHelpOn = localStorage.getItem("rh.voiceHelp") === "yes";
  const [state, setState] = useState({ status: "loading", results: [], schemes: {}, message: "" });
  const [helper, setHelper] = useState(readHelper);
  // Document tap state: key is `${schemeId}:${index}`, true = Ready. Starts Still needed,
  // except the CCRC card when the tenant answered Yes to CCRC (see isDocReady).
  const [docDone, setDocDone] = useState({});
  // Print status shown near the checklist button.
  const [printMsg, setPrintMsg] = useState("");
  const heroRef = useRef(null);

  // Derived data runs before the early returns so every hook runs each render; empty until loaded.
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
  const docsFor = (r) => documentsFor(schemes[r.id], tenure);
  const docResults = ordered.filter((r) => docsFor(r).length > 0);
  // Ready = a tap overrides the default; with no tap yet, the CCRC card is Ready when has_ccrc is true.
  const ccrcYes = answers?.has_ccrc === true;
  const isDocReady = (key, d) =>
    docDone[key] ?? (ccrcYes && docForTenure(d, tenure).en === "CCRC card");

  const summaryText = `${season}. Total ${money(total)} per year. Likely eligible: ${
    likelyNames.join(", ") || "none"
  }.`;
  const { speaking, speechMsg, speakSummary, stopSpeaking } = useResultsSpeech(lang, summaryText);

  useEffect(() => {
    if (!answers || Object.keys(answers).length === 0) return undefined;
    let cancelled = false;
    fetch("/schemes.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json) => {
        if (cancelled) return;
        const list = [...json.schemes];
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
    scrollScreenToElement(heroRef.current);
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

  function printChecklist() {
    setPrintMsg(openChecklistWindow({ lang, tenure, docResults, docsFor, ordered, schemes }));
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

  function toggleDoc(key, current) {
    setDocDone((prev) => ({ ...prev, [key]: !current }));
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
      <h1 className="text-[28px] leading-9 font-bold text-ink">{seasonShown}</h1>

      {/* Hero: yearly cash only */}
      <section ref={heroRef} className="rounded-[20px] border border-[#E3E6DF] bg-surface p-4 space-y-1">
        <p className="text-[44px] leading-[52px] font-bold text-ink">{money(total)}</p>
        <p className="text-[17px] text-muted">{t("per_year", lang)}</p>
        <p className="text-[14px] leading-5 text-muted">{t("pmfby_kcc_note", lang)}</p>
      </section>

      {blockers.length > 0 && (
        <BlockersSection blockers={blockers} blockedTotal={blockedTotal} schemes={schemes} lang={lang} />
      )}

      <SchemeGroups groups={groups} schemes={schemes} lang={lang} tenure={tenure} crop={answers?.crop} />

      {docResults.length > 0 && (
        <DocumentsSection
          docResults={docResults}
          docsFor={docsFor}
          schemes={schemes}
          tenure={tenure}
          lang={lang}
          isDocReady={isDocReady}
          toggleDoc={toggleDoc}
        />
      )}

      <DecoderSection lang={lang} tenure={tenure} />

      <ActionsSection
        lang={lang}
        voiceHelpOn={voiceHelpOn}
        speaking={speaking}
        speechMsg={speechMsg}
        printMsg={printMsg}
        helper={helper}
        onShare={shareWhatsApp}
        onPrint={printChecklist}
        onSpeak={speakSummary}
        onStopSpeaking={stopSpeaking}
        onToggleHelper={toggleHelper}
        onStartAgain={startAgain}
      />
    </div>
  );
}

