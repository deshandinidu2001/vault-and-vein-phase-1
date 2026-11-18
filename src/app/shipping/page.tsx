import { PolicyPage } from "@/components/layout/policy-page"
import { policies } from "@/config/site"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata(policies.shipping.title, policies.shipping.summary, "/shipping")

export default function Page() {
  return <PolicyPage policy="shipping" />
}
