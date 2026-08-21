import type { PublicPlan } from "./graphql-client"

/**
 * Filters the dynamic list of business-line categories (Tax Compliance /
 * Buyer / Supplier / whatever else gets added later) by a `?category=`
 * URL param. Shared by the homepage and /customize so both respect the
 * same links.
 *
 *   ?category=tax               -> only categories whose name contains "tax"
 *   ?category=tax,buyer         -> categories matching "tax" OR "buyer"
 *   ?category=all / no param    -> every category (unfiltered)
 *
 * Matching is a case-insensitive substring check against the category's
 * real (admin-managed) name -- same heuristic already used elsewhere in
 * this app (category-selector's icon picker, destinationSystems'
 * resolveDestinationSystem) -- so "tax" matches "Tax Compliance Agents"
 * without needing an exact slug. Unrecognized values that match nothing
 * fall back to showing every category rather than a dead end.
 */
export function filterCategoriesByParam(
  categories: PublicPlan[],
  categoryParam: string | null
): PublicPlan[] {
  if (!categoryParam) return categories

  const wanted = categoryParam
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)

  if (wanted.length === 0 || wanted.includes("all")) return categories

  const filtered = categories.filter((c) =>
    wanted.some((w) => c.name.toLowerCase().includes(w))
  )

  return filtered.length > 0 ? filtered : categories
}

/** Reads `?category=` from the current URL (client-side only). */
export function getCategoryParam(): string | null {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get("category")
}

/**
 * Tax Compliance and Buyer are treated as paired account types once
 * someone's actually building a *custom* plan -- a Buyer org (hotel,
 * corporate, NGO, etc.) commonly also runs its own payroll/tax compliance,
 * and vice versa. Supplier intentionally stays exclusive, no business need
 * to bundle it with either. Bidirectional: tax alone -> also offer Buyer,
 * buyer alone -> also offer Tax Compliance.
 *
 * IMPORTANT: this is a DISPLAY-ONLY widening, applied by /customize when
 * deciding which categories to show as toggleable -- it must never be
 * baked into the URL itself (via buildCustomizeHref or anywhere else).
 * The URL has to stay the single category the visitor actually came in
 * on, because "Go back to packages" reads that same URL param straight
 * back into the picker -- if the URL had already been widened to
 * "tax,buyer", going back would incorrectly show both categories' plans
 * instead of just the one the visitor originally picked.
 */
export function widenForCustomize(categoryValue: string): string {
  const parts = categoryValue.split(",").map((v) => v.trim().toLowerCase()).filter(Boolean)
  const hasTax = parts.some((p) => p.includes("tax"))
  const hasBuyer = parts.includes("buyer")
  if (hasBuyer && !hasTax) return `${categoryValue},tax`
  if (hasTax && !hasBuyer) return `${categoryValue},buyer`
  return categoryValue
}

/**
 * Some entry points (e.g. eopsprimax.com's "Become Agent" button) link
 * straight into Customize with "tax,buyer" already baked into the URL --
 * unlike the picker-originated flow, there's no single category to
 * "un-widen" back to because the visitor never saw a tax-only or
 * buyer-only picker in the first place. Tax Compliance is the anchor
 * category for all of those entry points (Buyer only ever rides along as
 * a Customize-only bonus, never its own "packages" to browse back to), so
 * "Go back to packages" collapses a combined tax+buyer URL down to tax
 * alone instead of echoing both back onto the picker.
 *
 * A URL that only ever had ONE category to begin with (e.g. a visitor who
 * picked "Buyer" on the picker itself and used Customize from there) is
 * untouched -- this only fires when both are already present together.
 */
export function narrowForBack(categoryValue: string): string {
  const parts = categoryValue.split(",").map((v) => v.trim()).filter(Boolean)
  const hasTax = parts.some((p) => p.toLowerCase().includes("tax"))
  const hasBuyer = parts.some((p) => p.toLowerCase() === "buyer")
  if (hasTax && hasBuyer) {
    return parts.filter((p) => p.toLowerCase().includes("tax")).join(",")
  }
  return categoryValue
}

/**
 * Where a "Customize your own plan" link should point, so navigating
 * there doesn't reset back to every category. Checks the URL first, then
 * narrows further if the customer has actually picked a specific category
 * on this page -- that's more specific than the URL's original filter
 * (e.g. URL says ?category=tax,buyer, they clicked "Buyer" -> /customize
 * should go straight to Buyer). Deliberately NOT widened here -- see
 * widenForCustomize's note on why the URL must stay unwidened.
 */
export function buildCustomizeHref(selectedCategory: PublicPlan | null, categoryParam: string | null): string {
  if (selectedCategory) {
    return `/customize?category=${encodeURIComponent(selectedCategory.name)}`
  }
  if (categoryParam) {
    return `/customize?category=${encodeURIComponent(categoryParam)}`
  }
  return "/customize"
}
