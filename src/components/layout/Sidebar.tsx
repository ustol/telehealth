import { useAuth } from "@/hooks/useAuth";
import { getNavItems } from "@/components/layout/navItems";
import { NavLinks } from "@/components/layout/NavLinks";
import { BrandMark } from "@/components/layout/BrandMark";

export function Sidebar() {
  const { roles } = useAuth();
  const items = getNavItems(roles);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card">
      <BrandMark />
      <NavLinks items={items} />
    </aside>
  );
}
