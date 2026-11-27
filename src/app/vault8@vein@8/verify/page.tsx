import Link from "next/link"
import { redirect } from "next/navigation"
import { requireAdminPasswordIdentity } from "@/lib/admin-auth"
import { signOut } from "../actions"
import { enterPin, sendVerificationCode, setPinWithCode } from "./actions"

const messages = {
  sent: "Check your email for the verification code.",
  invalid: "That code is invalid or expired. Request a new code and try again.",
  "invalid-pin": "Enter a matching PIN of 8 to 12 digits.",
  "wrong-pin": "That PIN is incorrect. Try again or reset it by email.",
  limited: "Too many attempts. Try again in a few minutes.",
  unavailable: "Admin verification is temporarily unavailable. Try again shortly.",
  "save-failed": "The PIN was not saved. Request a new verification code and try again.",
}

export default async function AdminVerification({ searchParams }: PageProps<"/vault8@vein@8/verify">) {
  const { email, revision, unlocked } = await requireAdminPasswordIdentity()
  const { mode, result } = await searchParams
  const resetting = mode === "reset" || !revision
  if (unlocked && !resetting) redirect("/vault8@vein@8")
  const message = typeof result === "string" && Object.hasOwn(messages, result)
    ? messages[result as keyof typeof messages] : null

  return <section className="admin-panel mx-auto max-w-md space-y-6 p-6 sm:p-9">
    <h1>{resetting ? (revision ? "Reset admin PIN" : "Set up your admin PIN") : "Enter admin PIN"}</h1>
    {message && <p role={result === "sent" ? "status" : "alert"}>{message}</p>}
    {resetting ? <>
      <p>Send a six-digit verification code to <strong>{email}</strong>, then choose a PIN of 8 to 12 digits.</p>
      <form action={sendVerificationCode}>
        <button className="admin-button">{result === "sent" ? "Send a new code" : "Send verification code"}</button>
      </form>
      <form action={setPinWithCode} className="grid gap-4">
        <label className="grid gap-2">Verification code
          <input className="admin-field" name="code" inputMode="numeric" autoComplete="one-time-code"
            pattern="[0-9]{6}" maxLength={6} required />
        </label>
        <label className="grid gap-2">New PIN
          <input className="admin-field" name="pin" type="password" inputMode="numeric"
            autoComplete="new-password" pattern="[0-9]{8,12}" maxLength={12} required />
        </label>
        <label className="grid gap-2">Confirm new PIN
          <input className="admin-field" name="confirm" type="password" inputMode="numeric"
            autoComplete="new-password" pattern="[0-9]{8,12}" maxLength={12} required />
        </label>
        <button className="admin-button admin-button-primary w-fit">Save PIN and sign in</button>
      </form>
      {revision && <Link href={unlocked ? "/vault8@vein@8/account" : "/vault8@vein@8/verify"} className="admin-text-link">Cancel</Link>}
    </> : <>
      <form action={enterPin} className="grid gap-4">
        <label className="grid gap-2">Admin PIN
          <input className="admin-field" name="pin" type="password" inputMode="numeric"
            autoComplete="current-password" pattern="[0-9]{8,12}" maxLength={12} required />
        </label>
        <button className="admin-button admin-button-primary w-fit">Sign in to admin</button>
      </form>
      <Link href="/vault8@vein@8/verify?mode=reset" className="admin-text-link">Forgot PIN?</Link>
    </>}
    <form action={signOut}>
      <button className="admin-text-link">Sign out</button>
    </form>
  </section>
}
