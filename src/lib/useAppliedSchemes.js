import { useState } from "react";

const APPLIED_KEY = "rh.applied";

function readApplied() {
  try {
    const v = JSON.parse(localStorage.getItem(APPLIED_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// Manual "Mark as applied" state for Likely / May-be scheme cards. No auto-tracking.
export function useAppliedSchemes() {
  const [applied, setApplied] = useState(readApplied);

  const toggleApplied = (id) => {
    setApplied((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(APPLIED_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable; toggle still works for this session
      }
      return next;
    });
  };

  return { applied, toggleApplied };
}
