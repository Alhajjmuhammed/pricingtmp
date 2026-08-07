"use client"

import { Check, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Module } from "@/lib/customize-data"

/**
 * One bordered container for the whole catalog -- not one box per
 * SubFeature -- so it stays compact and doesn't turn into a long, heavy
 * scroll when there are many Features. Feature names are just an
 * underlined section label inside it; SubFeature rows are plain rows
 * separated by hairline dividers, not individual cards.
 */
export function FeatureList({
  modules,
  selectedItems,
  onToggleItem,
  billingCycle,
  formatPrice,
  freeLabel,
}: {
  modules: Module[]
  selectedItems: Record<string, boolean>
  onToggleItem: (itemId: string) => void
  billingCycle: "monthly" | "yearly"
  formatPrice: (val: number) => string
  freeLabel: string
}) {
  return (
    <div className="w-full max-w-3xl mx-auto rounded-2xl border border-border overflow-hidden bg-card">
      {modules.map((mod, modIndex) => {
        const selectedCount = mod.items.filter((item) => selectedItems[item.id]).length

        return (
          <div key={mod.id}>
            <div
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-2.5 bg-secondary/40",
                modIndex > 0 && "border-t border-border"
              )}
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground underline decoration-border underline-offset-4">
                {mod.name}
              </h3>
              {selectedCount > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                  <Sparkles className="h-2.5 w-2.5" />
                  {selectedCount} selected
                </span>
              )}
            </div>

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
          </div>
        )
      })}
    </div>
  )
}
