"use client"

import { useTheme } from "next-themes"
import {
  Sun,
  Moon,
  Monitor,
  SunMedium,
  MoonStar,
  Laptop,
  Sunrise,
  Sunset,
  CloudMoon,
  SunDim,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

/* ─── Compact pill toggle (for header navbars) ─── */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-full bg-secondary/50 border border-border",
          compact ? "p-0.5" : "p-1"
        )}
      >
        <div className={cn("rounded-full", compact ? "w-7 h-7" : "w-8 h-8")} />
        <div className={cn("rounded-full", compact ? "w-7 h-7" : "w-8 h-8")} />
        <div className={cn("rounded-full", compact ? "w-7 h-7" : "w-8 h-8")} />
      </div>
    )
  }

  const options = [
    {
      value: "light" as const,
      icon: Sun,
      activeIcon: SunMedium,
      label: "Light mode",
    },
    {
      value: "dark" as const,
      icon: Moon,
      activeIcon: MoonStar,
      label: "Dark mode",
    },
    {
      value: "system" as const,
      icon: Monitor,
      activeIcon: Laptop,
      label: "System preference",
    },
  ]

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-full bg-secondary/60 border border-border shadow-sm",
        compact ? "p-0.5" : "p-1"
      )}
      role="radiogroup"
      aria-label="Theme selection"
    >
      {options.map(({ value, icon: Icon, activeIcon: ActiveIcon, label }) => {
        const isActive = theme === value
        const CurrentIcon = isActive ? ActiveIcon : Icon
        return (
          <button
            key={value}
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "relative flex items-center justify-center rounded-full transition-all duration-300",
              compact ? "w-7 h-7" : "w-8 h-8",
              isActive
                ? "bg-card text-primary shadow-md border border-primary/20 scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            <CurrentIcon
              className={cn(
                "transition-all duration-300",
                compact ? "h-3.5 w-3.5" : "h-4 w-4",
                isActive && "animate-in spin-in-90 zoom-in-75 duration-300"
              )}
            />
            {isActive && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Inline sidebar toggle with labels ─── */
export function ThemeToggleInline({ label }: { label?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {label}
          </div>
        )}
        <div className="h-9 rounded-xl bg-secondary/50 border border-border" />
      </div>
    )
  }

  const options = [
    { value: "light" as const, icon: SunMedium, label: "Light" },
    { value: "dark" as const, icon: MoonStar, label: "Dark" },
    { value: "system" as const, icon: Laptop, label: "Auto" },
  ]

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          <Sunrise className="h-3 w-3" />
          {label}
        </div>
      )}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-xl border border-border">
        {options.map(({ value, icon: Icon, label: l }) => {
          const isActive = theme === value
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5",
                isActive
                  ? "bg-card text-primary shadow-sm border border-primary/15"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-3 w-3 transition-all duration-300",
                  isActive && "animate-in spin-in-90 zoom-in-75 duration-300"
                )}
              />
              {l}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Large floating toggle for page headers ─── */
export function ThemeToggleFloating() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="w-10 h-10 rounded-xl bg-secondary/50 border border-border" />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 group",
        isDark
          ? "bg-secondary/80 border-border text-foreground hover:border-primary/40 hover:bg-secondary"
          : "bg-card border-border text-foreground hover:border-primary/40 hover:shadow-md"
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Sun icon - shown in dark mode */}
      <SunMedium
        className={cn(
          "h-[18px] w-[18px] absolute transition-all duration-500",
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "rotate-90 scale-0 opacity-0"
        )}
      />
      {/* Moon icon - shown in light mode */}
      <MoonStar
        className={cn(
          "h-[18px] w-[18px] absolute transition-all duration-500",
          isDark
            ? "-rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        )}
      />
      {/* Pulse ring on hover */}
      <span
        className={cn(
          "absolute inset-0 rounded-xl transition-all duration-300 group-hover:ring-2",
          isDark ? "group-hover:ring-primary/20" : "group-hover:ring-primary/15"
        )}
      />
    </button>
  )
}
