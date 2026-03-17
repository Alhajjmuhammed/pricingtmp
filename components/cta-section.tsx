"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Headphones, CreditCard, Settings2 } from "lucide-react"

export function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 sm:p-16 text-center">
        {/* Glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Ready to accelerate your sales?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-lg leading-relaxed">
            Start your free 14-day trial today. Full access to Professional
            features, no credit card required.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-12 px-8 text-base font-semibold shadow-lg shadow-primary/20"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Link href="/customize">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 h-12 px-8 text-base border-primary/30 text-primary hover:bg-primary/10"
              >
                <Settings2 className="h-4 w-4" />
                Build custom plan
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 h-12 px-8 text-base"
            >
              Talk to Sales
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Headphones className="h-4 w-4 text-primary" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>No credit card needed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
