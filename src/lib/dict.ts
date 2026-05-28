// Pre-built dictionary utilities. init-app only generates dict-data.ts (the data).
// These functions are stable — do not regenerate.

import { dictionaries } from "./dict-data"
export type { DictItem } from "./dict-data"

export function getDictOptions(dictId: string) {
  return dictionaries[dictId] ?? []
}

export function getDictLabel(dictId: string, value: string): string {
  const item = dictionaries[dictId]?.find((d) => d.value === value)
  return item?.label ?? value
}

export function getDictColor(dictId: string, value: string): string | undefined {
  const item = dictionaries[dictId]?.find((d) => d.value === value)
  return item?.color
}

// Badge color → Tailwind class mapping (matches data-flow contract color values)
const badgeColorMap: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  green: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
  purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  orange: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
}

export function getBadgeClassName(color?: string): string {
  return badgeColorMap[color ?? "gray"] ?? badgeColorMap.gray
}
