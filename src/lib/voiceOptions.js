// Pure helpers for voice answers: normalising speech, matching a spoken phrase to one
// option, and building the "Option 1: ..., Option 2: ..." text that is read aloud.

import { labelOf } from "./questionSteps.js";

// Spoken forms for option 1, 2, 3, ... (English, Telugu romanised, Telugu script).
const ORDINAL_WORDS = [
  ["one", "first", "okati", "modati", "ఒకటి", "మొదటి", "వన్", "1"],
  ["two", "second", "rendu", "rendava", "రెండు", "రెండవ", "టూ", "2"],
  ["three", "third", "moodu", "mudu", "మూడు", "మూడవ", "త్రీ", "3"],
  ["four", "fourth", "naalugu", "nalugu", "నాలుగు", "నాలుగవ", "ఫోర్", "4"],
  ["five", "fifth", "aidu", "ayidu", "ఐదు", "ఐదవ", "ఫైవ్", "5"],
  ["six", "sixth", "aaru", "aru", "ఆరు", "ఆరవ", "సిక్స్", "6"],
  ["seven", "seventh", "edu", "yedu", "ఏడు", "ఏడవ", "సెవెన్", "7"],
  ["eight", "eighth", "enimidi", "ఎనిమిది", "ఎనిమిదవ", "ఎయిట్", "8"],
  ["nine", "ninth", "tommidi", "తొమ్మిది", "తొమ్మిదవ", "నైన్", "9"],
  ["ten", "tenth", "padi", "పది", "పదవ", "టెన్", "10"],
  ["eleven", "eleventh", "ఎలెవెన్", "11"],
];

// Number words used when reading options aloud: "Option one", "ఆప్షన్ ఒకటి".
const SPOKEN_OPTION_NUMBERS = [
  { te: "ఒకటి", en: "one" },
  { te: "రెండు", en: "two" },
  { te: "మూడు", en: "three" },
  { te: "నాలుగు", en: "four" },
  { te: "ఐదు", en: "five" },
  { te: "ఆరు", en: "six" },
  { te: "ఏడు", en: "seven" },
  { te: "ఎనిమిది", en: "eight" },
  { te: "తొమ్మిది", en: "nine" },
  { te: "పది", en: "ten" },
  { te: "ఎలెవెన్", en: "eleven" },
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
  const dashParts = s.split(/\s*[—–]\s*/);
  return [s, ...dashParts, ...inner].map(normalizeSpeech).filter(Boolean);
}

function valueForm(opt) {
  return typeof opt.value === "string" ? normalizeSpeech(opt.value) : "";
}

// Every form an option answers to, used for exact matches (short labels allowed).
function exactForms(opt, index) {
  const value = valueForm(opt);
  return [
    ...labelAliases(opt.en),
    ...labelAliases(opt.te),
    ...(value ? [value] : []),
    ...ordinalPhrases(index),
  ];
}

// Label words used for word-boundary matches. English labels of 2 chars or fewer are ignored.
function wordForms(opt) {
  const en = labelAliases(opt.en).filter((a) => a.length > 2);
  const value = valueForm(opt);
  return [...en, ...labelAliases(opt.te), ...(value.length > 2 ? [value] : [])];
}

function ordinalPhrases(index) {
  const words = ORDINAL_WORDS[index];
  if (!words) return [];
  return words
    .flatMap((w) => [w, `option ${w}`, `${w} option`, `ఆప్షన్ ${w}`, `${w} ఆప్షన్`])
    .map(normalizeSpeech);
}

// Option-marker phrases only, so "no one" cannot match option "one" by accident.
function ordinalOptionPhrases(index) {
  return ordinalPhrases(index).filter((p) => p.includes("option") || p.includes("ఆప్షన్"));
}

// Returns the index of the one option the phrase names, or -1 when none or several match.
// Tiers: exact form, then ordinal phrase as whole words, then label words as whole words.
export function matchOption(transcript, options) {
  const q = normalizeSpeech(transcript);
  if (!q) return -1;
  const pad = ` ${q} `;
  const tiers = [
    (o, i) => exactForms(o, i).includes(q),
    (o, i) => ordinalOptionPhrases(i).some((p) => pad.includes(` ${p} `)),
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

function spokenNumber(index, lang) {
  const n = SPOKEN_OPTION_NUMBERS[index];
  if (!n) return String(index + 1);
  return lang === "te" ? n.te : n.en;
}

// "Option one: <text>, Option two: <text>, ..." in the given language.
export function optionListText(options, lang) {
  const prefix = lang === "te" ? "ఆప్షన్" : "Option";
  return options.map((o, i) => `${prefix} ${spokenNumber(i, lang)}: ${labelOf(o, lang)}`).join(", ");
}
