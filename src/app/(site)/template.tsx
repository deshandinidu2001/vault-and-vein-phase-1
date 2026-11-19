"use client"

import { motion, useReducedMotion } from "framer-motion"

export default function PageTemplate({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()
  return <motion.main id="main" tabIndex={-1} initial={reduced ? false : { opacity: .55 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .35 }}>{children}</motion.main>
}
