"use client"

import { Star, Quote } from "lucide-react"
import { testimonials } from "@/lib/pricing-data"

export function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      {/* Trust bar */}
      <div className="text-center mb-12">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-6">
          Trusted by 100,000+ sales teams worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {["Cloudflare", "Stripe", "Shopify", "Twilio", "Notion"].map(
            (company) => (
              <span
                key={company}
                className="text-lg font-bold text-muted-foreground/40 tracking-wide"
              >
                {company}
              </span>
            )
          )}
        </div>
      </div>

      {/* Testimonials */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/20"
          >
            <Quote className="h-8 w-8 text-primary/20 mb-4" />
            <p className="text-sm leading-relaxed text-muted-foreground mb-6">
              {`"${t.quote}"`}
            </p>
            <div className="flex items-center gap-2 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground">
                {t.role}, {t.company}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
