// Shared display constants for the Results screen. No imports.

export const ANSWERS_KEY = "rh.answers";
export const HELPER_KEY = "rh.helper";

// Display order of groups. Closed and superseded come last.
export const GROUP_ORDER = ["likely", "maybe", "not", "closed", "superseded"];
export const GROUP_EN = {
  likely: "Likely eligible",
  maybe: "May be eligible",
  not: "Not eligible",
  closed: "Not open now",
  superseded: "No longer active",
};
export const GROUP_PILL = {
  likely: "bg-[#DCFCE7] text-[#15803D]",
  maybe: "bg-[#FEF3C7] text-[#92400E]",
  not: "bg-[#F5F5F4] text-[#57534E]",
  closed: "bg-[#F5F5F4] text-[#57534E]",
  superseded: "bg-[#F5F5F4] text-[#57534E]",
};
export const SUPERSEDED_TEXT = "This scheme no longer exists — see Annadata Sukhibhava.";
export const SUPERSEDED_TEXT_TE = "ఈ పథకం ఇప్పుడు లేదు — అన్నదాత సుఖీభవ చూడండి";

export const DECODER = [
  {
    issue: "eKYC pending",
    issue_te: "eKYC పెండింగ్‌లో ఉంది",
    office: "Rythu Seva Kendram / VAA",
    office_te: "రైతు సేవా కేంద్రం / VAA",
    document: { en: "eKYC completed status", te: "eKYC పూర్తయిన స్థితి" },
  },
  {
    issue: "Land seeding pending",
    issue_te: "భూమి లింకింగ్ పెండింగ్‌లో ఉంది",
    office: "Rythu Seva Kendram / VAA",
    office_te: "రైతు సేవా కేంద్రం / VAA",
    document: { en: "Pattadar passbook", te: "పట్టాదారు పాస్‌బుక్" },
  },
  {
    issue: "NPCI (bank Aadhaar mapping) pending",
    issue_te: "NPCI (బ్యాంక్-ఆధార్ మ్యాపింగ్) పెండింగ్‌లో ఉంది",
    office: "The bank branch",
    office_te: "బ్యాంక్ శాఖ",
    document: { en: "Aadhaar-linked bank account", te: "ఆధార్-లింక్ బ్యాంక్ ఖాతా" },
  },
];

export const CARD = "rounded-2xl border border-[#E3E6DF] bg-surface p-4";
export const OUTLINE_BTN =
  "w-full min-h-[56px] rounded-full border border-[#1B5E20] bg-surface px-4 text-[18px] font-semibold text-[#1B5E20]";
