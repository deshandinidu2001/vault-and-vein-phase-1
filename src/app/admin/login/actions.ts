"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { adminAuthConfigured, startAdminGoogleSignIn } from "@/lib/admin-auth"

export async function signInWithGoogle() {
  if (!adminAuthConfigured) redirect("/admin/login")
  const origin = (await headers()).get("origin")
  const url = origin && URL.canParse(origin) ? new URL(origin) : null
  const loopback = url?.hostname === "localhost" || url?.hostname === "127.0.0.1"
  if (!url || !(url.protocol === "https:" || (loopback && url.protocol === "http:"))) {
    redirect("/admin/login?result=google-failed")
  }
  const destination = await startAdminGoogleSignIn(url.origin).catch(() => null)
  redirect(destination ?? "/admin/login?result=google-failed")
}
