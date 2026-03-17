"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Settings2, Sparkles } from "lucide-react"

export function PricingHero({
  isAnnual,
  onToggle,
}: {
  isAnnual: boolean
  onToggle: (value: boolean) => void
}) {
  return (
    <section className="relative overflow-hidden pt-20 pb-8">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-20 right-1/4 h-[300px] w-[400px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Top pill - centered */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">
              New AI-powered features available
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>

        {/* Title - centered */}
        <div className="text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Choose the perfect plan
            <br />
            <span className="text-primary">for your team</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Flexible pricing designed to scale with your business. Start free for
            14 days, no credit card required.
          </p>
        </div>

        {/* Action bar: left = Customize, right = Billing toggle */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Left: Customize your own plan */}
          <Link href="/customize">
            <Button
              variant="outline"
              className="group relative h-12 gap-3 rounded-full border-primary/30 bg-primary/5 px-6 text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 group-hover:bg-primary/25 transition-colors">
                <Settings2 className="h-4 w-4" />
              </span>
              <span>Customize your own plan</span>
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </Button>
          </Link>

          {/* Right: Billing toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <Sparkles className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-xs text-muted-foreground font-medium">Billing cycle</span>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 p-1">
              <button
                onClick={() => onToggle(false)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                  !isAnnual
                    ? "bg-foreground text-background shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => onToggle(true)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                  isAnnual
                    ? "bg-foreground text-background shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <Badge className="bg-primary/15 text-primary border-primary/20 text-[11px] font-semibold">
                  Save 42%
                </Badge>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
