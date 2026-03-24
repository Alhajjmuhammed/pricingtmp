# Pricingtmp Onboarding Flow Implementation

## ✅ What Was Done

### 1. Services Layer (Copied from FRT_eOpsEntre_Platform)
Created complete API integration layer at `services/`:

```
services/
├── core/
│   ├── api.ts          # BaseApiService class
│   └── index.ts
├── wellongeid/
│   ├── wellongeIdService.ts  # Authentication & user management
│   └── index.ts
├── wellongepay/
│   ├── wellongepayService.ts # Payment processing
│   └── index.ts
├── onboarding/
│   ├── onboardingApi.ts      # Unified onboarding wrapper
│   └── index.ts
└── index.ts
```

**Key Features:**
- BaseApiService with 15s timeout, retry logic, error handling
- Wellonge ID integration (register, login, profiles, organizations)
- Wellongepay integration (Card via N-GENIUS, M-PESA support)
- Platform detection (Web/Android/iOS)
- OAuth2 authentication support (Google, Apple, Wellonge ID)

### 2. New Pages Created

#### `/app/register/page.tsx` - 3-Step Registration
**Step 1: Account Information**
- Email, password, confirm password, full name
- Calls `registerPersonalAccount()` API

**Step 2: Profile Details**
- Phone number, location (country, district, city)
- Calls `createPersonalProfile()` API

**Step 3: Organization Setup**
- Organization name, industry, size
- Calls `createOrganization()` API

**Flow:** Form validation → API calls → localStorage storage → Navigate to /payment

#### `/app/payment/page.tsx` - Payment Processing
**Two Payment Methods:**
- **Card Payment**: Card number, CVV, expiry, billing address
- **M-PESA Payment**: Phone number input

**Features:**
- Tabbed interface with Radix UI Tabs
- Form validation with react-hook-form + zod
- Reads plan data from localStorage (selected_plan or customization_data)
- Calls `processPayment()` API
- Stores payment_data to localStorage
- Navigates to /success on completion

#### `/app/success/page.tsx` - Confirmation Screen
**Displays:**
- Success message with transaction ID
- Order summary (plan, add-ons, total)
- Next steps guide
- Link to dashboard
- Download receipt button

**Data Sources:** 
- registration_data (user info)
- payment_data (transaction details)
- selected_plan or customization_data (pricing info)

### 3. Updated Existing Pages

#### `components/pricing-cards.tsx`
**Changes:**
- Added `useRouter` hook from `next/navigation`
- Created `handleCTAClick(plan)` function
- Stores selected plan to `localStorage.setItem('selected_plan', JSON.stringify(plan))`
- Navigates to `/register` when "Start free trial" clicked

**Result:** All 4 pricing cards (Go, Plus, ProMax, Enterprise) now functional

#### `app/customize/page.tsx`
**Changes:**
- Added `useRouter` hook and `ArrowRight` icon import
- Updated `handleContinue()` function with two modes:
  1. **Add-ons hidden:** Scrolls to show add-ons section
  2. **Add-ons visible:** Stores customization data to localStorage + navigates to `/register`
- Changed button text dynamically:
  - "Show Add-ons" (when add-ons hidden)  
  - "Proceed to Checkout" (when add-ons visible)

**Stored Data:**
```json
{
  "activeModules": [...],
  "selectedItems": {...},
  "itemCounts": {...},
  "pricing": {
    "monthlyTotal": 0,
    "yearlyTotal": 0,
    "monthlySavings": 0,
    "yearlySavings": 0
  }
}
```

## 🔄 Complete User Flow

```
HOME PAGE (/)
├── Click "Start free trial" on any plan
│   └─> Stores selected_plan → /register
│
└── Click "Customize your own plan"
    └─> /customize
        ├─> Select modules
        ├─> Click "Show Add-ons" (scrolls down)
        ├─> Select add-ons
        └─> Click "Proceed to Checkout"
            └─> Stores customization_data → /register

REGISTRATION (/register)
├─> Step 1: Account (email, password, name)
├─> Step 2: Profile (phone, location)
├─> Step 3: Organization (name, industry, size)
└─> Stores registration_data → /payment

PAYMENT (/payment)
├─> Choose Card or M-PESA
├─> Fill payment details
├─> Process payment via Wellongepay
└─> Stores payment_data → /success

SUCCESS (/success)
├─> Display confirmation
├─> Show transaction ID
├─> Download receipt
└─> Link to dashboard
```

## 💾 LocalStorage Data Structure

### `selected_plan`
```json
{
  "name": "Go",
  "price": "$0",
  "description": "Perfect for trying out plated",
  "features": [...],
  "highlighted": false
}
```

### `customization_data`
```json
{
  "activeModules": ["asset-management", "e-office"],
  "selectedItems": {
    "asset-management": ["vehicles", "equipment"],
    "e-office": ["staff-portal", "document-management"]
  },
  "itemCounts": {
    "asset-management": 2,
    "e-office": 2
  },
  "pricing": {
    "monthlyTotal": 83.99,
    "yearlyTotal": 907.89,
    "monthlySavings": 12,
    "yearlySavings": 100.99
  }
}
```

### `registration_data`
```json
{
  "account": {
    "email": "user@example.com",
    "name": "John Doe",
    "accountId": "uuid"
  },
  "profile": {
    "phone": "+250788123456",
    "location": {...},
    "profileId": "uuid"
  },
  "organization": {
    "name": "ACME Corp",
    "industry": "Technology",
    "size": "11-50",
    "orgId": "uuid"
  }
}
```

### `payment_data`
```json
{
  "transactionId": "txn_123456",
  "method": "card",
  "amount": 907.89,
  "currency": "USD",
  "status": "completed",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔌 API Endpoints

### Wellonge ID API (https://wellonge.id/api/)
- `POST /accounts/register/personal/` - Register personal account
- `POST /profiles/` - Create user profile
- `POST /organizations/` - Create organization
- `POST /authentication/login/` - Login with email/password
- `POST /authentication/oauth2/google/` - Google OAuth
- `POST /authentication/oauth2/apple/` - Apple OAuth

### Wellongepay API (https://wellonge.pay/api/)
- `POST /payments/process/` - Process payment (Card/M-PESA)
- `GET /payments/{id}/status/` - Check payment status
- `POST /payments/mpesa/initiate/` - Initiate M-PESA payment

### eOpsEntre API (http://localhost:8000/graphql, http://localhost:8001/graphql)
- GraphQL endpoints for organization data
- Subscription management
- Module activation

## 🛠️ Technologies Used

- **Framework:** Next.js 16.1.6 with App Router
- **UI Components:** Radix UI (Tabs, Dialog, etc.)
- **Styling:** Tailwind CSS v4
- **Form Management:** react-hook-form + @hookform/resolvers
- **Validation:** zod
- **Icons:** lucide-react
- **State Management:** localStorage (client-side)
- **API Integration:** Fetch API with custom BaseApiService

## 📦 Dependencies (Already Installed)

All required dependencies are already in package.json:
- ✅ @radix-ui/react-tabs
- ✅ react-hook-form
- ✅ @hookform/resolvers
- ✅ zod
- ✅ lucide-react
- ✅ next-themes
- ✅ class-variance-authority
- ✅ tailwind-merge

## 🧪 Testing the Flow

### Option 1: Test Pre-built Plan Selection
1. Run `pnpm dev` in pricingtmp/
2. Go to http://localhost:3000
3. Click "Start free trial" on any plan
4. Fill out 3-step registration form
5. Choose payment method and complete
6. See success page

### Option 2: Test Custom Plan Builder
1. Run `pnpm dev` in pricingtmp/
2. Go to http://localhost:3000
3. Click "Customize your own plan"
4. Select modules (e.g., Asset Management, E-Office)
5. Click "Show Add-ons"
6. Select add-ons (e.g., Vehicles, Staff Portal)
7. Click "Proceed to Checkout"
8. Complete registration and payment

## ⚠️ Notes for Production

1. **API Endpoints:** Currently hardcoded to production URLs
   - Wellonge ID: https://wellonge.id/api/
   - Wellongepay: https://wellonge.pay/api/
   - Consider adding environment variables

2. **Error Handling:** Basic error handling implemented
   - Consider adding error boundaries
   - Add toast notifications for better UX

3. **Loading States:** Basic loading states added
   - Consider adding skeleton loaders
   - Add progress indicators for multi-step forms

4. **Validation:** Client-side validation with zod
   - Server-side validation already handled by backend

5. **Security:** 
   - Tokens stored in localStorage (consider httpOnly cookies)
   - CORS must be configured on backend
   - SSL required for production

6. **Testing:** 
   - Backend must be running for API calls to work
   - Mock services for E2E testing recommended

## 🎯 Next Steps (Optional Enhancements)

- [ ] Add email verification flow
- [ ] Implement password reset
- [ ] Add social login buttons (Google, Apple)
- [ ] Create error boundary components
- [ ] Add loading skeletons
- [ ] Implement toast notifications (using sonner - already installed)
- [ ] Add form autosave to localStorage
- [ ] Create dashboard page
- [ ] Add receipt PDF generation
- [ ] Implement analytics tracking
- [ ] Add A/B testing for pricing cards
- [ ] Create admin panel for plan management

## 📚 File Structure Summary

```
pricingtmp/
├── app/
│   ├── page.tsx              # Home with pricing cards
│   ├── customize/
│   │   └── page.tsx          # ✏️ UPDATED - Custom plan builder
│   ├── register/
│   │   └── page.tsx          # ✨ NEW - 3-step registration
│   ├── payment/
│   │   └── page.tsx          # ✨ NEW - Payment processing
│   └── success/
│       └── page.tsx          # ✨ NEW - Success confirmation
├── components/
│   ├── pricing-cards.tsx     # ✏️ UPDATED - Added navigation
│   ├── pricing-hero.tsx      # Already has "Customize" link
│   └── ui/                   # Radix UI components (all exist)
├── services/                 # ✨ NEW - API integration layer
│   ├── core/
│   │   └── api.ts
│   ├── wellongeid/
│   │   └── wellongeIdService.ts
│   ├── wellongepay/
│   │   └── wellongepayService.ts
│   ├── onboarding/
│   │   └── onboardingApi.ts
│   └── index.ts
└── package.json              # All dependencies already installed
```

---

## ✅ READY TO TEST!

Run `pnpm dev` and visit http://localhost:3000 to test the complete flow.
