// Date and region helpers split out of match.js. Pure functions, no dependencies.

const MS_PER_DAY = 86400000;

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Month is 0-based (Jan = 0). Nov-Mar = Rabi, Jun-Oct = Kharif, Apr-May = Summer.
export function seasonFromDate(date) {
  const m = date.getMonth();
  const y = date.getFullYear();
  if (m >= 10 || m <= 2) {
    const start = m >= 10 ? y : y - 1;
    return { season: "Rabi", label: `Rabi ${start}-${pad2((start + 1) % 100)}` };
  }
  if (m >= 5 && m <= 9) return { season: "Kharif", label: `Kharif ${y}` };
  return { season: "Summer", label: `Summer ${y}` };
}

export function daysUntil(deadlineIso, now = new Date()) {
  if (!deadlineIso) return null;
  const target = Date.parse(deadlineIso);
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - now.getTime()) / MS_PER_DAY);
}

export function regionForDistrict(name, schemesJson) {
  const map = schemesJson?.district_region;
  if (!map || !Object.prototype.hasOwnProperty.call(map, name)) return null;
  return map[name];
}
