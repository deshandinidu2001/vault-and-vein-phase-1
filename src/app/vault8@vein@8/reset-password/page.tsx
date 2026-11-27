import Link from "next/link"
import { adminAuthConfigured } from "@/lib/admin-auth"
import { resetPasswordWithCode, sendPasswordResetCode } from "../login/actions"

const messages = {
  sent: "If your admin account is set up in Neon, check your email for a password reset code.",
  password: "Enter a matching password of 12 to 128 characters.",
  invalid: "That code is invalid or expired. Request a new code and try again.",
  limited: "Too many attempts. Try again in a few minutes.",
  unavailable: "Password reset is temporarily unavailable. Try again shortly.",
}

export default async function ResetPasswordPage({ searchParams }: PageProps<"/vault8@vein@8/reset-password">) {
  const { result } = await searchParams
  const message = typeof result === "string" && Object.hasOwn(messages, result) ? messages[result as keyof typeof messages] : null
  return <section className="admin-panel mx-auto max-w-md space-y-6 p-6 sm:p-9">
    <h1>Set or reset password</h1>
    {adminAuthConfigured ? <>
      <p>Neon sends a verification code to the store admin email.</p>
      {message && <p role={result === "sent" ? "status" : "alert"}>{message}</p>}
      <form action={sendPasswordResetCode}>
        <button className="admin-button">Send password reset code</button>
      </form>
      <form action={resetPasswordWithCode} className="grid gap-4">
        <label className="grid gap-2">Verification code
          <input className="admin-field" name="code" inputMode="numeric" autoComplete="one-time-code"
            pattern="[0-9]{6}" maxLength={6} required />
        </label>
        <label className="grid gap-2">New password
          <input className="admin-field" name="password" type="password" autoComplete="new-password"
            minLength={12} maxLength={128} required />
        </label>
        <label className="grid gap-2">Confirm new password
          <input className="admin-field" name="confirm" type="password" autoComplete="new-password"
            minLength={12} maxLength={128} required />
        </label>
        <button className="admin-button admin-button-primary w-fit">Save password</button>
      </form>
    </> : <p>Password reset is unavailable until Neon Auth and the store database are configured.</p>}
    <Link href="/vault8@vein@8/login" className="admin-text-link">Back to sign-in</Link>
  </section>
}
