"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import type { z } from "zod"
import { contactSchema } from "@/lib/validators"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Values = z.infer<typeof contactSchema>
const inputs = [
  { name: "name", label: "Name", autoComplete: "name" },
  { name: "email", label: "Email", autoComplete: "email", type: "email", spellCheck: false },
  { name: "subject", label: "Subject" },
] as const

export function ContactForm() {
  const form = useForm<Values>({
    resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", subject: "", message: "" },
  })
  const { errors, isSubmitting } = form.formState

  async function submit() {
    // PHASE 2: POST to /api/contact
    await new Promise((resolve) => setTimeout(resolve, 450))
    toast.success("Contact form completed", { description: "This is a preview. Your message was not sent." })
    form.reset()
  }

  function messageFor(name: keyof Values) {
    const message = errors[name]?.message
    if (!message) return null
    return <span id={"contact-" + name + "-error"} role="alert" className="text-sm text-destructive">{message}</span>
  }

  return <form onSubmit={form.handleSubmit(submit)} className="grid gap-5" noValidate autoComplete="off">
    {inputs.map(({ name, label, ...props }) => <div key={name} className="grid gap-2">
      <label htmlFor={"contact-" + name}>{label}</label>
      <Input id={"contact-" + name} className="h-12" aria-invalid={!!errors[name]} aria-describedby={errors[name] ? "contact-" + name + "-error" : undefined} {...props} {...form.register(name)} />
      {messageFor(name)}
    </div>)}
    <div className="grid gap-2">
      <label htmlFor="contact-message">Message</label>
      <Textarea id="contact-message" className="min-h-32" aria-invalid={!!errors.message} aria-describedby={errors.message ? "contact-message-error" : undefined} {...form.register("message")} />
      {messageFor("message")}
    </div>
    <button className="pill pill-primary w-fit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting…" : "Send message"}</button>
    <p className="text-sm text-muted-foreground">Messages entered in this preview are not sent.</p>
  </form>
}
