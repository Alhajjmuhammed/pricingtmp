"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, CreditCard, Smartphone, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { processPayment } from "@/services"

export default function PaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [registrationData, setRegistrationData] = useState<any>(null)
  
  // Card payment
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  
  // Billing address
  const [fullName, setFullName] = useState("")
  const [emailBilling, setEmailBilling] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [street, setStreet] = useState("")
  const [zipCode, setZipCode] = useState("")
  
  // M-PESA
  const [mpesaPhone, setMpesaPhone] = useState("")

  useEffect(() => {
    const data = localStorage.getItem('registration_data')
    if (!data) {
      router.push('/register')
      return
    }
    const parsed = JSON.parse(data)
    setRegistrationData(parsed)
    setEmailBilling(parsed.email)
    setFullName(parsed.orgName)
  }, [router])

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await processPayment({
        paymentMethod: 'card',
        amount: 100, // Replace with actual amount from plan
        currency: 'USD',
        organizationId: registrationData?.orgId,
        personalAccountId: registrationData?.accountId,
        billingAddress: {
          fullName,
          email: emailBilling,
          city,
          country,
          street,
          zipCode,
        },
        cart: {
          items: [{
            itemName: 'eOpsEntre Subscription',
            itemType: 'subscription',
            quantity: 1,
            price: 100,
          }]
        },
      })

      if (response.success && response.data) {
        localStorage.setItem('payment_data', JSON.stringify({
          paymentId: response.data.payment_id,
          transactionId: response.data.transaction_id,
        }))
        router.push('/success')
      } else {
        setError(response.message || "Payment failed")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleMpesaPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await processPayment({
        paymentMethod: 'mpesa',
        amount: 100,
        currency: 'KES',
        organizationId: registrationData?.orgId,
        personalAccountId: registrationData?.accountId,
        mpesaPhone,
        cart: {
          items: [{
            itemName: 'eOpsEntre Subscription',
            itemType: 'subscription',
            quantity: 1,
            price: 100,
          }]
        },
      })

      if (response.success && response.data) {
        localStorage.setItem('payment_data', JSON.stringify({
          paymentId: response.data.payment_id,
          checkoutRequestId: response.data.checkout_request_id,
        }))
        router.push('/success')
      } else {
        setError(response.message || "Payment failed")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (!registrationData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/register" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to registration
          </Link>
          <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-muted-foreground">
            Secure payment powered by Wellongepay
          </p>
        </div>

        {error && (
          <Card className="p-4 mb-6 bg-destructive/10 border-destructive/20">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="p-6">
              <Tabs defaultValue="card" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="card">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Credit Card
                  </TabsTrigger>
                  <TabsTrigger value="mpesa">
                    <Smartphone className="h-4 w-4 mr-2" />
                    M-PESA
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="card">
                  <form onSubmit={handleCardPayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        required
                        maxLength={19}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardName">Card Holder Name</Label>
                      <Input
                        id="cardName"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input
                          id="expiry"
                          placeholder="MM/YY"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          required
                          maxLength={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          required
                          maxLength={4}
                          type="password"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-4">Billing Address</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emailBilling">Email</Label>
                          <Input
                            id="emailBilling"
                            type="email"
                            value={emailBilling}
                            onChange={(e) => setEmailBilling(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="street">Street Address</Label>
                          <Input
                            id="street"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">Postal Code</Label>
                          <Input
                            id="zipCode"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Pay $100.00
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="mpesa">
                  <form onSubmit={handleMpesaPayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mpesaPhone">M-PESA Phone Number</Label>
                      <Input
                        id="mpesaPhone"
                        type="tel"
                        placeholder="+254 712 345 678"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter your M-PESA registered phone number
                      </p>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Pay KES 10,000
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">Custom Plan</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Billing</span>
                  <span className="font-medium">Monthly</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>$100.00</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Secure Payment</p>
                  <p className="text-muted-foreground text-xs">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
