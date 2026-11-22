import SchemeCard from "./SchemeCard.jsx";
import { GROUP_ORDER } from "../../lib/resultsConfig.js";
import { groupLabel } from "../../lib/resultsHelpers.js";

// Scheme cards under a heading per eligibility group, in GROUP_ORDER. Empty groups are skipped.
export default function SchemeGroups({ groups, schemes, lang, tenure, crop }) {
  return (
    <>
      {GROUP_ORDER.filter((g) => groups[g].length > 0).map((g) => (
        <section key={g} className="space-y-3">
          <h2 className="text-[20px] font-semibold leading-7 text-ink">{groupLabel(lang, g)}</h2>
          {groups[g].map((r) => (
            <SchemeCard key={r.id} r={r} s={schemes[r.id]} lang={lang} tenure={tenure} crop={crop} />
          ))}
        </section>
      ))}
    </>
  );
}

