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
import { bi, docForTenure, documentsFor, groupLabel, money, readHelper } from "../lib/resultsHelpers.js";
import { openChecklistWindow } from "../lib/resultsPrint.js";
import { useAppliedSchemes } from "../lib/useAppliedSchemes.js";
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
  const { applied, toggleApplied } = useAppliedSchemes();
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
  const likelyNamesEn = groups.likely.map((r) => bi("en", schemes[r.id]?.name_te, schemes[r.id]?.name_en) || r.id);
  const tenure = answers?.tenure;
  const docsFor = (r) => documentsFor(schemes[r.id], tenure);
  const docResults = ordered.filter((r) => docsFor(r).length > 0);
  // Manual "Mark as applied" applies to Likely and May-be cards only.
  const eligibleIds = [...groups.likely, ...groups.maybe].map((r) => r.id);
  const appliedCount = eligibleIds.filter((id) => applied.includes(id)).length;
  // Ready = a tap overrides the default; with no tap yet, the CCRC card is Ready when has_ccrc is true.
  const ccrcYes = answers?.has_ccrc === true;
  const isDocReady = (key, d) =>
    docDone[key] ?? (ccrcYes && docForTenure(d, tenure).en === "CCRC card");

  const summaryText = t("summary_line", lang)
    .replace("{season}", seasonShown)
    .replace("{amount}", money(total))
    .replace("{names}", likelyNames.join(", ") || t("summary_none", lang));
  const summaryTextEn = t("summary_line", "en")
    .replace("{season}", season)
    .replace("{amount}", money(total))
    .replace("{names}", likelyNamesEn.join(", ") || t("summary_none", "en"));
  const { speaking, speechMsg, speakSummary, stopSpeaking } = useResultsSpeech(lang, summaryText, summaryTextEn);

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
      <div className="app-page max-w-[390px] mx-auto">
        <section className="surface-card space-y-4">
          <div className="space-y-1">
            <p className="section-kicker">{t("analysis_title", lang)}</p>
            <h1 className="section-heading">{t("results_title", lang)}</h1>
          </div>
          <p className="text-[16px] leading-6 text-muted">{t("no_answers", lang)}</p>
          <button type="button" onClick={() => onNavigate("home")} className={OUTLINE_BTN}>
            {t("btn_back_home", lang)}
          </button>
        </section>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="app-page max-w-[390px] mx-auto">
        <section className="surface-card space-y-3">
          <p className="section-kicker">{t("analysis_title", lang)}</p>
          <p className="text-[17px] text-muted">{t("results_loading", lang)}</p>
        </section>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="app-page max-w-[390px] mx-auto">
        <section className="surface-card space-y-3">
          <p className="section-kicker">{t("analysis_title", lang)}</p>
          <p className="text-[17px] leading-6 text-ink">
            {t("results_error", lang)} ({state.message})
          </p>
        </section>
      </div>
    );
  }

  function printChecklist() {
    setPrintMsg(openChecklistWindow({ lang, tenure, docResults, docsFor, ordered, schemes }));
  }

  function shareWhatsApp() {
    const text = `${t("app_name", lang)} ${season}: likely eligible — ${
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

  const analysisStats = [
    { label: groupLabel(lang, "likely"), value: groups.likely.length, tone: "bg-[#DCFCE7] text-[#15803D]" },
    { label: groupLabel(lang, "maybe"), value: groups.maybe.length, tone: "bg-[#FEF3C7] text-[#92400E]" },
    { label: groupLabel(lang, "not"), value: groups.not.length, tone: "bg-[#F5F5F4] text-[#57534E]" },
    { label: t("schemes_checked", lang), value: ordered.length, tone: "bg-primary-container text-primary" },
  ];

  return (
    <div className="app-page max-w-[390px] mx-auto">
      <section ref={heroRef} className="page-hero space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="chip bg-white/15 text-white">{seasonShown}</span>
          <span className="chip bg-white/15 text-white">
            {t("schemes_checked", lang)}: {ordered.length}
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-[15px] font-semibold text-white/80">{t("per_year", lang)}</p>
          <p className="text-[46px] leading-[54px] font-bold">{money(total)}</p>
          <p className="text-[15px] leading-6 text-white/85">{t("analysis_subtitle", lang)}</p>
        </div>
        <p className="rounded-2xl bg-white/10 p-3 text-[13px] leading-5 text-white/85">
          {t("pmfby_kcc_note", lang)}
        </p>
      </section>

      <section className="surface-card space-y-4">
        <div className="space-y-1">
          <p className="section-kicker">{t("analysis_title", lang)}</p>
          <h2 className="section-heading">{t("results_title", lang)}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {analysisStats.map((stat) => (
            <div key={stat.label} className="rounded-[18px] border border-outline bg-[#F8FAF5] p-3">
              <p className={`chip mb-2 ${stat.tone}`}>{stat.value}</p>
              <p className="text-[13px] font-semibold leading-5 text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {blockers.length > 0 && (
        <BlockersSection blockers={blockers} blockedTotal={blockedTotal} schemes={schemes} lang={lang} />
      )}

      <SchemeGroups
        groups={groups}
        schemes={schemes}
        lang={lang}
        tenure={tenure}
        crop={answers?.crop}
        applied={applied}
        onToggleApplied={toggleApplied}
      />

      {docResults.length > 0 && (
        <DocumentsSection
          docResults={docResults}
          docsFor={docsFor}
          schemes={schemes}
          tenure={tenure}
          lang={lang}
          isDocReady={isDocReady}
          toggleDoc={toggleDoc}
          appliedCount={appliedCount}
          appliedTotal={eligibleIds.length}
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

