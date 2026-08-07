"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, ArrowRight, Mail, Building2, User, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Each destination product's own frontend, and the dashboard-label to show
// for it. The token-handoff route on each of these accepts the destination
// system's own JWT (returned directly by registerFirm/register during
// Step 4.6 of registration) via a query param, logs the user in locally on
// that origin, and redirects to the dashboard -- so the user lands already
// authenticated instead of at a login screen.
const DESTINATION_DASHBOARDS: Record<string, { url: string; label: string }> = {
  tax_compliance: { url: 'https://taxcomply.eopsprimax.com', label: 'Tax Compliance Dashboard' },
  buyer: { url: 'https://eops-supplierconnect.eopsprimax.com', label: 'Buyer Dashboard' },
  supplier: { url: 'https://eops-supplierconnect.eopsprimax.com', label: 'Supplier Dashboard' },
}

function getDashboardLink(registrationData: any): { href: string; label: string } {
  const destination = DESTINATION_DASHBOARDS[registrationData?.destinationSystem]
  if (destination && registrationData?.destinationAccessToken) {
    const refresh = registrationData.destinationRefreshToken || registrationData.destinationAccessToken
    return {
      href: `${destination.url}/auth/token-handoff?token=${encodeURIComponent(registrationData.destinationAccessToken)}&refresh=${encodeURIComponent(refresh)}`,
      label: `Go to ${destination.label}`,
    }
  }
  // No destination system (custom plan with no category) or the
  // destination-system registration step failed non-blocking earlier --
  // nothing to auto-login into, so just send them back to the storefront.
  return { href: '/', label: 'Back to Home' }
}

const WELLONGE_ID_URL = 'https://frontidall.eopsprimax.com'

function getWellongeIdDashboardLink(registrationData: any): string | null {
  if (!registrationData?.wellongeIdAccessToken) return null
  const refresh = registrationData.wellongeIdRefreshToken || registrationData.wellongeIdAccessToken
  return `${WELLONGE_ID_URL}/auth/token-handoff?token=${encodeURIComponent(registrationData.wellongeIdAccessToken)}&refresh=${encodeURIComponent(refresh)}`
}

export default function SuccessPage() {
  const [registrationData, setRegistrationData] = useState<any>(null)

  useEffect(() => {
    const regData = localStorage.getItem('registration_data')
    if (regData) setRegistrationData(JSON.parse(regData))
  }, [])

  const dashboardLink = getDashboardLink(registrationData)
  const wellongeIdLink = getWellongeIdDashboardLink(registrationData)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h1 className="text-3xl font-bold mb-3">Account Created!</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Welcome to eOpsPrimax Platform
          </p>

          <div className="bg-muted/30 rounded-lg p-6 mb-8 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Account holder</p>
                <p className="font-medium">
                  {registrationData?.firstName} {registrationData?.lastName}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{registrationData?.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Organization</p>
                <p className="font-medium">{registrationData?.orgName}</p>
              </div>
            </div>
            {registrationData?.industry && (
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Industry</p>
                  <p className="font-medium capitalize">{registrationData.industry}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium capitalize">
                  {registrationData?.registrationSource === 'pricing_package' ? 'Pre-built Package' : 'Custom Plan'}
                  {' Â· '}
                  {registrationData?.billingPeriod === 'yearly' ? 'Annual billing' : 'Monthly billing'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <a href={dashboardLink.href} className="flex items-center justify-center gap-2">
                {dashboardLink.label}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>

            {wellongeIdLink && (
              <Button asChild variant="outline" className="w-full" size="lg">
                <a href={wellongeIdLink} className="flex items-center justify-center gap-2">
                  Go to Wellonge ID Account
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            )}

            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link href="/">
                Back to Pricing
              </Link>
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t">
            <h3 className="font-semibold mb-3">What's Next?</h3>
            <div className="grid gap-3 text-left">
              <div className="flex gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                <div>
                  <p className="font-medium text-sm">Check your email</p>
                  <p className="text-xs text-muted-foreground">We've sent setup instructions to {registrationData?.email}</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                <div>
                  <p className="font-medium text-sm">Complete your profile</p>
                  <p className="text-xs text-muted-foreground">Add team members and configure your workspace</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                <div>
                  <p className="font-medium text-sm">Start using eOpsPrimax</p>
                  <p className="text-xs text-muted-foreground">Access all features based on your selected plan</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help? Contact our support team at{" "}
          <a href="mailto:support@eopsprimax.com" className="text-primary hover:underline">
            support@eopsprimax.com
          </a>
        </p>
      </div>
    </div>
  )
}
