"use client"

import { Minus, Plus, Languages, Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggleInline } from "@/components/theme-toggle"
import {
  UNIT_PRICES,
  ASSET_STEPS,
  CURRENCIES,
  TRANSLATIONS,
  type LangKey,
  type Counts,
  type ScaleKey,
} from "@/lib/customize-data"

function Counter({
  label,
  value,
  onUpdate,
  disableMinus,
  disablePlus,
  price,
  currencySymbol,
  currencyRate,
}: {
  label: string
  value: number
  onUpdate: (delta: number) => void
  disableMinus?: boolean
  disablePlus?: boolean
  price: number
  currencySymbol: string
  currencyRate: number
}) {
  return (
    <div className="flex flex-col gap-1.5 group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary uppercase tracking-wider transition-colors">
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
        <span className="text-xs font-bold text-foreground w-10 text-center tabular-nums">
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
}: {
  activeModules: Record<string, boolean>
  setActiveModules: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  counts: Counts
  setCounts: React.Dispatch<React.SetStateAction<Counts>>
  lang: LangKey
  setLang: (l: LangKey) => void
  currency: string
  setCurrency: (c: string) => void
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
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-primary-foreground font-black text-xl italic leading-none">e</span>
        </div>
        <div className="leading-tight">
          <span className="font-bold text-lg block text-foreground tracking-tight">eOpsEntre</span>
          <span className="text-[8px] text-primary uppercase font-bold tracking-widest">Digital Ops</span>
        </div>
      </div>

      <div className="mb-8 px-2 space-y-6">
        {/* Modules */}
        <div>
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-4 tracking-widest">
            {t.modules}
          </h3>
          <div className="space-y-2.5">
            {Object.keys(activeModules).map((id) => (
              <div key={id} className="flex items-center justify-between group">
                <span
                  className={cn(
                    "text-sm transition-colors cursor-pointer",
                    activeModules[id] ? "text-foreground font-bold" : "text-muted-foreground"
                  )}
                  onClick={() => setActiveModules((p) => ({ ...p, [id]: !p[id] }))}
                >
                  {id}
                </span>
                <button
                  onClick={() => setActiveModules((p) => ({ ...p, [id]: !p[id] }))}
                  className={cn(
                    "w-9 h-5 rounded-full relative transition-all duration-200",
                    activeModules[id]
                      ? "bg-primary shadow-sm shadow-primary/25"
                      : "bg-border"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-sm",
                      activeModules[id]
                        ? "right-0.5 bg-primary-foreground"
                        : "left-0.5 bg-card"
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Scale */}
        <div className="pt-6 border-t border-border">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase mb-4 tracking-widest">
            {t.scale}
          </h3>
          <div className="space-y-5">
            <Counter
              label={t.users}
              price={UNIT_PRICES.user}
              currencySymbol={cur.symbol}
              currencyRate={cur.rate}
              value={counts.users}
              onUpdate={(d) => setCounts((p) => ({ ...p, users: Math.max(1, p.users + d) }))}
            />
            <Counter
              label={t.assets}
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
              price={UNIT_PRICES.organization}
              currencySymbol={cur.symbol}
              currencyRate={cur.rate}
              value={counts.organizations}
              onUpdate={(d) => setCounts((p) => ({ ...p, organizations: Math.max(1, p.organizations + d) }))}
            />
            <Counter
              label={t.storage}
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

          {/* Language */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
              <Languages className="h-3 w-3" /> {t.language}
            </div>
            <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl border border-border">
              {(["en", "es", "fr"] as LangKey[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all",
                    lang === l ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

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
