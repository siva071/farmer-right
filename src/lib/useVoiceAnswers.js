// Voice mode for the questionnaire: reads the question and its options aloud, listens
// (te-IN, en-IN when lang is "en"), and turns a spoken phrase into the same answer a tap gives.
import { useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { getTeluguVoice } from "./voice.js";
import { matchOption, normalizeSpeech, optionListText } from "./voiceOptions.js";

export function useVoiceAnswers({ lang, step, index, options, onPick, onNote }) {
  const [listening, setListening] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [speakMsg, setSpeakMsg] = useState("");
  const [heard, setHeard] = useState("");
  const speakTokenRef = useRef(0);
  const recRef = useRef(null);
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

  // Reads the question, then the options, aloud: Telugu voice if installed, otherwise English.
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
    const teVoice = await getTeluguVoice(synth);
    if (token !== speakTokenRef.current) return;
    if (!teVoice) {
      // No Telugu voice: say so, then speak English for this tap only.
      const msg = t("telugu_voice_missing", lang);
      setSpeakMsg(msg);
      setVoiceMsg(msg);
    }
    const spokenLang = teVoice ? "te" : "en";
    const prompt = teVoice ? step.prompt.te : step.prompt.en;
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
      u.lang = teVoice ? "te-IN" : "en-IN";
      if (teVoice) u.voice = teVoice;
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
      () => setSpeakMsg(t("voice_unavailable", lang)),
      15000,
    );
  };

  // Starts recognition (te-IN). Every exit path clears listening or shows a message.
  const startRecognition = () => {
    if (!SR) {
      setVoiceMsg(t("voice_unavailable", lang));
      return;
    }
    const rec = new SR();
    rec.lang = "te-IN";
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
      if (!gotResult) setVoiceMsg(t("voice_unavailable", lang));
    };
    rec.onerror = () => {
      setListening(false);
      setVoiceMsg(t("voice_unavailable", lang));
    };
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
      setVoiceMsg(t("voice_unavailable", lang));
    }
  };

  // Mic tap: speak the question and options first, then listen.
  const startVoice = () => {
    setVoiceMsg("");
    setHeard("");
    if (!SR) {
      setVoiceMsg(t("voice_unavailable", lang));
      return;
    }
    speakQuestion(
      startRecognition,
      () => setVoiceMsg(t("voice_unavailable", lang)),
      15000,
    );
  };

  // Voice help on: read each question aloud when its screen opens, then start the mic only
  // if the speech finished. A blocked or failed speech shows voice_unavailable and no mic.
  // Runs on mount and on each step change; the speaker and mic buttons still work.
  useEffect(() => {
    setVoiceMsg("");
    setSpeakMsg("");
    if (!voiceHelpOn) return;
    speakQuestion(
      startRecognition,
      () => setVoiceMsg(t("voice_unavailable", lang)),
      15000,
    );
  }, [index]);

  return { SR, listening, voiceMsg, speaking, speakMsg, heard, speakButton, startVoice };
}
