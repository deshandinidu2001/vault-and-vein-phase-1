import "server-only"
import { z } from "zod"
import { backendConfigured, serviceDatabase } from "./backend"
import { permitRequest, readJson } from "./http"
import { contactSchema, enquirySchema } from "./validators"

const enquiry = enquirySchema.extend({
  stones: z.array(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80)).max(20).default([]),
})

export async function saveMessage(request: Request, kind: "contact" | "enquiry") {
  const schema = kind === "contact" ? contactSchema : enquiry
  const parsed = schema.safeParse(await readJson(request))
  if (!parsed.success) return Response.json({ message: "Please check the form and try again." }, { status: 400 })
  if (!backendConfigured) return Response.json({ preview: true })
  try {
    if (!await permitRequest(request, kind, parsed.data.email)) {
      return Response.json({ message: "Please wait before sending another message." }, { status: 429 })
    }
    const { error } = await serviceDatabase().from("inbox").insert({ kind, email: parsed.data.email.toLowerCase(), payload: parsed.data })
    if (error) throw error
    return Response.json({ preview: false }, { status: 201 })
  } catch {
    return Response.json({ message: "We couldn’t save your message. Please try again." }, { status: 503 })
  }
}
