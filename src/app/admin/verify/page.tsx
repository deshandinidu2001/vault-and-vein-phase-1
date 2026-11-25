import { pendingAdminIdentity } from "@/lib/admin-auth"
import { signOut } from "../actions"
import { confirmVerificationCode, sendVerificationCode } from "./actions"

const messages = {
  sent: "Check your email for the verification code.",
  invalid: "That code is invalid or expired. Use the latest code or request a new one.",
  limited: "Too many attempts. Wait a few minutes and try again.",
  unavailable: "Email verification is temporarily unavailable. Try again shortly.",
}

export default async function AdminVerification({ searchParams }: PageProps<"/admin/verify">) {
  const { email } = await pendingAdminIdentity()
  const { result } = await searchParams
  const message = typeof result === "string" && Object.hasOwn(messages, result)
    ? messages[result as keyof typeof messages] : null
  return <section className="admin-panel mx-auto max-w-md space-y-6 p-6 sm:p-9">
    <h1>Verify your sign-in</h1>
    <p>Send a six-digit code to <strong>{email}</strong> to finish signing in.</p>
    {message && <p role={result === "sent" ? "status" : "alert"}>{message}</p>}
    <form action={sendVerificationCode}>
      <button className="admin-button">{result === "sent" ? "Send a new code" : "Send verification code"}</button>
    </form>
    <form action={confirmVerificationCode} className="grid gap-4">
      <label className="grid gap-2">Verification code
        <input className="admin-field" name="code" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9]{6}" maxLength={6} required />
      </label>
      <button className="admin-button admin-button-primary w-fit">Verify and sign in</button>
    </form>
    <form action={signOut}>
      <button className="admin-text-link">Use a different Google account</button>
    </form>
  </section>
}
