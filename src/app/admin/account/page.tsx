import Link from "next/link"
import { adminIdentity } from "@/lib/admin-auth"
import { changePassword } from "./security-actions"

const messages = {
  invalid: "Enter a different password of 12 to 128 characters and confirm it.",
  denied: "The current password could not be verified.",
  limited: "Too many attempts. Please wait before trying again.",
  failed: "The password could not be updated. Please try again.",
}

export default async function AccountPage({ searchParams }: PageProps<"/admin/account">) {
  const { email } = await adminIdentity()
  const { result } = await searchParams
  const message = typeof result === "string" && Object.hasOwn(messages, result) ? messages[result as keyof typeof messages] : null
  return <section className="admin-panel mx-auto max-w-lg space-y-5 p-6 sm:p-9">
    <Link href="/admin" className="admin-text-link">Back to inventory</Link>
    <h1>Account security</h1>
    <p>{email}</p>
    <h2>Change password</h2>
    <form action={changePassword} className="grid gap-4">
      {[["current", "Current password"], ["password", "New password"], ["confirm", "Confirm new password"]].map(([name, label]) =>
        <label key={name} className="grid gap-2">{label}
          <input className="admin-field" name={name} type="password" minLength={name === "current" ? 1 : 12} maxLength={128}
            autoComplete={name === "current" ? "current-password" : "new-password"} required />
        </label>)}
      <p className="admin-muted text-sm">Use at least 12 characters. Sign in again after saving.</p>
      {message && <p role="alert" className="admin-notice">{message}</p>}
      <button className="admin-button admin-button-primary">Save password</button>
    </form>
  </section>
}
