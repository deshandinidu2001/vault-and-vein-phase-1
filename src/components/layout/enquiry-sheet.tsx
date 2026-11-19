"use client"

import { useSyncExternalStore } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import type { z } from "zod"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { budgetRanges, enquirySchema, gemInterests } from "@/lib/validators"
import { sendMessage } from "@/lib/send-message"
import { site, whatsappLink } from "@/config/site"
import { restoreOverlayFocus, useUi, type EnquiryStone } from "@/store/ui"

type Values = z.infer<typeof enquirySchema>
const mobileQuery = "(max-width: 767px)"
function subscribe(callback: () => void) {
  const query = window.matchMedia(mobileQuery)
  query.addEventListener("change", callback)
  return () => query.removeEventListener("change", callback)
}

const inputs = [
  { name: "name", label: "Name", autoComplete: "name" },
  { name: "mobile", label: "Mobile", type: "tel", autoComplete: "tel" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "colour", label: "Preferred colour (optional)" },
  { name: "size", label: "Preferred size or carat (optional)" },
] as const

function EnquiryForm({ stones }: { stones: EnquiryStone[] }) {
  const preferred = gemInterests.find((gem) => stones.length > 0 && stones.every((stone) => stone.gem_type === gem.toLowerCase()))
  const form = useForm<Values>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { name: "", mobile: "", email: "", gem: preferred ?? "", budget: "", colour: "", size: "", notes: "" },
  })
  const { errors, isSubmitting } = form.formState
  const whatsapp = whatsappLink(stones.length
    ? "Hello Vault & Vein, I’m interested in " + stones.map((stone) => stone.name).join(", ") + "."
    : "Hello Vault & Vein, I’d like to enquire about a gemstone.")

  async function submit(values: Values) {
    try {
      const preview = await sendMessage("enquiry", { ...values, stones: stones.map(({ slug }) => slug) })
      toast.success(preview ? "Preview complete. Your enquiry was not sent." : "Your enquiry was received.")
      form.reset()
    } catch (error) {
      form.setError("root", { message: error instanceof Error ? error.message : "Please try again." })
    }
  }

  function fieldError(name: keyof Values) {
    const error = errors[name]?.message
    return error ? <span id={"enquiry-" + name + "-error"} className="text-sm text-destructive" role="alert">{error}</span> : null
  }

  const renderInput = ({ name, label, ...props }: (typeof inputs)[number]) => (
    <div className="grid gap-2" key={name}>
      <label htmlFor={"enquiry-" + name}>{label}</label>
      <Input className="h-12" id={"enquiry-" + name} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? "enquiry-" + name + "-error" : undefined} {...props} {...form.register(name)} />
      {fieldError(name)}
    </div>
  )

  return <form noValidate autoComplete="off" onSubmit={form.handleSubmit(submit)} className="grid gap-5 px-6 pb-8">
    {stones.length > 0 && <div className="rounded-xl bg-muted p-4">
      <p className="font-semibold">Stones in your enquiry</p>
      <ul className="mt-2 list-disc pl-5">{stones.map(({ slug, name }) => <li key={slug}>{name}</li>)}</ul>
    </div>}
    {inputs.slice(0, 3).map(renderInput)}
    {([{ name: "gem", label: "Gem of interest", options: gemInterests }, { name: "budget", label: "Budget range", options: budgetRanges }] as const).map(({ name, label, options }) => (
      <div className="grid gap-2" key={name}>
        <label htmlFor={"enquiry-" + name}>{label}</label>
        <select id={"enquiry-" + name} className="form-select" aria-invalid={!!errors[name]} aria-describedby={errors[name] ? "enquiry-" + name + "-error" : undefined} {...form.register(name)}>
          <option value="">Select an option</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        {fieldError(name)}
      </div>
    ))}
    {inputs.slice(3).map(renderInput)}
    <div className="grid gap-2">
      <label htmlFor="enquiry-notes">Notes (optional)</label>
      <Textarea id="enquiry-notes" rows={4} aria-invalid={!!errors.notes} aria-describedby={errors.notes ? "enquiry-notes-error" : undefined} {...form.register("notes")} />
      {fieldError("notes")}
    </div>
    <button className="pill pill-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting…" : "Submit enquiry"}</button>
    {errors.root?.message && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
    {whatsapp && <a className="pill" href={whatsapp} target="_blank" rel="noreferrer">Chat on WhatsApp</a>}
  </form>
}

export function EnquirySheet() {
  const { overlay, enquiry, closeOverlay } = useUi()
  const mobile = useSyncExternalStore(subscribe, () => window.matchMedia(mobileQuery).matches, () => false)
  return <Sheet open={overlay === "enquiry"} onOpenChange={(open) => { if (!open && useUi.getState().overlay === "enquiry") closeOverlay() }}>
    <SheetContent side={mobile ? "bottom" : "right"} aria-labelledby="enquiry-title" data-lenis-prevent onOpenAutoFocus={(event) => {
        if (mobile) {
          event.preventDefault()
          document.getElementById("enquiry-title")?.focus()
        }
      }} onCloseAutoFocus={restoreOverlayFocus} className="overlay-scroll max-h-[92dvh] overflow-y-auto md:max-h-dvh md:w-[29rem]! md:max-w-none!">
      <SheetHeader className="p-6 pt-12">
        <SheetTitle id="enquiry-title" tabIndex={-1} className="font-display text-4xl">Enquire about a stone</SheetTitle>
        <SheetDescription>{site.replyTime}</SheetDescription>
      </SheetHeader>
      <EnquiryForm key={enquiry.map(({ slug }) => slug).join(",")} stones={enquiry} />
    </SheetContent>
  </Sheet>
}
