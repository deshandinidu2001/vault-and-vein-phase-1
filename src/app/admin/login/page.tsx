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
  return <section className="max-w-lg space-y-6">
    <p className="eyebrow">Vault &amp; Vein</p>
    <h1>Admin sign-in</h1>
    {backendConfigured ? <form action={signIn} className="grid gap-4">
      <label className="grid gap-2">Email
        <input className="min-h-11 rounded-lg border border-input bg-background px-3" type="email" name="email" autoComplete="username" maxLength={254} required />
      </label>
      <label className="grid gap-2">Password
        <input className="min-h-11 rounded-lg border border-input bg-background px-3" type="password" name="password" autoComplete="current-password" maxLength={128} required />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="pill pill-primary w-fit" type="submit">Sign in</button>
    </form> : <p>Store admin is unavailable until Supabase is configured.</p>}
  </section>
}
