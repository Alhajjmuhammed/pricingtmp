"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail, Lock, User, Phone, Building2, MapPin, Package, DollarSign, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { registerPersonalAccount, createPersonalProfile, createOrganization } from "@/services"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Account, 2: Profile + Organization, 3: Review
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [accountId, setAccountId] = useState("")

  // Account data
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  // Profile data
  const [phoneNumber, setPhoneNumber] = useState("")
  const [location, setLocation] = useState("")

  // Organization data
  const [orgName, setOrgName] = useState("")
  const [industry, setIndustry] = useState("")
  const [orgSize, setOrgSize] = useState("")

  // Selected plan/customization data
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [customizationData, setCustomizationData] = useState<any>(null)

  // Editing states for review page
  const [editingAccount, setEditingAccount] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingOrg, setEditingOrg] = useState(false)
  const [editingPackage, setEditingPackage] = useState(false)

  // Handle inline save with validation
  const handleSaveAccount = () => {
    if (!email || !firstName || !lastName) {
      setError("Please fill in all account fields")
      return
    }
    setEditingAccount(false)
    setError("")
  }

  const handleSaveProfile = () => {
    if (!phoneNumber || !location) {
      setError("Please fill in all profile fields")
      return
    }
    setEditingProfile(false)
    setError("")
  }

  const handleSaveOrg = () => {
    if (!orgName || !industry || !orgSize) {
      setError("Please fill in all organization fields")
      return
    }
    setEditingOrg(false)
    setError("")
  }

  const handleSavePackage = () => {
    // Save package changes to localStorage
    if (selectedPlan) {
      localStorage.setItem('selected_plan', JSON.stringify(selectedPlan))
    }
    if (customizationData) {
      localStorage.setItem('customization_data', JSON.stringify(customizationData))
    }
    setEditingPackage(false)
    setError("")
  }

  const handleRemoveModule = (moduleIdx: number) => {
    if (customizationData?.modules) {
      const updatedModules = customizationData.modules.filter((_: any, idx: number) => idx !== moduleIdx)
      setCustomizationData({ ...customizationData, modules: updatedModules })
    }
  }

  const handleRemoveAddon = (addonIdx: number) => {
    if (customizationData?.addons) {
      const updatedAddons = customizationData.addons.filter((_: any, idx: number) => idx !== addonIdx)
      setCustomizationData({ ...customizationData, addons: updatedAddons })
    }
  }

  const handleChangePlanPrice = (newPrice: number) => {
    if (selectedPlan) {
      setSelectedPlan({ ...selectedPlan, price: newPrice })
    }
  }

  // Load selected plan and customization on mount
  useEffect(() => {
    const planData = localStorage.getItem('selected_plan')
    const customData = localStorage.getItem('customization_data')
    
    if (planData) setSelectedPlan(JSON.parse(planData))
    if (customData) setCustomizationData(JSON.parse(customData))
  }, [])

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Just validate and move to next step - don't create account yet
    if (!email || !password || !firstName || !lastName) {
      setError("Please fill in all fields")
      return
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    
    setError("")
    setStep(2) // Move to profile step
  }

  const handleProfileAndOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    if (!phoneNumber || !location || !orgName || !industry || !orgSize) {
      setError("Please fill in all fields")
      return
    }
    
    setError("")
    setStep(3) // Move to review step
  }

  const handleOrganizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orgName || !industry || !orgSize) {
      setError("Please fill in all fields")
      return
    }
    
    setLoading(true)
    setError("")

    try {
      console.log('🔵 [Register] Creating account with all collected data...')
      
      // Step 1: Create personal account
      console.log('📝 Step 1: Creating account...')
      const accountResponse = await registerPersonalAccount({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        accept_terms: true,
      })

      if (!accountResponse.success || !accountResponse.data?.id) {
        const errorMsg = accountResponse.message || accountResponse.errors?.[0] || "Failed to create account"
        console.error('❌ Account creation failed:', errorMsg)
        setError(errorMsg)
        return
      }

      const newAccountId = accountResponse.data.id
      console.log('✅ Account created, ID:', newAccountId)

      // Step 2: Create personal profile
      console.log('📝 Step 2: Creating profile...')
      const profileResponse = await createPersonalProfile({
        personal_account_id: newAccountId,
        phone_number: phoneNumber,
        location,
      })

      if (!profileResponse.success) {
        const errorMsg = profileResponse.message || profileResponse.errors?.[0] || "Failed to create profile"
        console.error('❌ Profile creation failed:', errorMsg)
        setError(errorMsg)
        return
      }
      console.log('✅ Profile created')

      // Step 3: Create organization
      console.log('📝 Step 3: Creating organization...')
      const orgResponse = await createOrganization({
        name: orgName,
        legal_name: orgName,
        industry,
        size: orgSize,
        personal_account_owner_id: newAccountId,
        primary_email: email,
        primary_phone: phoneNumber,
      })

      if (!orgResponse.success || !orgResponse.data?.id) {
        const errorMsg = orgResponse.message || orgResponse.errors?.[0] || "Failed to create organization"
        console.error('❌ Organization creation failed:', errorMsg)
        setError(errorMsg)
        return
      }
      console.log('✅ Organization created, ID:', orgResponse.data.id)

      // All steps completed successfully - store data and proceed to payment
      console.log('🎉 Registration complete! Moving to payment...')
      localStorage.setItem('registration_data', JSON.stringify({
        accountId: newAccountId,
        email,
        firstName,
        lastName,
        phoneNumber,
        location,
        orgId: orgResponse.data.id,
        orgName,
        industry,
        orgSize,
      }))
      
      router.push('/payment')
    } catch (err: any) {
      console.error('💥 [Register] Exception:', err)
      setError(err.message || "An error occurred during registration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/customize" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to pricing
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
          <p className="text-muted-foreground">
            Complete your registration to unlock eOpsEntre platform
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center items-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= s ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted-foreground/20'}`} />}
            </div>
          ))}
        </div>

        <Card className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Account */}
          {step === 1 && (
            <form onSubmit={handleAccountSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={8}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue to Profile
              </Button>
            </form>
          )}

          {/* Step 2: Profile + Organization */}
          {step === 2 && (
            <form onSubmit={handleProfileAndOrgSubmit} className="space-y-6">
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Profile Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 234 567 8900"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="City, Country"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Organization Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Organization Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="orgName"
                        placeholder="Acme Corporation"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      placeholder="Technology, Finance, etc."
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Company Size</Label>
                    <select
                      id="size"
                      value={orgSize}
                      onChange={(e) => setOrgSize(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      required
                    >
                      <option value="">Select size...</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501+">501+ employees</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Continue to Review
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Review & Create Account */}
          {step === 3 && (
            <form onSubmit={handleOrganizationSubmit} className="space-y-6">
              <h3 className="text-2xl font-bold mb-6 text-center">Review Your Order</h3>
              
              <div className="space-y-4">
                {/* Account Info Summary */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Account Information
                    </h4>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        console.log('Edit button clicked, current state:', editingAccount)
                        if (editingAccount) {
                          handleSaveAccount()
                        } else {
                          setEditingAccount(true)
                        }
                      }}
                      className="h-7 text-xs"
                    >
                      {editingAccount ? 'Save' : 'Edit'}
                    </Button>
                  </div>
                  
                  {(() => {
                    console.log('Rendering Account section, editingAccount:', editingAccount)
                    return editingAccount ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="review-firstName" className="text-xs">First Name</Label>
                          <Input
                            id="review-firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="review-lastName" className="text-xs">Last Name</Label>
                          <Input
                            id="review-lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="review-email" className="text-xs">Email</Label>
                        <Input
                          id="review-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="review-password" className="text-xs">Password</Label>
                        <Input
                          id="review-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Name</p>
                        <p className="font-medium">{firstName} {lastName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Email</p>
                        <p className="font-medium">{email}</p>
                      </div>
                    </div>
                  )
                  })()}
                </div>

                {/* Profile Info Summary */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Profile Information
                    </h4>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => editingProfile ? handleSaveProfile() : setEditingProfile(true)}
                      className="h-7 text-xs"
                    >
                      {editingProfile ? 'Save' : 'Edit'}
                    </Button>
                  </div>
                  
                  {editingProfile ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="review-phone" className="text-xs">Phone Number</Label>
                        <Input
                          id="review-phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="review-location" className="text-xs">Location</Label>
                        <Input
                          id="review-location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Phone Number</p>
                        <p className="font-medium">{phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Location</p>
                        <p className="font-medium">{location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Organization Info Summary */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization Information
                    </h4>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => editingOrg ? handleSaveOrg() : setEditingOrg(true)}
                      className="h-7 text-xs"
                    >
                      {editingOrg ? 'Save' : 'Edit'}
                    </Button>
                  </div>
                  
                  {editingOrg ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="review-orgName" className="text-xs">Organization Name</Label>
                        <Input
                          id="review-orgName"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="review-industry" className="text-xs">Industry</Label>
                        <Input
                          id="review-industry"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="review-orgSize" className="text-xs">Company Size</Label>
                        <select
                          id="review-orgSize"
                          value={orgSize}
                          onChange={(e) => setOrgSize(e.target.value)}
                          className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="">Select size...</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="501+">501+ employees</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Organization</p>
                        <p className="font-medium">{orgName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Industry</p>
                        <p className="font-medium">{industry}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">Company Size</p>
                        <p className="font-medium">{orgSize}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected Plan/Package */}
                <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Selected Package</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => editingPackage ? handleSavePackage() : setEditingPackage(true)}
                        className="h-7 text-xs"
                      >
                        {editingPackage ? 'Save' : 'Edit'}
                      </Button>
                      {editingPackage && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            // Redirect to customize page for full package selection
                            window.location.href = "/customize"
                          }}
                          className="h-7 text-xs"
                        >
                          Full Customize
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {selectedPlan ? (
                    <div className="space-y-3">
                      <div>
                        <p className="font-bold text-lg">{selectedPlan.name || 'Custom Plan'}</p>
                        {selectedPlan.description && (
                          <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                        )}
                        {editingPackage && (
                          <div className="mt-2">
                            <Label htmlFor="review-planPrice" className="text-xs">Monthly/Annual Price</Label>
                            <Input
                              id="review-planPrice"
                              type="number"
                              value={selectedPlan.price || 0}
                              onChange={(e) => handleChangePlanPrice(parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm w-32"
                              step="0.01"
                            />
                          </div>
                        )}
                      </div>
                      
                      {selectedPlan.features && selectedPlan.features.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">INCLUDED FEATURES</p>
                          <ul className="space-y-1">
                            {selectedPlan.features.map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No plan selected</p>
                  )}

                  {customizationData && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">CUSTOMIZATIONS</p>
                      {customizationData.modules && customizationData.modules.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm font-medium mb-1">Custom Modules ({customizationData.modules.length})</p>
                          <ul className="space-y-1 ml-4">
                            {customizationData.modules.map((module: any, idx: number) => (
                              <li key={idx} className="flex items-center justify-between text-xs text-muted-foreground group">
                                <span>• {module.name || module}</span>
                                {editingPackage && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveModule(idx)}
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3 text-destructive" />
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {customizationData.addons && customizationData.addons.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-1">Add-ons ({customizationData.addons.length})</p>
                          <ul className="space-y-1 ml-4">
                            {customizationData.addons.map((addon: any, idx: number) => (
                              <li key={idx} className="flex items-center justify-between text-xs text-muted-foreground group">
                                <span>• {addon.name || addon}</span>
                                {editingPackage && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveAddon(idx)}
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3 text-destructive" />
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {editingPackage && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground italic">
                        💡 Tip: Click "Full Customize" to add modules/add-ons or change your plan. Use the X buttons above to remove items.
                      </p>
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5" />
                    <h4 className="font-semibold">Price Summary</h4>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedPlan ? (
                      <div className="flex justify-between text-sm">
                        <span>{selectedPlan.name || 'Plan'}</span>
                        <span className="font-medium">
                          ${selectedPlan.price || 0}/{selectedPlan.billing === 'annual' ? 'year' : 'month'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>No plan selected</span>
                        <span>$0</span>
                      </div>
                    )}

                    {customizationData?.totalPrice > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Customizations</span>
                        <span className="font-medium">${customizationData.totalPrice}/month</span>
                      </div>
                    )}

                    <div className="pt-3 mt-3 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">Total</span>
                        <span className="text-2xl font-bold text-primary">
                          ${(selectedPlan?.price || 0) + (customizationData?.totalPrice || 0)}
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            /{selectedPlan?.billing === 'annual' ? 'year' : 'month'}
                          </span>
                        </span>
                      </div>
                      {selectedPlan?.billing === 'annual' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ${((selectedPlan?.price || 0) / 12).toFixed(2)}/month billed annually
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground mb-4">
                Need to change something? Click "Edit" on any section above to update inline
              </div>

              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setStep(2)}
                >
                  Back to Form
                </Button>
                <Button type="submit" className="flex-1" size="lg" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Creating Account...' : 'Confirm & Create Account'}
                </Button>
              </div>
            </form>
          )}
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
