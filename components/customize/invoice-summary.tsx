"use client"

import { useMemo } from "react"
import {
  X,
  Download,
  FileText,
  Check,
  Building2,
  HardDrive,
  Users,
  Package,
  Receipt,
  Printer,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  modules as staticModules,
  UNIT_PRICES,
  CURRENCIES,
  type LangKey,
  type Counts,
  type Module,
} from "@/lib/customize-data"

const VAT_RATE = 0.18

interface InvoiceSummaryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeModules: Record<string, boolean>
  selectedItems: Record<string, boolean>
  selectedSubFeatures?: Record<string, boolean>
  selectedAddOns?: Record<string, boolean>
  modules?: Module[]
  counts: Counts
  billingCycle: "monthly" | "yearly"
  currency: string
  lang: LangKey
}

interface LineItem {
  label: string
  detail: string
  amount: number
}

export function InvoiceSummary({
  open,
  onOpenChange,
  activeModules,
  selectedItems,
  selectedSubFeatures = {},
  selectedAddOns = {},
  modules: dynamicModules,
  counts,
  billingCycle,
  currency,
}: InvoiceSummaryProps) {
  const cur = CURRENCIES[currency]
  const isYearly = billingCycle === "yearly"
  const periodLabel = isYearly ? "year" : "month"
  const resolvedModules = dynamicModules ?? staticModules

  const { lineItems, subtotal, vatAmount, grandTotal } = useMemo(() => {
    const items: LineItem[] = []
    let sub = 0

    // Module items (features + sub-features)
    resolvedModules.forEach((mod) => {
      if (!activeModules[mod.id]) return
      mod.items.forEach((item) => {
        if (!selectedItems[item.id]) return
        // Use selected sub-feature prices if the item has sub-features; otherwise use base price
        let itemPrice = 0
        if (item.subFeatures && item.subFeatures.length > 0) {
          item.subFeatures.forEach(sf => {
            if (selectedSubFeatures[sf.id]) itemPrice += sf.price
          })
        } else {
          itemPrice = item.price
        }
        if (itemPrice <= 0) return
        let qty = counts.users
        let unit = "user"
        if (item.per === "gb") { qty = counts.storage; unit = "GB" }
        else if (item.per === "asset") { qty = counts.asset; unit = "asset" }
        const monthly = itemPrice * qty
        const period = isYearly ? monthly * 12 * 0.8 : monthly
        items.push({
          label: item.name,
          detail: `${qty} ${unit}${qty > 1 ? "s" : ""} x ${cur.symbol}${(itemPrice * cur.rate).toFixed(2)}/${unit}/mo${isYearly ? " x 12 x 0.8" : ""}`,
          amount: period * cur.rate,
        })
        sub += period * cur.rate
      })
    })

    // Asset hosting
    if (counts.asset > 0) {
      const assetCost = counts.asset * UNIT_PRICES.asset
      const period = isYearly ? assetCost * 12 * 0.8 : assetCost
      const converted = period * cur.rate
      items.push({
        label: "Asset Hosting",
        detail: `${counts.asset} assets x ${cur.symbol}${(UNIT_PRICES.asset * cur.rate).toFixed(2)}/asset/mo`,
        amount: converted,
      })
      sub += converted
    }

    // Organizations
    {
      const orgCost = counts.organizations * UNIT_PRICES.organization
      const period = isYearly ? orgCost * 12 * 0.8 : orgCost
      const converted = period * cur.rate
      items.push({
        label: "Organizations",
        detail: `${counts.organizations} org${counts.organizations !== 1 ? "s" : ""} x ${cur.symbol}${(UNIT_PRICES.organization * cur.rate).toFixed(2)}/org/mo`,
        amount: converted,
      })
      sub += converted
    }

    // Add-ons
    resolvedModules.forEach((mod) => {
      if (!activeModules[mod.id] || !mod.addons) return
      mod.addons.forEach(addon => {
        if (!selectedAddOns[addon.id]) return
        const period = isYearly ? addon.price * 12 * 0.8 : addon.price
        const converted = period * cur.rate
        items.push({
          label: addon.name,
          detail: `Add-on${isYearly ? " x 12 x 0.8" : ""}`,
          amount: converted,
        })
        sub += converted
      })
    })

    const vat = sub * VAT_RATE
    return { lineItems: items, subtotal: sub, vatAmount: vat, grandTotal: sub + vat }
  }, [activeModules, selectedItems, selectedSubFeatures, selectedAddOns, resolvedModules, counts, billingCycle, cur, isYearly])

  const handleExport = () => {
    const activeModList = Object.keys(activeModules).filter((k) => activeModules[k])
    const now = new Date()
    const invNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const lines = lineItems.map(
      (l) => `  ${l.label.padEnd(40)} ${cur.symbol}${l.amount.toFixed(2).padStart(12)}\n    ${l.detail}`
    )
    const data = `
=====================================
  INVOICE SUMMARY
=====================================
  Invoice #: ${invNumber}
  Date: ${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
  Billing: ${billingCycle === "yearly" ? "Annual (20% discount applied)" : "Monthly"}
  Currency: ${currency}
-------------------------------------

  ACTIVE MODULES
${activeModList.map((m) => `    [x] ${m}`).join("\n")}

  PLAN SCALE
    Users: ${counts.users}
    Assets: ${counts.asset}
    Organizations: ${counts.organizations}
    Storage: ${counts.storage} GB

-------------------------------------
  LINE ITEMS
-------------------------------------
${lines.join("\n\n")}

-------------------------------------
  Subtotal:${" ".repeat(32)}${cur.symbol}${subtotal.toFixed(2).padStart(12)}
  VAT (18%):${" ".repeat(31)}${cur.symbol}${vatAmount.toFixed(2).padStart(12)}
  ─────────────────────────────────────
  TOTAL:${" ".repeat(35)}${cur.symbol}${grandTotal.toFixed(2).padStart(12)}
  Per ${periodLabel}
=====================================
  Generated: ${now.toLocaleString()}
  Thank you for choosing eOpsEntre.
=====================================
`
    const blob = new Blob([data], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${invNumber}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[70]"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet */}
      <div className="fixed inset-y-0 right-0 z-[80] w-full sm:w-[480px] md:w-[540px] bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Invoice Summary</h2>
              <p className="text-xs text-muted-foreground">
                {billingCycle === "yearly" ? "Annual billing" : "Monthly billing"} &middot; {currency}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Plan summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-secondary/50 border border-border p-3.5">
              <Users className="h-4 w-4 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground tabular-nums">{counts.users}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Users</p>
            </div>
            <div className="rounded-xl bg-secondary/50 border border-border p-3.5">
              <Package className="h-4 w-4 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground tabular-nums">{counts.asset}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Assets</p>
            </div>
            <div className="rounded-xl bg-secondary/50 border border-border p-3.5">
              <Building2 className="h-4 w-4 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground tabular-nums">{counts.organizations}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Organizations</p>
            </div>
            <div className="rounded-xl bg-secondary/50 border border-border p-3.5">
              <HardDrive className="h-4 w-4 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground tabular-nums">{counts.storage} GB</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Storage</p>
            </div>
          </div>

          {/* Active modules */}
          <div>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Active Modules
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(activeModules)
                .filter((k) => activeModules[k])
                .map((k) => (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary"
                  >
                    <Check className="h-3 w-3" />
                    {k}
                  </span>
                ))}
            </div>
          </div>

          {/* Line items table */}
          <div>
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Line Items
            </h3>
            <div className="rounded-xl border border-border overflow-hidden">
              {lineItems.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No billable items selected.
                </div>
              ) : (
                lineItems.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start justify-between p-4 gap-4",
                      i < lineItems.length - 1 && "border-b border-border"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.detail}</p>
                    </div>
                    <span className="text-sm font-bold text-foreground tabular-nums whitespace-nowrap">
                      {cur.symbol}{item.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {cur.symbol}{subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-sm text-muted-foreground">VAT (18%)</span>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {cur.symbol}{vatAmount.toFixed(2)}
              </span>
            </div>
            {isYearly && (
              <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
                <span className="text-sm text-primary font-medium">Annual discount (20%)</span>
                <span className="text-sm font-semibold text-primary tabular-nums">Included</span>
              </div>
            )}
            <div className="flex items-center justify-between p-4 bg-secondary/50">
              <span className="text-base font-bold text-foreground">Grand Total</span>
              <div className="text-right">
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {cur.symbol}{grandTotal.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground block">
                  per {periodLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Per-user breakdown */}
          {counts.users > 0 && (
            <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Effective cost per user</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isYearly ? `${cur.symbol}${(grandTotal / 12 / counts.users).toFixed(2)}/user/month` : `${cur.symbol}${(grandTotal / counts.users).toFixed(2)}/user/month`}
                </p>
              </div>
              <span className="text-2xl font-bold text-primary tabular-nums">
                {cur.symbol}{isYearly ? (grandTotal / 12 / counts.users).toFixed(2) : (grandTotal / counts.users).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-border shrink-0 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex-1 gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <FileText className="h-4 w-4" />
            Continue
          </Button>
        </div>
      </div>
    </>
  )
}
