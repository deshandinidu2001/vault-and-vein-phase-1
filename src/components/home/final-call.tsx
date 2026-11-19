import { ArrowUpRight } from "lucide-react"
import { photos } from "@/config/images"
import { site } from "@/config/site"
import { ResponsivePhoto } from "@/components/ui/responsive-photo"
import { EnquireButton } from "@/components/layout/enquire-button"

export function FinalCall() {
  return (
    <section className="wrap section" aria-labelledby="closing-title">
      <div className="editorial-card closing-banner">
        <div className="closing-backdrop" aria-hidden="true">
          <ResponsivePhoto photo={photos.closing} sizes="(min-width: 1600px) 1520px, 94vw" />
        </div>
        <div className="closing-copy">
          <p className="eyebrow">Make time for a stone</p>
          <h2 id="closing-title">Ready when you are.</h2>
          <p>Start with a colour you love, a setting you have in mind or a budget you’d like to work within. We can help you narrow down the possibilities.</p>
          <div className="closing-action">
            <EnquireButton className="pill-primary closing-enquiry">
              Ask about a stone
              <span className="action-disc"><ArrowUpRight size={18} aria-hidden="true" /></span>
            </EnquireButton>
            <p>{site.replyTime}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
