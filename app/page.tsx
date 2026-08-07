"use client"

import { useState, useEffect, useMemo } from "react"
import { SiteHeader } from "@/components/site-header"
import { PricingHero } from "@/components/pricing-hero"
import { PricingCards } from "@/components/pricing-cards"
import { CategorySelector } from "@/components/category-selector"
import { ComparePlansButton } from "@/components/compare-plans-modal"
import { SiteFooter } from "@/components/site-footer"
import { ArrowLeft } from "lucide-react"
import { billingGraphqlRequest, GET_PUBLIC_PLANS, type PublicPlan } from "@/lib/graphql-client"
import { filterCategoriesByParam, getCategoryParam, buildCustomizeHref } from "@/lib/category-filter"

interface PublicPlansResponse {
  publicPlans: PublicPlan[]
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true)
  const [categories, setCategories] = useState<PublicPlan[]>([])
  const [selectedCategory, setSelectedCategory] = useState<PublicPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ?category=tax / ?category=tax,buyer / ?category=all (default) --
  // restricts which categories are offered at all, on this page and on
  // the same-origin link into /customize below. See lib/category-filter.
  const visibleCategories = useMemo(
    () => filterCategoriesByParam(categories, getCategoryParam()),
    [categories]
  )

  // "Customize your own plan" links (header + hero) should carry this
  // page's category context forward, not reset to every category.
  const customizeHref = useMemo(
    () => buildCustomizeHref(selectedCategory, getCategoryParam()),
    [selectedCategory]
  )

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await billingGraphqlRequest<PublicPlansResponse>(GET_PUBLIC_PLANS)
        if (data.publicPlans && data.publicPlans.length > 0) {
          setCategories(data.publicPlans)
        } else {
          setError('No pricing plans returned from the API.')
        }
      } catch (err) {
        console.error('Failed to fetch pricing plans:', err)
        setError('Unable to load pricing plans. Please check NEXT_PUBLIC_BILLING_GRAPHQL_URL in .env.local.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Skip the picker entirely once there's exactly one category to offer
  // -- either because the URL narrowed it down to one, or because the
  // tenant only has one real category with packages.
  useEffect(() => {
    if (selectedCategory) return
    const withPlans = visibleCategories.filter((c) => c.packages.length > 0)
    if (withPlans.length === 1 && visibleCategories.length === 1) {
      setSelectedCategory(withPlans[0])
    }
  }, [visibleCategories, selectedCategory])

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader customizeHref={customizeHref} />
      <main>
        <PricingHero isAnnual={isAnnual} onToggle={setIsAnnual} customizeHref={customizeHref} />
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
        ) : !selectedCategory ? (
          <CategorySelector categories={visibleCategories} onSelect={setSelectedCategory} />
        ) : (
          <>
            {visibleCategories.length > 1 && (
              <div className="mx-auto max-w-6xl px-4 pt-2 mb-6">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  All categories
                </button>
                <h2 className="mt-4 text-xl font-semibold text-foreground">
                  {selectedCategory.name} plans
                </h2>
              </div>
            )}
            <PricingCards
              plans={selectedCategory.packages}
              isAnnual={isAnnual}
              categoryId={selectedCategory.id}
              categoryName={selectedCategory.name}
            />
            <ComparePlansButton />
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
