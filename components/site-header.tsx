"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { BrandLogo } from "@/components/brand-logo"

export function SiteHeader({ customizeHref = "/customize" }: { customizeHref?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <a href="/" className="flex items-center">
          <BrandLogo />
        </a>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle compact />
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium text-muted-foreground">Theme</span>
              <ThemeToggle compact />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
