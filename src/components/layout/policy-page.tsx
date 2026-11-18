import Link from "next/link"
import { policies, type PolicyKey } from "@/config/site"

export function PolicyPage({ policy }: { policy: PolicyKey }) {
  const { title, summary, sections } = policies[policy]
  return <article className="wrap section page-top grid justify-items-start gap-8">
    <p className="eyebrow text-[#785520]">Store policies</p>
    <h1>{title}</h1>
    <p>{summary}</p>
    {sections.map(({ heading, body }) => <section key={heading} className="grid gap-3">
      <h2 className="text-4xl">{heading}</h2><p>{body}</p>
    </section>)}
    <Link href="/contact" className="pill">Ask us a question</Link>
  </article>
}
