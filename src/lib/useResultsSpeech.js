import { useRef, useState } from "react";
import { t } from "../i18n.js";
import { getTeluguVoice } from "./voice.js";

// Speech state and handlers for the summary Listen / Stop buttons on Results.
export function useResultsSpeech(lang, summaryText) {
  // Speech status shown near the buttons.
  const [speaking, setSpeaking] = useState(false);
  const [speechMsg, setSpeechMsg] = useState("");
  const utterRef = useRef(null);
  // Bumped by each Listen tap and by Stop, so a pending voice lookup can be dropped.
  const summaryReqRef = useRef(0);

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

  return { speaking, speechMsg, speakSummary, stopSpeaking };
}
