import { useEffect, useRef, useState } from "react";

const APPLIED_KEY = "rh.applied";

// Stable stringify so the same answers always produce the same scope key.
function stable(v) {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stable(v[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

// Scope key for the current farmer's answers; each run gets its own applied list.
export function answersKey(answers) {
  try {
    return stable(answers || {});
  } catch {
    return "";
  }
}

function readApplied(scope) {
  try {
    const v = JSON.parse(localStorage.getItem(APPLIED_KEY) || "null");
    if (v && v.k === scope && Array.isArray(v.ids)) {
      return v.ids.filter((x) => typeof x === "string");
    }
  } catch {
    // storage unavailable or old format
  }
  return [];
}

function writeApplied(scope, ids) {
  try {
    localStorage.setItem(APPLIED_KEY, JSON.stringify({ k: scope, ids }));
  } catch {
    // storage unavailable; toggle still works for this session
  }
}

// Manual "Mark as applied" state for Likely / May-be scheme cards, scoped to one
// set of answers so flags never leak across farmers. No auto-tracking.
export function useAppliedSchemes(scope = "") {
  const [applied, setApplied] = useState(() => readApplied(scope));
  const scopeRef = useRef(scope);

  // Answers changed (new run / different farmer): reload that scope's list.
  useEffect(() => {
    if (scopeRef.current === scope) return;
    scopeRef.current = scope;
    setApplied(readApplied(scope));
  }, [scope]);

  const toggleApplied = (id) => {
    setApplied((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeApplied(scope, next);
      return next;
    });
  };

  return { applied, toggleApplied };
}
