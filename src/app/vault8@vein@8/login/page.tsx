import { adminAuthConfigured, continueAdminSignIn } from "@/lib/admin-auth"
import { signInWithGoogle } from "./actions"

const errors = {
  denied: "This Google account is not approved for store admin access.",
  "google-failed": "Google sign-in could not be completed. Try again.",
}

export default async function AdminLogin({ searchParams }: PageProps<"/vault8@vein@8/login">) {
  await continueAdminSignIn()
  const { result } = await searchParams
  const error = typeof result === "string" && Object.hasOwn(errors, result) ? errors[result as keyof typeof errors] : null
  return <section className="admin-panel mx-auto max-w-md space-y-6 p-6 sm:p-9">
    <h1>Admin sign-in</h1>
    {adminAuthConfigured ? <form action={signInWithGoogle} className="grid gap-4">
      <p>Continue with your Google account, then enter your admin PIN.</p>
      {error && <p role="alert">{error}</p>}
      <button className="admin-button admin-button-primary w-fit" type="submit">Continue with Google</button>
    </form> : <p>Store admin is unavailable until Neon Auth and the store database are configured.</p>}
  </section>
}
