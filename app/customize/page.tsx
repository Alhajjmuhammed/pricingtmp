"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Menu,
  X,
  Receipt,
  Info,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {

  UNIT_PRICES,
  CURRENCIES,
  TRANSLATIONS,
  DEFAULT_COUNTS,
  type LangKey,
  type Counts,
  type Module,
  type ModuleItem,
} from "@/lib/customize-data"
import { CustomizeSidebar } from "@/components/customize/customize-sidebar"
import { FeatureList } from "@/components/customize/feature-list"
import { InvoiceSummary } from "@/components/customize/invoice-summary"
import { ThemeToggleFloating } from "@/components/theme-toggle"
import { AddOnsSection } from "@/components/add-ons-section"
import { CategorySelector } from "@/components/category-selector"
import {
  billingGraphqlRequest,
  GET_PUBLIC_CATALOG,
  GET_PUBLIC_PLANS,
  type PublicFeature,
  type PublicPlan,
} from "@/lib/graphql-client"
import { filterCategoriesByParam, getCategoryParam } from "@/lib/category-filter"

export default function CustomizePlanPage() {
  const router = useRouter()

  // Which business-line Plan (Tax Compliance / Buyer / Supplier) the
  // customer is building a custom plan for -- the catalog below is always
  // scoped to this, so they only ever see Features actually relevant to
  // what they picked, not the whole tenant-wide catalog mixed together.
  const [categories, setCategories] = useState<PublicPlan[]>([])
  const [selectedCategory, setSelectedCategory] = useState<PublicPlan | null>(null)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  // ?category=tax / ?category=tax,buyer / ?category=all (default) --
  // same URL filter as the homepage. See lib/category-filter.
  const visibleCategories = useMemo(
    () => filterCategoriesByParam(categories, getCategoryParam()),
    [categories]
  )

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await billingGraphqlRequest<{ publicPlans: PublicPlan[] }>(GET_PUBLIC_PLANS)
        if (data.publicPlans && data.publicPlans.length > 0) {
          setCategories(data.publicPlans)
        } else {
          setCategoriesError('No categories returned from the API.')
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
        setCategoriesError('Unable to load categories.')
      } finally {
        setIsLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  // Skip the picker if the URL narrowed it down to exactly one category.
  useEffect(() => {
    if (selectedCategory) return
    if (visibleCategories.length === 1) {
      setSelectedCategory(visibleCategories[0])
    }
  }, [visibleCategories, selectedCategory])

  const [lang, setLang] = useState<LangKey>("en")
  const [currency, setCurrency] = useState("USD")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly")
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [showAddOns, setShowAddOns] = useState(false)
  const addOnsRef = useRef<HTMLDivElement>(null)
  const [activeModules, setActiveModules] = useState<Record<string, boolean>>({
    "HR & Payroll": false,
    "Project Management": false,
    "Asset Management": false,
    "E-office": false,
  })
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [selectedSubFeatures, setSelectedSubFeatures] = useState<Record<string, boolean>>({})
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({})
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, boolean>>({})
  const [counts, setCounts] = useState<Counts>(DEFAULT_COUNTS)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const restoredFromLocalStorage = useRef(false)
  const VAT_RATE = 0.18

  // Dynamic data states
  const [modules, setModules] = useState<Module[]>([])
  const [isLoadingModules, setIsLoadingModules] = useState(true)
  const [modulesError, setModulesError] = useState<string | null>(null)

  const t = TRANSLATIONS[lang]
  const cur = CURRENCIES[currency]

  // Fetch dynamic data from backend
  const fetchServicesData = async () => {
    try {
      setIsLoadingModules(true)
      setModulesError(null)

      const data = await billingGraphqlRequest<{ publicCatalog: PublicFeature[] }>(
        GET_PUBLIC_CATALOG,
        { planId: selectedCategory?.id }
      )

      // Transform the catalog (Feature -> SubFeature/Addon, flat -- pricing
      // only ever lives on the SubFeature/Addon, never on the Feature
      // itself) to Module format. Each SubFeature becomes a directly
      // priced, directly selectable item -- there's no third nesting
      // level in the new catalog the way there used to be.
      const transformedModules: Module[] = data.publicCatalog
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(feature => ({
          id: feature.name, // Use name as ID for activeModules compatibility
          name: feature.name,
          items: feature.subFeatures.map(sf => {
            const per: "user" | "flat" =
              sf.billingType === "PER_USER" || sf.billingType === "PER_DEVICE" ? "user" : "flat"
            return {
              id: sf.id,
              name: sf.name,
              desc: sf.description,
              price: Number(sf.price) || 0,
              per,
            }
          }),
          addons: feature.addons.map(addon => ({
            id: addon.id,
            name: addon.name,
            desc: addon.description,
            price: Number(addon.unitPrice) || 0,
            pricingPeriod: addon.billingType === "ANNUAL" ? "yearly" : "monthly",
          })),
        }))

      if (transformedModules.length === 0) {
        setModulesError('No services found. Please check your backend data.')
      } else {
        setModules(transformedModules)

        // Try to restore previous selections from localStorage
        let savedData: any = null
        try {
          const raw = localStorage.getItem('customization_data')
          if (raw) savedData = JSON.parse(raw)
        } catch { /* ignore parse errors */ }

        const cameFromRegister =
          typeof document !== "undefined" && document.referrer.includes("/register")

        if (savedData?.activeModules && cameFromRegister) {
          // Returning from register — restore selections, merging with currently available modules
          const restoredActive: Record<string, boolean> = {}
          transformedModules.forEach(mod => {
            restoredActive[mod.id] = savedData.activeModules[mod.id] ?? false
          })
          setActiveModules(restoredActive)
          if (savedData.selectedItems) setSelectedItems(savedData.selectedItems)
          if (savedData.selectedSubFeatures) setSelectedSubFeatures(savedData.selectedSubFeatures)
          if (savedData.selectedAddOns) setSelectedAddOns(savedData.selectedAddOns)
          if (savedData.counts) setCounts(savedData.counts)
          restoredFromLocalStorage.current = true
        } else {
          // Fresh visit (or direct open) — start with all modules inactive
          const newActiveModules: Record<string, boolean> = {}
          transformedModules.forEach(mod => {
            newActiveModules[mod.id] = false
          })
          setActiveModules(newActiveModules)
          setSelectedItems({})
          setSelectedSubFeatures({})
          setSelectedAddOns({})
          setCounts(DEFAULT_COUNTS)
          restoredFromLocalStorage.current = false
        }
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
      setModulesError(error instanceof Error ? error.message : 'Failed to load services')
    } finally {
      setIsLoadingModules(false)
    }
  }

  // Fetch the catalog once a category (business-line Plan) is chosen, and
  // again if the customer switches category.
  useEffect(() => {
    if (!selectedCategory) return
    fetchServicesData()
  }, [selectedCategory])

  // Initialize items as NOT selected by default (skip if state was restored from localStorage)
  useEffect(() => {
    if (restoredFromLocalStorage.current) return
    const initial: Record<string, boolean> = {}
    modules.forEach((m) => {
      m.items.forEach((i) => {
        initial[i.id] = false
      })
    })
    setSelectedItems(initial)
    setSelectedSubFeatures({})
  }, [modules])

  // A Feature is "active" for pricing/submission purposes whenever at
  // least one of its SubFeatures is selected -- there's no separate
  // manual "turn this Feature on" step in this flat, single-list UI.
  useEffect(() => {
    const derived: Record<string, boolean> = {}
    modules.forEach((mod) => {
      derived[mod.id] = mod.items.some((item) => selectedItems[item.id])
    })
    setActiveModules(derived)
  }, [modules, selectedItems])

  const formatPrice = useCallback(
    (val: number) => {
      const converted = val * cur.rate
      return `${cur.symbol}${converted.toFixed(2)}`
    },
    [cur]
  )

  const { subtotal, vatAmount, totalCost } = useMemo(() => {
    let monthlyTotal = 0
    modules.forEach((mod) => {
      if (activeModules[mod.id]) {
        mod.items.forEach((item) => {
          if (selectedItems[item.id]) {
            // Calculate price: use sub-features if available, otherwise base price
            let itemPrice = 0
            if (item.subFeatures && item.subFeatures.length > 0) {
              // Sum up selected sub-features
              item.subFeatures.forEach(sf => {
                if (selectedSubFeatures[sf.id]) {
                  itemPrice += sf.price
                }
              })
            } else if (item.price > 0) {
              // Use base price
              itemPrice = item.price
            }

            // Apply multiplier based on pricing unit -- "flat" (the
            // catalog's MONTHLY/ANNUAL/ONE_TIME sub-features/add-ons)
            // isn't scaled by any count, only PER_USER/PER_DEVICE items are
            if (itemPrice > 0) {
              if (item.per === "gb") monthlyTotal += itemPrice * counts.storage
              else if (item.per === "asset") monthlyTotal += itemPrice * counts.asset
              else if (item.per === "flat") monthlyTotal += itemPrice
              else monthlyTotal += itemPrice * counts.users
            }
          }
        })
      }
    })
    monthlyTotal += counts.asset * UNIT_PRICES.asset
    monthlyTotal += counts.organizations * UNIT_PRICES.organization
    
    // Add add-ons to monthly total
    modules.forEach((mod) => {
      if (activeModules[mod.id] && mod.addons) {
        mod.addons.forEach(addon => {
          if (selectedAddOns[addon.id]) {
            monthlyTotal += addon.price
          }
        })
      }
    })
    
    const yearlyModifier = billingCycle === "yearly" ? 12 * 0.8 : 1
    const sub = monthlyTotal * yearlyModifier * cur.rate
    const vat = sub * VAT_RATE
    return { subtotal: sub, vatAmount: vat, totalCost: sub + vat }
  }, [activeModules, selectedItems, selectedSubFeatures, selectedAddOns, modules, counts, billingCycle, cur, VAT_RATE])

  // Validate that user has selected at least 1 module with 1 item enabled
  // on it (the catalog is flat -- Feature -> SubFeature/Addon, no third
  // nesting level -- so "selected item" is already the priced thing)
  const isValidSelection = useMemo(() => {
    const activeModuleNames = Object.keys(activeModules).filter(name => activeModules[name] === true)
    if (activeModuleNames.length === 0) return false

    for (const moduleName of activeModuleNames) {
      const module = modules.find(m => m.name === moduleName)
      if (!module) continue
      if (module.items.some(item => selectedItems[item.id] === true)) return true
    }

    return false
  }, [activeModules, selectedItems, modules])


  const handleContinue = () => {
    if (!showAddOns) {
      setShowAddOns(true)
      setTimeout(() => {
        addOnsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } else {
      // Store customization data and proceed to registration
      // Clear any pre-built plan — user chose to customize instead
      localStorage.removeItem('selected_plan')
      localStorage.setItem('customization_data', JSON.stringify({
        activeModules,
        selectedItems,
        selectedSubFeatures,
        selectedAddOns,
        counts,
        billingCycle,
        currency,
        pricing: {
          subtotal,
          vatAmount,
          totalCost,
        },
        // Business-line category (Tax Compliance / Buyer / Supplier) this
        // custom build is scoped to -- selected_plan carries this for
        // pre-built plans, but that key is cleared above, so register/
        // page.tsx needs it here instead to know which destination system
        // (if any) to provision the account in.
        categoryId: selectedCategory?.id,
        categoryName: selectedCategory?.name,
      }))
      router.push('/register')
    }
  }

  // Gate: pick a category (Tax Compliance / Buyer / Supplier) before
  // showing any Features/SubFeatures to build a custom plan from — the
  // catalog fetch above is scoped to whichever one is chosen.
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-background">
        <header className="px-4 py-6 lg:px-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary/15 transition-all border border-primary/20"
          >
            <ChevronLeft className="h-4 w-4" /> Back to pricing
          </Link>
        </header>
        {isLoadingCategories ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : categoriesError ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{categoriesError}</p>
          </div>
        ) : (
          <CategorySelector categories={visibleCategories} onSelect={setSelectedCategory} />
        )}
      </div>
    )
  }

  return (
    <div className="flex h-screen h-[100dvh] bg-background font-sans text-foreground overflow-hidden relative">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-card border-r border-border flex-col p-6 shrink-0">
        <CustomizeSidebar
          activeModules={activeModules}
          setActiveModules={setActiveModules}
          counts={counts}
          setCounts={setCounts}
          lang={lang}
          setLang={setLang}
          currency={currency}
          setCurrency={setCurrency}
        />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-3 bg-card/80 backdrop-blur-xl border-b border-border">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-muted-foreground bg-secondary rounded-lg"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-bold text-primary italic">eOpsPrimax</span>
        <div className="flex items-center gap-2">
          <ThemeToggleFloating />
          <Link href="/" className="p-2 text-muted-foreground text-xs font-medium">
            Plans
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden pt-14 lg:pt-0 pb-40 sm:pb-32">
        {/* Header */}
        <header className="relative px-4 py-6 lg:px-12 lg:py-10 lg:pb-6 shrink-0 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[280px] w-[600px] rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="max-w-7xl mx-auto">
            {/* Title and subtitle - at top */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2 tracking-tight text-balance">
                {t.title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
                {t.subtitle}
              </p>
              <button
                onClick={() => setSelectedCategory(null)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground transition-colors"
              >
                {selectedCategory.name}
                <span className="text-muted-foreground font-normal">· change category</span>
              </button>
            </div>

            {/* Control row: Back button on left, billing toggle on right --
                stacks on narrow screens so the toggle never gets squeezed */}
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary/15 transition-all border border-primary/20 shrink-0"
              >
                <ChevronLeft className="h-4 w-4" /> {t.goBack}
              </Link>

              <div className="flex items-center gap-3">
                <div className="hidden lg:block">
                  <ThemeToggleFloating />
                </div>
                <div className="flex bg-card rounded-xl p-1.5 border border-border shadow-sm">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={cn(
                      "px-4 sm:px-6 lg:px-8 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                      billingCycle === "monthly"
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {t.monthly}
                  </button>
                  <button
                    onClick={() => setBillingCycle("yearly")}
                    className={cn(
                      "px-4 sm:px-6 lg:px-8 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
                      billingCycle === "yearly"
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "text-muted-foreground"
                    )}
                  >
                    {billingCycle === "yearly" && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    {t.yearly}
                    <span className="text-[8px] bg-chart-1/20 text-chart-1 px-2 py-0.5 rounded-full font-bold">
                      {t.save20}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Features + SubFeatures — a single flat list, always fully
            visible: pick a Feature's SubFeatures directly, no "activate
            this feature first" step. */}
        <div className="py-4 px-4 lg:px-0">
          {/* Loading State */}
          {isLoadingModules && (
            <div className="flex flex-col items-center justify-center gap-4 min-h-[400px] text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading services from backend...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoadingModules && modulesError && (
            <div className="flex flex-col items-center justify-center gap-4 min-h-[400px] text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{modulesError}</p>
              <button
                onClick={fetchServicesData}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>

            </div>
          )}

          {/* Success State */}
          {!isLoadingModules && !modulesError && (
            <FeatureList
              modules={modules}
              selectedItems={selectedItems}
              onToggleItem={(itemId) => setSelectedItems((p) => ({ ...p, [itemId]: !p[itemId] }))}
              billingCycle={billingCycle}
              formatPrice={formatPrice}
              freeLabel={t.free}
            />
          )}
        </div>

        {/* Add-ons Section */}
        {showAddOns && (
          <div ref={addOnsRef} className="bg-background">
            <AddOnsSection 
              isAnnual={billingCycle === "yearly"} 
              activeModules={activeModules}
              modules={modules}
              selectedAddOns={selectedAddOns}
              onToggleAddOn={(addonId) => setSelectedAddOns(prev => ({ ...prev, [addonId]: !prev[addonId] }))}
              formatPrice={formatPrice}
            />
          </div>
        )}

        {/* Footer invoice bar */}
        <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-3 sm:p-4 lg:px-12 shadow-2xl shadow-background/30 z-30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left - back + invoice summary */}
            <div className="hidden sm:flex items-center gap-3">
              <Link
                href="/"
                className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> {t.back}
              </Link>
              <button
                onClick={() => setInvoiceOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-border"
              >
                <Receipt className="h-3.5 w-3.5 text-primary" /> Invoice Summary
              </button>
            </div>

            {/* Center - price breakdown */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground tabular-nums">
                <span>
                  Subtotal: <span className="font-semibold text-foreground">{cur.symbol}{subtotal.toFixed(2)}</span>
                </span>
                <span>
                  VAT 18%: <span className="font-semibold text-foreground">{cur.symbol}{vatAmount.toFixed(2)}</span>
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums tracking-tight">
                  {cur.symbol}
                  {totalCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  / {billingCycle === "yearly" ? t.yearly : t.monthly}
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                {t.invoice} (incl. 18% VAT)
              </span>
            </div>

            {/* Right - actions */}
            <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-end">
              {/* Mobile-only invoice summary */}
              <button
                onClick={() => setInvoiceOpen(true)}
                className="sm:hidden flex items-center gap-2 px-4 py-3 bg-secondary text-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest border border-border"
              >
                <Receipt className="h-3.5 w-3.5 text-primary" />
              </button>
              <button
                onClick={handleContinue}
                disabled={!isValidSelection}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 disabled:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-8 sm:px-12 py-3 sm:py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-2 group">
                {showAddOns ? 'Proceed to Checkout' : t.continue}
                {showAddOns ? <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" /> : <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </div>
        </footer>

        {/* Invoice Summary Sheet */}
        <InvoiceSummary
          open={invoiceOpen}
          onOpenChange={setInvoiceOpen}
          activeModules={activeModules}
          selectedItems={selectedItems}
          selectedSubFeatures={selectedSubFeatures}
          selectedAddOns={selectedAddOns}
          modules={modules}
          counts={counts}
          billingCycle={billingCycle}
          currency={currency}
          lang={lang}
        />
      </main>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/70 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-card z-[60] p-6 shadow-2xl shadow-background/20 border-r border-border lg:hidden animate-in slide-in-from-left duration-300">
            <button
              className="absolute top-5 right-5 p-2 text-muted-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <CustomizeSidebar
              activeModules={activeModules}
              setActiveModules={setActiveModules}
              counts={counts}
              setCounts={setCounts}
              lang={lang}
              setLang={setLang}
              currency={currency}
              setCurrency={setCurrency}
            />
          </aside>
        </>
      )}
    </div>
  )
}
