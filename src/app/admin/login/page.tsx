import { backendConfigured } from "@/lib/backend"
import { signIn } from "../actions"

const errors = {
  denied: "These credentials did not grant admin access.",
  unavailable: "Sign-in is temporarily unavailable. Try again shortly.",
  limited: "Too many sign-in attempts. Try again in a few minutes.",
}

export default async function AdminLogin({ searchParams }: PageProps<"/admin/login">) {
  const { result } = await searchParams
  const error = typeof result === "string" && Object.hasOwn(errors, result) ? errors[result as keyof typeof errors] : null
  return <section className="admin-panel mx-auto max-w-md space-y-6 p-6 sm:p-9">
    <h1>Admin sign-in</h1>
    {result === "changed" && <p role="status">Password changed. Sign in with your new password.</p>}
    {backendConfigured ? <form action={signIn} className="grid gap-4">
      <label className="grid gap-2">Email
        <input className="admin-field" type="email" name="email" autoComplete="username" maxLength={254} required />
      </label>
      <label className="grid gap-2">Password
        <input className="admin-field" type="password" name="password" autoComplete="current-password" maxLength={128} required />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="admin-button admin-button-primary w-fit" type="submit">Sign in</button>
    </form> : <p>Store admin is unavailable until the database is configured.</p>}
  </section>
}
