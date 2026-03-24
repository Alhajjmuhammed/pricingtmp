export function TrustSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-6">
          Trusted by 100,000+ sales teams worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {["Cloudflare", "Stripe", "Shopify", "Twilio", "Notion"].map(
            (company) => (
              <span
                key={company}
                className="text-lg font-bold text-muted-foreground/40 tracking-wide"
              >
                {company}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  )
}
