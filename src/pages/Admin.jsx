import { useState } from "react";

const CUSTOM_KEY = "rh.customSchemes";

const CARD = "rounded-2xl border border-[#E3E6DF] bg-surface p-4";
const INPUT =
  "w-full min-h-[48px] rounded-xl border border-[#E3E6DF] bg-surface px-3 py-2 text-[17px] text-ink";
const LABEL = "block text-[17px] font-semibold text-ink";
const HINT = "text-[14px] leading-5 text-muted";
const ERR_TEXT = "rounded-lg bg-[#FEE2E2] px-3 py-2 text-[14px] leading-5 text-[#B91C1C]";
const OUTLINE_BTN =
  "w-full min-h-[48px] rounded-full border border-[#E3E6DF] bg-surface px-4 text-[17px] font-semibold text-ink";

function pick(lang, te, en) {
  return lang === "te" ? te || en : en || te;
}

function readCustomSchemes() {
  try {
    const v = JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function writeCustomSchemes(list) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Returns an error message, or "" when the text is a JSON array (empty text counts as []).
function checkRules(text) {
  if (!text.trim()) return "";
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? "" : "Must be a JSON array, e.g. [ ]";
  } catch {
    return "Invalid JSON. Check commas, quotes and brackets.";
  }
}

function linesOf(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

const EMPTY = {
  nameEn: "",
  nameTe: "",
  benefit: "0",
  countsCash: false,
  benefitTextEn: "",
  benefitTextTe: "",
  officialLink: "",
  lastVerified: "",
  matchRules: "",
  notMatchRules: "",
  documents: "",
  steps: "",
};

function validate(f) {
  const e = {};
  if (!f.nameEn.trim()) e.nameEn = "Name (English) is required.";
  if (f.benefit === "" || Number.isNaN(Number(f.benefit)) || Number(f.benefit) < 0)
    e.benefit = "Enter a number, 0 or more.";
  if (f.officialLink.trim() && !f.officialLink.trim().startsWith("https://"))
    e.officialLink = "Link must start with https://";
  if (!f.lastVerified) e.lastVerified = "Last verified date is required.";
  const m = checkRules(f.matchRules);
  if (m) e.matchRules = m;
  const n = checkRules(f.notMatchRules);
  if (n) e.notMatchRules = n;
  return e;
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      <label className={LABEL}>{label}</label>
      {children}
      {error && <p role="alert" className={ERR_TEXT}>{error}</p>}
    </div>
  );
}

export default function Admin({ lang, onNavigate }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState("");
  const [customs, setCustoms] = useState(readCustomSchemes);
  const [downloadError, setDownloadError] = useState("");
  const [deletedMsg, setDeletedMsg] = useState("");

  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  function save() {
    const errs = validate(form);
    setErrors(errs);
    setSaved("");
    if (Object.keys(errs).length > 0) return;

    const nameEn = form.nameEn.trim();
    const scheme = {
      id: `custom-${slugify(nameEn) || "scheme"}-${Date.now()}`,
      status: "open",
      counts_as_cash: form.countsCash,
      benefit_per_year: Number(form.benefit),
      deadline: null,
      last_verified: form.lastVerified,
      rules: {
        match: form.matchRules.trim() ? JSON.parse(form.matchRules) : [],
        not_match: form.notMatchRules.trim() ? JSON.parse(form.notMatchRules) : [],
      },
      documents: linesOf(form.documents).map((line) => ({ te: line, en: line, ready_when: null })),
      steps: linesOf(form.steps).map((line) => ({ te: line, en: line })),
      official_link: form.officialLink.trim(),
      name_te: form.nameTe.trim(),
      name_en: nameEn,
      benefit_text_te: form.benefitTextTe.trim(),
      benefit_text_en: form.benefitTextEn.trim(),
    };

    const next = [...readCustomSchemes(), scheme];
    try {
      writeCustomSchemes(next);
    } catch {
      setSaved("");
      setErrors({ save: "Could not save on this device (storage unavailable)." });
      return;
    }
    setCustoms(next);
    setForm(EMPTY);
    setSaved("Saved. It now appears in Results.");
  }

  function removeCustom(id) {
    const next = readCustomSchemes().filter((s) => s.id !== id);
    try {
      writeCustomSchemes(next);
    } catch {
      setErrors({ save: "Could not update storage on this device." });
      return;
    }
    setCustoms(next);
    setDeletedMsg("Deleted");
  }

  async function downloadSchemes() {
    setDownloadError("");
    try {
      const res = await fetch("/schemes.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const base = await res.json();
      const out = { ...base, schemes: [...base.schemes, ...readCustomSchemes()] };
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "schemes.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(`Could not load schemes.json (${String(err.message)})`);
    }
  }

  const heading = pick(lang, "Admin — kotha scheme", "Admin — Add scheme");

  return (
    <div className="max-w-[390px] mx-auto px-4 py-6 space-y-6 bg-canvas min-h-screen">
      <header className="space-y-2">
        <h1 className="text-[24px] leading-8 font-bold text-ink">{heading}</h1>
        <p className={HINT}>
          Saved on this device only (localStorage). Login not required.
        </p>
      </header>

      {/* Form */}
      <section className={`${CARD} space-y-4`}>
        <Field label="Name (English)" error={errors.nameEn}>
          <input className={INPUT} type="text" value={form.nameEn} onChange={set("nameEn")} required />
        </Field>

        <Field label="Name (Telugu)">
          <input className={INPUT} type="text" value={form.nameTe} onChange={set("nameTe")} />
        </Field>

        <Field label="Benefit per year, in rupees" error={errors.benefit}>
          <input
            className={INPUT}
            type="number"
            min="0"
            inputMode="numeric"
            value={form.benefit}
            onChange={set("benefit")}
          />
        </Field>

        <label className="flex min-h-[48px] items-center gap-3 text-[17px] text-ink">
          <input
            type="checkbox"
            className="h-6 w-6"
            checked={form.countsCash}
            onChange={set("countsCash")}
          />
          Counts as yearly cash
        </label>

        <Field label="Benefit text (English)">
          <textarea className={INPUT} rows={3} value={form.benefitTextEn} onChange={set("benefitTextEn")} />
        </Field>

        <Field label="Benefit text (Telugu)">
          <textarea className={INPUT} rows={3} value={form.benefitTextTe} onChange={set("benefitTextTe")} />
        </Field>

        <Field label="Official link" error={errors.officialLink}>
          <input
            className={INPUT}
            type="url"
            placeholder="https://"
            value={form.officialLink}
            onChange={set("officialLink")}
          />
        </Field>

        <Field label="Last verified date" error={errors.lastVerified}>
          <input className={INPUT} type="date" value={form.lastVerified} onChange={set("lastVerified")} required />
        </Field>

        <Field label="Match rules (JSON array)" error={errors.matchRules}>
          <textarea
            className={`${INPUT} font-mono text-[14px]`}
            rows={6}
            placeholder='[{"id":"...","field":"tenure","op":"in","value":["..."],"reason_en":"...","reason_te":"..."}]'
            value={form.matchRules}
            onChange={set("matchRules")}
          />
        </Field>

        <Field label="Not-match rules (JSON array)" error={errors.notMatchRules}>
          <textarea
            className={`${INPUT} font-mono text-[14px]`}
            rows={6}
            placeholder='[{"id":"...","field":"excluded","op":"is_true","value":true,"reason_en":"...","reason_te":"...","fix_en":"...","fix_te":"..."}]'
            value={form.notMatchRules}
            onChange={set("notMatchRules")}
          />
        </Field>

        <Field label="Documents (one per line, English)">
          <textarea className={INPUT} rows={4} value={form.documents} onChange={set("documents")} />
        </Field>

        <Field label="Steps (one per line, English)">
          <textarea className={INPUT} rows={4} value={form.steps} onChange={set("steps")} />
        </Field>

        {errors.save && <p role="alert" className={ERR_TEXT}>{errors.save}</p>}

        <button
          type="button"
          onClick={save}
          className="w-full h-14 rounded-full bg-[#1B5E20] text-[17px] font-semibold text-white"
        >
          Save scheme
        </button>

        {saved && (
          <p role="status" className="text-[17px] font-semibold text-ink">
            {saved}
          </p>
        )}
      </section>

      {/* Saved custom schemes */}
      <section className={`${CARD} space-y-3`}>
        <h2 className="text-[20px] font-semibold leading-7 text-ink">Saved custom schemes</h2>
        {customs.length === 0 && <p className={HINT}>None saved yet.</p>}
        <ul className="space-y-3">
          {customs.map((s) => {
            const name = s.name_en || s.name_te || s.id;
            return (
              <li key={s.id} className="flex items-center justify-between gap-3">
                <span className="text-[17px] text-ink">{name}</span>
                <button
                  type="button"
                  onClick={() => removeCustom(s.id)}
                  className="min-h-[48px] min-w-[48px] px-2 text-[17px] font-semibold text-[#B91C1C] underline"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
        {deletedMsg && <span role="status" className="text-[17px] font-semibold text-ink">{deletedMsg}</span>}
      </section>

      {/* Export */}
      <section className="space-y-2">
        <button type="button" onClick={downloadSchemes} className={OUTLINE_BTN}>
          Download schemes.json
        </button>
        <p className={HINT}>
          Copy this file into public/schemes.json to make these schemes permanent.
        </p>
        {downloadError && <p role="alert" className={ERR_TEXT}>{downloadError}</p>}
      </section>

      <nav>
        <button
          type="button"
          onClick={() => onNavigate?.("results")}
          className="min-h-[48px] text-[17px] font-semibold text-ink underline"
        >
          Back to results
        </button>
      </nav>
    </div>
  );
}
