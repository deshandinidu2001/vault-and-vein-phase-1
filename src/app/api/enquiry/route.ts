import { saveMessage } from "@/lib/inbox"

export function POST(request: Request) { return saveMessage(request, "enquiry") }
