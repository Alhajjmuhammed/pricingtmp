"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check } from "lucide-react"
import { addOns } from "@/lib/pricing-data"
import type { AddOn } from "@/lib/pricing-data"

function AddOnCard({
  addOn,
  isAnnual,
  isSelected,
  onToggle,
}: {
  addOn: AddOn
  isAnnual: boolean
  isSelected: boolean
  onToggle: () => void
}) {
  const price = isAnnual ? addOn.annualPrice : addOn.monthlyPrice

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:bg-primary/[0.02]">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">{addOn.name}</h3>
        <Switch checked={isSelected} onCheckedChange={onToggle} />
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground mb-5 flex-1">
        {addOn.description}
      </p>

      <ul className="flex flex-wrap gap-2 mb-5">
        {addOn.features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
          >
            <Check className="h-3 w-3 text-primary" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="flex items-end justify-between pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Starting from</p>
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-bold text-foreground">
              ${price % 1 === 0 ? price : price.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              /{addOn.per}/mo
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

export function AddOnsSection({ isAnnual, activeModules }: { isAnnual: boolean; activeModules: Record<string, boolean> }) {
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, boolean>>({})

  const toggleAddOn = (id: string) => {
    setSelectedAddOns(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Group add-ons by module and filter by active modules
  const addOnsByModule = useMemo(() => {
    const modules = ["HR & Payroll", "Project Management", "Asset Management", "E-office"] as const
    return modules.reduce((acc, module) => {
      // Only include module if it's active
      if (activeModules[module]) {
        acc[module] = addOns.filter(addOn => addOn.module === module)
      }
      return acc
    }, {} as Record<string, AddOn[]>)
  }, [activeModules])

  // Get first active module for default tab
  const firstActiveModule = useMemo(() => {
    const modules = ["HR & Payroll", "Project Management", "Asset Management", "E-office"] as const
    return modules.find(module => activeModules[module]) || "HR & Payroll"
  }, [activeModules])

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
          {activeModules["HR & Payroll"] && (
            <TabsTrigger value="HR & Payroll" className="text-sm font-semibold py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              HR & Payroll
            </TabsTrigger>
          )}
          {activeModules["Project Management"] && (
            <TabsTrigger value="Project Management" className="text-sm font-semibold py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Project Management
            </TabsTrigger>
          )}
          {activeModules["Asset Management"] && (
            <TabsTrigger value="Asset Management" className="text-sm font-semibold py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Asset Management
            </TabsTrigger>
          )}
          {activeModules["E-office"] && (
            <TabsTrigger value="E-office" className="text-sm font-semibold py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              E-office
            </TabsTrigger>
          )}
        </TabsList>

        {Object.entries(addOnsByModule).map(([module, moduleAddOns]) => (
          <TabsContent key={module} value={module} className="mt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {moduleAddOns.map((addOn) => (
                <AddOnCard 
                  key={addOn.id} 
                  addOn={addOn} 
                  isAnnual={isAnnual}
                  isSelected={!!selectedAddOns[addOn.id]}
                  onToggle={() => toggleAddOn(addOn.id)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
