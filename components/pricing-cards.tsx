"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Sparkles, Zap, Rocket, Building2 } from "lucide-react"
import type { Plan } from "@/lib/pricing-data"
import { cn } from "@/lib/utils"
import { PlanFeaturesSheet } from "@/components/plan-features-sheet"

function PlanIcon({ planId }: { planId: string }) {
  const icons: Record<string, React.ReactNode> = {
    go: (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Zap className="h-5 w-5" />
      </div>
    ),
    plus: (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
        <Sparkles className="h-5 w-5" />
      </div>
    ),
    promax: (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
        <Rocket className="h-5 w-5" />
      </div>
    ),
    enterprise: (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
        <Building2 className="h-5 w-5" />
      </div>
    ),
  }
  return <>{icons[planId]}</>
}

export function PricingCard({
  plan,
  isAnnual,
  categoryId,
  categoryName,
}: {
  plan: Plan
  isAnnual: boolean
  categoryId?: string
  categoryName?: string
}) {
  const router = useRouter()
  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleCTAClick = () => {
    // Enterprise's CTA is "Contact Sales" -- there's no pre-built package
    // to check out with, so send them to the plan builder (pre-scoped to
    // this card's category) instead of the registration/payment flow.
    if (plan.cta?.toLowerCase().includes('contact sales')) {
      const href = categoryName
        ? `/customize?category=${encodeURIComponent(categoryName)}`
        : '/customize'
      router.push(href)
      return
    }

    localStorage.setItem('selected_plan', JSON.stringify({
      planId: plan.id,
      name: plan.name,
      price,
      billing: isAnnual ? 'annual' : 'monthly',
      features: plan.features,
      moduleNames: plan.moduleNames || [],
      description: plan.tagline,
      // Business-line category (Tax Compliance / Buyer / Supplier) this
      // package belongs to -- used after payment to decide which
      // destination system (if any) to also provision the account in.
      categoryId,
      categoryName,
      // Display-only -- the backend independently decides real trial
      // eligibility from the package's own free_tier_limit at checkout,
      // this is just so the review/success steps can tell the customer
      // what to expect before they pay.
      freeTierLimit: plan.freeTierLimit || 0,
    }))
    // Clear any previous custom plan data — user picked a pre-built plan
    localStorage.removeItem('customization_data')
    router.push('/register')
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border transition-all duration-300 hover:border-primary/30",
        plan.highlighted
          ? "border-primary/50 bg-primary/5 shadow-[0_0_30px_-5px] shadow-primary/15"
          : "border-border bg-card"
      )}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge
            className={cn(
              "px-3 py-1 text-xs font-semibold shadow-lg",
              plan.badge === "Most Popular"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-amber-500 text-amber-950 border-amber-500"
            )}
          >
            {plan.badge}
          </Badge>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <PlanIcon planId={plan.id} />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {plan.name}
            </h3>
            <span className="text-xs font-medium text-primary">
              Now with AI
            </span>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground mb-6">
          {plan.tagline}
        </p>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-sm text-muted-foreground">US$</span>
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {price}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Per seat per month{isAnnual ? ", billed annually" : ""}
          </p>
          {isAnnual && (
            <p className="mt-1 text-xs text-primary font-medium">
              ${plan.monthlyPrice}/mo if billed monthly
            </p>
          )}
          {!!plan.freeTierLimit && (
            <p className="mt-2 text-xs font-semibold text-primary">
              {plan.freeTierLimit}-day free trial, no charge until it ends
            </p>
          )}
        </div>

        {/* CTA */}
        <Button
          onClick={() => handleCTAClick()}
          className={cn(
            "w-full mb-6 font-medium h-11",
            plan.highlighted
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
              : ""
          )}
          variant={plan.ctaVariant}
        >
          {plan.cta}
        </Button>

        {/* Features */}
        <div className="flex-1">
          {plan.previousPlan && (
            <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {plan.previousPlan} Plan +
            </p>
          )}
          <ul className="flex flex-col gap-3">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm">
                <Check
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    plan.highlighted ? "text-primary" : "text-primary/70"
                  )}
                />
                <span className="text-muted-foreground leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer link */}
        <button
          className="mt-6 text-sm font-medium text-primary hover:text-primary/80 transition-colors text-left"
          onClick={() => setSheetOpen(true)}
        >
          See all features &rarr;
        </button>
      </div>

      <PlanFeaturesSheet
        plan={plan}
        isAnnual={isAnnual}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}

// A rigid 4-column grid leaves a gaping, unbalanced hole on the right
// whenever a category has fewer than 4 plans (3 is the common case) --
// sizing the grid (and its max-width) to the actual plan count keeps any
// row of 1-4 cards centered and evenly filled instead of left-stuck.
const GRID_LAYOUT: Record<number, string> = {
  1: "grid-cols-1 max-w-sm",
  2: "grid-cols-1 sm:grid-cols-2 max-w-2xl",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl",
}
const DEFAULT_GRID_LAYOUT = "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 max-w-6xl"

export function PricingCards({
  plans,
  isAnnual,
  categoryId,
  categoryName,
}: {
  plans: Plan[]
  isAnnual: boolean
  categoryId?: string
  categoryName?: string
}) {
  const gridLayout = GRID_LAYOUT[plans.length] || DEFAULT_GRID_LAYOUT

  return (
    <section className="px-4 pb-16">
      <div className={cn("mx-auto grid gap-6", gridLayout)}>
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            isAnnual={isAnnual}
            categoryId={categoryId}
            categoryName={categoryName}
          />
        ))}
      </div>
    </section>
  )
}
