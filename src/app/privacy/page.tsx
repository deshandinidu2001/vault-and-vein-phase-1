import { PolicyPage } from "@/components/layout/policy-page"
import { policies } from "@/config/site"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata(policies.privacy.title, policies.privacy.summary, "/privacy")

export default function Page() {
  return <PolicyPage policy="privacy" />
}
