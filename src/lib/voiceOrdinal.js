// Fallback ordinal picker for voice answers. Used only when matchOption finds nothing,
// so phrases like "Option three" / "ఆప్షన్ మూడు" still select the right option.
import { normalizeSpeech } from "./voiceOptions.js";

const NUM = {
  one: 0, first: 0, "1": 0, "ఒకటి": 0, "మొదటి": 0,
  two: 1, second: 1, "2": 1, "రెండు": 1, "రెండవ": 1,
  three: 2, third: 2, "3": 2, "మూడు": 2, "మూడవ": 2,
  four: 3, fourth: 3, "4": 3, "నాలుగవ": 3,
  five: 4, fifth: 4, "5": 4, "ఐదు": 4, "ఐదవ": 4,
  six: 5, sixth: 5, "6": 5, "ఆరు": 5, "ఆరవ": 5,
  seven: 6, seventh: 6, "7": 6, "ఏడు": 6, "ఏడవ": 6,
  eight: 7, eighth: 7, "8": 7, "ఎనిమిది": 7, "ఎనిమిదవ": 7,
  nine: 8, ninth: 8, "9": 8, "తొమ్మిది": 8, "తొమ్మిదవ": 8,
  ten: 9, tenth: 9, "10": 9, "పది": 9, "పదవ": 9,
  eleven: 10, "11": 10, "ఎలెవెన్": 10,
};

// Returns the option index a spoken ordinal names, or -1.
// Requires an "option"/"ఆప్షన్" marker, or a single-number phrase, so "no one" cannot
// accidentally pick option one.
export function ordinalPick(text, count) {
  const q = normalizeSpeech(text);
  if (!q) return -1;
  const tokens = q.split(" ").filter(Boolean);
  if (!tokens.length) return -1;
  const marked = tokens.some((w) => w === "option" || w === "ఆప్షన్");
  const single = tokens.length === 1;
  for (const w of tokens) {
    if (!Object.hasOwn(NUM, w)) continue;
    const idx = NUM[w];
    if (!marked && !single) continue;
    if (idx < count) return idx;
  }
  return -1;
}
