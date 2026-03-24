"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Download, ArrowRight, Mail, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function SuccessPage() {
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [paymentData, setPaymentData] = useState<any>(null)

  useEffect(() => {
    const regData = localStorage.getItem('registration_data')
    const payData = localStorage.getItem('payment_data')
    
    if (regData) setRegistrationData(JSON.parse(regData))
    if (payData) setPaymentData(JSON.parse(payData))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h1 className="text-3xl font-bold mb-3">Payment Successful!</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Welcome to eOpsEntre Platform
          </p>

          <div className="bg-muted/30 rounded-lg p-6 mb-8 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Confirmation sent to</p>
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
            {paymentData?.transactionId && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm">{paymentData.transactionId}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="https://apitesteops.eopsentre.com" className="flex items-center justify-center gap-2">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button variant="outline" className="w-full" size="lg" asChild>
              <Link href="/" className="flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                Download Receipt
              </Link>
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t">
            <h3 className="font-semibold mb-3">What's Next?</h3>
            <div className="grid gap-3 text-left">
              <div className="flex gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">Check your email</p>
                  <p className="text-xs text-muted-foreground">We've sent login credentials and setup instructions</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">Complete your profile</p>
                  <p className="text-xs text-muted-foreground">Add team members and configure your workspace</p>
                </div>
              </div>
              <div className="flex gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">Start using eOpsEntre</p>
                  <p className="text-xs text-muted-foreground">Access all features based on your selected plan</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help? Contact our support team at{" "}
          <a href="mailto:support@eopsentre.com" className="text-primary hover:underline">
            support@eopsentre.com
          </a>
        </p>
      </div>
    </div>
  )
}
