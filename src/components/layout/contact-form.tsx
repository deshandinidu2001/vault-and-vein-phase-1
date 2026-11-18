"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import type { z } from "zod"
import { contactSchema } from "@/lib/validators"
import { sendMessage } from "@/lib/send-message"
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

  async function submit(values: Values) {
    try {
      const preview = await sendMessage("contact", values)
      toast.success(preview ? "Preview complete. Your message was not sent." : "Your message was received.")
      form.reset()
    } catch (error) {
      form.setError("root", { message: error instanceof Error ? error.message : "Please try again." })
    }
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
    {errors.root?.message && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
  </form>
}
