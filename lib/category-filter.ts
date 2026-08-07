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
 * Where a "Customize your own plan" link should point, so navigating
 * there doesn't reset back to every category. Checks the URL first, then
 * narrows further if the customer has actually picked a specific category
 * on this page -- that's more specific than the URL's original filter
 * (e.g. URL says ?category=tax,buyer, they clicked "Buyer" -> /customize
 * should go straight to Buyer, not offer tax+buyer again).
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
