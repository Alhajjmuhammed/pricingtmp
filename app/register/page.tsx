"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail, Lock, User, Phone, Building2, Package, DollarSign, Check, Plus, Minus, ChevronDown, HardDrive, Calendar, Briefcase, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { registerPersonalAccount, createPersonalProfile, createOrganization } from "@/services"
import { 
  graphqlRequest, 
  GET_SERVICE_CATEGORIES,
  type ServiceCategory 
} from "@/lib/graphql-client"

const COUNTRY_CODES = [
  { code: "+255", iso: "tz", name: "Tanzania" },
  { code: "+254", iso: "ke", name: "Kenya" },
  { code: "+256", iso: "ug", name: "Uganda" },
  { code: "+250", iso: "rw", name: "Rwanda" },
  { code: "+257", iso: "bi", name: "Burundi" },
  { code: "+251", iso: "et", name: "Ethiopia" },
  { code: "+27",  iso: "za", name: "South Africa" },
  { code: "+234", iso: "ng", name: "Nigeria" },
  { code: "+20",  iso: "eg", name: "Egypt" },
  { code: "+1",   iso: "us", name: "USA" },
  { code: "+44",  iso: "gb", name: "UK" },
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
  { iso: null, name: "Other" },
]

function detectCardType(number: string): "visa" | "mastercard" | "amex" | "discover" | null {
  const raw = number.replace(/\s/g, "")
  if (/^4/.test(raw)) return "visa"
  if (/^(5[1-5]|2[2-7])/.test(raw)) return "mastercard"
  if (/^3[47]/.test(raw)) return "amex"
  if (/^(6011|65|64[4-9]|622)/.test(raw)) return "discover"
  return null
}

function CardBrandIcon({ type }: { type: "visa" | "mastercard" | "amex" | "discover" | null }) {
  if (!type) return null
  const logos: Record<string, React.ReactNode> = {
    visa: (
      <svg viewBox="0 0 38 24" width="38" height="24" aria-label="Visa">
        <rect width="38" height="24" rx="3" fill="#1A1F71" />
        <text x="6" y="17" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="white" letterSpacing="0">VISA</text>
      </svg>
    ),
    mastercard: (
      <svg viewBox="0 0 38 24" width="38" height="24" aria-label="Mastercard">
        <rect width="38" height="24" rx="3" fill="#252525" />
        <circle cx="14" cy="12" r="7" fill="#EB001B" />
        <circle cx="24" cy="12" r="7" fill="#F79E1B" />
        <path d="M19 7.2a7 7 0 0 1 0 9.6A7 7 0 0 1 19 7.2z" fill="#FF5F00" />
      </svg>
    ),
    amex: (
      <svg viewBox="0 0 38 24" width="38" height="24" aria-label="Amex">
        <rect width="38" height="24" rx="3" fill="#2E77BC" />
        <text x="4" y="17" fontFamily="Arial" fontWeight="bold" fontSize="10" fill="white">AMEX</text>
      </svg>
    ),
    discover: (
      <svg viewBox="0 0 38 24" width="38" height="24" aria-label="Discover">
        <rect width="38" height="24" rx="3" fill="#FFFFFF" stroke="#E6E6E6" strokeWidth="1" />
        <text x="3" y="16" fontFamily="Arial" fontWeight="bold" fontSize="8" fill="#231F20">DISCOVER</text>
        <circle cx="29" cy="12" r="6" fill="#F76F20" />
      </svg>
    ),
  }
  return <>{logos[type]}</>
}

function CountryPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  const selected = COUNTRIES.find((c) => c.name === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full h-10 rounded-md border border-input bg-background px-3 text-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {selected?.iso ? (
          <img
            src={`https://flagcdn.com/20x15/${selected.iso}.png`}
            width={20}
            height={15}
            alt={selected.name}
            className="rounded-sm object-cover flex-shrink-0"
          />
        ) : (
          <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <span className={cn("flex-1 text-left", !selected && "text-muted-foreground")}>
          {selected?.name ?? "Select country"}
        </span>
        <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-popover border rounded-md shadow-lg w-full max-h-60 overflow-y-auto">
          {COUNTRIES.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => { onChange(c.name); setOpen(false) }}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left",
                value === c.name && "bg-accent font-medium"
              )}
            >
              {c.iso ? (
                <img
                  src={`https://flagcdn.com/20x15/${c.iso}.png`}
                  width={20}
                  height={15}
                  alt={c.name}
                  className="rounded-sm object-cover flex-shrink-0"
                />
              ) : (
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CountryCodePicker({
  value,
  onChange,
  compact = false,
}: {
  value: string
  onChange: (code: string) => void
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  const selected = COUNTRY_CODES.find((c) => c.code === value) ?? COUNTRY_CODES[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-md border border-input bg-background text-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
          compact ? "h-8 px-2" : "h-10 px-3"
        )}
      >
        <img
          src={`https://flagcdn.com/20x15/${selected.iso}.png`}
          width={20}
          height={15}
          alt={selected.name}
          className="rounded-sm object-cover"
        />
        <span className={compact ? "text-xs" : "text-sm"}>{selected.code}</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-popover border rounded-md shadow-lg min-w-[170px] max-h-60 overflow-y-auto">
          {COUNTRY_CODES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => { onChange(c.code); setOpen(false) }}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left",
                value === c.code && "bg-accent font-medium"
              )}
            >
              <img
                src={`https://flagcdn.com/20x15/${c.iso}.png`}
                width={20}
                height={15}
                alt={c.name}
                className="rounded-sm object-cover"
              />
              <span>{c.code}</span>
              <span className="text-muted-foreground text-xs">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Account + Organization, 2: Review
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Account data
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  // Profile data
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countryCode, setCountryCode] = useState("+255")
  const [country, setCountry] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [preferredContact, setPreferredContact] = useState<string[]>(["Email"])

  // Organization data
  const [orgName, setOrgName] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [industry, setIndustry] = useState("")
  const [orgSize, setOrgSize] = useState("")

  // Selected plan/customization data
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [customizationData, setCustomizationData] = useState<any>(null)

  // Editing states for review page
  const [editingAccount, setEditingAccount] = useState(false)
  const [editingOrg, setEditingOrg] = useState(false)
  const [editingPackage, setEditingPackage] = useState(false)

  // FRT-style editing interface states
  const [services, setServices] = useState<any[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, boolean>>({})
  const [selectedSubFeatures, setSelectedSubFeatures] = useState<Record<string, boolean>>({})
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({})
  const [expandedService, setExpandedService] = useState<string | null>(null)
  const [expandedAddonService, setExpandedAddonService] = useState<string | null>(null)
  const [featurePrices, setFeaturePrices] = useState<Record<string, number>>({})
  const [subFeaturePrices, setSubFeaturePrices] = useState<Record<string, number>>({})
  const [userCount, setUserCount] = useState(3)
  const [assetCount, setAssetCount] = useState(3)
  const [orgCount, setOrgCount] = useState(1)
  const [storageGB, setStorageGB] = useState(10)
  const [assetPrice, setAssetPrice] = useState(2)
  const [orgUnitPrice, setOrgUnitPrice] = useState(50)
  const [storagePrice, setStoragePrice] = useState(2)
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, boolean>>({})

  // Billing information (step 3)
  const [billingName, setBillingName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [billingAddress, setBillingAddress] = useState("")
  const [billingCity, setBillingCity] = useState("")
  const [billingCountry, setBillingCountry] = useState("")

  // Handle inline save with validation
  const handleSaveAccount = () => {
    if (!email || !firstName || !lastName || !phoneNumber || !country || !jobTitle) {
      setError("Please fill in all required account fields")
      return
    }
    setEditingAccount(false)
    setError("")
  }

  const handleSaveOrg = () => {
    if (!orgName || !orgSlug || !industry || !orgSize) {
      setError("Please fill in all organization fields")
      return
    }
    setEditingOrg(false)
    setError("")
  }

  const handleSavePackage = () => {
    // Save package changes to localStorage with FRT-style data
    const updatedCustomization = {
      selectedServices,
      selectedFeatures,
      selectedSubFeatures,
      selectedAddOns,
      featurePrices,
      subFeaturePrices,
      userCount,
      assetCount,
      orgCount,
      storageGB,
      assetPrice,
      orgUnitPrice,
      storagePrice,
      totalPrice: calculateTotal(),
    }
    
    if (selectedPlan) {
      localStorage.setItem('selected_plan', JSON.stringify(selectedPlan))
    }
    localStorage.setItem('customization_data', JSON.stringify(updatedCustomization))
    setCustomizationData(updatedCustomization)
    setEditingPackage(false)
    setError("")
  }

  // Fetch services when entering edit mode
  const fetchServices = async () => {
    try {
      setIsLoadingServices(true)
      const data = await graphqlRequest<{ serviceCategories: ServiceCategory[] }>(
        GET_SERVICE_CATEGORIES
      )

      const transformedServices = data.serviceCategories
        .filter((s: any) => s.isActive)
        .map((service: any) => ({
          id: service.slug,
          slug: service.slug,
          name: service.name,
          color: service.color || '#3B82F6',
          isActive: service.isActive,
          addons: (service.addons || [])
            .filter((a: any) => a.isActive)
            .map((addon: any) => ({
              id: addon.slug,
              slug: addon.slug,
              name: addon.name,
              description: addon.description || '',
              price: Number(addon.price) || 0,
              pricingPeriod: addon.pricingPeriod || 'monthly',
            })),
          features: (service.features || [])
            .filter((f: any) => f.isActive)
            .map((feature: any) => ({
              id: feature.slug,
              slug: feature.slug,
              name: feature.name,
              description: feature.description || '',
              price: Number(feature.price) || 0,
              pricingUnit: feature.pricingUnit || 'per_user',
              isActive: feature.isActive,
              isFree: feature.pricingUnit === 'free' || Number(feature.price) === 0,
              subFeatures: (feature.subFeatures || [])
                .filter((sf: any) => sf.isActive)
                .map((subFeature: any) => ({
                  id: subFeature.slug,
                  slug: subFeature.slug,
                  name: subFeature.name,
                  description: subFeature.description || '',
                  price: Number(subFeature.price) || 0,
                  isActive: subFeature.isActive,
                })),
            })),
        }))

      setServices(transformedServices)
      if (transformedServices.length > 0) {
        setExpandedService(transformedServices[0].id)
        // Default addon tab to first service that has addons
        const firstWithAddons = transformedServices.find((s: any) => (s.addons || []).length > 0)
        if (firstWithAddons) setExpandedAddonService(firstWithAddons.id)
      }

      // If we have old format data (activeModules) but haven't mapped to selectedServices yet
      const customData = localStorage.getItem('customization_data')
      if (customData) {
        const savedData = JSON.parse(customData)
        
        // Only convert activeModules if we haven't already set selectedServices
        if (savedData.activeModules && selectedServices.length === 0) {
          const activeModuleNames = Object.keys(savedData.activeModules).filter(key => savedData.activeModules[key])
          
          // Map service names to slugs
          const activeServiceIds = activeModuleNames
            .map(moduleName => {
              const service = transformedServices.find((s: any) => s.name === moduleName)
              return service ? service.id : null
            })
            .filter(Boolean) as string[]
          
          setSelectedServices(activeServiceIds)
          
          if (activeServiceIds.length > 0) {
            setExpandedService(activeServiceIds[0])
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch services:', err)
    } finally {
      setIsLoadingServices(false)
    }
  }

  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      const isSelected = prev.includes(serviceId)
      if (!isSelected) {
        setExpandedService(serviceId)
        return [...prev, serviceId]
      } else {
        const service = services.find((s: any) => s.id === serviceId)
        if (service) {
          service.features.forEach((f: any) => {
            setSelectedFeatures(p => ({ ...p, [f.id]: false }))
          })
        // Also deselect addons for this service
        service.addons?.forEach((a: any) => {
            setSelectedAddOns(p => ({ ...p, [a.id]: false }))
          })
        }
        return prev.filter(id => id !== serviceId)
      }
    })
  }

  // Toggle feature selection
  const toggleFeature = (featureId: string) => {
    const currentlySelected = selectedFeatures[featureId]
    
    setSelectedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }))
    
    const allFeatures = services.flatMap((s: any) => s.features)
    const feature = allFeatures.find((f: any) => f.id === featureId)
    
    // If selecting (not currently selected) and has sub-features, expand it
    if (feature && feature.subFeatures.length > 0 && !currentlySelected) {
      setExpandedFeatures(prev => ({ ...prev, [featureId]: true }))
    }
    // If deselecting, collapse it
    if (currentlySelected) {
      setExpandedFeatures(prev => ({ ...prev, [featureId]: false }))
    }
  }

  // Calculate feature price
  const calculateFeaturePrice = (feature: any): number => {
    if (feature.subFeatures && feature.subFeatures.length > 0) {
      let total = 0
      feature.subFeatures.forEach((sf: any) => {
        if (selectedSubFeatures[sf.id]) {
          total += subFeaturePrices[sf.id] !== undefined ? subFeaturePrices[sf.id] : sf.price
        }
      })
      return total
    }
    return featurePrices[feature.id] !== undefined ? featurePrices[feature.id] : feature.price
  }

  // Toggle addon selection
  const toggleAddon = (addonId: string) => {
    setSelectedAddOns(prev => {
      const next = { ...prev, [addonId]: !prev[addonId] }
      // Persist immediately so both display-mode and edit-mode stay in sync
      const customData = localStorage.getItem('customization_data')
      if (customData) {
        const saved = JSON.parse(customData)
        saved.selectedAddOns = next
        localStorage.setItem('customization_data', JSON.stringify(saved))
      }
      return next
    })
  }

  // Calculate total price
  const calculateTotal = () => {
    let monthly = 0
    
    services.forEach((service: any) => {
      if (selectedServices.includes(service.id)) {
        service.features.forEach((feature: any) => {
          if (selectedFeatures[feature.id] && !feature.isFree) {
            const featurePrice = calculateFeaturePrice(feature)
            monthly += featurePrice * userCount
          }
        })
      }
    })
    
    monthly += assetCount * assetPrice
    monthly += orgCount * orgUnitPrice
    monthly += storageGB * storagePrice
    
    // Add addons
    services.forEach((service: any) => {
      if (selectedServices.includes(service.id) && service.addons) {
        service.addons.forEach((addon: any) => {
          if (selectedAddOns[addon.id]) {
            monthly += addon.price
          }
        })
      }
    })
    
    return monthly
  }

  // Fetch services on mount
  useEffect(() => {
    if (services.length === 0) {
      fetchServices()
    }
  }, [])

  // Load selected plan and customization on mount
  useEffect(() => {
    const planData = localStorage.getItem('selected_plan')
    const customData = localStorage.getItem('customization_data')

    if (planData) {
      const parsedPlan = JSON.parse(planData)
      setSelectedPlan(parsedPlan)

      // Pre-built plan (has planId) — forcefully discard any stale customization data
      if (parsedPlan.planId) {
        localStorage.removeItem('customization_data')
        return // do NOT load customizationData — pre-built plan shows its own features
      }
    }

    if (customData) {
      const savedData = JSON.parse(customData)
      setCustomizationData(savedData)
      
      // Immediately populate state from localStorage for display mode
      // Handle both new format (from register edit) and old format (from customize page)
      if (savedData.selectedServices) {
        // New format
        setSelectedServices(savedData.selectedServices || [])
        setSelectedFeatures(savedData.selectedFeatures || {})
        setSelectedSubFeatures(savedData.selectedSubFeatures || {})
        setSelectedAddOns(savedData.selectedAddOns || {})
        setFeaturePrices(savedData.featurePrices || {})
        setSubFeaturePrices(savedData.subFeaturePrices || {})
        setUserCount(savedData.userCount || 3)
        setAssetCount(savedData.assetCount || 3)
        setOrgCount(savedData.orgCount || 1)
        setStorageGB(savedData.storageGB || 10)
        setAssetPrice(savedData.assetPrice || 2)
        setOrgUnitPrice(savedData.orgUnitPrice || 50)
        setStoragePrice(savedData.storagePrice || 2)
      } else if (savedData.activeModules || savedData.selectedItems) {
        // Old format from customize page - set basic data now
        setSelectedFeatures(savedData.selectedItems || {})
        setSelectedSubFeatures(savedData.selectedSubFeatures || {})
        setSelectedAddOns(savedData.selectedAddOns || {})
        
        if (savedData.counts) {
          setUserCount(savedData.counts.users || 3)
          setAssetCount(savedData.counts.asset || 3)
          setOrgCount(savedData.counts.organizations || 1)
          setStorageGB(savedData.counts.storage || 10)
        }
        
        setAssetPrice(2)
        setOrgUnitPrice(50)
        setStoragePrice(2)
        
        // Note: We'll map activeModules to selectedServices after services are fetched
      }
    }
  }, [])

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields including organization
    if (!email || !password || !firstName || !lastName || !phoneNumber || !country || !jobTitle || !orgName || !orgSlug || !industry || !orgSize) {
      setError("Please fill in all required fields")
      return
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    
    if (preferredContact.length === 0) {
      setError("Please select at least one preferred contact method")
      return
    }
    
    setError("")
    setStep(2) // Move to review step
  }

  const handleOrganizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Close any open edit sections first and re-validate everything
    if (editingAccount) {
      handleSaveAccount()
      return
    }
    if (editingOrg) {
      handleSaveOrg()
      return
    }
    if (editingPackage) {
      handleSavePackage()
      return
    }

    if (!email || !password || !firstName || !lastName || !phoneNumber || !country || !jobTitle || !orgName || !orgSlug || !industry || !orgSize) {
      setError("Please fill in all required fields")
      return
    }
    if (preferredContact.length === 0) {
      setError("Please select at least one preferred contact method")
      return
    }

    setError("")
    setStep(3)
  }

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!billingName || !cardNumber || !cardExpiry || !cardCvv || !billingAddress || !billingCity || !billingCountry) {
      setError("Please fill in all billing fields")
      return
    }

    const rawCard = cardNumber.replace(/\s/g, "")
    if (rawCard.length < 15 || rawCard.length > 16) {
      setError("Please enter a valid card number")
      return
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setError("Please enter expiry in MM/YY format")
      return
    }
    if (cardCvv.length < 3) {
      setError("Please enter a valid CVV")
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
        const errorMsg = accountResponse.message || accountResponse.errors?.[0] || (accountResponse as any).error || "Failed to create account"
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
        phone_number: `${countryCode}${phoneNumber}`,
        country,
        job_title: jobTitle,
        date_of_birth: dateOfBirth || undefined,
        preferred_contact: preferredContact.join(","),
      })

      if (!profileResponse.success) {
        const errorMsg = profileResponse.message || profileResponse.errors?.[0] || (profileResponse as any).error || "Failed to create profile"
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
        slug: orgSlug,
        industry,
        size: orgSize,
        personal_account_owner_id: newAccountId,
        primary_email: email,
        primary_phone: `${countryCode}${phoneNumber}`,
      })

      if (!orgResponse.success || !orgResponse.data?.id) {
        const errorMsg = orgResponse.message || orgResponse.errors?.[0] || (orgResponse as any).error || "Failed to create organization"
        console.error('❌ Organization creation failed:', errorMsg)
        setError(errorMsg)
        return
      }
      console.log('✅ Organization created, ID:', orgResponse.data.id)

      // All steps completed — store registration + billing data and proceed to payment
      console.log('🎉 Registration complete! Moving to payment...')
      localStorage.setItem('registration_data', JSON.stringify({
        accountId: newAccountId,
        email,
        firstName,
        lastName,
        countryCode,
        phoneNumber,
        country,
        jobTitle,
        dateOfBirth,
        preferredContact,
        orgId: orgResponse.data.id,
        orgName,
        orgSlug,
        industry,
        orgSize,
      }))

      // Store billing info (card number masked for security)
      localStorage.setItem('billing_data', JSON.stringify({
        billingName,
        cardLast4: rawCard.slice(-4),
        cardExpiry,
        billingAddress,
        billingCity,
        billingCountry,
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
      <div className="w-full max-w-5xl">
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
        <div className="flex justify-center items-center gap-2 mb-8">
          {[
            { num: 1, label: "Account Info" },
            { num: 2, label: "Review Plan" },
            { num: 3, label: "Billing" },
          ].map(({ num, label }) => (
            <div key={num} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-semibold ${
                  step > num
                    ? 'bg-primary border-primary text-primary-foreground'
                    : step === num
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}>
                  {step > num ? <Check className="w-4 h-4" /> : num}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap ${step >= num ? 'text-primary' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
              {num < 3 && <div className={`w-12 h-0.5 mb-4 ${step > num ? 'bg-primary' : 'bg-muted-foreground/20'}`} />}
            </div>
          ))}
        </div>

        <Card className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Account + Organization */}
          {step === 1 && (
            <form onSubmit={handleAccountSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Personal Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Personal & Contact Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        placeholder="Moh'd"
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
                        placeholder="Juma"
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
                      placeholder="alhajjmuhammed@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <CountryCodePicker value={countryCode} onChange={setCountryCode} />
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="772 333 036"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10"
                        required
                      >
                        <option value="">Select country</option>
                        <option value="Tanzania">Tanzania</option>
                        <option value="Kenya">Kenya</option>
                        <option value="Uganda">Uganda</option>
                        <option value="Rwanda">Rwanda</option>
                        <option value="Burundi">Burundi</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <select
                        id="jobTitle"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10"
                        required
                      >
                        <option value="">Select job title</option>
                        <option value="CEO">CEO</option>
                        <option value="CTO">CTO</option>
                        <option value="CFO">CFO</option>
                        <option value="Manager">Manager</option>
                        <option value="Director">Director</option>
                        <option value="Team Lead">Team Lead</option>
                        <option value="Developer">Developer</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Contact Method</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferredContact.includes("WhatsApp")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferredContact([...preferredContact, "WhatsApp"])
                          } else {
                            setPreferredContact(preferredContact.filter(m => m !== "WhatsApp"))
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">WhatsApp</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferredContact.includes("Email")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreferredContact([...preferredContact, "Email"])
                          } else {
                            setPreferredContact(preferredContact.filter(m => m !== "Email"))
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm">Email</span>
                    </label>
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

                {/* Right Column - Organization Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Organization Information</h3>
                  <p className="text-sm text-muted-foreground">Company profile details</p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="orgName"
                        placeholder="State University of Zanzibar"
                        value={orgName}
                        onChange={(e) => {
                          setOrgName(e.target.value)
                          // Auto-generate slug from name if not manually edited
                          if (!orgSlug) {
                            setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, ''))
                          }
                        }}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orgSlug">Organization Username</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="orgSlug"
                        placeholder="stateuniversityofzanzibar"
                        value={orgSlug}
                        onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        className="pl-10 font-mono"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Only lowercase letters and numbers (no spaces)</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="size">Company Size</Label>
                      <select
                        id="size"
                        value={orgSize}
                        onChange={(e) => setOrgSize(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        required
                      >
                        <option value="">Select size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501+">501+ employees</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <select
                        id="industry"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        required
                      >
                        <option value="">Select industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Education">Education</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Retail">Retail</option>
                        <option value="Government">Government</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue to Review
              </Button>
            </form>
          )}

          {/* Step 2: Review & Create Account */}
          {step === 2 && (
            <form onSubmit={handleOrganizationSubmit} className="space-y-6">
              <h3 className="text-2xl font-bold mb-6 text-center">Review Your Order</h3>
              
              {/* TOP ROW: Account + Org side by side */}
              <div className="grid md:grid-cols-2 gap-4">

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
                  
                  {editingAccount ? (
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
                        <Label htmlFor="review-phone" className="text-xs">Phone Number</Label>
                        <div className="flex gap-2">
                          <CountryCodePicker value={countryCode} onChange={setCountryCode} compact />
                          <Input
                            id="review-phone"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            className="h-8 text-sm flex-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="review-country" className="text-xs">Country</Label>
                          <select
                            id="review-country"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="">Select country</option>
                            <option value="Tanzania">Tanzania</option>
                            <option value="Kenya">Kenya</option>
                            <option value="Uganda">Uganda</option>
                            <option value="Rwanda">Rwanda</option>
                            <option value="Burundi">Burundi</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="review-jobTitle" className="text-xs">Job Title</Label>
                          <select
                            id="review-jobTitle"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="">Select job title</option>
                            <option value="CEO">CEO</option>
                            <option value="CTO">CTO</option>
                            <option value="CFO">CFO</option>
                            <option value="Manager">Manager</option>
                            <option value="Director">Director</option>
                            <option value="Team Lead">Team Lead</option>
                            <option value="Developer">Developer</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="review-dateOfBirth" className="text-xs">Date of Birth</Label>
                        <Input
                          id="review-dateOfBirth"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Preferred Contact</Label>
                        <div className="flex gap-3 mt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferredContact.includes("WhatsApp")}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPreferredContact([...preferredContact, "WhatsApp"])
                                } else {
                                  setPreferredContact(preferredContact.filter(m => m !== "WhatsApp"))
                                }
                              }}
                              className="w-3.5 h-3.5 rounded border-gray-300"
                            />
                            <span className="text-xs">WhatsApp</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferredContact.includes("Email")}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPreferredContact([...preferredContact, "Email"])
                                } else {
                                  setPreferredContact(preferredContact.filter(m => m !== "Email"))
                                }
                              }}
                              className="w-3.5 h-3.5 rounded border-gray-300"
                            />
                            <span className="text-xs">Email</span>
                          </label>
                        </div>
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
                      <div>
                        <p className="text-muted-foreground text-xs">Phone</p>
                        <p className="font-medium flex items-center gap-1.5">
                          {(() => {
                            const c = COUNTRY_CODES.find(x => x.code === countryCode)
                            return c ? <img src={`https://flagcdn.com/20x15/${c.iso}.png`} width={16} height={12} alt={c.name} className="rounded-sm" /> : null
                          })()}
                          {countryCode} {phoneNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Country</p>
                        <p className="font-medium">{country}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Job Title</p>
                        <p className="font-medium">{jobTitle}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Date of Birth</p>
                        <p className="font-medium">{dateOfBirth || "Not provided"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">Preferred Contact</p>
                        <p className="font-medium">{preferredContact.join(", ")}</p>
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
                        <Label htmlFor="review-orgSlug" className="text-xs">Organization Username</Label>
                        <Input
                          id="review-orgSlug"
                          value={orgSlug}
                          onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                          className="h-8 text-sm font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="review-industry" className="text-xs">Industry</Label>
                          <select
                            id="review-industry"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="">Select industry</option>
                            <option value="Technology">Technology</option>
                            <option value="Education">Education</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Finance">Finance</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Retail">Retail</option>
                            <option value="Government">Government</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="review-orgSize" className="text-xs">Company Size</Label>
                          <select
                            id="review-orgSize"
                            value={orgSize}
                            onChange={(e) => setOrgSize(e.target.value)}
                            className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="">Select size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="501+">501+ employees</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Organization</p>
                        <p className="font-medium">{orgName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Username</p>
                        <p className="font-medium">{orgSlug}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Industry</p>
                        <p className="font-medium">{industry}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Company Size</p>
                        <p className="font-medium">{orgSize}</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>{/* end top row */}

              {/* BOTTOM: Selected Package full width */}
              <div>
                {/* Selected Plan/Package */}
                <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold">Selected Package</h4>
                    </div>
                    {customizationData && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => editingPackage ? handleSavePackage() : setEditingPackage(true)}
                        className="h-7 text-xs"
                      >
                        {editingPackage ? 'Save' : 'Edit'}
                      </Button>
                    )}
                  </div>
                  
                  {!editingPackage ? (
                    // Display Mode — 2-col inner: left=plan/features/resources, right=addons
                    <div className="grid md:grid-cols-2 gap-4 items-start">
                      {/* Left: Plan name + features + resources */}
                      <div>
                      {selectedPlan ? (
                        <div className="space-y-3">
                          <div>
                            <p className="font-bold text-lg">{selectedPlan.name || 'Custom Plan'}</p>
                            {selectedPlan.description && (
                              <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                            )}
                            {selectedPlan.price && (
                              <p className="text-sm font-semibold text-primary mt-1">
                                ${selectedPlan.price}/seat/mo{selectedPlan.billing === 'annual' ? ' · billed annually' : ''}
                              </p>
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
                        <p className="font-bold text-lg">Custom Plan</p>
                      )}

                      {/* Show Resources and Selected Items (only for custom plans) */}
                      {customizationData && (isLoadingServices ? (
                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                          <span className="text-sm text-muted-foreground">Loading configuration...</span>
                        </div>
                      ) : (() => {
                        // Determine resource counts from either format
                        const users = userCount || customizationData?.userCount || customizationData?.counts?.users || 3
                        const assets = assetCount || customizationData?.assetCount || customizationData?.counts?.asset || 3
                        const storage = storageGB || customizationData?.storageGB || customizationData?.counts?.storage || 10
                        const assetPriceVal = assetPrice || customizationData?.assetPrice || 2
                        const orgPriceVal = orgUnitPrice || customizationData?.orgUnitPrice || 50
                        const storagePriceVal = storagePrice || customizationData?.storagePrice || 2
                        
                        // Get selected services and features
                        const selectedServicesList = services
                          .filter((s: any) => selectedServices.includes(s.id))
                          .map((s: any) => ({
                            name: s.name,
                            color: s.color,
                            features: s.features.filter((f: any) => selectedFeatures[f.id])
                          }))
                          .filter((s: any) => s.features.length > 0)
                        
                        return (
                          <>
                            {/* Selected Services & Features */}
                            {selectedServicesList.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border text-sm">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">SELECTED FEATURES</p>
                                <div className="space-y-3">
                                  {selectedServicesList.map((service: any) => (
                                    <div key={service.name}>
                                      <div className="flex items-center gap-2 mb-1">
                                        <div 
                                          className="w-3 h-3 rounded" 
                                          style={{ backgroundColor: service.color }}
                                        />
                                        <p className="font-semibold text-xs">{service.name}</p>
                                      </div>
                                      <ul className="ml-5 space-y-0.5">
                                        {service.features.map((feature: any) => (
                                          <li key={feature.id} className="flex items-start gap-1.5 text-xs">
                                            <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                            <span>{feature.name}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Resources — with +/- controls for custom plan */}
                            <div className="mt-4 pt-4 border-t border-border">
                              <p className="text-xs font-semibold text-muted-foreground mb-2">RESOURCES</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {/* Users */}
                                <div className="bg-background rounded-lg p-2.5 border">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center flex-shrink-0">
                                      <User className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-semibold leading-tight">Users</p>
                                      <p className="text-[10px] text-muted-foreground leading-tight">${assetPriceVal}/ea</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-1">
                                    <button type="button" onClick={() => setUserCount(c => Math.max(1, c - 1))} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Minus className="w-2.5 h-2.5" /></button>
                                    <span className="text-sm font-bold text-blue-600">{userCount}</span>
                                    <button type="button" onClick={() => setUserCount(c => c + 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Plus className="w-2.5 h-2.5" /></button>
                                  </div>
                                </div>
                                {/* Assets */}
                                <div className="bg-background rounded-lg p-2.5 border">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <div className="w-6 h-6 rounded-md bg-purple-500 flex items-center justify-center flex-shrink-0">
                                      <Package className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-semibold leading-tight">Assets</p>
                                      <p className="text-[10px] text-muted-foreground leading-tight">${assetPriceVal}/ea</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-1">
                                    <button type="button" onClick={() => setAssetCount(c => Math.max(0, c - 1))} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Minus className="w-2.5 h-2.5" /></button>
                                    <span className="text-sm font-bold text-purple-600">{assets}</span>
                                    <button type="button" onClick={() => setAssetCount(c => c + 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Plus className="w-2.5 h-2.5" /></button>
                                  </div>
                                </div>
                                {/* Organizations */}
                                <div className="bg-background rounded-lg p-2.5 border">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center flex-shrink-0">
                                      <Building2 className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-semibold leading-tight">Orgs</p>
                                      <p className="text-[10px] text-muted-foreground leading-tight">${orgPriceVal}/ea</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-1">
                                    <button type="button" onClick={() => setOrgCount(c => Math.max(1, c - 1))} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Minus className="w-2.5 h-2.5" /></button>
                                    <span className="text-sm font-bold text-orange-600">{orgCount}</span>
                                    <button type="button" onClick={() => setOrgCount(c => c + 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Plus className="w-2.5 h-2.5" /></button>
                                  </div>
                                </div>
                                {/* Storage */}
                                <div className="bg-background rounded-lg p-2.5 border">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <div className="w-6 h-6 rounded-md bg-green-500 flex items-center justify-center flex-shrink-0">
                                      <HardDrive className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-semibold leading-tight">Storage</p>
                                      <p className="text-[10px] text-muted-foreground leading-tight">${storagePriceVal}/GB</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-1">
                                    <button type="button" onClick={() => setStorageGB(c => Math.max(1, c - 1))} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Minus className="w-2.5 h-2.5" /></button>
                                    <span className="text-sm font-bold text-green-600">{storage}</span>
                                    <button type="button" onClick={() => setStorageGB(c => c + 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"><Plus className="w-2.5 h-2.5" /></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )
                      })())}
                      </div>{/* end left */}

                      {/* Right: Add-ons */}
                      <div>
                          {/* Add-ons (read-only display) */}
                          {customizationData && !isLoadingServices && services.length > 0 && (() => {
                            const servicesWithAddons = services.filter((s: any) => selectedServices.includes(s.id) && (s.addons || []).length > 0)
                            if (servicesWithAddons.length === 0) return null

                            // If the active addon tab's service was deselected, fall back to first available
                            const activeAddonServiceId = servicesWithAddons.find((s: any) => s.id === expandedAddonService)
                              ? expandedAddonService
                              : servicesWithAddons[0]?.id
                            const activeAddonService = servicesWithAddons.find((s: any) => s.id === activeAddonServiceId) ?? servicesWithAddons[0]

                            return (
                              <div className="mt-3 pt-3 border-t border-border">
                                {/* Header */}
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                    <span className="text-white text-[10px] font-bold">+</span>
                                  </div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Available Add-ons</p>
                                </div>
                                {/* Service tabs */}
                                <div className="border rounded-lg overflow-hidden">
                                  <div className="flex items-center border-b bg-muted/50 overflow-x-auto">
                                    {servicesWithAddons.map((s: any) => {
                                      const isActive = s.id === activeAddonServiceId
                                      const selectedCount = (s.addons || []).filter((a: any) => selectedAddOns[a.id]).length
                                      return (
                                        <button
                                          key={s.id}
                                          type="button"
                                          onClick={() => setExpandedAddonService(s.id)}
                                          className={cn(
                                            "flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap transition-all border-b-2 -mb-px",
                                            isActive
                                              ? "border-amber-500 bg-background font-semibold text-amber-700"
                                              : "border-transparent hover:bg-muted font-medium text-muted-foreground"
                                          )}
                                        >
                                          <div className="w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
                                          <span>{s.name}</span>
                                          {selectedCount > 0 && (
                                            <span className="bg-amber-500 text-white text-[9px] font-bold rounded-full px-1 min-w-[14px] text-center">
                                              {selectedCount}
                                            </span>
                                          )}
                                        </button>
                                      )
                                    })}
                                  </div>
                                  {/* Addons list for active tab */}
                                  <div className="p-2 space-y-1.5">
                                    {(activeAddonService?.addons || []).map((addon: any) => {
                                      const isSelected = selectedAddOns[addon.id]
                                      return (
                                        <div
                                          key={addon.id}
                                          onClick={() => toggleAddon(addon.id)}
                                          className={cn(
                                            "flex items-center justify-between p-2 rounded-md transition-all border text-xs cursor-pointer",
                                            isSelected ? "bg-amber-50 border-amber-300" : "bg-background border-border hover:border-amber-200"
                                          )}
                                        >
                                          <div className="flex items-center gap-2 flex-1">
                                            <div className={cn(
                                              "w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0",
                                              isSelected ? "bg-amber-500 border-amber-500" : "border-muted-foreground/30"
                                            )}>
                                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium leading-tight">{addon.name}</p>
                                              <p className="text-[10px] text-muted-foreground leading-tight">{addon.description}</p>
                                            </div>
                                          </div>
                                          <div className="text-xs font-semibold text-amber-600 ml-2">
                                            ${addon.price}/mo
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                      </div>
                    </div>
                  ) : (
                    // FRT-Style Edit Mode
                    <div className="space-y-4">
                      {isLoadingServices ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading services...</span>
                        </div>
                      ) : (
                        <>
                          {/* Service Selection - Inline Checkboxes */}
                          <div className="flex items-center gap-3 flex-wrap py-2 px-3 bg-muted/50 rounded-lg border">
                            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Services:</span>
                            {services.map((service: any) => {
                              const isSelected = selectedServices.includes(service.id)
                              return (
                                <label
                                  key={service.id}
                                  className={cn(
                                    "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-all border text-xs",
                                    isSelected ? "bg-background border-primary/30" : "border-transparent hover:bg-background/50"
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleService(service.id)}
                                    className="w-3 h-3 rounded border-gray-300 text-primary focus:ring-primary"
                                  />
                                  <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: service.color }}
                                  >
                                  </div>
                                  <span className="font-medium">{service.name}</span>
                                </label>
                              )
                            })}
                          </div>

                          {/* Resource Configuration */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {/* Users */}
                            <div className="bg-background rounded-lg p-3 border">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold">Users</p>
                                  <p className="text-[10px] text-muted-foreground">Team seats</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-center gap-2 bg-muted/50 rounded-md py-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => setUserCount(Math.max(1, userCount - 1))}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-lg font-bold text-blue-600 w-10 text-center">{userCount}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => setUserCount(userCount + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Assets */}
                            <div className="bg-background rounded-lg p-3 border">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                                  <Package className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold">Assets</p>
                                  <p className="text-[10px] text-muted-foreground">Count</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-center gap-2 bg-muted/50 rounded-md py-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => setAssetCount(Math.max(0, assetCount - 1))}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-lg font-bold text-purple-600 w-10 text-center">{assetCount}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => setAssetCount(assetCount + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Organizations */}
                            <div className="bg-background rounded-lg p-3 border">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                                  <Building2 className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold">Orgs</p>
                                  <p className="text-[10px] text-muted-foreground">${orgUnitPrice}/ea</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-center gap-2 bg-muted/50 rounded-md py-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => setOrgCount(Math.max(1, orgCount - 1))}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-lg font-bold text-orange-600 w-10 text-center">{orgCount}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => setOrgCount(orgCount + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Storage */}
                            <div className="bg-background rounded-lg p-3 border">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                                  <HardDrive className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold">Storage</p>
                                  <p className="text-[10px] text-muted-foreground">GB</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-center gap-2 bg-muted/50 rounded-md py-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => setStorageGB(Math.max(0, storageGB - 5))}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-lg font-bold text-green-600 w-10 text-center">{storageGB}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => setStorageGB(storageGB + 5)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          {selectedServices.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                              {/* Service Tabs */}
                              <div className="flex items-center border-b bg-muted/50">
                                {selectedServices.map((serviceId: string) => {
                                  const service = services.find((s: any) => s.id === serviceId)
                                  if (!service) return null
                                  const isActive = expandedService === serviceId
                                  
                                  return (
                                    <button
                                      key={serviceId}
                                      type="button"
                                      onClick={() => setExpandedService(serviceId)}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 text-xs transition-all border-b-2 -mb-px",
                                        isActive
                                          ? "border-primary bg-background font-semibold"
                                          : "border-transparent hover:bg-muted font-medium text-muted-foreground"
                                      )}
                                    >
                                      <div
                                        className="w-4 h-4 rounded flex items-center justify-center"
                                        style={{ backgroundColor: service.color }}
                                      >
                                        <Check className="w-2.5 h-2.5 text-white" />
                                      </div>
                                      <span>{service.name}</span>
                                    </button>
                                  )
                                })}
                              </div>
                              
                              {/* Features Content */}
                              {(() => {
                                const service = services.find((s: any) => s.id === expandedService)
                                if (!service) return null

                                const freeFeatures = service.features.filter((f: any) => f.isFree)
                                const paidFeatures = service.features.filter((f: any) => !f.isFree)

                                return (
                                  <div className="p-3 max-h-96 overflow-y-auto">
                                    {/* Free Features */}
                                    {freeFeatures.length > 0 && (
                                      <div className="mb-3">
                                        <div className="flex flex-wrap gap-1.5">
                                          {freeFeatures.map((feature: any) => (
                                            <div key={feature.id} className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 border border-green-200 text-xs">
                                              <Check className="h-3 w-3 text-green-600" />
                                              <span className="text-green-800 font-medium">{feature.name}</span>
                                              <span className="text-green-600">(Free)</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Paid Features */}
                                    <div className="space-y-2">
                                      {paidFeatures.map((feature: any) => {
                                        const isSelected = selectedFeatures[feature.id]
                                        const hasSubFeatures = feature.subFeatures.length > 0
                                        const isExpanded = expandedFeatures[feature.id]
                                        const selectedSubCount = hasSubFeatures ? feature.subFeatures.filter((sf: any) => selectedSubFeatures[sf.id]).length : 0

                                        return (
                                          <div key={feature.id} className="border rounded-md overflow-hidden">
                                            {/* Feature Header */}
                                            <div
                                              className={cn(
                                                "flex items-center justify-between p-2 cursor-pointer transition-all text-xs",
                                                isSelected ? "bg-primary/5 border-b" : "hover:bg-muted/50"
                                              )}
                                              onClick={() => toggleFeature(feature.id)}
                                            >
                                              <div className="flex items-center gap-2 flex-1">
                                                <div className={cn(
                                                  "w-4 h-4 rounded border-2 flex items-center justify-center",
                                                  isSelected ? "bg-primary border-primary" : "border-muted-foreground/25"
                                                )}>
                                                  {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                                </div>
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-1.5">
                                                    <p className="font-medium">{feature.name}</p>
                                                    {hasSubFeatures && (
                                                      <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
                                                        {selectedSubCount}/{feature.subFeatures.length}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <p className="text-[10px] text-muted-foreground">{feature.description}</p>
                                                </div>
                                                {hasSubFeatures && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      if (isSelected) {
                                                        setExpandedFeatures(prev => ({ ...prev, [feature.id]: !prev[feature.id] }))
                                                      }
                                                    }}
                                                    className="p-1 hover:bg-muted rounded transition-colors"
                                                  >
                                                    <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                                                  </button>
                                                )}
                                              </div>
                                              
                                              <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                                                {hasSubFeatures ? (
                                                  <div className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200">
                                                    <span className="text-xs font-bold text-purple-600">${calculateFeaturePrice(feature).toFixed(2)}</span>
                                                    <span className="text-[10px] text-purple-500">/u</span>
                                                  </div>
                                                ) : (
                                                  <>
                                                    <span className="text-[10px]">$</span>
                                                    <Input
                                                      type="number"
                                                      value={featurePrices[feature.id] ?? feature.price}
                                                      onChange={(e) => setFeaturePrices({ ...featurePrices, [feature.id]: Math.max(0, parseFloat(e.target.value) || 0) })}
                                                      className="w-14 h-6 text-xs text-center border-dashed"
                                                    />
                                                    <span className="text-[10px] text-muted-foreground">/u</span>
                                                  </>
                                                )}
                                              </div>
                                            </div>

                                            {/* Sub-Features */}
                                            {hasSubFeatures && isExpanded && isSelected && (
                                              <div className="bg-muted/30 px-2 py-1.5 space-y-1">
                                                {feature.subFeatures.map((subFeature: any) => {
                                                  const isSubSelected = selectedSubFeatures[subFeature.id]
                                                  return (
                                                    <div
                                                      key={subFeature.id}
                                                      className={cn(
                                                        "flex items-center justify-between p-1.5 rounded cursor-pointer transition-all border text-[11px]",
                                                        isSubSelected ? "bg-purple-50 border-purple-200" : "bg-background border-border hover:border-purple-200"
                                                      )}
                                                      onClick={() => setSelectedSubFeatures(prev => ({ ...prev, [subFeature.id]: !prev[subFeature.id] }))}
                                                    >
                                                      <div className="flex items-center gap-1.5 flex-1">
                                                        <div className={cn(
                                                          "w-3 h-3 rounded border-2 flex items-center justify-center",
                                                          isSubSelected ? "bg-purple-500 border-purple-500" : "border-muted-foreground/25"
                                                        )}>
                                                          {isSubSelected && <Check className="w-2 h-2 text-white" />}
                                                        </div>
                                                        <div className="flex-1">
                                                          <p className="font-medium">{subFeature.name}</p>
                                                          <p className="text-[10px] text-muted-foreground">{subFeature.description}</p>
                                                        </div>
                                                      </div>
                                                      <div className="text-[10px] text-purple-600 font-semibold ml-2">
                                                        ${(subFeaturePrices[subFeature.id] ?? subFeature.price).toFixed(2)}/u
                                                      </div>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          )}

                          {/* Add-ons Section — tabbed by selected services only */}
                          {(() => {
                            const servicesWithAddons = services.filter((s: any) => selectedServices.includes(s.id) && (s.addons || []).length > 0)
                            if (servicesWithAddons.length === 0) return null

                            // If the active addon tab's service was deselected, fall back to first available
                            const activeAddonServiceId = servicesWithAddons.find((s: any) => s.id === expandedAddonService)
                              ? expandedAddonService
                              : servicesWithAddons[0]?.id
                            const activeAddonService = servicesWithAddons.find((s: any) => s.id === activeAddonServiceId) ?? servicesWithAddons[0]

                            return (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 rounded bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">+</span>
                                  </div>
                                  <h5 className="text-sm font-semibold">Available Add-ons</h5>
                                </div>
                                <div className="border rounded-lg overflow-hidden">
                                  {/* Service tabs */}
                                  <div className="flex items-center border-b bg-muted/50 overflow-x-auto">
                                    {servicesWithAddons.map((s: any) => {
                                      const isActive = s.id === activeAddonServiceId
                                      const selectedCount = (s.addons || []).filter((a: any) => selectedAddOns[a.id]).length
                                      return (
                                        <button
                                          key={s.id}
                                          type="button"
                                          onClick={() => setExpandedAddonService(s.id)}
                                          className={cn(
                                            "flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap transition-all border-b-2 -mb-px",
                                            isActive
                                              ? "border-amber-500 bg-background font-semibold text-amber-700"
                                              : "border-transparent hover:bg-muted font-medium text-muted-foreground"
                                          )}
                                        >
                                          <div className="w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
                                          <span>{s.name}</span>
                                          {selectedCount > 0 && (
                                            <span className="bg-amber-500 text-white text-[9px] font-bold rounded-full px-1 min-w-[14px] text-center">
                                              {selectedCount}
                                            </span>
                                          )}
                                        </button>
                                      )
                                    })}
                                  </div>
                                  {/* Addons for active tab */}
                                  <div className="p-2 space-y-1.5">
                                    {(activeAddonService?.addons || []).map((addon: any) => {
                                      const isSelected = selectedAddOns[addon.id]
                                      return (
                                        <div
                                          key={addon.id}
                                          className={cn(
                                            "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border",
                                            isSelected ? "bg-amber-50 border-amber-200" : "bg-background border-border hover:border-amber-200"
                                          )}
                                          onClick={() => toggleAddon(addon.id)}
                                        >
                                          <div className="flex items-center gap-2 flex-1">
                                            <div className={cn(
                                              "w-4 h-4 rounded border-2 flex items-center justify-center",
                                              isSelected ? "bg-amber-500 border-amber-500" : "border-muted-foreground/25"
                                            )}>
                                              {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="flex-1">
                                              <p className="text-sm font-medium">{addon.name}</p>
                                              <p className="text-xs text-muted-foreground">{addon.description}</p>
                                            </div>
                                          </div>
                                          <div className="text-sm font-semibold text-amber-600">
                                            ${addon.price}/mo
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            )
                          })()}

                          {/* Total Preview */}
                          <div className="bg-muted/50 rounded-lg p-3 border">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold">Estimated Total</span>
                              <span className="text-xl font-bold text-primary">${calculateTotal().toFixed(2)}/mo</span>
                            </div>
                          </div>
                        </>
                      )}
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
                          ${selectedPlan.price || 0}/month{selectedPlan.billing === 'annual' ? ' (annual)' : ''}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>No plan selected</span>
                        <span>$0</span>
                      </div>
                    )}

                    {customizationData && (() => {
                      const customizationTotal = calculateTotal()
                      if (customizationTotal > 0) {
                        return (
                          <div className="flex justify-between text-sm">
                            <span>Customizations</span>
                            <span className="font-medium">${customizationTotal.toFixed(2)}/month</span>
                          </div>
                        )
                      }
                      return null
                    })()}

                    <div className="pt-3 mt-3 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">Total</span>
                        <span className="text-2xl font-bold text-primary">
                          ${(() => {
                            const planPrice = selectedPlan && !customizationData ? (selectedPlan?.price || 0) : 0
                            const customizationTotal = customizationData ? calculateTotal() : 0
                            return (planPrice + customizationTotal).toFixed(2)
                          })()}
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            /month
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
              </div>{/* end BOTTOM */}


              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => {
                    setStep(1)
                    setEditingAccount(false)
                    setEditingOrg(false)
                    setEditingPackage(false)
                  }}
                >
                  Back to Form
                </Button>
                <Button type="submit" className="flex-1" size="lg">
                  Continue to Billing
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Billing Information */}
          {step === 3 && (
            <form onSubmit={handleBillingSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold">Billing Information</h3>
                <p className="text-muted-foreground text-sm mt-1">Your payment details are secured with 256-bit SSL encryption</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Left: Card Details */}
                <div className="space-y-5">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">Card Details</h4>

                  {/* Cardholder Name */}
                  <div className="space-y-2">
                    <Label htmlFor="billingName">Cardholder Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="billingName"
                        placeholder="Name as on card"
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Card Number */}
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "").slice(0, 16)
                          const formatted = raw.replace(/(.{4})/g, "$1 ").trim()
                          setCardNumber(formatted)
                        }}
                        className="pl-10 pr-14 tracking-widest"
                        maxLength={19}
                        required
                      />
                      {detectCardType(cardNumber) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <CardBrandIcon type={detectCardType(cardNumber)} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expiry + CVV */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiry">Expiry Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cardExpiry"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, "").slice(0, 4)
                            if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2)
                            setCardExpiry(v)
                          }}
                          className="pl-10"
                          maxLength={5}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardCvv">CVV</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cardCvv"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="pl-10"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Accepted cards notice */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
                    <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>We accept Visa, Mastercard, and American Express. Card details are never stored on our servers.</span>
                  </div>
                </div>

                {/* Right: Billing Address + Order Summary */}
                <div className="space-y-5">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">Billing Address</h4>

                  <div className="space-y-2">
                    <Label htmlFor="billingAddress">Street Address</Label>
                    <Input
                      id="billingAddress"
                      placeholder="123 Main Street"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingCity">City</Label>
                      <Input
                        id="billingCity"
                        placeholder="Dar es Salaam"
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingCountry">Country</Label>
                      <CountryPicker
                        value={billingCountry}
                        onChange={setBillingCountry}
                      />
                    </div>
                  </div>

                  {/* Order summary box */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Order Summary</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plan</span>
                        <span className="font-medium">{selectedPlan?.name || "Custom Plan"}</span>
                      </div>
                      {selectedPlan?.billing && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Billing</span>
                          <span className="font-medium capitalize">{selectedPlan.billing}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-1.5 mt-1.5 font-semibold">
                        <span>Total</span>
                        <span className="text-primary">
                          ${customizationData
                            ? (customizationData.totalPrice || customizationData.pricing?.totalCost || 0).toFixed(2)
                            : (selectedPlan?.price || 0).toFixed(2)
                          }/mo
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setStep(2); setError("") }}
                >
                  Back to Review
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
