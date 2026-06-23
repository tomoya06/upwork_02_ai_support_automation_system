"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [collapsed, setCollapsed] = useState(false);

  if (isHome) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen flex-col border-r bg-card z-40 transition-[width] duration-200",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((p) => !p)} />
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "pb-20 md:pb-0 min-h-screen transition-[padding] duration-200",
          collapsed ? "md:pl-16" : "md:pl-64"
        )}
      >
        <div className={cn("max-w-7xl mx-auto p-4 md:p-6")}>{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
