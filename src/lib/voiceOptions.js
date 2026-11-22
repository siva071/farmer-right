// Pure helpers for voice answers: normalising speech, matching a spoken phrase to one
// option, and building the "Option 1: ..., Option 2: ..." text that is read aloud.

import { labelOf } from "./questionSteps.js";

// Spoken forms for option 1, 2, 3, ... (English, Telugu romanised, Telugu script).
const ORDINAL_WORDS = [
  ["one", "first", "okati", "modati", "ఒకటి", "మొదటి"],
  ["two", "second", "rendu", "rendava", "రెండు", "రెండవ"],
  ["three", "third", "moodu", "mudu", "మూడు", "మూడవ"],
  ["four", "fourth", "naalugu", "nalugu", "నాలుగు", "నాలుగవ"],
  ["five", "fifth", "aidu", "ayidu", "ఐదు", "ఐదవ"],
  ["six", "sixth", "aaru", "aru", "ఆరు", "ఆరవ"],
  ["seven", "seventh", "edu", "yedu", "ఏడు", "ఏడవ"],
  ["eight", "eighth", "enimidi", "ఎనిమిది", "ఎనిమిదవ"],
  ["nine", "ninth", "tommidi", "తొమ్మిది", "తొమ్మిదవ"],
];

// Lowercase, drop ZWNJ/ZWJ, turn punctuation into spaces (Telugu vowel signs are kept).
export function normalizeSpeech(s) {
  return String(s || "")
    .replace(/[\u200c\u200d]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Whole label plus any parenthetical part, e.g. "Leased (tenant)" -> "leased tenant", "tenant".
function labelAliases(text) {
  const s = String(text || "");
  const inner = [...s.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
  return [s, ...inner].map(normalizeSpeech).filter(Boolean);
}

// Every form an option answers to, used for exact matches (short labels allowed).
function exactForms(opt, index) {
  return [
    ...labelAliases(opt.en),
    ...labelAliases(opt.te),
    ...ordinalPhrases(index),
  ];
}

// Label words used for word-boundary matches. English labels of 2 chars or fewer are ignored.
function wordForms(opt) {
  const en = labelAliases(opt.en).filter((a) => a.length > 2);
  return [...en, ...labelAliases(opt.te)];
}

function ordinalPhrases(index) {
  const words = ORDINAL_WORDS[index];
  if (!words) return [];
  return words.flatMap((w) => [w, `option ${w}`, `${w} option`]).map(normalizeSpeech);
}

// Returns the index of the one option the phrase names, or -1 when none or several match.
// Tiers: exact form, then ordinal phrase as whole words, then label words as whole words.
export function matchOption(transcript, options) {
  const q = normalizeSpeech(transcript);
  if (!q) return -1;
  const pad = ` ${q} `;
  const tiers = [
    (o, i) => exactForms(o, i).includes(q),
    (o, i) => ordinalPhrases(i).some((p) => pad.includes(` ${p} `)),
    (o) => wordForms(o).some((a) => pad.includes(` ${a} `)),
  ];
  for (const hit of tiers) {
    const found = [];
    options.forEach((o, i) => {
      if (hit(o, i)) found.push(i);
    });
    if (found.length === 1) return found[0];
    if (found.length > 1) return -1;
  }
  return -1;
}

// "Option 1: <text>, Option 2: <text>, ..." in the given language.
export function optionListText(options, lang) {
  return options.map((o, i) => `Option ${i + 1}: ${labelOf(o, lang)}`).join(", ");
}
