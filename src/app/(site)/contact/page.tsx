import { ContactForm } from "@/components/layout/contact-form"
import { site, whatsappLink } from "@/config/site"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata("Contact", "Ask Vault & Vein about a stone, a jewellery project or delivery.", "/contact")

export default function Contact() {
  const whatsapp = whatsappLink("Hello Vault & Vein, I have a question.")
  return <div className="wrap wrap-editorial section page-top-compact space-y-8 lg:space-y-10">
    <div className="space-y-4">
      <p className="eyebrow text-[#785520]">Contact</p>
      <h1>Let’s talk stones.</h1>
      <p className="max-w-[65ch]">Tell us about the stone you have in mind, a setting you’re planning or a detail you’d like us to clarify.</p>
    </div>
    <div className="film-grid items-start!">
      <section className="space-y-6 rounded-2xl border border-emerald/15 p-5 md:p-8" aria-labelledby="message-title">
        <h2 id="message-title" className="text-4xl">Send a message</h2>
        <ContactForm />
      </section>
      <section className="grid gap-5" aria-labelledby="contact-details">
        <h2 id="contact-details" className="text-4xl">Contact details</h2>
        <dl className="grid divide-y divide-emerald/15 rounded-2xl border border-emerald/15 bg-[#fbf8ef] px-5 md:px-6">
          <div className="grid items-center gap-1 py-4 sm:grid-cols-[8rem_1fr]">
            <dt className="font-semibold">Email</dt>
            <dd><a className="line-link" href={"mailto:" + site.email}>{site.email}</a></dd>
          </div>
          <div className="grid items-center gap-1 py-4 sm:grid-cols-[8rem_1fr]">
            <dt className="font-semibold">Mobile</dt>
            <dd><a className="line-link" href={"tel:" + site.mobile}>{site.mobile}</a></dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]">
            <dt className="font-semibold">Business hours</dt>
            <dd>{site.businessHours}</dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[8rem_1fr]">
            <dt className="font-semibold">Country</dt>
            <dd>{site.country}</dd>
          </div>
        </dl>
        {whatsapp && <a className="pill w-fit" href={whatsapp} target="_blank" rel="noreferrer">Chat on WhatsApp</a>}
      </section>
    </div>
  </div>
}
