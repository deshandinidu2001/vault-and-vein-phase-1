import "server-only"
import { z } from "zod"
import { backendConfigured, database } from "./backend"
import { permitRequest, readJson } from "./http"
import { contactSchema, enquirySchema } from "./validators"

const enquiry = enquirySchema.extend({
  stones: z.array(z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80)).max(20).default([]),
})

export async function saveMessage(request: Request, kind: "contact" | "enquiry") {
  const source = request.headers.get("sec-fetch-site")
  if (source && source !== "same-origin") {
    return Response.json({ message: "Send this message from the storefront." }, { status: 403 })
  }
  const schema = kind === "contact" ? contactSchema : enquiry
  const parsed = schema.safeParse(await readJson(request))
  if (!parsed.success) return Response.json({ message: "Please check the form and try again." }, { status: 400 })
  if (!backendConfigured) return Response.json({ preview: true })
  try {
    if (!await permitRequest(request, kind, parsed.data.email)) {
      return Response.json({ message: "Please wait before sending another message." }, { status: 429 })
    }
    await database().inboxMessage.create({
      data: { kind, email: parsed.data.email.toLowerCase(), payload: parsed.data },
    })
    return Response.json({ preview: false }, { status: 201 })
  } catch {
    return Response.json({ message: "We couldn’t save your message. Please try again." }, { status: 503 })
  }
}
