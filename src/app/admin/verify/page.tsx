import { redirect } from "next/navigation"
import { adminIdentity } from "@/lib/admin-auth"
import { signOut } from "../actions"
import { VerificationForm } from "./verification-form"

export default async function VerificationPage() {
  const { session, verified, id } = await adminIdentity()
  if (verified) redirect("/admin")
  const { data: { user }, error } = await session.auth.getUser()
  if (error || user?.id !== id) redirect("/admin/login")
  const enrolled = (user.factors ?? []).filter(f => f.status === "verified")
  const factors = enrolled.filter(f => f.factor_type === "phone" || f.factor_type === "totp").map(f => ({
    id: f.id, label: f.friendly_name || (f.factor_type === "phone" ? "SMS" : "Authenticator app"),
  }))
  return <section className="admin-panel mx-auto max-w-md space-y-5 p-6 sm:p-9">
    <h1>Verify your sign-in</h1>
    {enrolled.length && !factors.length ? <p>Contact the store owner to recover your verification method.</p> :
      <VerificationForm factors={factors} />}
    <form action={signOut}><button className="admin-text-link">Sign out</button></form>
  </section>
}
