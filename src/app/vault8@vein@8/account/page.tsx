import Link from "next/link"
import { adminIdentity } from "@/lib/admin-auth"
import { signOut } from "../actions"

export default async function AccountPage() {
  const { email } = await adminIdentity()
  return <section className="admin-panel mx-auto max-w-lg space-y-5 p-6 sm:p-9">
    <Link href="/vault8@vein@8" className="admin-text-link">Back to inventory</Link>
    <h1>Account security</h1>
    <p>{email}</p>
    <p>Admin access uses your Google account and a verification code sent by Neon.</p>
    <form action={signOut}>
      <button className="admin-button">Sign out</button>
    </form>
  </section>
}
