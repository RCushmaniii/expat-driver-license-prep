import type { SignMetadata, NomSignCategory } from "./types";

const DATA_PATH = "/data/jalisco/sign-metadata.json";

let cachedSigns: SignMetadata[] | null = null;

/** Load sign metadata from public JSON (client-side fetch) */
export async function loadSignMetadata(): Promise<SignMetadata[]> {
  if (cachedSigns) return cachedSigns;
  const response = await fetch(`${DATA_PATH}?v=${Date.now()}`);
  if (!response.ok) throw new Error(`Failed to load sign metadata: ${response.status}`);
  cachedSigns = (await response.json()) as SignMetadata[];
  return cachedSigns;
}

/** Filter signs by NOM category */
export function filterSignsByCategory(
  signs: SignMetadata[],
  category: NomSignCategory
): SignMetadata[] {
  return signs.filter((s) => s.nomCategory === category);
}

/** Category display info for the guide section */
export const signCategoryInfo: Record<
  NomSignCategory,
  { name: string; nameEs: string; description: string; color: string; bgColor: string }
> = {
  restrictive: {
    name: "Restrictive / Regulatory",
    nameEs: "Restrictivas",
    description: "Red circle — sets limits and requirements (height, width, yield, turn rules)",
    color: "text-error",
    bgColor: "bg-red-50",
  },
  prohibitive: {
    name: "Prohibitive",
    nameEs: "Prohibitivas",
    description: "Red circle with diagonal bar — actions that are completely forbidden",
    color: "text-error",
    bgColor: "bg-red-50",
  },
  warning: {
    name: "Warning / Preventive",
    nameEs: "Preventivas",
    description: "Yellow diamond — hazards ahead (curves, narrowing, crossroads)",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  informational: {
    name: "Informational",
    nameEs: "Informativas",
    description: "Blue or green rectangle — directions, distances, and clearance info",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  "officer-signals": {
    name: "Officer / Hand Signals",
    nameEs: "Señales del Agente",
    description: "Hand and whistle signals used by traffic officers and drivers",
    color: "text-navy",
    bgColor: "bg-navy/5",
  },
  "construction-warning": {
    name: "Construction / Work Zone",
    nameEs: "Protección en Obras",
    description: "Orange diamond — road construction and maintenance zones ahead",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
};

/** Ordered list of categories for display */
export const signCategoryOrder: NomSignCategory[] = [
  "restrictive",
  "prohibitive",
  "warning",
  "construction-warning",
  "informational",
  "officer-signals",
];
