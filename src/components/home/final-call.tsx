import { ArrowUpRight } from "lucide-react"
import { photos } from "@/config/images"
import { site } from "@/config/site"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"
import { EnquireButton } from "@/components/layout/enquire-button"

export function FinalCall() {
  return (
    <section className="wrap section" aria-labelledby="closing-title">
      <div className="editorial-card closing-banner">
        <svg className="closing-sketch" viewBox="0 0 640 640" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
          <circle cx="320" cy="320" r="289" />
          <circle cx="320" cy="320" r="254" />
          <path d="m320 78 167 71 73 171-73 171-167 71-167-71-73-171 73-171Z" />
          <path d="m320 78 99 143 141 99-141 99-99 143-99-143-141-99 141-99Z" />
          <path d="m221 221 99-43 99 43 43 99-43 99-99 43-99-43-43-99Z" />
        </svg>
        <div className="closing-copy">
          <p className="eyebrow">Make time for a stone</p>
          <h2 id="closing-title">Ready when you are.</h2>
          <p>Start with a colour you love, a setting you have in mind or a budget you’d like to work within. We can help you narrow down the possibilities.</p>
          <div className="closing-action">
            <EnquireButton className="pill-primary closing-enquiry">
              Enquire about a stone
              <span className="action-disc"><ArrowUpRight size={18} aria-hidden="true" /></span>
            </EnquireButton>
            <p>{site.replyTime}</p>
          </div>
        </div>
        <div className="closing-arch">
          <ResponsivePhoto photo={photos.closing} sizes="(min-width: 1600px) 624px, (min-width: 768px) 44vw, 90vw" />
        </div>
      </div>
    </section>
  )
}
