export interface CategoryStyle {
  text: string;
  bgSoft: string;
  border: string;
  barFill: string;
  accentHex: string;
  shortLabel: string;
}

export const CATEGORY_STYLES: readonly CategoryStyle[] = [
  {
    text: "text-emerald-800",
    bgSoft: "bg-emerald-50/70",
    border: "border-emerald-200",
    barFill: "bg-emerald-600",
    accentHex: "#16a34a",
    shortLabel: "Good",
  },
  {
    text: "text-amber-800",
    bgSoft: "bg-amber-50/80",
    border: "border-amber-200",
    barFill: "bg-amber-500",
    accentHex: "#d97706",
    shortLabel: "Moderate",
  },
  {
    text: "text-orange-800",
    bgSoft: "bg-orange-50/80",
    border: "border-orange-200",
    barFill: "bg-orange-600",
    accentHex: "#ea580c",
    shortLabel: "Sensitive Groups",
  },
  {
    text: "text-red-800",
    bgSoft: "bg-red-50/80",
    border: "border-red-200",
    barFill: "bg-red-600",
    accentHex: "#dc2626",
    shortLabel: "Unhealthy",
  },
  {
    text: "text-purple-900",
    bgSoft: "bg-purple-50/80",
    border: "border-purple-200",
    barFill: "bg-purple-700",
    accentHex: "#7e22ce",
    shortLabel: "Very Unhealthy",
  },
  {
    text: "text-rose-950",
    bgSoft: "bg-rose-50/90",
    border: "border-rose-300",
    barFill: "bg-rose-900",
    accentHex: "#881337",
    shortLabel: "Hazardous",
  },
];

export function getCategoryStyle(categoryIndex: number): CategoryStyle {
  return CATEGORY_STYLES[Math.min(Math.max(categoryIndex, 0), CATEGORY_STYLES.length - 1)];
}
