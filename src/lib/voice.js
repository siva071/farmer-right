// Shared Telugu voice lookup for speechSynthesis.
// Voices load asynchronously on many phones, so an empty getVoices() on first call
// does not mean "no Telugu voice". Wait for voiceschanged, up to timeoutMs.

const isTelugu = (v) => /^te/i.test(v?.lang || "");

// Resolves to the first voice whose lang starts with "te", or null.
export function getTeluguVoice(synth, timeoutMs = 1500) {
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
      resolve(initial.find(isTelugu) || null);
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
      if (list.length > 0) finish(list.find(isTelugu) || null);
    }

    if (useEvents) synth.addEventListener("voiceschanged", onChanged);
    else synth.onvoiceschanged = onChanged;
    timer = setTimeout(() => finish(null), timeoutMs);
  });
}
