"use client"

import { useMediaQuery } from "./use-media-query"

export function useMobile() {
  return useMediaQuery("(max-width: 768px)")
}
