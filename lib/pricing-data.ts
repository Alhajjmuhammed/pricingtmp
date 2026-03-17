export type Plan = {
  id: string
  name: string
  tagline: string
  monthlyPrice: number
  annualPrice: number
  badge?: string
  highlighted?: boolean
  features: string[]
  previousPlan?: string
  cta: string
  ctaVariant: "default" | "outline"
}

export const plans: Plan[] = [
  {
    id: "go",
    name: "Go",
    tagline: "Get organized and set up simple sales processes quickly",
    monthlyPrice: 18,
    annualPrice: 12,
    features: [
      "Lead, calendar & pipeline management",
      "Seamless data import & 400+ integrations",
      "Activity, deal & contact reports",
      "Personalized onboarding",
      "24/7 knowledge base access",
    ],
    cta: "Start free trial",
    ctaVariant: "outline",
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "Never miss a step with email automation & sequences",
    monthlyPrice: 39,
    annualPrice: 28,
    previousPlan: "Go",
    badge: "Most Popular",
    highlighted: true,
    features: [
      "Full email sync with templates & tracking",
      "Automations builder with email sequences",
      "Meeting, email & video call scheduling",
      "Live chat support during business hours",
      "Group emailing & click tracking",
    ],
    cta: "Start free trial",
    ctaVariant: "default",
  },
  {
    id: "promax",
    name: "ProMax",
    tagline: "Optimize performance with advanced customizations & AI",
    monthlyPrice: 69,
    annualPrice: 49,
    previousPlan: "Plus",
    badge: "Best Value",
    features: [
      "AI-powered Sales Assistant & emailing tools",
      "Contract & proposal management with e-signatures",
      "Streamlined lead routing & team management",
      "Revenue forecasts & custom field reporting",
      "Enhanced data entry & quality settings",
    ],
    cta: "Start free trial",
    ctaVariant: "outline",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Experience unlimited power with ultimate peace of mind",
    monthlyPrice: 119,
    annualPrice: 79,
    previousPlan: "ProMax",
    features: [
      "Enhanced security with SSO & 2FA",
      "Unlimited reports & customizations",
      "Maximize automations & email syncs per seat",
      "Dedicated account manager & SLA guarantees",
      "Priority 24/7 phone & chat support",
    ],
    cta: "Contact Sales",
    ctaVariant: "outline",
  },
]

export type FeatureValue = boolean | string | { main: string; sub: string }

export type FeatureCategory = {
  name: string
  features: {
    name: string
    tooltip?: string
    plans: Record<string, FeatureValue>
  }[]
}

export const featureComparison: FeatureCategory[] = [
  {
    name: "Feature usage limits",
    features: [
      {
        name: "Leads and deals (per company)",
        tooltip: "Maximum number of leads and deals your company can manage",
        plans: {
          go: { main: "2,500 x seats", sub: "up to 300,000" },
          plus: { main: "5,000 x seats", sub: "up to 300,000" },
          promax: { main: "15,000 x seats", sub: "up to 300,000" },
          enterprise: { main: "20,000 x seats", sub: "up to 300,000" },
        },
      },
      {
        name: "Custom fields (per company)",
        tooltip: "Add custom data fields to contacts, deals, and organizations",
        plans: { go: "30", plus: "100", promax: "300", enterprise: "500" },
      },
      {
        name: "Reports (per seat)",
        tooltip: "Number of custom reports each user can create",
        plans: { go: "15", plus: "50", promax: "250", enterprise: "500" },
      },
      {
        name: "Automations (per company)",
        tooltip: "Number of automation workflows that can run simultaneously",
        plans: { go: false, plus: "50", promax: "150", enterprise: "250" },
      },
      {
        name: "If/else steps (per automation)",
        tooltip: "Conditional branching steps within each automation workflow",
        plans: { go: false, plus: "3", promax: "10", enterprise: "20" },
      },
      {
        name: "Sequences (per company)",
        tooltip: "Multi-step automated outreach campaigns",
        plans: { go: false, plus: "5", promax: "25", enterprise: "50" },
      },
      {
        name: "Email syncs (per seat)",
        tooltip: "Number of email accounts each user can sync",
        plans: { go: false, plus: "1", promax: "3", enterprise: "5" },
      },
      {
        name: "Team inboxes (per company)",
        tooltip: "Shared inboxes for team-wide email collaboration",
        plans: { go: false, plus: false, promax: "1", enterprise: "5" },
      },
      {
        name: "Teams (per company)",
        tooltip: "Organizational team structures within your account",
        plans: { go: false, plus: false, promax: "15", enterprise: "25" },
      },
      {
        name: "Custom visibility groups (per company)",
        tooltip: "Control which data different teams and departments can access",
        plans: { go: false, plus: false, promax: "15", enterprise: "25" },
      },
      {
        name: "Custom permission sets (per company)",
        tooltip: "Define granular access controls for different roles",
        plans: { go: false, plus: false, promax: "15", enterprise: "25" },
      },
      {
        name: "Custom scores (per company)",
        tooltip: "Lead and deal scoring models for prioritization",
        plans: { go: false, plus: false, promax: "5", enterprise: "10" },
      },
      {
        name: "Data enrichment credits (per company)",
        tooltip: "Auto-enrich contact and company data from external sources",
        plans: { go: false, plus: false, promax: "100", enterprise: "500" },
      },
      {
        name: "API tokens (per company)",
        tooltip: "API access tokens for integrations and custom development",
        plans: {
          go: { main: "30,000 x seats", sub: "up to 100 million" },
          plus: { main: "60,000 x seats", sub: "up to 100 million" },
          promax: { main: "150,000 x seats", sub: "up to 100 million" },
          enterprise: { main: "210,000 x seats", sub: "up to 100 million" },
        },
      },
    ],
  },
  {
    name: "Manage deals",
    features: [
      {
        name: "Custom pipelines",
        tooltip: "Visual pipeline stages to track your deals from lead to close",
        plans: { go: "1", plus: "5", promax: "Unlimited", enterprise: "Unlimited" },
      },
      {
        name: "Deal management",
        tooltip: "Track and manage sales deals through your pipeline stages",
        plans: { go: true, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Deal rotting",
        tooltip: "Get alerted when deals are idle for too long in a stage",
        plans: { go: true, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Products catalog",
        tooltip: "Manage your products and services with pricing and descriptions",
        plans: { go: true, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Custom deal fields",
        tooltip: "Add specialized data fields unique to your deals",
        plans: { go: true, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Required fields",
        tooltip: "Enforce data quality by marking certain fields as mandatory",
        plans: { go: false, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Revenue forecasting",
        tooltip: "AI-driven revenue predictions based on pipeline data and trends",
        plans: { go: false, plus: false, promax: true, enterprise: true },
      },
    ],
  },
  {
    name: "Email & Communication",
    features: [
      {
        name: "Email sync",
        tooltip: "Two-way sync with your email provider for seamless communication",
        plans: { go: false, plus: "1 account", promax: "3 accounts", enterprise: "5 accounts" },
      },
      {
        name: "Email templates",
        tooltip: "Create reusable email templates with merge fields for personalization",
        plans: { go: false, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Email open & click tracking",
        tooltip: "Know when recipients open emails and click links in real time",
        plans: { go: false, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Group emailing",
        tooltip: "Send personalized emails to groups of contacts at once",
        plans: { go: false, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Email scheduling",
        tooltip: "Schedule emails to send at optimal times for higher engagement",
        plans: { go: false, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Smart email AI assistant",
        tooltip: "AI-powered writing assistant that drafts and improves your emails",
        plans: { go: false, plus: false, promax: true, enterprise: true },
      },
    ],
  },
  {
    name: "Automation & Workflows",
    features: [
      {
        name: "Workflow builder",
        tooltip: "Visual drag-and-drop builder for complex multi-step automation flows",
        plans: { go: false, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Email sequences",
        tooltip: "Multi-step automated email drip campaigns triggered by actions",
        plans: { go: false, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Webhook automation",
        tooltip: "Connect to external services with custom webhook triggers and actions",
        plans: { go: false, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Custom automation triggers",
        tooltip: "Define custom trigger conditions based on any field or activity change",
        plans: { go: false, plus: false, promax: true, enterprise: true },
      },
      {
        name: "Smart automation suggestions",
        tooltip: "AI-powered suggestions for automation improvements and new workflows",
        plans: { go: false, plus: false, promax: true, enterprise: true },
      },
    ],
  },
  {
    name: "Reporting & Insights",
    features: [
      {
        name: "Custom dashboards",
        tooltip: "Create personalized dashboards with widgets for key metrics",
        plans: { go: "1", plus: "5", promax: "Unlimited", enterprise: "Unlimited" },
      },
      {
        name: "Deal duration reports",
        tooltip: "Analyze how long deals take to close across stages and team members",
        plans: { go: false, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Custom report builder",
        tooltip: "Build reports with flexible filters, grouping, and visualization options",
        plans: { go: false, plus: false, promax: true, enterprise: true },
      },
      {
        name: "Team performance insights",
        tooltip: "Track individual and team performance with leaderboards and scorecards",
        plans: { go: false, plus: false, promax: true, enterprise: true },
      },
      {
        name: "AI-generated reports",
        tooltip: "Get automated insights and recommendations powered by machine learning",
        plans: { go: false, plus: false, promax: true, enterprise: true },
      },
    ],
  },
  {
    name: "Security & Admin",
    features: [
      {
        name: "Two-factor authentication",
        tooltip: "Add an extra layer of security with 2FA for all user accounts",
        plans: { go: true, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Single sign-on (SSO)",
        tooltip: "Enable SSO with SAML 2.0 for seamless enterprise authentication",
        plans: { go: false, plus: false, promax: false, enterprise: true },
      },
      {
        name: "IP-based access restrictions",
        tooltip: "Limit CRM access to approved IP addresses for enhanced security",
        plans: { go: false, plus: false, promax: false, enterprise: true },
      },
      {
        name: "Security alerts",
        tooltip: "Get notified about suspicious login attempts and security events",
        plans: { go: false, plus: false, promax: true, enterprise: true },
      },
      {
        name: "Audit log",
        tooltip: "Complete audit trail of all user actions and system changes",
        plans: { go: false, plus: false, promax: false, enterprise: true },
      },
      {
        name: "HIPAA compliance",
        tooltip: "Healthcare data compliance with BAA agreements",
        plans: { go: false, plus: false, promax: false, enterprise: true },
      },
    ],
  },
  {
    name: "Support",
    features: [
      {
        name: "Knowledge base",
        tooltip: "Access comprehensive documentation, guides, and tutorials",
        plans: { go: true, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Community forum",
        tooltip: "Connect with other users, share tips, and get peer-to-peer help",
        plans: { go: true, plus: true, promax: true, enterprise: true },
      },
      {
        name: "Live chat support",
        tooltip: "Get real-time help from support agents via in-app chat",
        plans: { go: false, plus: "Business hours", promax: "24/5", enterprise: "24/7" },
      },
      {
        name: "Phone support",
        tooltip: "Call our support team directly for urgent issues and complex questions",
        plans: { go: false, plus: false, promax: true, enterprise: true },
      },
      {
        name: "Dedicated account manager",
        tooltip: "A personal account manager to help with onboarding, strategy, and growth",
        plans: { go: false, plus: false, promax: false, enterprise: true },
      },
      {
        name: "Custom onboarding program",
        tooltip: "Tailored onboarding sessions and training for your team",
        plans: { go: false, plus: false, promax: false, enterprise: true },
      },
    ],
  },
]

export type AddOn = {
  id: string
  name: string
  description: string
  monthlyPrice: number
  annualPrice: number
  per: string
  features: string[]
  module: "HR & Payroll" | "Project Management" | "Asset Management" | "E-office"
}

export const addOns: AddOn[] = [
  // HR & Payroll Add-ons
  {
    id: "hr-advanced-analytics",
    name: "Advanced HR Analytics",
    description: "Deep insights into workforce metrics, turnover analysis, and predictive analytics for better HR decisions.",
    monthlyPrice: 49,
    annualPrice: 39,
    per: "company",
    features: ["Workforce analytics", "Turnover prediction", "Custom reports", "Benchmarking"],
    module: "HR & Payroll",
  },
  {
    id: "hr-recruitment",
    name: "Recruitment Suite",
    description: "End-to-end recruitment management with applicant tracking, interview scheduling, and candidate evaluation.",
    monthlyPrice: 39,
    annualPrice: 32,
    per: "company",
    features: ["Applicant tracking", "Interview scheduling", "Candidate scoring", "Job posting"],
    module: "HR & Payroll",
  },
  {
    id: "hr-performance",
    name: "Performance Management",
    description: "360-degree reviews, goal tracking, and performance evaluations to drive employee growth.",
    monthlyPrice: 29,
    annualPrice: 24,
    per: "company",
    features: ["360° reviews", "Goal tracking", "Performance ratings", "Feedback system"],
    module: "HR & Payroll",
  },
  
  // Project Management Add-ons
  {
    id: "pm-advanced-planning",
    name: "Advanced Project Planning",
    description: "Gantt charts, critical path analysis, and resource allocation tools for complex project management.",
    monthlyPrice: 45,
    annualPrice: 36,
    per: "company",
    features: ["Gantt charts", "Critical path", "Resource planning", "Dependencies"],
    module: "Project Management",
  },
  {
    id: "pm-time-tracking",
    name: "Time Tracking & Billing",
    description: "Track time spent on projects, generate timesheets, and create invoices based on logged hours.",
    monthlyPrice: 25,
    annualPrice: 20,
    per: "company",
    features: ["Time tracking", "Timesheets", "Billing integration", "Expense tracking"],
    module: "Project Management",
  },
  {
    id: "pm-portfolio",
    name: "Portfolio Management",
    description: "Manage multiple projects across your portfolio with executive dashboards and portfolio-level reporting.",
    monthlyPrice: 59,
    annualPrice: 47,
    per: "company",
    features: ["Portfolio view", "Executive dashboards", "Cross-project reports", "Risk assessment"],
    module: "Project Management",
  },
  
  // Asset Management Add-ons
  {
    id: "am-maintenance",
    name: "Maintenance Management",
    description: "Schedule and track preventive maintenance, manage work orders, and monitor asset downtime.",
    monthlyPrice: 35,
    annualPrice: 28,
    per: "company",
    features: ["Work orders", "Preventive maintenance", "Downtime tracking", "Maintenance history"],
    module: "Asset Management",
  },
  {
    id: "am-depreciation",
    name: "Depreciation & Finance",
    description: "Automatic depreciation calculations, financial reporting, and asset valuation tracking.",
    monthlyPrice: 29,
    annualPrice: 23,
    per: "company",
    features: ["Auto depreciation", "Financial reports", "Asset valuation", "Tax compliance"],
    module: "Asset Management",
  },
  {
    id: "am-iot",
    name: "IoT Asset Monitoring",
    description: "Real-time monitoring of IoT-enabled assets with sensors, alerts, and predictive maintenance.",
    monthlyPrice: 79,
    annualPrice: 63,
    per: "company",
    features: ["Real-time monitoring", "Sensor integration", "Predictive alerts", "Usage analytics"],
    module: "Asset Management",
  },
  
  // E-office Add-ons
  {
    id: "eo-advanced-workflow",
    name: "Advanced Workflow Designer",
    description: "Visual workflow builder with conditional logic, multi-step approvals, and automation triggers.",
    monthlyPrice: 39,
    annualPrice: 31,
    per: "company",
    features: ["Visual designer", "Conditional logic", "Multi-step approvals", "Automation"],
    module: "E-office",
  },
  {
    id: "eo-document-ai",
    name: "Document AI & OCR",
    description: "AI-powered document processing with OCR, intelligent classification, and data extraction.",
    monthlyPrice: 49,
    annualPrice: 39,
    per: "company",
    features: ["OCR scanning", "Auto-classification", "Data extraction", "Smart indexing"],
    module: "E-office",
  },
  {
    id: "eo-collaboration",
    name: "Team Collaboration Suite",
    description: "Real-time document collaboration, commenting, version control, and team workspaces.",
    monthlyPrice: 25,
    annualPrice: 20,
    per: "company",
    features: ["Real-time editing", "Commenting", "Version control", "Team workspaces"],
    module: "E-office",
  },
]

export const faqs = [
  {
    question: "What is CRM pricing and how is it determined?",
    answer: "CRM pricing refers to the cost of implementing and using customer relationship management software. The price is determined by factors like number of users, features included, integrations, and level of support provided. Our pricing scales with your team size, charging per seat per month.",
  },
  {
    question: "How much does a CRM cost on average?",
    answer: "CRM costs vary widely depending on the provider and features included. On average, CRM software ranges from $12 to $119+ per user per month. We offer four tiers to match every budget and business size, from startups to enterprises.",
  },
  {
    question: "Can I try different plans during my free trial?",
    answer: "Yes, you can switch between our Go, Plus, and ProMax plans for free during your 14-day trial period. This lets you explore features at different tiers before committing.",
  },
  {
    question: "What's the difference between annual and monthly billing?",
    answer: "With monthly billing, you're charged on the same day each month with flexibility to cancel anytime. With annual billing, you pay once for the full year and save up to 42% compared to monthly pricing.",
  },
  {
    question: "Can my team join my free trial?",
    answer: "Yes, you can invite unlimited team members to join your trial. Simply navigate to your account settings and select 'Add more users' to send invitations to your colleagues.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and PayPal. Enterprise customers can also pay via invoice with net-30 terms.",
  },
  {
    question: "Will my data be safe?",
    answer: "Absolutely. We employ enterprise-grade security including AES-256 encryption, SOC 2 Type II compliance, regular security audits, and optional single sign-on (SSO). Your data is backed up in real-time across multiple geographic regions.",
  },
  {
    question: "What is an add-on and how does billing work?",
    answer: "Add-ons are additional tools that extend your CRM capabilities. They are billed per company (not per user), making them cost-effective for teams of any size. You can add or remove them at any time.",
  },
]

export const testimonials = [
  {
    quote: "The workflow is perfect for our business, recording all information and giving reminder alerts. Being able to email clients via the app is a game-changer.",
    name: "Sarah Mitchell",
    role: "VP of Sales",
    company: "TechFlow Inc.",
  },
  {
    quote: "It mixes features and design that allows our team to streamline operations. It was incredibly easy to get up and running compared to alternatives.",
    name: "David Chen",
    role: "Engineering Manager",
    company: "CloudScale.io",
  },
  {
    quote: "The platform is evolving rapidly, just like us. We love the personal and ultra-responsive support team. ROI was visible within the first month.",
    name: "Anna Schmidt",
    role: "CEO",
    company: "GrowthLab Digital",
  },
]
