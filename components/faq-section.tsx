"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faqs } from "@/lib/pricing-data"

export function FaqSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-3 text-muted-foreground text-lg">
          Everything you need to know about our pricing and plans.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`faq-${index}`}
            className="border-border"
          >
            <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline py-5 text-base">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-5">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
