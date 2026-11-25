"use client"

import { useEffect } from "react"

export function AdminHistory() {
  useEffect(() => {
    function checkRestoredPage(event: PageTransitionEvent) {
      if (event.persisted) window.location.reload()
    }
    window.addEventListener("pageshow", checkRestoredPage)
    return () => window.removeEventListener("pageshow", checkRestoredPage)
  }, [])
  return null
}
