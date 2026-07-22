export type PrescriptionItemCategory = "Medicine" | "Injection" | "Test";

export type PrescriptionCatalogType =
  | "TAB"
  | "CAP"
  | "SYR"
  | "INJ"
  | "TEST"
  | "DROP"
  | "OINT"
  | "OTHER";

export type PrescriptionCatalogItem = {
  id: string;
  name: string;
  type: PrescriptionCatalogType;
  category: PrescriptionItemCategory;
  composition?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  useCount?: number;
};

export const MEDICINE_TYPES: PrescriptionCatalogType[] = [
  "TAB",
  "CAP",
  "SYR",
  "INJ",
  "OINT",
  "DROP",
  "OTHER",
];

export const TIMING_PRESETS = {
  en: [
    "Before food - Daily - 30 days",
    "After food - Daily - 30 days",
    "Before food - Daily - 60 days",
    "After food - Daily - 60 days",
    "Before food - Twice daily - 30 days",
    "After food - Twice daily - 30 days",
    "Empty stomach - Daily - 30 days",
    "At bedtime - Daily - 30 days",
    "SOS (as needed)",
  ],
  hi: [
    "खाने से पहले - रोज़ - 30 दिन",
    "खाने के बाद - रोज़ - 30 दिन",
    "खाने से पहले - रोज़ - 60 दिन",
    "खाने के बाद - रोज़ - 60 दिन",
    "खाने से पहले - दिन में दो बार - 30 दिन",
    "खाने के बाद - दिन में दो बार - 30 दिन",
    "खाली पेट - रोज़ - 30 दिन",
    "सोने से पहले - रोज़ - 30 दिन",
    "ज़रूरत पड़ने पर (SOS)",
  ],
} as const;
