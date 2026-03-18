"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check } from "lucide-react"
import type { Module, AddOn } from "@/lib/customize-data"

function AddOnCard({
  addOn,
  isAnnual,
  isSelected,
  onToggle,
  formatPrice,
}: {
  addOn: AddOn
  isAnnual: boolean
  isSelected: boolean
  onToggle: () => void
  formatPrice: (val: number) => string
}) {
  const price = isAnnual ? addOn.price * 12 * 0.8 : addOn.price

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:bg-primary/[0.02]">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">{addOn.name}</h3>
        <Switch checked={isSelected} onCheckedChange={onToggle} />
      </div>

      <div 
        className="text-sm leading-relaxed text-muted-foreground mb-5 flex-1 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: addOn.desc }}
      />

      <div className="flex items-end justify-between pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Price</p>
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-bold text-foreground">
              {formatPrice(price)}
            </span>
            <span className="text-xs text-muted-foreground">
              /{isAnnual ? 'year' : 'month'}
            </span>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground border-border">
          Add-on
        </Badge>
      </div>
    </div>
  )
}

export function AddOnsSection({ 
  isAnnual, 
  activeModules, 
  modules,
  selectedAddOns,
  onToggleAddOn,
  formatPrice
}: { 
  isAnnual: boolean
  activeModules: Record<string, boolean>
  modules: Module[]
  selectedAddOns: Record<string, boolean>
  onToggleAddOn: (addonId: string) => void
  formatPrice: (val: number) => string
}) {
  // Group add-ons by module from dynamic modules data
  const addOnsByModule = useMemo(() => {
    const result: Record<string, AddOn[]> = {}
    modules.forEach(module => {
      if (activeModules[module.id] && module.addons && module.addons.length > 0) {
        result[module.id] = module.addons
      }
    })
    return result
  }, [modules, activeModules])

  // Get first active module for default tab
  const firstActiveModule = useMemo(() => {
    return modules.find(module => activeModules[module.id] && module.addons && module.addons.length > 0)?.id || ""
  }, [modules, activeModules])

  // If no add-ons available, don't render
  if (Object.keys(addOnsByModule).length === 0) {
    return null
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Supercharge your plan with add-ons
        </h2>
        <p className="mt-3 text-muted-foreground text-lg">
          Extend your capabilities with powerful tools for every service module.
        </p>
      </div>

      <Tabs defaultValue={firstActiveModule} className="w-full">
        <TabsList className={`grid w-full mb-8 h-auto p-1 bg-muted/50`} style={{ gridTemplateColumns: `repeat(${Object.keys(addOnsByModule).length}, 1fr)` }}>
          {Object.keys(addOnsByModule).map(moduleId => (
            <TabsTrigger 
              key={moduleId}
              value={moduleId} 
              className="text-sm font-semibold py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {moduleId}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(addOnsByModule).map(([moduleId, moduleAddOns]) => (
          <TabsContent key={moduleId} value={moduleId} className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {moduleAddOns.map((addOn) => (
                <AddOnCard 
                  key={addOn.id} 
                  addOn={addOn} 
                  isAnnual={isAnnual}
                  isSelected={!!selectedAddOns[addOn.id]}
                  onToggle={() => onToggleAddOn(addOn.id)}
                  formatPrice={formatPrice}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
