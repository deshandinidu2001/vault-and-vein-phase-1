"use client"

import { useUi, type EnquiryStone } from "@/store/ui"
import { cn } from "@/lib/utils"

export function EnquireButton({ children = "Ask about a stone", stones, className }: {
  children?: React.ReactNode
  stones?: EnquiryStone[]
  className?: string
}) {
  const open = useUi((state) => state.openEnquiry)
  return <button type="button" onClick={() => open(stones)} className={cn("pill", className)}>{children}</button>
}
