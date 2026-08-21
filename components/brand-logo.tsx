// Fitted-box + object-contain so the real eOpsPrimax mark (a tall,
// stacked icon-over-wordmark composition, not a plain horizontal lockup)
// always scales down cleanly regardless of where it's placed, without
// ever looking oversized, cropped, or stretched -- same pattern already
// used for the eopsprimax.com and supplierconnect.eopsprimax.com navbars.
export function BrandLogo({ className = "h-8 max-w-[140px]" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center`}>
      <img
        src="/eopsprimax-logo.png"
        alt="eOpsPrimax"
        className="h-full w-full object-contain object-left"
      />
    </div>
  )
}
