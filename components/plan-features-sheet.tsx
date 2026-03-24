"use client"

import { useMemo, useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Check,
  X,
  ArrowRight,
  Sparkles,
  Zap,
  Rocket,
  Building2,
  Layers,
  Mail,
  Bot,
  BarChart3,
  Shield,
  Headphones,
  Database,
  Info,
} from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { type FeatureValue } from "@/lib/pricing-data"
import type { Plan } from "@/lib/pricing-data"
import { pricingGraphqlRequest, GET_FEATURE_COMPARISON } from "@/lib/graphql-client"

// Transformed feature category type
type FeatureCategory = {
  name: string
  features: {
    name: string
    tooltip?: string
    plans: Record<string, FeatureValue>
  }[]
}

const categoryIcons: Record<string, React.ReactNode> = {
  "Feature usage limits": <Database className="h-4 w-4" />,
  "Manage deals": <Layers className="h-4 w-4" />,
  "Email & Communication": <Mail className="h-4 w-4" />,
  "Automation & Workflows": <Bot className="h-4 w-4" />,
  "Reporting & Insights": <BarChart3 className="h-4 w-4" />,
  "Security & Admin": <Shield className="h-4 w-4" />,
  Support: <Headphones className="h-4 w-4" />,
}

const categoryColors: Record<string, string> = {
  "Feature usage limits": "text-primary bg-primary/10 border-primary/20",
  "Manage deals": "text-blue-400 bg-blue-400/10 border-blue-400/20",
  "Email & Communication": "text-sky-400 bg-sky-400/10 border-sky-400/20",
  "Automation & Workflows": "text-amber-400 bg-amber-400/10 border-amber-400/20",
  "Reporting & Insights": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  "Security & Admin": "text-rose-400 bg-rose-400/10 border-rose-400/20",
  Support: "text-violet-400 bg-violet-400/10 border-violet-400/20",
}

function PlanIconLarge({ planId }: { planId: string }) {
  const icons: Record<string, React.ReactNode> = {
    go: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Zap className="h-6 w-6" />
      </div>
    ),
    plus: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
        <Sparkles className="h-6 w-6" />
      </div>
    ),
    promax: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
        <Rocket className="h-6 w-6" />
      </div>
    ),
    enterprise: (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
        <Building2 className="h-6 w-6" />
      </div>
    ),
  }
  return <>{icons[planId]}</>
}

function isValueIncluded(value: FeatureValue | undefined): boolean {
  if (value === undefined || value === false) return false
  return true
}

function FeatureValueDisplay({ value }: { value: FeatureValue | undefined }) {
  if (value === undefined || value === false) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/10">
          <X className="h-3 w-3" />
        </span>
        Not available
      </span>
    )
  }
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
          <Check className="h-3 w-3" />
        </span>
        Included
      </span>
    )
  }
  if (typeof value === "object" && "main" in value) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Check className="h-3 w-3" />
        </span>
        <span className="text-xs font-semibold text-foreground">
          {value.main}
        </span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Check className="h-3 w-3" />
      </span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </span>
  )
}

export function PlanFeaturesSheet({
  plan,
  isAnnual,
  open,
  onOpenChange,
}: {
  plan: Plan
  isAnnual: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
  const [featureComparison, setFeatureComparison] = useState<FeatureCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])

  const fetchData = async () => {
    setLoading(true)
    try {
      const comparisonData = await pricingGraphqlRequest(GET_FEATURE_COMPARISON)

      if (comparisonData?.featureComparison) {
        const transformed: FeatureCategory[] = comparisonData.featureComparison.map((category: any) => ({
          name: category.name,
          features: category.features.map((feature: any) => {
            const plans: Record<string, FeatureValue> = {}
            
            feature.values.forEach((value: any) => {
              const packageId = value.packageId
              let transformedValue: FeatureValue
              
              try {
                const parsedValue = JSON.parse(value.valueJson)
                
                if (value.valueType === 'boolean') {
                  transformedValue = parsedValue
                } else if (value.valueType === 'complex' && typeof parsedValue === 'object') {
                  transformedValue = { main: parsedValue.main, sub: parsedValue.sub }
                } else {
                  transformedValue = parsedValue
                }
              } catch (e) {
                transformedValue = false
              }
              
              plans[packageId] = transformedValue
            })
            
            return {
              name: feature.name,
              tooltip: feature.tooltip,
              plans
            }
          })
        }))

        setFeatureComparison(transformed)
      }
    } catch (err) {
      console.error('Failed to fetch feature comparison:', err)
      setError('Unable to load features. Please make sure the backend is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  const categoryStats = useMemo(() => {
    return featureComparison.map((category) => {
      const total = category.features.length
      const included = category.features.filter((f) =>
        isValueIncluded(f.plans[plan.id])
      ).length
      return {
        name: category.name,
        total,
        included,
        pct: Math.round((included / total) * 100),
      }
    })
  }, [plan.id, featureComparison])

  const totalFeatures = categoryStats.reduce((a, c) => a + c.total, 0)
  const totalIncluded = categoryStats.reduce((a, c) => a + c.included, 0)
  const totalPct = Math.round((totalIncluded / totalFeatures) * 100)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl p-0 flex flex-col overflow-hidden border-border"
      >
        {/* Header */}
        <SheetHeader className="p-6 pb-0 gap-0">
          <div className="flex items-start gap-4">
            <PlanIconLarge planId={plan.id} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-xl font-bold text-foreground">
                  {plan.name} Plan
                </SheetTitle>
                {plan.badge && (
                  <Badge
                    className={cn(
                      "text-[10px] uppercase tracking-wider font-semibold",
                      plan.badge === "Most Popular"
                        ? "bg-primary/15 text-primary border-primary/20"
                        : "bg-amber-500/15 text-amber-400 border-amber-500/20"
                    )}
                  >
                    {plan.badge}
                  </Badge>
                )}
              </div>
              <SheetDescription className="mt-1 text-sm leading-relaxed">
                {plan.tagline}
              </SheetDescription>
            </div>
          </div>

          {/* Price block */}
          <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">US$</span>
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {price}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                per seat/month{isAnnual ? ", billed annually" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">
                {totalIncluded}/{totalFeatures}
              </p>
              <p className="text-[11px] text-muted-foreground">
                features included
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Feature coverage
              </span>
              <span className="text-xs font-bold text-primary">
                {totalPct}%
              </span>
            </div>
            <Progress value={totalPct} className="h-2" />
          </div>

          {/* Category pills */}
          <div className="mt-4 flex flex-wrap gap-2 pb-5 border-b border-border">
            {categoryStats.map((cat) => (
              <a
                key={cat.name}
                href={`#sheet-cat-${cat.name.replace(/\s+/g, "-").toLowerCase()}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:brightness-110",
                  categoryColors[cat.name] ??
                    "text-muted-foreground bg-secondary border-border"
                )}
              >
                {categoryIcons[cat.name]}
                <span className="hidden sm:inline">{cat.name}</span>
                <span className="sm:hidden">
                  {cat.name.length > 12
                    ? cat.name.slice(0, 10) + "..."
                    : cat.name}
                </span>
                <span className="opacity-60">
                  {cat.included}/{cat.total}
                </span>
              </a>
            ))}
          </div>
        </SheetHeader>

        {/* Scrollable feature list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading features...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16 px-4">
              <div className="text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive mx-auto mb-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">Failed to load features</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : featureComparison.map((category, catIdx) => {
            const stat = categoryStats[catIdx]
            return (
              <div
                key={category.name}
                id={`sheet-cat-${category.name.replace(/\s+/g, "-").toLowerCase()}`}
                className={cn("scroll-mt-4", catIdx > 0 && "mt-6")}
              >
                {/* Category heading */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border",
                      categoryColors[category.name] ??
                        "text-muted-foreground bg-secondary border-border"
                    )}
                  >
                    {categoryIcons[category.name]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      {category.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {stat.included} of {stat.total} features available
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={stat.pct} className="w-16 h-1.5" />
                    <span className="text-[11px] font-bold text-muted-foreground w-8 text-right">
                      {stat.pct}%
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  {category.features.map((feature, idx) => {
                    const value = feature.plans[plan.id]
                    const included = isValueIncluded(value)
                    return (
                      <div
                        key={feature.name}
                        className={cn(
                          "flex items-center justify-between gap-3 px-4 py-3 transition-colors",
                          idx < category.features.length - 1 &&
                            "border-b border-border/50",
                          included
                            ? "bg-card hover:bg-secondary/30"
                            : "bg-muted-foreground/[0.02] opacity-60"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "text-sm leading-snug",
                              included
                                ? "text-foreground"
                                : "text-muted-foreground line-through decoration-muted-foreground/30"
                            )}
                          >
                            {feature.name}
                          </span>
                          {feature.tooltip && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-xs"
                              >
                                {feature.tooltip}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <FeatureValueDisplay value={value} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Plan highlights */}
          <div className="mt-8 scroll-mt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Plan Highlights
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Key features in your {plan.name} plan
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/[0.03] overflow-hidden">
              {plan.features.map((feature, idx) => (
                <div
                  key={feature}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    idx < plan.features.length - 1 &&
                      "border-b border-primary/10"
                  )}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {!loading && !error && plan.previousPlan && (
            <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {plan.name}
                </span>{" "}
                includes everything in{" "}
                <span className="font-semibold text-primary">
                  {plan.previousPlan}
                </span>
                , plus the features above.
              </p>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <SheetFooter className="border-t border-border bg-card/80 backdrop-blur-sm p-4 gap-2 flex-row">
          <Button
            className={cn(
              "flex-1 h-11 font-semibold gap-2",
              plan.highlighted
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                : ""
            )}
            variant={plan.ctaVariant}
          >
            {plan.cta}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-11 px-6"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
