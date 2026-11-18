import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SectionHeading } from "@/components/ui/section-heading"
import { faq } from "@/config/site"

export function Faq() {
  return <section id="faq" className="wrap section film-grid border-t border-emerald/15 md:items-start">
    <SectionHeading eyebrow="Before you buy">Questions, answered.</SectionHeading>
    <Accordion type="single" collapsible className="w-full" data-reveal>
      {faq.map(({ question, answer }, index) => <AccordionItem key={question} value={String(index)}>
        <AccordionTrigger className="min-h-16 items-center gap-4 py-4 text-left font-display text-[clamp(1.35rem,2vw,1.85rem)] font-semibold leading-snug">{question}</AccordionTrigger>
        <AccordionContent className="max-w-[60ch] pb-5 pr-6 font-sans text-lg leading-relaxed text-muted-foreground">{answer}</AccordionContent>
      </AccordionItem>)}
    </Accordion>
  </section>
}
