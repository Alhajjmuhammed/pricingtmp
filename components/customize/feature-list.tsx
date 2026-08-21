"use client"

import { useState } from "react"
import { Check, ChevronDown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Module } from "@/lib/customize-data"

/**
 * One bordered container per category -- not one box per SubFeature -- so
 * each card stays compact and doesn't turn into a long, heavy scroll when
 * there are many Features. Feature names are just an underlined section
 * label inside it; SubFeature rows are plain rows separated by hairline
 * dividers, not individual cards.
 *
 * Each Feature group starts collapsed -- with two categories side by side,
 * each holding several Features with several SubFeatures apiece, fully
 * expanding everything by default turned this into a very long scroll.
 * The "N selected" badge stays visible on a collapsed group so a customer
 * can see what they've already picked without opening it back up.
 */
function CategoryCard({
  categoryName,
  modules,
  selectedItems,
  onToggleItem,
  billingCycle,
  formatPrice,
  freeLabel,
}: {
  categoryName: string
  modules: Module[]
  selectedItems: Record<string, boolean>
  onToggleItem: (itemId: string) => void
  billingCycle: "monthly" | "yearly"
  formatPrice: (val: number) => string
  freeLabel: string
}) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})
  const toggleExpanded = (modId: string) =>
    setExpandedIds((prev) => ({ ...prev, [modId]: !prev[modId] }))

  return (
    <div className="flex-1 min-w-0 lg:min-w-[280px] w-full rounded-2xl border border-border overflow-hidden bg-card">
      <div className="px-4 py-3 bg-primary/5 border-b border-border">
        <h2 className="text-sm font-bold text-foreground truncate">{categoryName}</h2>
      </div>

      {modules.length === 0 ? (
        <p className="px-4 py-6 text-xs text-muted-foreground text-center">
          No modules configured for this category yet.
        </p>
      ) : (
        modules.map((mod, modIndex) => {
          const selectedCount = mod.items.filter((item) => selectedItems[item.id]).length
          const isExpanded = !!expandedIds[mod.id]

          return (
            <div key={mod.id}>
              <button
                type="button"
                onClick={() => toggleExpanded(mod.id)}
                aria-expanded={isExpanded}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-2.5 bg-secondary/40 hover:bg-secondary/60 transition-colors text-left",
                  modIndex > 0 && "border-t border-border"
                )}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform",
                      !isExpanded && "-rotate-90"
                    )}
                  />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground underline decoration-border underline-offset-4 truncate">
                    {mod.name}
                  </h3>
                </span>
                {selectedCount > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                    <Sparkles className="h-2.5 w-2.5" />
                    {selectedCount} selected
                  </span>
                )}
              </button>

              {isExpanded && (
              <div className="divide-y divide-border">
                {mod.items.map((item) => {
                  const isSelected = selectedItems[item.id] ?? false
                  const price = billingCycle === "yearly" ? item.price * 0.8 : item.price

                  return (
                    <div
                      key={item.id}
                      onClick={() => onToggleItem(item.id)}
                      className={cn(
                        "flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                        isSelected ? "bg-primary/[0.06]" : "hover:bg-secondary/30"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-[18px] h-[18px] rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            isSelected ? "bg-primary border-primary" : "bg-card border-border"
                          )}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-sm font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
                            {item.name}
                          </p>
                          {item.desc && (
                            <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-bold tabular-nums shrink-0",
                          isSelected ? "text-primary" : "text-foreground"
                        )}
                      >
                        {item.price === 0 ? freeLabel : `${formatPrice(price)} / ${item.per || "u"}`}
                      </span>
                    </div>
                  )
                })}
              </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

/**
 * One card per toggled-on category, laid out side by side on larger
 * screens (first Tax Compliance Agents, then Buyer, then Supplier -- same
 * order the category toggles appear in) and stacked on mobile. A module
 * shared by more than one category's catalog appears once per card it's
 * relevant to; selecting it in one card selects it everywhere (same
 * SubFeature id, same shared selection state) since it's genuinely the
 * same purchasable thing either way.
 */
export function FeatureList({
  categorizedModules,
  selectedItems,
  onToggleItem,
  billingCycle,
  formatPrice,
  freeLabel,
}: {
  categorizedModules: Array<{ category: { id: string; name: string }; modules: Module[] }>
  selectedItems: Record<string, boolean>
  onToggleItem: (itemId: string) => void
  billingCycle: "monthly" | "yearly"
  formatPrice: (val: number) => string
  freeLabel: string
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start w-full">
      {categorizedModules.map(({ category, modules }) => (
        <CategoryCard
          key={category.id}
          categoryName={category.name}
          modules={modules}
          selectedItems={selectedItems}
          onToggleItem={onToggleItem}
          billingCycle={billingCycle}
          formatPrice={formatPrice}
          freeLabel={freeLabel}
        />
      ))}
    </div>
  )
}
