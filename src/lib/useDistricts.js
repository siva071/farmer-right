// Loads the district list from /schemes.json for the district step. Empty on failure.
import { useEffect, useState } from "react";

export function useDistricts() {
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/schemes.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json) => {
        if (cancelled) return;
        const te = json.district_te || {};
        const list = Object.keys(json.district_region || {}).map((name) => ({
          value: name,
          te: te[name] || name,
          en: name,
        }));
        setDistricts(list);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return districts;
}
