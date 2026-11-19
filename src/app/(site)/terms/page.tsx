import { PolicyPage } from "@/components/layout/policy-page"
import { policies } from "@/config/site"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata(policies.terms.title, policies.terms.summary, "/terms")

export default function Page() {
  return <PolicyPage policy="terms" />
}
