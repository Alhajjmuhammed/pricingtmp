"use client"

import { Landmark, ShoppingCart, Truck, Layers, ArrowRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PublicPlan } from "@/lib/graphql-client"

// Categories are admin-managed Plans from the billing API (name/description
// are free text) -- this only picks a matching icon by keyword, it never
// hides or invents a category that isn't actually there.
function CategoryIcon({ name }: { name: string }) {
  const lower = name.toLowerCase()
  if (lower.includes("tax")) return <Landmark className="h-6 w-6" />
  if (lower.includes("buyer")) return <ShoppingCart className="h-6 w-6" />
  if (lower.includes("supplier")) return <Truck className="h-6 w-6" />
  return <Layers className="h-6 w-6" />
}

export function CategorySelector({
  categories,
  onSelect,
}: {
  categories: PublicPlan[]
  onSelect: (category: PublicPlan) => void
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          What best describes you?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Pick a category to see the plans built for it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const isAvailable = category.packages.length > 0
          return (
            <button
              key={category.id}
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelect(category)}
              className={cn(
                "group relative flex flex-col items-start gap-4 rounded-2xl border p-6 text-left transition-all duration-300",
                isAvailable
                  ? "border-border bg-card hover:border-primary/40 hover:shadow-lg cursor-pointer"
                  : "border-border/50 bg-card/50 cursor-not-allowed opacity-60"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CategoryIcon name={category.name} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {category.description}
                  </p>
                )}
              </div>

              {isAvailable ? (
                <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary">
                  {category.packages.length} plan{category.packages.length === 1 ? "" : "s"} available
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </span>
              ) : (
                <span className="mt-auto flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Coming soon
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
