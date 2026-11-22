import SchemeCard from "./SchemeCard.jsx";
import { GROUP_ORDER } from "../../lib/resultsConfig.js";
import { groupLabel } from "../../lib/resultsHelpers.js";

// Scheme cards under a heading per eligibility group, in GROUP_ORDER. Empty groups are skipped.
export default function SchemeGroups({ groups, schemes, lang, tenure, crop, applied = [], onToggleApplied }) {
  return (
    <>
      {GROUP_ORDER.filter((g) => groups[g].length > 0).map((g) => (
        <section key={g} className="space-y-3">
          <div className="space-y-1 px-1">
            <h2 className="section-heading">{groupLabel(lang, g)}</h2>
          </div>
          {groups[g].map((r) => (
            <SchemeCard
              key={r.id}
              r={r}
              s={schemes[r.id]}
              lang={lang}
              tenure={tenure}
              crop={crop}
              applied={applied}
              onToggleApplied={onToggleApplied}
            />
          ))}
        </section>
      ))}
    </>
  );
}
