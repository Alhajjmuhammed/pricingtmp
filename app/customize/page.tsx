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
import { ModuleCard } from "@/components/customize/module-card"
import { InvoiceSummary } from "@/components/customize/invoice-summary"
import { ThemeToggleFloating } from "@/components/theme-toggle"
import { AddOnsSection } from "@/components/add-ons-section"
import { 
  graphqlRequest, 
  GET_SERVICE_CATEGORIES,
  type ServiceCategory 
} from "@/lib/graphql-client"

export default function CustomizePlanPage() {
  const router = useRouter()
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
  const scrollRef = useRef<HTMLDivElement>(null)
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

      const data = await graphqlRequest<{ serviceCategories: ServiceCategory[] }>(
        GET_SERVICE_CATEGORIES
      )

      // Transform backend data to Module format
      const transformedModules: Module[] = data.serviceCategories
        .filter(service => service.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(service => ({
          id: service.name, // Use name as ID for activeModules compatibility
          name: service.name,
          items: (service.features || [])
            .filter(f => f.isActive)
            .map(feature => {
              // Determine pricing unit
              let per: "user" | "gb" | "asset" | undefined = undefined
              if (feature.pricingUnit === 'per_user') per = 'user'
              else if (feature.pricingUnit === 'per_gb') per = 'gb'
              else if (feature.pricingUnit === 'per_asset') per = 'asset'

              return {
                id: feature.slug,
                name: feature.name,
                desc: feature.description,
                price: Number(feature.price) || 0,
                per,
                subFeatures: (feature.subFeatures || []).map(sf => ({
                  id: sf.slug,
                  name: sf.name,
                  desc: sf.description,
                  price: Number(sf.price) || 0,
                  isDefaultEnabled: sf.isDefaultEnabled,
                })),
              }
            }),
          addons: (service.addons || []).map(addon => ({
            id: addon.slug,
            name: addon.name,
            desc: addon.description,
            price: Number(addon.price) || 0,
            pricingPeriod: addon.pricingPeriod || 'monthly',
          })),
        }))

      if (transformedModules.length === 0) {
        setModulesError('No services found. Please check your backend data.')
      } else {
        setModules(transformedModules)
        
        // Update activeModules state with new module names
        const newActiveModules: Record<string, boolean> = {}
        transformedModules.forEach(mod => {
          newActiveModules[mod.id] = false
        })
        setActiveModules(newActiveModules)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
      setModulesError(error instanceof Error ? error.message : 'Failed to load services')
    } finally {
      setIsLoadingModules(false)
    }
  }

  // Fetch data on mount
  useEffect(() => {
    fetchServicesData()
  }, [])

  // Initialize items as NOT selected by default
  useEffect(() => {
    const initial: Record<string, boolean> = {}
    const initialSubFeatures: Record<string, boolean> = {}
    modules.forEach((m) => {
      m.items.forEach((i) => {
        initial[i.id] = false  // Start with all features unselected
        // Don't auto-select sub-features either
      })
    })
    setSelectedItems(initial)
    setSelectedSubFeatures(initialSubFeatures)
  }, [modules])

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

            // Apply multiplier based on pricing unit
            if (itemPrice > 0) {
              if (item.per === "gb") monthlyTotal += itemPrice * counts.storage
              else if (item.per === "asset") monthlyTotal += itemPrice * counts.asset
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

  const scrollCards = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const amount = 380
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  const handleContinue = () => {
    if (!showAddOns) {
      setShowAddOns(true)
      setTimeout(() => {
        addOnsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } else {
      // Store customization data and proceed to registration
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
      }))
      router.push('/register')
    }
  }

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden relative">
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
        <span className="font-bold text-primary italic">eOpsEntre</span>
        <div className="flex items-center gap-2">
          <ThemeToggleFloating />
          <Link href="/" className="p-2 text-muted-foreground text-xs font-medium">
            Plans
          </Link>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden pt-14 lg:pt-0 pb-32">
        {/* Header */}
        <header className="px-4 py-6 lg:px-12 lg:py-10 lg:pb-6 shrink-0">
          <div className="max-w-7xl mx-auto">
            {/* Title and subtitle - at top */}
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-foreground mb-2 tracking-tight text-balance">
                {t.title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
                {t.subtitle}
              </p>
            </div>

            {/* Control row: Back button on left, billing toggle on right */}
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary/15 transition-all border border-primary/20"
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
                      "px-6 sm:px-8 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
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
                      "px-6 sm:px-8 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2",
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

        {/* Module cards - horizontal scroll */}
        <div
          ref={scrollRef}
          className={cn(
            "overflow-x-auto px-4 lg:px-10 py-4 flex items-start gap-4 lg:gap-6 scroll-smooth select-none min-h-[400px]",
            showAddOns ? "shrink-0" : ""
          )}
          style={{ scrollbarWidth: "thin" }}
        >
          {/* Loading State */}
          {isLoadingModules && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading services from backend...</p>
            </div>
          )}

          {/* Error State */}
          {!isLoadingModules && modulesError && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[400px]">
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

          {/* Success State - Show Modules */}
          {!isLoadingModules && !modulesError && modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              mod={mod}
              isActive={activeModules[mod.id]}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              selectedSubFeatures={selectedSubFeatures}
              setSelectedSubFeatures={setSelectedSubFeatures}
              expandedFeatures={expandedFeatures}
              setExpandedFeatures={setExpandedFeatures}
              billingCycle={billingCycle}
              formatPrice={formatPrice}
              freeLabel={t.free}
              selectedLabel={t.selected}
            />
          ))}


        </div>

        {/* Scroll navigation */}
        <div className={cn("px-10 py-6 flex flex-col items-center gap-3 shrink-0")}>
          <div className="w-full h-1.5 bg-secondary rounded-full max-w-xs relative overflow-hidden">
            <div className="absolute h-full bg-primary transition-all duration-700 rounded-full w-1/3 left-1/4" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => scrollCards("left")}
              className="p-2.5 text-muted-foreground hover:text-primary transition-colors bg-card rounded-full shadow-sm border border-border"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollCards("right")}
              className="p-2.5 text-muted-foreground hover:text-primary transition-colors bg-card rounded-full shadow-sm border border-border"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
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
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-primary-foreground px-8 sm:px-12 py-3 sm:py-3.5 rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-2 group">
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
