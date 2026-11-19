"use client"

import Link from "next/link"
import { useState, type ComponentProps } from "react"

export function NavigationLink(props: Omit<ComponentProps<typeof Link>, "prefetch" | "onFocus" | "onPointerEnter" | "onTouchStart">) {
  const [interested, setInterested] = useState(false)
  const prepare = () => setInterested(true)
  return <Link {...props} prefetch={interested ? null : false} onFocus={prepare} onPointerEnter={prepare} onTouchStart={prepare} />
}
