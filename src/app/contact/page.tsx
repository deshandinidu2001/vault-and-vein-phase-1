import { ContactForm } from "@/components/layout/contact-form"
import { site, whatsappLink } from "@/config/site"
import { pageMetadata } from "@/lib/seo"

export const metadata = pageMetadata("Contact", "Ask Vault & Vein about a stone, a jewellery project or delivery.", "/contact")

export default function Contact() {
  const whatsapp = whatsappLink("Hello Vault & Vein, I have a question.")
  return <div className="wrap section page-top space-y-12">
    <div className="space-y-5">
      <p className="eyebrow text-[#785520]">Contact</p>
      <h1>Let’s talk stones.</h1>
      <p>Tell us about the stone you have in mind, a setting you’re planning or a detail you’d like us to clarify.</p>
    </div>
    <div className="film-grid items-start!">
      <section className="space-y-6 rounded-2xl border border-emerald/15 p-5 md:p-8" aria-labelledby="message-title">
        <h2 id="message-title" className="text-4xl">Send a message</h2>
        <ContactForm />
      </section>
      <section className="grid gap-5" aria-labelledby="contact-details">
        <h2 id="contact-details" className="text-4xl">Contact details</h2>
        <dl className="grid gap-3">
          <div><dt className="font-semibold">Email</dt><dd>{site.email ? <a className="line-link" href={"mailto:" + site.email}>{site.email}</a> : "Email address to be announced."}</dd></div>
          <div><dt className="font-semibold">Business hours</dt><dd>{site.businessHours || "Hours to be announced."}</dd></div>
        </dl>
        {whatsapp
          ? <a className="pill w-fit" href={whatsapp} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
          : <button className="pill w-fit" type="button" disabled>Chat on WhatsApp</button>}
        <figure className="space-y-2">
          <iframe src={site.mapEmbedUrl} title={"Map of " + site.country} loading="lazy" referrerPolicy="no-referrer" className="aspect-[4/3] w-full rounded-2xl border border-emerald/15" />
          <figcaption className="text-sm text-muted-foreground">Our roots are in Sri Lanka. The map shows the country.</figcaption>
        </figure>
      </section>
    </div>
  </div>
}
