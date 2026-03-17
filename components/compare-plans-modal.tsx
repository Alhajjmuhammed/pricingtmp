"use client"

import { useState, useCallback } from "react"
import { X, ChevronUp, ChevronDown, Info, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { featureComparison, plans, type FeatureValue } from "@/lib/pricing-data"

/* ---------- Value renderer matching screenshot style ---------- */
function CellValue({ value }: { value: FeatureValue | undefined }) {
  if (value === undefined || value === false) {
    return <span className="text-muted-foreground/25">&mdash;</span>
  }
  if (value === true) {
    return (
      <svg
        className="mx-auto h-5 w-5 text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }
  if (typeof value === "object" && "main" in value) {
    return (
      <div className="flex flex-col items-center">
        <span className="text-sm font-semibold text-foreground">{value.main}</span>
        <span className="text-[11px] text-muted-foreground leading-tight">({value.sub})</span>
      </div>
    )
  }
  return <span className="text-sm font-semibold text-foreground">{value}</span>
}

/* ---------- Category section with collapsible toggle ---------- */
function CategorySection({
  category,
}: {
  category: (typeof featureComparison)[number]
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <>
      {/* Category header row */}
      <tr
        className="cursor-pointer select-none group border-b border-border bg-secondary/40 hover:bg-secondary/60 transition-colors"
        onClick={() => setIsOpen((p) => !p)}
      >
        <td
          colSpan={plans.length + 1}
          className="px-6 py-3"
        >
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-foreground/70 transition-transform" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-foreground/70 transition-transform" />
            )}
            <span className="text-sm font-bold text-foreground tracking-tight">
              {category.name}
            </span>
          </div>
        </td>
      </tr>

      {/* Feature rows */}
      {isOpen &&
        category.features.map((feature, idx) => (
          <tr
            key={feature.name}
            className={cn(
              "transition-colors hover:bg-secondary/20",
              idx < category.features.length - 1
                ? "border-b border-border/40"
                : "border-b border-border"
            )}
          >
            {/* Feature name */}
            <td className="px-6 py-3.5 text-sm text-muted-foreground min-w-[260px]">
              <span className="inline-flex items-center gap-2">
                {feature.tooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground/50 cursor-help hover:border-muted-foreground/40 hover:text-muted-foreground/70 transition-colors">
                        <Info className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      className="max-w-xs text-xs"
                    >
                      {feature.tooltip}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground/30">
                    <Info className="h-3 w-3" />
                  </span>
                )}
                <span>{feature.name}</span>
              </span>
            </td>

            {/* Plan values */}
            {plans.map((plan) => (
              <td
                key={plan.id}
                className={cn(
                  "px-4 py-3.5 text-center min-w-[160px]",
                  plan.highlighted && "bg-primary/[0.02]"
                )}
              >
                <CellValue value={feature.plans[plan.id]} />
              </td>
            ))}
          </tr>
        ))}
    </>
  )
}

/* ---------- Full-screen comparison modal ---------- */
export function ComparePlansModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card shrink-0">
        <h2 className="text-lg font-bold text-foreground">Compare plans in detail</h2>
        <button
          onClick={close}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Close comparison"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1200px] px-4 py-6">
          <table className="w-full border-collapse">
            {/* Sticky column headers */}
            <thead>
              <tr className="sticky top-0 z-20 bg-background">
                <th className="px-6 py-5 text-left text-sm font-normal text-muted-foreground w-[280px]" />
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    className={cn(
                      "px-4 py-5 text-center min-w-[160px]",
                      plan.highlighted && "bg-primary/[0.02]"
                    )}
                  >
                    <span
                      className={cn(
                        "text-base font-bold",
                        plan.highlighted ? "text-primary" : "text-foreground"
                      )}
                    >
                      {plan.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Category sections */}
            <tbody>
              {featureComparison.map((category) => (
                <CategorySection
                  key={category.name}
                  category={category}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-card shrink-0">
        <p className="text-sm text-muted-foreground">
          {featureComparison.reduce((acc, c) => acc + c.features.length, 0)} features compared across {plans.length} plans
        </p>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={close}>
            Close
          </Button>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            Start free trial
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Compare plans trigger button ---------- */
export function ComparePlansButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setOpen(true)}
            className="group h-14 gap-3 rounded-2xl border-border bg-card px-8 text-base font-semibold text-foreground hover:bg-secondary/50 hover:border-primary/30 transition-all duration-300 shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </span>
            Compare plans in detail
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Every feature across every plan, so you can make an informed decision
          </p>
        </div>
      </section>

      <ComparePlansModal open={open} onOpenChange={setOpen} />
    </>
  )
}
