import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SectionHeading } from "@/components/ui/section-heading"
import { faq } from "@/config/site"

export function Faq() {
  return <section id="faq" className="wrap section film-grid border-t border-emerald/15 md:items-start">
    <SectionHeading eyebrow="Before you buy">Questions, answered.</SectionHeading>
    <Accordion type="single" collapsible className="w-full" data-reveal>
      {faq.map(({ question, answer }, index) => <AccordionItem key={question} value={String(index)}>
        <AccordionTrigger className="min-h-14 py-4 text-left text-base">{question}</AccordionTrigger>
        <AccordionContent className="text-base text-muted-foreground">{answer}</AccordionContent>
      </AccordionItem>)}
    </Accordion>
  </section>
}
