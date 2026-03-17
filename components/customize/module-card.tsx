"use client"

import { Check, Info } from "lucide-react"
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
  billingCycle,
  formatPrice,
  freeLabel,
  selectedLabel,
}: {
  mod: Module
  isActive: boolean
  selectedItems: Record<string, boolean>
  setSelectedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  billingCycle: "monthly" | "yearly"
  formatPrice: (val: number) => string
  freeLabel: string
  selectedLabel: string
}) {
  return (
    <div
      className={cn(
        "min-w-[300px] sm:min-w-[340px] lg:min-w-[360px] bg-card rounded-3xl border flex flex-col shadow-sm transition-all duration-500 shrink-0",
        isActive
          ? "border-border hover:shadow-lg hover:border-primary/20"
          : "opacity-20 grayscale pointer-events-none border-border"
      )}
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
          const displayPrice =
            billingCycle === "yearly" ? item.price * 0.8 : item.price

          return (
              <div
              key={item.id}
              onClick={() =>
                setSelectedItems((p) => ({ ...p, [item.id]: !p[item.id] }))
              }
              className={cn(
                "p-4 rounded-2xl group cursor-pointer transition-all duration-200 border",
                isSelected
                  ? "bg-primary/[0.06] border-primary/25 shadow-sm"
                  : "bg-transparent border-transparent hover:bg-secondary/40 hover:border-border"
              )}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "text-[11px] block font-bold mb-1 transition-colors",
                      isSelected ? "text-primary" : "text-foreground/80"
                    )}
                  >
                    {item.name}
                  </span>
                  <p className="text-[9px] text-muted-foreground leading-snug font-medium">
                    {item.desc}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2.5 shrink-0">
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
                  {item.price === 0 ? (
                    <span className="text-[8px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {freeLabel}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight tabular-nums">
                      {formatPrice(displayPrice)} / {item.per || "u"}
                    </span>
                  )}
                </div>
              </div>
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
