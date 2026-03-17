"use client"

import { useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { PricingHero } from "@/components/pricing-hero"
import { PricingCards } from "@/components/pricing-cards"
import { ComparePlansButton } from "@/components/compare-plans-modal"
import { SiteFooter } from "@/components/site-footer"
import { plans } from "@/lib/pricing-data"

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PricingHero isAnnual={isAnnual} onToggle={setIsAnnual} />
        <PricingCards plans={plans} isAnnual={isAnnual} />
        <ComparePlansButton />
      </main>
      <SiteFooter />
    </div>
  )
}
