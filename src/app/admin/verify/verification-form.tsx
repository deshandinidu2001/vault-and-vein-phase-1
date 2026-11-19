"use client"

import { useActionState } from "react"
import { sendChallenge, verifyCode, type ChallengeState } from "../account/security-actions"

export function VerificationForm({ factors }: { factors: { id: string; label: string }[] }) {
  const [state, action, pending] = useActionState(async (previous: ChallengeState, form: FormData) => {
    if (form.get("step") === "restart") return {}
    return previous.challenge ? verifyCode(previous, form) : sendChallenge(previous, form)
  }, {})
  return <form action={action} className="grid gap-4">
    {state.challenge ? <label className="grid gap-2">Verification code
      <input autoFocus className="admin-field" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
    </label> : factors.length ? <label className="grid gap-2">Verification method
      <select className="admin-field" name="factor">{factors.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
    </label> : <label className="grid gap-2">SMS phone number
      <input className="admin-field" name="phone" type="tel" autoComplete="tel" placeholder="+94771234567" maxLength={16} required />
      <span className="admin-muted text-sm">Include your country code. This number will receive your sign-in codes.</span>
    </label>}
    {state.error && <p role="alert" className="admin-notice">{state.error}</p>}
    <button className="admin-button admin-button-primary" disabled={pending}>{pending ? "Please wait…" : state.challenge ? "Verify code" : "Request code"}</button>
    {state.challenge && <button className="admin-text-link w-fit" name="step" value="restart" formNoValidate disabled={pending}>Request a new code</button>}
  </form>
}
