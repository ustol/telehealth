import * as React from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getNavItems } from "@/components/layout/navItems";
import { NavLinks } from "@/components/layout/NavLinks";
import { BrandMark } from "@/components/layout/BrandMark";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const { roles } = useAuth();
  const items = getNavItems(roles);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open navigation menu">
        <Menu className="h-5 w-5" />
      </Button>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-card shadow-xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center">
          <div className="min-w-0 flex-1">
            <BrandMark />
          </div>
          <Button variant="ghost" size="icon" className="mr-2 shrink-0" onClick={() => setOpen(false)} aria-label="Close navigation menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <NavLinks items={items} onNavigate={() => setOpen(false)} />
      </div>
    </div>
  );
}
