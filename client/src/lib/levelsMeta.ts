export type LevelId = "first" | "second" | "third" | "bac";

export const LEVELS_META: Array<{ id: LevelId; title: string; subtitle: string }> = [
  { id: "first", title: "1ère année secondaire", subtitle: "Physique – Chimie" },
  { id: "second", title: "2ème année secondaire", subtitle: "Sciences / Informatique" },
  { id: "third", title: "3ème année secondaire", subtitle: "Sciences expérimentales / Mathématiques / Informatique" },
  { id: "bac", title: "Baccalauréat", subtitle: "Session 2027" },
];

export const CATEGORY_LABELS: Record<string, string> = {
  lesson: "Cours",
  practice: "Exercices",
  media: "Vidéos",
  lab: "Travaux pratiques",
};

export const DEFAULT_LOGO = "/assets/logo-hamadi-zitouni.png";

export type Branch = { id: string; label: string };

// Filières (ou sections) de chaque niveau. Garder les identifiants synchronisés avec api/content.ts.
export const BRANCHES: Record<LevelId, Branch[]> = {
  first: [
    { id: "physique", label: "Physique" },
    { id: "chimie", label: "Chimie" },
  ],
  second: [
    { id: "sciences", label: "Sciences" },
    { id: "informatique", label: "Informatique" },
  ],
  third: [
    { id: "sciences-exp", label: "Sciences expérimentales" },
    { id: "maths", label: "Mathématiques" },
    { id: "informatique", label: "Informatique" },
  ],
  bac: [
    { id: "sciences-exp", label: "Sciences expérimentales" },
    { id: "sciences-tech", label: "Sciences techniques" },
    { id: "maths-info", label: "Mathématiques et Informatique" },
  ],
};

export function getBranch(levelId: string, branchId: string): Branch | undefined {
  return BRANCHES[levelId as LevelId]?.find((branch) => branch.id === branchId);
}
