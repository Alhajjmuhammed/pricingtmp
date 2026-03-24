"use client"

import { useState, useEffect } from "react"
import { SiteHeader } from "@/components/site-header"
import { PricingHero } from "@/components/pricing-hero"
import { PricingCards } from "@/components/pricing-cards"
import { ComparePlansButton } from "@/components/compare-plans-modal"
import { SiteFooter } from "@/components/site-footer"
import { type Plan } from "@/lib/pricing-data"
import { pricingGraphqlRequest, GET_PRICING_PLANS } from "@/lib/graphql-client"

interface PricingPlansResponse {
  pricingPagePackages: Plan[]
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPricingPlans() {
      try {
        const data = await pricingGraphqlRequest<PricingPlansResponse>(
          GET_PRICING_PLANS
        )
        if (data.pricingPagePackages && data.pricingPagePackages.length > 0) {
          setPlans(data.pricingPagePackages)
        } else {
          setError('No pricing plans returned from the API.')
        }
      } catch (err) {
        console.error('Failed to fetch pricing plans:', err)
        setError('Unable to load pricing plans. Please make sure the backend is running on port 8000.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPricingPlans()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PricingHero isAnnual={isAnnual} onToggle={setIsAnnual} />
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Loading pricing plans...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-24 px-4">
            <div className="text-center max-w-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">Failed to load plans</h3>
              <p className="text-sm text-muted-foreground mb-5">{error}</p>
              <button
                onClick={() => { setError(null); setIsLoading(true); window.location.reload() }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            <PricingCards plans={plans} isAnnual={isAnnual} />
            <ComparePlansButton />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
