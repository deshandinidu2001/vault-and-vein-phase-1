"use client"

import Link, { useLinkStatus } from "next/link"
import { useState, type ComponentProps } from "react"

function LinkFeedback() {
  const { pending } = useLinkStatus()
  return <span role="status">
    {pending && <>
      <span className="sr-only">Loading page…</span>
      <span aria-hidden="true" className="absolute end-1 top-1 z-10 size-2 rounded-full bg-[#c89e47] motion-safe:animate-pulse motion-safe:[animation-delay:150ms]" />
    </>}
  </span>
}

export function NavigationLink({ children, className, ...props }: Omit<ComponentProps<typeof Link>, "prefetch" | "onFocus" | "onPointerEnter" | "onTouchStart">) {
  const [interested, setInterested] = useState(false)
  const prepare = () => setInterested(true)
  return <Link {...props} className={className ? "relative " + className : "relative"} prefetch={interested ? null : false}
    onFocus={prepare} onPointerEnter={prepare} onTouchStart={prepare}>
    {children}
    <LinkFeedback />
  </Link>
}
