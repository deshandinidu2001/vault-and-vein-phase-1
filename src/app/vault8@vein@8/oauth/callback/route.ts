import type { NextRequest } from "next/server"
import { finishAdminGoogleSignIn } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  return finishAdminGoogleSignIn(request)
}
