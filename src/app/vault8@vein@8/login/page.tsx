import Link from "next/link"
import { adminAuthConfigured, continueAdminSignIn } from "@/lib/admin-auth"
import { signInWithPassword } from "./actions"

const messages = {
  invalid: "The email or password is incorrect, or the account has not been verified.",
  denied: "This email is not approved for store admin access.",
  limited: "Too many attempts. Try again in a few minutes.",
  unavailable: "Admin sign-in is temporarily unavailable. Try again shortly.",
  changed: "Password updated. Sign in with your new password, then enter your PIN.",
}

export default async function AdminLogin({ searchParams }: PageProps<"/vault8@vein@8/login">) {
  await continueAdminSignIn()
  const { result } = await searchParams
  const message = typeof result === "string" && Object.hasOwn(messages, result) ? messages[result as keyof typeof messages] : null

  return <section className="admin-panel mx-auto max-w-md space-y-6 p-6 sm:p-9">
    <h1>Admin sign-in</h1>
    {adminAuthConfigured ? <>
      <p>Sign in with your store email and password, then enter your admin PIN.</p>
      {message && <p role={result === "changed" ? "status" : "alert"}>{message}</p>}
      <form action={signInWithPassword} className="grid gap-4">
        <label className="grid gap-2">Email
          <input className="admin-field" name="email" type="email" autoComplete="username" maxLength={254} required />
        </label>
        <label className="grid gap-2">Password
          <input className="admin-field" name="password" type="password" autoComplete="current-password" maxLength={128} required />
        </label>
        <button className="admin-button admin-button-primary w-fit">Sign in</button>
      </form>
      <Link href="/vault8@vein@8/reset-password" className="admin-text-link">Set or reset password</Link>
    </> : <p>Store admin is unavailable until Neon Auth and the store database are configured.</p>}
  </section>
}
