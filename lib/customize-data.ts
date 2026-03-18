export type SubFeature = {
  id: string
  name: string
  desc: string
  price: number
  isDefaultEnabled?: boolean
}

export type AddOn = {
  id: string
  name: string
  desc: string
  price: number
  pricingPeriod: string
}

export type ModuleItem = {
  id: string
  name: string
  desc: string
  price: number
  per?: "user" | "gb" | "asset"
  subFeatures?: SubFeature[]  // Support for sub-features
}

export type Module = {
  id: string
  name: string
  items: ModuleItem[]
  addons?: AddOn[]  // Add-ons for this module
}

export const ASSET_STEPS = [20, 100, 200, 255]

export const UNIT_PRICES = {
  user: 7.0,
  asset: 0.99,
  organization: 50.0,
  storage: 3.0,
}

export const CURRENCIES: Record<string, { symbol: string; rate: number; label: string }> = {
  USD: { symbol: "$", rate: 1, label: "USD" },
  EUR: { symbol: "\u20AC", rate: 0.92, label: "EUR" },
  GBP: { symbol: "\u00A3", rate: 0.79, label: "GBP" },
}

export const modules: Module[] = [
  {
    id: "HR & Payroll",
    name: "HR & Payroll",
    items: [
      { id: "hr_org", name: "Organization Management", desc: "Manage organization structure and information", price: 0 },
      { id: "hr_emp", name: "Employee Management", desc: "Full employee lifecycle management", price: 4, per: "user" },
      { id: "hr_pay", name: "Payroll Management", desc: "Process payroll and manage compensation", price: 3, per: "user" },
      { id: "hr_time", name: "Time & Attendance", desc: "Track time, attendance and leave", price: 3, per: "user" },
    ],
  },
  {
    id: "Project Management",
    name: "Project Management",
    items: [
      { id: "pm_train", name: "Training Opportunity & Digital Check-in", desc: "Manage training programs and events", price: 0 },
      { id: "pm_rep", name: "Advanced Reporting & Insights", desc: "Data-driven dashboards and insights", price: 10, per: "user" },
      { id: "pm_mon", name: "Monitoring & Evaluation", desc: "M&E frameworks and dashboards", price: 5, per: "user" },
    ],
  },
  {
    id: "Asset Management",
    name: "Asset Management",
    items: [
      { id: "am_audit", name: "Asset Audit & Inventory", desc: "Full lifecycle tracking and auditing", price: 0 },
      { id: "am_scan", name: "Mobile Asset Scan App", desc: "QR and barcode scanning from mobile", price: 9.99, per: "user" },
      { id: "am_ins", name: "Asset Insurance & Risk Dashboard", desc: "Risk assessment and insurance tracking", price: 0 },
      { id: "am_reg", name: "Digital Asset Registration", desc: "Compliance portal and registration", price: 3, per: "gb" },
    ],
  },
  {
    id: "E-office",
    name: "E-Office",
    items: [
      { id: "eo_doc", name: "Document & Records Management", desc: "Secure cloud document storage", price: 2.88, per: "user" },
      { id: "eo_work", name: "Workflow & Approval Automation", desc: "Process and approval management", price: 2, per: "user" },
      { id: "eo_mail", name: "Email Management", desc: "Business email integration", price: 1.99, per: "user" },
      { id: "eo_sig", name: "Digital Signatures & Authentication", desc: "Secure signing and verification", price: 7, per: "user" },
      { id: "eo_task", name: "Task, Case & File Tracking", desc: "Daily productivity and case management", price: 0 },
    ],
  },
]

export type ScaleKey = "users" | "asset" | "organizations" | "storage"

export type Counts = {
  users: number
  asset: number
  organizations: number
  storage: number
}

export const DEFAULT_COUNTS: Counts = {
  users: 3,
  asset: 20,
  organizations: 1,
  storage: 3,
}

export const TRANSLATIONS = {
  en: {
    title: "Customize your enterprise plan.",
    subtitle: "Select modules and seats to best fit your business. Save 20% on annual billing.",
    modules: "Modules",
    scale: "Plan Scale",
    users: "Users",
    assets: "Assets",
    organization: "Organizations",
    storage: "Storage (GB)",
    monthly: "Monthly",
    yearly: "Yearly",
    save20: "Save 20%",
    invoice: "Estimated Invoice",
    continue: "Continue",
    export: "Export Plan",
    back: "Back",
    per: "per",
    free: "Free",
    selected: "Items selected",
    goBack: "Go back to packages",
    prefs: "Preferences",
    currency: "Currency",
    language: "Language",
    theme: "Appearance",
    light: "Light",
    dark: "Dark",
  },
  es: {
    title: "Personalice su plan empresarial.",
    subtitle: "Seleccione m\u00F3dulos y asientos. Ahorre un 20% en facturaci\u00F3n anual.",
    modules: "M\u00F3dulos",
    scale: "Escala del Plan",
    users: "Usuarios",
    assets: "Activos",
    organization: "Organizaciones",
    storage: "Almacenamiento (GB)",
    monthly: "Mensual",
    yearly: "Anual",
    save20: "Ahorra 20%",
    invoice: "Factura Estimada",
    continue: "Continuar",
    export: "Exportar Plan",
    back: "Atr\u00E1s",
    per: "por",
    free: "Gratis",
    selected: "Elementos seleccionados",
    goBack: "Volver a paquetes",
    prefs: "Preferencias",
    currency: "Moneda",
    language: "Idioma",
    theme: "Apariencia",
    light: "Claro",
    dark: "Oscuro",
  },
  fr: {
    title: "Personnalisez votre plan d\u2019entreprise.",
    subtitle: "S\u00E9lectionnez les modules. \u00C9conomisez 20\u00A0% sur la facturation annuelle.",
    modules: "Modules",
    scale: "Echelle du Plan",
    users: "Utilisateurs",
    assets: "Actifs",
    organization: "Organisations",
    storage: "Stockage (Go)",
    monthly: "Mensuel",
    yearly: "Annuel",
    save20: "\u00C9conomisez 20%",
    invoice: "Facture Estim\u00E9e",
    continue: "Continuer",
    export: "Exporter",
    back: "Retour",
    per: "par",
    free: "Gratuit",
    selected: "\u00C9l\u00E9ments s\u00E9lectionn\u00E9s",
    goBack: "Retour aux forfaits",
    prefs: "Pr\u00E9f\u00E9rences",
    currency: "Devise",
    language: "Langue",
    theme: "Apparence",
    light: "Clair",
    dark: "Sombre",
  },
} as const

export type LangKey = keyof typeof TRANSLATIONS
