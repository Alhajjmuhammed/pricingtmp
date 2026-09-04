"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2, Lock, Phone, DollarSign, CheckCircle2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { BrandLogo } from "@/components/brand-logo"

import { registerPersonalAccount, loginPersonalAccount, createPersonalProfile, createOrganization } from "@/services"
import { syncUserToWellongeId } from "@/services/wellongeid/wellongeIdSyncService"
import {
  getInvitationDetails,
  finalizeClientFromInvitation,
  resolveDestinationSystem,
  registerWithTaxCompliance,
  registerWithSupplierPlatform,
  mapToTaxComplianceModules,
  mapToSupplierPlatformModules,
  type InvitationDetails,
} from "@/services/provisioning/destinationSystems"
import { withRetry } from "@/lib/retry"
import {
  billingGraphqlRequest,
  REGISTER_CUSTOM_SUBSCRIPTION,
  type RegisterCustomSubscriptionResult,
} from "@/lib/graphql-client"

const COUNTRY_CODES = [
  { code: "+255", iso: "tz", name: "Tanzania" },
  { code: "+254", iso: "ke", name: "Kenya" },
  { code: "+256", iso: "ug", name: "Uganda" },
  { code: "+250", iso: "rw", name: "Rwanda" },
  { code: "+257", iso: "bi", name: "Burundi" },
  { code: "+251", iso: "et", name: "Ethiopia" },
  { code: "+27", iso: "za", name: "South Africa" },
  { code: "+234", iso: "ng", name: "Nigeria" },
  { code: "+20", iso: "eg", name: "Egypt" },
  { code: "+1", iso: "us", name: "USA" },
  { code: "+44", iso: "gb", name: "UK" },
]

const COUNTRIES = [
  { iso: "tz", name: "Tanzania" },
  { iso: "ke", name: "Kenya" },
  { iso: "ug", name: "Uganda" },
  { iso: "rw", name: "Rwanda" },
  { iso: "bi", name: "Burundi" },
  { iso: "et", name: "Ethiopia" },
  { iso: "za", name: "South Africa" },
  { iso: "ng", name: "Nigeria" },
  { iso: "eg", name: "Egypt" },
  { iso: "us", name: "USA" },
  { iso: "gb", name: "UK" },
]

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export default function InvitePage() {
  const router = useRouter()
  // useParams() (not the page's `params` prop) -- version-stable way to
  // read dynamic route params in a client component. Destructuring the
  // `params` prop directly silently resolved to undefined here (Next.js
  // 16), which sent a null $token straight to invitationDetails and
  // surfaced as a generic "could not load this invitation" error even
  // for a perfectly valid, unexpired link.
  const routeParams = useParams<{ token: string }>()
  const token = routeParams.token

  const [loadingDetails, setLoadingDetails] = useState(true)
  const [details, setDetails] = useState<InvitationDetails | null>(null)
  const [loadError, setLoadError] = useState("")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [countryCode, setCountryCode] = useState("+255")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [country, setCountry] = useState("tz")

  const [billingName, setBillingName] = useState("")
  const [billingAddress, setBillingAddress] = useState("")
  const [billingCity, setBillingCity] = useState("")
  const [billingCountry, setBillingCountry] = useState("tz")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    getInvitationDetails(token)
      .then((d) => {
        if (cancelled) return
        if (!d) {
          setLoadError("This invitation link is invalid or has expired. Please contact whoever sent it to you for a new link.")
          return
        }
        setDetails(d)
        setBillingName(`${d.firstName} ${d.lastName}`.trim())
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load this invitation. Please try again in a moment.")
      })
      .finally(() => {
        if (!cancelled) setLoadingDetails(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const monthlyTotal = details
    ? details.subFeatureSelections.reduce((sum, s) => sum + s.price * s.quantity, 0) +
      details.addonSelections.reduce((sum, a) => sum + a.unitPrice * a.quantity, 0)
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!details) return
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (!billingAddress || !billingCity) {
      setError("Please complete your billing address")
      return
    }

    setSubmitting(true)
    try {
      // Card details are no longer collected or verified here at all --
      // the first real payment happens later, safely, through the
      // hosted-page invoice-payment flow. This step used to send raw
      // card number/CVV directly to our own server (a PCI-DSS high-risk
      // pattern) to verify a card that (a) currently blocks every real
      // signup, and (b) was never actually used afterward -- recurring
      // billing means "generate an invoice and notify", not "auto-charge
      // a saved card".
      // Step 1: create the Wellonge ID account using the prefilled identity
      const accountResponse = await registerPersonalAccount({
        email: details.primaryEmail,
        password,
        first_name: details.firstName,
        last_name: details.lastName,
        accept_terms: true,
        platform: "eopsentre_pricing_invitation",
      })
      if (!accountResponse.success || !accountResponse.data?.id) {
        // This page has no login form to send them to (unlike /register),
        // so the backend's "please use login instead" wording doesn't fit
        // here -- point them at support instead.
        const message = accountResponse.errorType === "EMAIL_EXISTS"
          ? "An account with this email already exists. Please contact support@eopsprimax.com to finish setting up this invitation."
          : accountResponse.error || "Failed to create your account"
        setError(message)
        setSubmitting(false)
        return
      }
      const newAccountId = accountResponse.data.id

      const provisioningResults: Record<string, boolean> = {}

      // Step 1b: log in to obtain a Bearer token
      const loginResponse = await withRetry(() => loginPersonalAccount(details.primaryEmail, password))
      if (!loginResponse.success || !loginResponse.data?.access_token) {
        setError(loginResponse.message || loginResponse.errors?.[0] || "Failed to authenticate after registration")
        setSubmitting(false)
        return
      }
      const accessToken = loginResponse.data.access_token
      const wellongeIdRefreshToken = loginResponse.data.refresh_token

      // Step 2: profile
      const countryName = COUNTRIES.find((c) => c.iso === country)?.name
      await withRetry(() =>
        createPersonalProfile(
          {
            personal_account_id: newAccountId,
            phone_number: phoneNumber ? `${countryCode}${phoneNumber}` : undefined,
            country: countryName,
          },
          accessToken
        )
      )
      provisioningResults.wellongeIdProfile = true

      // Step 3: organization
      const orgSlug = `${slugify(details.name)}-${newAccountId.slice(0, 6)}`
      const orgResponse = await withRetry(() =>
        createOrganization(
          {
            name: details.name,
            legal_name: details.name,
            slug: orgSlug,
            personal_account_owner_id: newAccountId,
            primary_email: details.primaryEmail,
            primary_phone: phoneNumber ? `${countryCode}${phoneNumber}` : undefined,
          },
          accessToken
        )
      )
      if (!orgResponse.success || !orgResponse.data?.id) {
        setError(orgResponse.error || "Failed to create your organization")
        setSubmitting(false)
        return
      }
      const orgId = orgResponse.data.id
      provisioningResults.wellongeIdOrganization = true

      // Step 4: create the real wellongepay subscription -- subFeatureId/
      // addonId here are already real wellongepay catalog IDs (the admin's
      // picker sourced them live from wellongepay), so no translation step
      // is needed.
      let subscriptionId: string | undefined
      const billingCycleUpper = details.billingCycle === "yearly" ? "ANNUAL" : "MONTHLY"
      if (details.subFeatureSelections.length > 0 || details.addonSelections.length > 0) {
        try {
          await withRetry(async () => {
            const subResult = await billingGraphqlRequest<RegisterCustomSubscriptionResult>(REGISTER_CUSTOM_SUBSCRIPTION, {
              packageName: details.packageName || `${details.name} Plan`,
              subFeatureSelections: details.subFeatureSelections.map((s) => ({
                subFeatureId: s.subFeatureId,
              })),
              addonSelections: details.addonSelections.map((a) => ({ addonId: a.addonId, quantity: a.quantity })),
              ownerWalletId: newAccountId,
              billingCycle: billingCycleUpper,
            })
            subscriptionId = subResult.registerCustomSubscription?.subscriptionId
          })
          provisioningResults.wellongepaySubscription = true
        } catch (subErr) {
          console.warn("Could not create subscription (non-blocking):", subErr)
        }
      } else {
        console.warn("No catalog selections found on this invitation — skipping subscription creation")
      }

      // Step 4.5: flip the admin-drafted Client record from draft -> active
      // and link it to the real account (replaces completeOnboarding --
      // the Client/Organization already exist from the admin's draft).
      try {
        const finalizeResult = await withRetry(() => finalizeClientFromInvitation(token, newAccountId, subscriptionId))
        if (finalizeResult.success) provisioningResults.clientManagement = true
        else console.warn("Could not finalize Client Management record (non-blocking):", finalizeResult.message)
      } catch (finalizeErr) {
        console.warn("Could not finalize Client Management record (non-blocking):", finalizeErr)
      }

      // Step 4.6: provision the destination product itself
      let destinationAccessToken: string | null = null
      let destinationRefreshToken: string | null = null
      const destinationSystem = resolveDestinationSystem(details.categoryName || undefined)
      const purchasedModuleNames = [
        ...details.subFeatureSelections.map((s) => s.name),
        ...details.addonSelections.map((a) => a.name),
      ]
      if (destinationSystem === "tax_compliance") {
        try {
          const tcResult = await withRetry(() =>
            registerWithTaxCompliance({
              orgName: details.name,
              industry: "",
              orgSize: "",
              country: countryName || "",
              email: details.primaryEmail,
              password,
              firstName: details.firstName,
              lastName: details.lastName,
              planName: details.packageName || "standard",
              purchasedModules: mapToTaxComplianceModules(purchasedModuleNames),
            })
          )
          provisioningResults.taxCompliancePlatform = true
          destinationAccessToken = tcResult?.accessToken || null
          destinationRefreshToken = tcResult?.refreshToken || null
        } catch (tcErr) {
          console.warn("Could not register with Tax Compliance platform (non-blocking):", tcErr)
        }
      } else if (destinationSystem === "buyer" || destinationSystem === "supplier") {
        try {
          const spResult = await withRetry(() =>
            registerWithSupplierPlatform({
              orgName: details.name,
              orgSlug,
              country: countryName,
              email: details.primaryEmail,
              password,
              firstName: details.firstName,
              lastName: details.lastName,
              orgType: destinationSystem,
              planName: details.packageName || "standard",
              purchasedModules: mapToSupplierPlatformModules(purchasedModuleNames),
            })
          )
          provisioningResults.supplierConnectPlatform = true
          destinationAccessToken = spResult?.accessToken || null
          destinationRefreshToken = spResult?.refreshToken || null
        } catch (spErr) {
          console.warn("Could not register with Supplier Connect platform (non-blocking):", spErr)
        }
      }

      // Step 5: eOpsEntre linkage
      try {
        const syncResult = await withRetry(() =>
          syncUserToWellongeId({
            email: details.primaryEmail,
            password,
            firstName: details.firstName,
            lastName: details.lastName,
            personalAccountId: newAccountId,
            organizationId: orgId,
            accessToken,
          })
        )
        if (syncResult.success) provisioningResults.wellongeIdEopsentreLink = true
      } catch (syncErr) {
        console.warn("Could not sync user to Wellonge ID (non-blocking):", syncErr)
      }

      localStorage.setItem(
        "registration_data",
        JSON.stringify({
          accountId: newAccountId,
          email: details.primaryEmail,
          firstName: details.firstName,
          lastName: details.lastName,
          orgId,
          orgName: details.name,
          registrationSource: "admin_invitation",
          billingPeriod: details.billingCycle,
          provisioningResults,
          destinationSystem,
          destinationAccessToken,
          destinationRefreshToken,
          wellongeIdAccessToken: accessToken,
          wellongeIdRefreshToken,
          billing: {
            billingName,
            billingAddress,
            billingCity,
            billingCountry,
          },
        })
      )
      router.push("/success")
    } catch (err: any) {
      setError(err?.message || "An error occurred while finishing your registration")
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <BrandLogo />
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your invitation...</p>
          </div>
        </div>
      </div>
    )
  }

  if (loadError || !details) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background p-4">
        <BrandLogo />
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-xl font-bold mb-3">Invitation not available</h1>
          <p className="text-muted-foreground mb-6">{loadError}</p>
          <p className="text-sm text-muted-foreground">
            Need help? Contact{" "}
            <a href="mailto:support@eopsprimax.com" className="text-primary hover:underline">
              support@eopsprimax.com
            </a>
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Finish setting up your account</h1>
          <p className="text-muted-foreground">
            {details.name} — set a password and confirm your billing details to activate your plan.
          </p>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Your plan</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{details.categoryName}</span>
            </div>
            {details.packageName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{details.packageName}</span>
              </div>
            )}
            {details.subFeatureSelections.map((s) => (
              <div key={s.subFeatureId} className="flex justify-between text-muted-foreground">
                <span>{s.name}{s.quantity > 1 ? ` ×${s.quantity}` : ""}</span>
                <span>${(s.price * s.quantity).toFixed(2)}</span>
              </div>
            ))}
            {details.addonSelections.map((a) => (
              <div key={a.addonId} className="flex justify-between text-muted-foreground">
                <span>{a.name}{a.quantity > 1 ? ` ×${a.quantity}` : ""} (add-on)</span>
                <span>${(a.unitPrice * a.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total</span>
              <span>${monthlyTotal.toFixed(2)} / {details.billingCycle === "yearly" ? "year" : "month"}</span>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" /> Set your password
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4" /> Contact (optional)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone number</Label>
                  <div className="flex gap-2">
                    <select
                      className="border rounded-md px-2 text-sm bg-background"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.iso} value={c.code}>{c.code}</option>
                      ))}
                    </select>
                    <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <select
                    id="country"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.iso} value={c.iso}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Billing information
              </h2>

              <div className="space-y-2">
                <Label htmlFor="billingName">Full name</Label>
                <Input id="billingName" value={billingName} onChange={(e) => setBillingName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingAddress">Street address</Label>
                <Input id="billingAddress" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingCity">City</Label>
                  <Input id="billingCity" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingCountry">Country</Label>
                  <select
                    id="billingCountry"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={billingCountry}
                    onChange={(e) => setBillingCountry(e.target.value)}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.iso} value={c.iso}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Finishing registration...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Complete registration
                </>
              )}
            </Button>
          </Card>
        </form>
      </div>
    </div>
  )
}
