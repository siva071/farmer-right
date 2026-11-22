// Voice mode for the questionnaire: reads the question and its options aloud, listens
// (te-IN, en-IN when lang is "en"), and turns a spoken phrase into the same answer a tap gives.
import { useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { getLangVoice } from "./voice.js";
import { matchOption, normalizeSpeech, optionListText } from "./voiceOptions.js";

export function useVoiceAnswers({ lang, step, index, options, onPick, onNote }) {
  const [listening, setListening] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [speakMsg, setSpeakMsg] = useState("");
  const [heard, setHeard] = useState("");
  const speakTokenRef = useRef(0);
  const recRef = useRef(null);
  // Message ids already shown this run. The hook stays mounted across steps, so each
  // message appears at most once per page session (a fresh mount resets it).
  const shownRef = useRef(new Set());
  const once = (id) => {
    if (shownRef.current.has(id)) return false;
    shownRef.current.add(id);
    return true;
  };
  const showUnavailable = (setter) => {
    if (once("voice_unavailable")) setter(t("voice_unavailable", lang));
  };
  const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const voiceHelpOn = localStorage.getItem("rh.voiceHelp") === "yes";

  useEffect(() => () => recRef.current?.abort?.(), []);

  // On unmount, stop any speech and ignore late speech callbacks.
  useEffect(
    () => () => {
      speakTokenRef.current += 1;
      window.speechSynthesis?.cancel?.();
    },
    [],
  );

  // Routes a recognised phrase: a matching option is picked (tap-equivalent); otherwise a
  // textarea step keeps the words as notes, and any other step asks the user to repeat.
  const handleVoice = (text) => {
    if (!normalizeSpeech(text)) return;
    const idx = matchOption(text, options);
    if (idx >= 0) {
      onPick(options[idx]);
      return;
    }
    if (step.textarea) onNote(text);
    else setVoiceMsg(t("voice_no_match", lang));
  };

  // Reads the question, then the options, aloud in the selected UI language.
  // Telugu falls back to English with a one-time notice when no Telugu voice is installed.
  // onDone runs once on end (or after timeoutMs if onend never fires); onFail on error.
  const speakQuestion = async (onDone, onFail, timeoutMs) => {
    const synth = window.speechSynthesis;
    const Utter = window.SpeechSynthesisUtterance;
    if (!synth || !Utter) {
      onFail();
      return;
    }
    const token = ++speakTokenRef.current;
    // Waits for the voice list to load; a newer tap supersedes this one.
    const voice = await getLangVoice(synth, lang);
    if (token !== speakTokenRef.current) return;
    const useTelugu = lang === "te";
    if (useTelugu && !voice && once("telugu_voice_missing")) {
      const msg = t("telugu_voice_missing", lang);
      setSpeakMsg(msg);
      setVoiceMsg(msg);
    }
    const spokenLang = useTelugu ? "te" : "en";
    const prompt = useTelugu ? step.prompt.te : step.prompt.en;
    const text = options.length ? `${prompt}. ${optionListText(options, spokenLang)}` : prompt;
    let timer = null;
    let finished = false;
    const finish = (ok) => {
      if (finished || token !== speakTokenRef.current) return;
      finished = true;
      clearTimeout(timer);
      setSpeaking(false);
      if (ok) onDone();
      else onFail();
    };
    try {
      synth.cancel();
      const u = new Utter(text);
      u.lang = useTelugu ? "te-IN" : voice?.lang || "en-IN";
      if (voice && (useTelugu || lang === "en")) u.voice = voice;
      u.onend = () => finish(true);
      u.onerror = () => finish(false);
      setSpeaking(true);
      if (timeoutMs) timer = setTimeout(() => finish(true), timeoutMs);
      synth.speak(u);
    } catch {
      finished = true;
      clearTimeout(timer);
      setSpeaking(false);
      onFail();
    }
  };

  const speakButton = () => {
    setSpeakMsg("");
    speakQuestion(
      () => {},
      () => showUnavailable(setSpeakMsg),
      15000,
    );
  };

  // Starts recognition in the selected UI language. Every exit path clears listening or shows a message.
  const startRecognition = () => {
    if (!SR) {
      showUnavailable(setVoiceMsg);
      return;
    }
    const rec = new SR();
    rec.lang = lang === "te" ? "te-IN" : "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let gotResult = false;
    let handled = false;
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? "";
      gotResult = Boolean(transcript.trim());
      setHeard(transcript);
      // One utterance is handled once, so it cannot record or toggle twice.
      if (handled) return;
      handled = true;
      handleVoice(transcript);
    };
    rec.onend = () => {
      setListening(false);
      if (!gotResult) showUnavailable(setVoiceMsg);
    };
    rec.onerror = () => {
      setListening(false);
      showUnavailable(setVoiceMsg);
    };
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
      showUnavailable(setVoiceMsg);
    }
  };

  // Mic tap: speak the question and options first, then listen.
  const startVoice = () => {
    setVoiceMsg("");
    setHeard("");
    if (!SR) {
      showUnavailable(setVoiceMsg);
      return;
    }
    speakQuestion(
      startRecognition,
      () => showUnavailable(setVoiceMsg),
      15000,
    );
  };

  // Voice help on: read each question aloud when its screen opens, then start the mic only
  // if the speech finished. A blocked or failed speech shows voice_unavailable and no mic.
  // Runs on mount and on each step change; the speaker and mic buttons still work.
  useEffect(() => {
    recRef.current?.abort?.();
    recRef.current = null;
    setListening(false);
    setHeard("");
    setVoiceMsg("");
    setSpeakMsg("");
    if (!voiceHelpOn) return;
    speakQuestion(
      startRecognition,
      () => showUnavailable(setVoiceMsg),
      15000,
    );
  }, [index, lang]);

  return { SR, voiceHelpOn, listening, voiceMsg, speaking, speakMsg, heard, speakButton, startVoice };
}
