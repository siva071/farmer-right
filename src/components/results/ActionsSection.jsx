import { t } from "../../i18n.js";
import { OUTLINE_BTN } from "../../lib/resultsConfig.js";

// Action buttons at the bottom of Results: WhatsApp, checklist, voice, helper, start again.
export default function ActionsSection({
  lang,
  voiceHelpOn,
  speaking,
  speechMsg,
  printMsg,
  helper,
  onShare,
  onPrint,
  onSpeak,
  onStopSpeaking,
  onToggleHelper,
  onStartAgain,
}) {
  return (
    <section className="surface-card space-y-3">
      <div className="space-y-1">
        <h2 className="section-heading">{t("results_title", lang)}</h2>
      </div>

      <button
        type="button"
        onClick={onShare}
        className="flex min-h-[56px] w-full items-center justify-center rounded-full bg-[#1B5E20] px-5 text-[17px] font-bold text-white shadow-[0_10px_24px_rgba(27,94,32,0.18)]"
      >
        {t("btn_whatsapp", lang)}
      </button>

      <button type="button" onClick={onPrint} className={OUTLINE_BTN}>
        {t("btn_checklist", lang)}
      </button>
      {printMsg && <p className="text-[14px] leading-5 text-muted">{printMsg}</p>}

      <button
        type="button"
        onClick={onSpeak}
        className={voiceHelpOn ? `${OUTLINE_BTN} ring-2 ring-[#1B5E20]` : OUTLINE_BTN}
      >
        {speaking ? t("speaking", lang) : t("btn_listen", lang)}
      </button>
      {speaking && (
        <button type="button" onClick={onStopSpeaking} className={OUTLINE_BTN}>
          {t("stop_speaking", lang)}
        </button>
      )}
      {speechMsg && <p className="text-[14px] leading-5 text-muted">{speechMsg}</p>}

      <button
        type="button"
        aria-pressed={helper}
        onClick={onToggleHelper}
        className={OUTLINE_BTN}
      >
        {t("helper_toggle", lang)}
      </button>
      {helper && <p className="text-[16px] leading-6 text-muted">{t("helper_on", lang)}</p>}

      <button type="button" onClick={onStartAgain} className={OUTLINE_BTN}>
        {t("btn_start_again", lang)}
      </button>
    </section>
  );
}
