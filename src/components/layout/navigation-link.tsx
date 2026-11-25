"use client"

import Link, { useLinkStatus } from "next/link"
import { useState, type ComponentProps } from "react"

function LinkFeedback() {
  const { pending } = useLinkStatus()
  return <span className="sr-only" role="status" data-navigation-pending={pending ? "" : undefined}>
    {pending && "Loading page…"}
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
