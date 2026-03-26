"use client"

import { Check, Info, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import type { Module } from "@/lib/customize-data"

export function ModuleCard({
  mod,
  isActive,
  selectedItems,
  setSelectedItems,
  selectedSubFeatures,
  setSelectedSubFeatures,
  expandedFeatures,
  setExpandedFeatures,
  billingCycle,
  formatPrice,
  freeLabel,
  selectedLabel,
  onToggle,
}: {
  mod: Module
  isActive: boolean
  selectedItems: Record<string, boolean>
  setSelectedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  selectedSubFeatures: Record<string, boolean>
  setSelectedSubFeatures: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  expandedFeatures: Record<string, boolean>
  setExpandedFeatures: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  billingCycle: "monthly" | "yearly"
  formatPrice: (val: number) => string
  freeLabel: string
  selectedLabel: string
  onToggle: () => void
}) {
  // Calculate price for a feature (from selected sub-features or base price)
  const calculateFeaturePrice = (item: typeof mod.items[0]) => {
    if (item.subFeatures && item.subFeatures.length > 0) {
      let total = 0
      item.subFeatures.forEach(sf => {
        if (selectedSubFeatures[sf.id]) {
          total += sf.price
        }
      })
      return total
    }
    return item.price
  }

  return (
    <div
      className={cn(
        "min-w-[300px] sm:min-w-[340px] lg:min-w-[360px] bg-card rounded-3xl border flex flex-col shadow-sm transition-all duration-500 shrink-0",
        isActive
          ? "border-border hover:shadow-lg hover:border-primary/20"
          : "opacity-20 grayscale border-border cursor-pointer"
      )}
      onClick={!isActive ? onToggle : undefined}
    >
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shadow-sm",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
          <h4 className="font-bold text-xs uppercase tracking-widest text-foreground">
            {mod.name}
          </h4>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground/40 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top">Module includes {mod.items.length} features</TooltipContent>
        </Tooltip>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[420px] scrollbar-hide">
        {mod.items.map((item) => {
          const isSelected = selectedItems[item.id] ?? false
          const hasSubFeatures = item.subFeatures && item.subFeatures.length > 0
          const isExpanded = expandedFeatures[item.id] ?? false
          const displayPrice =
            billingCycle === "yearly" ? calculateFeaturePrice(item) * 0.8 : calculateFeaturePrice(item)
          const selectedSubFeatureCount = hasSubFeatures
            ? item.subFeatures!.filter(sf => selectedSubFeatures[sf.id]).length
            : 0

          return (
            <div key={item.id} className="space-y-1">
              {/* Feature */}
              <div
                onClick={() => {
                  setSelectedItems((p) => ({ ...p, [item.id]: !p[item.id] }))
                  // Auto-expand when selecting a feature with sub-features
                  if (hasSubFeatures && !isSelected) {
                    setExpandedFeatures(p => ({ ...p, [item.id]: true }))
                  }
                }}
                className={cn(
                  "p-4 rounded-2xl group cursor-pointer transition-all duration-200 border",
                  isSelected
                    ? "bg-primary/[0.06] border-primary/25 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-secondary/40 hover:border-border"
                )}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          "text-[11px] font-bold transition-colors",
                          isSelected ? "text-primary" : "text-foreground/80"
                        )}
                      >
                        {item.name}
                      </span>
                      {hasSubFeatures && (
                        <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">
                          {selectedSubFeatureCount}/{item.subFeatures!.length} sub-features
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-snug font-medium">
                      {item.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasSubFeatures && isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedFeatures(p => ({ ...p, [item.id]: !p[item.id] }))
                        }}
                        className="p-1 hover:bg-secondary/50 rounded transition-colors"
                      >
                        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                      </button>
                    )}
                    <div className="flex flex-col items-end gap-2.5">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                          isSelected
                            ? "bg-primary border-primary"
                            : "bg-card border-border"
                        )}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                        )}
                      </div>
                      {item.price === 0 && !hasSubFeatures ? (
                        <span className="text-[8px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {freeLabel}
                        </span>
                      ) : (
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-tight tabular-nums",
                          hasSubFeatures ? "text-purple-600" : "text-muted-foreground"
                        )}>
                          {formatPrice(displayPrice)} / {item.per || "u"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Features */}
              {hasSubFeatures && isExpanded && isSelected && (
                <div className="bg-secondary/30 rounded-xl p-2 border border-border/50 ml-2 space-y-1">
                  {item.subFeatures!.map((subFeature) => {
                    const isSubSelected = selectedSubFeatures[subFeature.id] ?? false
                    const subPrice = billingCycle === "yearly" ? subFeature.price * 0.8 : subFeature.price

                    return (
                      <div
                        key={subFeature.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedSubFeatures(p => ({ ...p, [subFeature.id]: !p[subFeature.id] }))
                        }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all text-xs",
                          isSubSelected
                            ? "bg-purple-50 border border-purple-200"
                            : "bg-background border border-transparent hover:border-purple-200"
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
                              isSubSelected ? "bg-purple-500 border-purple-500" : "border-border"
                            )}
                          >
                            {isSubSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-foreground truncate">
                              {subFeature.name}
                            </p>
                            {subFeature.desc && (
                              <p className="text-[9px] text-muted-foreground truncate">
                                {subFeature.desc}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-purple-600 ml-2 whitespace-nowrap">
                          {formatPrice(subPrice)} / {item.per || "u"}
                        </span>
                      </div>
                    )
                  })}
                  <div className="flex justify-between items-center pt-1 mt-1 border-t border-border">
                    <span className="text-[9px] text-muted-foreground font-medium uppercase">Sub-total:</span>
                    <span className="text-[10px] font-bold text-purple-600">
                      {formatPrice(displayPrice)} / {item.per || "u"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="p-4 bg-secondary/30 rounded-b-3xl border-t border-border flex items-center justify-between text-[10px] text-muted-foreground font-bold px-6 uppercase tracking-widest">
        <span>{selectedLabel}</span>
        <span className="text-primary font-bold tabular-nums">
          {mod.items.filter((i) => selectedItems[i.id]).length} / {mod.items.length}
        </span>
      </div>
    </div>
  )
}
