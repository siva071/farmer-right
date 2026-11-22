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
    <section className="space-y-3">
      <button
        type="button"
        onClick={onShare}
        className="w-full h-14 rounded-full bg-[#1B5E20] text-[17px] font-semibold text-white"
      >
        {t("btn_whatsapp", lang)}
      </button>
      <button type="button" onClick={onPrint} className={OUTLINE_BTN}>
        {t("btn_checklist", lang)}
      </button>
      {printMsg && <p className="text-[14px] text-muted">{printMsg}</p>}
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
      {speechMsg && <p className="text-[14px] text-muted">{speechMsg}</p>}
      <button
        type="button"
        aria-pressed={helper}
        onClick={onToggleHelper}
        className={OUTLINE_BTN}
      >
        {t("helper_toggle", lang)}
      </button>
      {helper && <p className="text-[17px] leading-6 text-muted">{t("helper_on", lang)}</p>}
      <button type="button" onClick={onStartAgain} className={OUTLINE_BTN}>
        {t("btn_start_again", lang)}
      </button>
    </section>
  );
}

