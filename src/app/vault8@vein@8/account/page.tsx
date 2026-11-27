import Link from "next/link"
import { adminIdentity } from "@/lib/admin-auth"
import { signOut } from "../actions"
import { updatePassword } from "./actions"

const messages = {
  password: "Enter your current password and a matching new password of 12 to 128 characters.",
  invalid: "The current password could not be verified.",
  limited: "Too many attempts. Try again in a few minutes.",
  unavailable: "Password change is temporarily unavailable. Try again shortly.",
}

export default async function AccountPage({ searchParams }: PageProps<"/vault8@vein@8/account">) {
  const { email } = await adminIdentity()
  const { result } = await searchParams
  const message = typeof result === "string" && Object.hasOwn(messages, result) ? messages[result as keyof typeof messages] : null
  return <section className="admin-panel mx-auto max-w-lg space-y-5 p-6 sm:p-9">
    <Link href="/vault8@vein@8" className="admin-text-link">Back to inventory</Link>
    <h1>Account security</h1>
    <p>{email}</p>
    <form action={updatePassword} className="grid gap-4 border-t pt-5">
      <h2>Change password</h2>
      {message && <p role="alert">{message}</p>}
      <label className="grid gap-2">Current password
        <input className="admin-field" name="current" type="password" autoComplete="current-password" maxLength={128} required />
      </label>
      <label className="grid gap-2">New password
        <input className="admin-field" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      </label>
      <label className="grid gap-2">Confirm new password
        <input className="admin-field" name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      </label>
      <button className="admin-button admin-button-primary w-fit">Save new password</button>
    </form>
    <p>To change your PIN, verify a code sent to your email.</p>
    <Link href="/vault8@vein@8/verify?mode=reset" className="admin-button inline-flex">Change PIN</Link>
    <form action={signOut}>
      <button className="admin-button">Sign out</button>
    </form>
  </section>
}
