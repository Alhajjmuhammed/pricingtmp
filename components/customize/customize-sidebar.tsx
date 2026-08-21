"use client"

import { Minus, Plus, Coins, Users, Boxes, Building2, HardDrive, Loader2, Landmark, ShoppingCart, Truck, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggleInline } from "@/components/theme-toggle"
import { BrandLogo } from "@/components/brand-logo"
import type { PublicPlan } from "@/lib/graphql-client"
import {
  UNIT_PRICES,
  ASSET_STEPS,
  CURRENCIES,
  TRANSLATIONS,
  type LangKey,
  type Counts,
  type ScaleKey,
} from "@/lib/customize-data"

// Categories are admin-managed Plans from the billing API (name/description
// are free text) -- this only picks a matching icon by keyword, it never
// hides or invents a category that isn't actually there.
function CategoryToggleIcon({ name }: { name: string }) {
  const lower = name.toLowerCase()
  if (lower.includes("tax")) return <Landmark className="h-3.5 w-3.5" />
  if (lower.includes("buyer")) return <ShoppingCart className="h-3.5 w-3.5" />
  if (lower.includes("supplier")) return <Truck className="h-3.5 w-3.5" />
  return <Layers className="h-3.5 w-3.5" />
}

function Counter({
  label,
  icon,
  value,
  onUpdate,
  disableMinus,
  disablePlus,
  price,
  currencySymbol,
  currencyRate,
}: {
  label: string
  icon: React.ReactNode
  value: number
  onUpdate: (delta: number) => void
  disableMinus?: boolean
  disablePlus?: boolean
  price: number
  currencySymbol: string
  currencyRate: number
}) {
  return (
    <div className="flex flex-col gap-2 group rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/25">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground group-hover:text-primary uppercase tracking-wider transition-colors">
          <span className="text-primary/70">{icon}</span>
          {label}
        </span>
        <span className="text-[10px] font-bold text-primary/60 tabular-nums">
          {currencySymbol}{(price * currencyRate).toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-3 bg-secondary/60 p-1 rounded-full border border-border">
        <button
          onClick={() => onUpdate(-1)}
          disabled={disableMinus}
          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-card transition-all duration-200 disabled:opacity-30"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="flex-1 text-xs font-bold text-foreground text-center tabular-nums">
          {value}
        </span>
        <button
          onClick={() => onUpdate(1)}
          disabled={disablePlus}
          className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-primary hover:scale-110 hover:shadow-sm active:scale-95 transition-all duration-200 disabled:opacity-30"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export function CustomizeSidebar({
  activeModules,
  setActiveModules,
  counts,
  setCounts,
  lang,
  setLang,
  currency,
  setCurrency,
  categories,
  activeCategoryIds,
  onToggleCategory,
  categoriesLoading,
  categoriesError,
}: {
  activeModules: Record<string, boolean>
  setActiveModules: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  counts: Counts
  setCounts: React.Dispatch<React.SetStateAction<Counts>>
  lang: LangKey
  setLang: (l: LangKey) => void
  currency: string
  setCurrency: (c: string) => void
  categories: PublicPlan[]
  activeCategoryIds: Record<string, boolean>
  onToggleCategory: (id: string) => void
  categoriesLoading: boolean
  categoriesError: string | null
}) {
  const t = TRANSLATIONS[lang]
  const cur = CURRENCIES[currency]

  const handleAssetUpdate = (delta: number) => {
    const currentIndex = ASSET_STEPS.indexOf(counts.asset)
    const nextIndex = Math.min(Math.max(0, currentIndex + delta), ASSET_STEPS.length - 1)
    setCounts((p) => ({ ...p, asset: ASSET_STEPS[nextIndex] }))
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-2 scrollbar-hide">
      {/* Logo */}
      <div className="mb-10 px-2">
        <BrandLogo />
      </div>

      <div className="mb-8 px-2 space-y-6">
        {/* Categories — toggle on/off to mix their modules into one plan
            (e.g. Tax Compliance + Buyer). */}
        <div className="pt-0 border-t-0 border-border">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-4 tracking-widest">
            Categories
          </h3>
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : categoriesError ? (
            <p className="text-[10px] text-destructive">{categoriesError}</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => {
                const isOn = !!activeCategoryIds[cat.id]
                return (
                  <button
                    key={cat.id}
                    onClick={() => onToggleCategory(cat.id)}
                    aria-pressed={isOn}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-xl border p-3 transition-colors",
                      isOn ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/25"
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center gap-2 text-xs font-semibold",
                        isOn ? "text-primary" : "text-foreground"
                      )}
                    >
                      <CategoryToggleIcon name={cat.name} />
                      {cat.name}
                    </span>
                    <span
                      className={cn(
                        "flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors",
                        isOn ? "bg-primary justify-end" : "bg-border justify-start"
                      )}
                    >
                      <span className="h-3 w-3 rounded-full bg-white shadow-sm" />
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Plan Scale */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-4 tracking-widest">
            {t.scale}
          </h3>
          <div className="space-y-3">
            <Counter
              label={t.users}
              icon={<Users className="h-3.5 w-3.5" />}
              price={UNIT_PRICES.user}
              currencySymbol={cur.symbol}
              currencyRate={cur.rate}
              value={counts.users}
              onUpdate={(d) => setCounts((p) => ({ ...p, users: Math.max(1, p.users + d) }))}
            />
            <Counter
              label={t.assets}
              icon={<Boxes className="h-3.5 w-3.5" />}
              price={UNIT_PRICES.asset}
              currencySymbol={cur.symbol}
              currencyRate={cur.rate}
              value={counts.asset}
              onUpdate={handleAssetUpdate}
              disableMinus={ASSET_STEPS.indexOf(counts.asset) === 0}
              disablePlus={ASSET_STEPS.indexOf(counts.asset) === ASSET_STEPS.length - 1}
            />
            <Counter
              label={t.organization}
              icon={<Building2 className="h-3.5 w-3.5" />}
              price={UNIT_PRICES.organization}
              currencySymbol={cur.symbol}
              currencyRate={cur.rate}
              value={counts.organizations}
              onUpdate={(d) => setCounts((p) => ({ ...p, organizations: Math.max(1, p.organizations + d) }))}
            />
            <Counter
              label={t.storage}
              icon={<HardDrive className="h-3.5 w-3.5" />}
              price={UNIT_PRICES.storage}
              currencySymbol={cur.symbol}
              currencyRate={cur.rate}
              value={counts.storage}
              onUpdate={(d) => setCounts((p) => ({ ...p, storage: Math.max(1, p.storage + d) }))}
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="pt-6 border-t border-border space-y-5 pb-10">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-4 tracking-widest">
            {t.prefs}
          </h3>

          {/* Currency */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
              <Coins className="h-3 w-3" /> {t.currency}
            </div>
            <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl border border-border">
              {["USD", "EUR", "GBP"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all",
                    currency === c ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <ThemeToggleInline label={t.theme} />
        </div>
      </div>
    </div>
  )
}
