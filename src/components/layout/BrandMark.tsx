export function BrandMark() {
  return (
    <div className="flex h-16 items-center gap-2 border-b px-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
        TH
      </div>
      <div className="leading-tight min-w-0">
        <p className="text-sm font-semibold truncate">Telehealth Reporting</p>
        <p className="text-xs text-muted-foreground truncate">Trust Hospital &middot; SSNIT</p>
      </div>
    </div>
  );
}
