"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col border-r bg-card z-40">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="md:pl-64 pb-20 md:pb-0 min-h-screen">
        <div className={cn("max-w-7xl mx-auto p-4 md:p-6")}>{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
