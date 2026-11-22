import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  evaluateSchemes,
  totalCashPerYear,
  blockersRanked,
  seasonFromDate,
  tenantMinOk,
} from "./match.js";

const schemesJson = JSON.parse(
  fs.readFileSync(new URL("../../public/schemes.json", import.meta.url), "utf8"),
);
const schemes = schemesJson.schemes;

function byId(results, id) {
  const r = results.find((x) => x.id === id);
  assert.ok(r, `missing result for ${id}`);
  return r;
}

test("Venkatesh (tenant with CCRC, 5-10 acres)", () => {
  const answers = {
    tenure: "tenant",
    area_band: "5_10a",
    crop: "groundnut",
    has_ccrc: true,
    excluded: ["none"],
    category: "sc",
    always: true,
  };
  const results = evaluateSchemes(answers, schemes);

  const annadata = byId(results, "annadata_sukhibhava");
  assert.equal(annadata.group, "likely");
  assert.equal(annadata.benefit_per_year, 20000);

  const pmKisan = byId(results, "pm_kisan");
  assert.equal(pmKisan.group, "not");
  assert.ok(pmKisan.fixes.some((f) => f.en.includes("Annadata gives you ₹20,000")));

  assert.equal(totalCashPerYear(results), 20000);

  assert.equal(byId(results, "pmfby").benefit_per_year, 0);
  assert.equal(byId(results, "kcc_loan").benefit_per_year, 0);

  const micro = byId(results, "micro_irrigation_ap");
  assert.equal(micro.group, "maybe");
  assert.equal(micro.reasons.length, 1);
  assert.ok(micro.reasons[0].en.includes("subsidy"));
});

test("Ramesh (owner, 10 cents to 5 acres)", () => {
  const answers = {
    tenure: "own",
    area_band: "10c_5a",
    crop: "groundnut",
    excluded: ["none"],
    has_ccrc: false,
    always: true,
  };
  const results = evaluateSchemes(answers, schemes);

  assert.equal(byId(results, "pm_kisan").group, "likely");
  assert.equal(byId(results, "pmfby").group, "likely");
});

test("Kiran (owner, income-tax payer)", () => {
  const answers = {
    tenure: "own",
    area_band: "5_10a",
    crop: "paddy",
    excluded: ["income_tax", "professional"],
    always: true,
  };
  const results = evaluateSchemes(answers, schemes);

  const pm = byId(results, "pm_kisan");
  assert.equal(pm.group, "not");
  assert.ok(pm.fixes.some((f) => /income tax/i.test(f.en)));

  const ranked = blockersRanked(results);
  assert.ok(ranked.length > 0);
  for (let i = 1; i < ranked.length; i++) {
    assert.ok(ranked[i - 1].blocked_per_year >= ranked[i].blocked_per_year);
  }
});

test("pm_kusum_b is closed and never says apply now", () => {
  const answers = { tenure: "own", area_band: "5_10a", crop: "paddy", excluded: ["none"], always: true };
  const results = evaluateSchemes(answers, schemes);
  assert.equal(byId(results, "pm_kusum_b").group, "closed");

  const scheme = schemes.find((s) => s.id === "pm_kusum_b");
  assert.doesNotMatch(JSON.stringify(scheme), /apply now/i);
});

test("ysr_rythu_bharosa is superseded and points to Annadata Sukhibhava", () => {
  const answers = { tenure: "own", area_band: "5_10a", crop: "paddy", excluded: ["none"], always: true };
  const results = evaluateSchemes(answers, schemes);
  assert.equal(byId(results, "ysr_rythu_bharosa").group, "superseded");

  const scheme = schemes.find((s) => s.id === "ysr_rythu_bharosa");
  assert.ok(scheme.benefit_text_en.includes("Annadata Sukhibhava"));
});

test("tenant in 10c_5a with CCRC is maybe; PM-KISAN is the blocked cash scheme", () => {
  const answers = {
    tenure: "tenant",
    area_band: "10c_5a",
    crop: "groundnut",
    has_ccrc: true,
    excluded: ["none"],
    always: true,
  };
  const results = evaluateSchemes(answers, schemes);

  const annadata = byId(results, "annadata_sukhibhava");
  assert.equal(annadata.group, "maybe");
  assert.equal(annadata.benefit_per_year, 0);
  assert.ok(
    annadata.reasons.some((r) =>
      r.en.includes("The band spans the 1-acre tenant minimum; the exact area needs checking at the RSK."),
    ),
  );

  const pmKisan = byId(results, "pm_kisan");
  assert.equal(pmKisan.group, "not");
  assert.equal(pmKisan.blocked_per_year, 6000);
  assert.equal(totalCashPerYear(results), 0);
  assert.equal(blockersRanked(results)[0]?.id, "pm_kisan");
  assert.ok(pmKisan.fixes.every((f) => !f.en.includes("₹20,000")));
  assert.ok(pmKisan.fixes.some((f) => f.en.includes("Rythu Seva Kendram")));
});

test("seasonFromDate labels", () => {
  assert.equal(seasonFromDate(new Date(2026, 10, 15)).label, "Rabi 2026-27");
  assert.equal(seasonFromDate(new Date(2026, 6, 15)).label, "Kharif 2026");
});

test("tenantMinOk thresholds", () => {
  assert.equal(tenantMinOk("gt_10a", "betelvine"), true);
  assert.equal(tenantMinOk("lt_10c", "groundnut"), false);
});
