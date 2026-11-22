// Shared voice lookup for speechSynthesis.
// Voices load asynchronously on many phones, so an empty getVoices() on first call
// does not mean "no voice". Wait for voiceschanged, up to timeoutMs.

const voiceLang = (v) => String(v?.lang || "").toLowerCase();

function findVoice(list, lang) {
  const prefix = lang === "te" ? "te" : "en";
  const exact = `${prefix}-in`;
  return (
    list.find((v) => voiceLang(v) === exact) ||
    list.find((v) => voiceLang(v).startsWith(`${prefix}-`)) ||
    list.find((v) => voiceLang(v).startsWith(prefix)) ||
    null
  );
}

function getVoiceForLang(synth, lang = "en", timeoutMs = 1500) {
  return new Promise((resolve) => {
    if (!synth) {
      resolve(null);
      return;
    }

    let initial = [];
    try {
      initial = synth.getVoices?.() || [];
    } catch {
      initial = [];
    }
    if (initial.length > 0) {
      resolve(findVoice(initial, lang));
      return;
    }

    let done = false;
    let timer = null;
    const useEvents = typeof synth.addEventListener === "function";

    const finish = (voice) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (useEvents) synth.removeEventListener("voiceschanged", onChanged);
      else if (synth.onvoiceschanged === onChanged) synth.onvoiceschanged = null;
      resolve(voice);
    };

    function onChanged() {
      let list = [];
      try {
        list = synth.getVoices?.() || [];
      } catch {
        list = [];
      }
      if (list.length > 0) finish(findVoice(list, lang));
    }

    if (useEvents) synth.addEventListener("voiceschanged", onChanged);
    else synth.onvoiceschanged = onChanged;
    timer = setTimeout(() => finish(null), timeoutMs);
  });
}

// Resolves to a Telugu voice when installed, otherwise null.
export function getTeluguVoice(synth, timeoutMs = 1500) {
  return getVoiceForLang(synth, "te", timeoutMs);
}

export function getLangVoice(synth, lang, timeoutMs = 1500) {
  return getVoiceForLang(synth, lang === "te" ? "te" : "en", timeoutMs);
}
