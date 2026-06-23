"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Inbox,
  BookOpen,
  BarChart3,
  Bot,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  LogIn,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/showcase", label: "Showcase", icon: Sparkles },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin, isLoading, logout } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Logo + toggle */}
      <div className="flex items-center p-4 border-b gap-2">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-bold text-lg min-w-0",
            collapsed && "justify-center w-full"
          )}
        >
          <Bot className="h-6 w-6 text-primary flex-shrink-0" />
          {!collapsed && <span className="truncate">AI Support</span>}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="ml-auto flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapsed toggle button (shown when collapsed) */}
      {collapsed && (
        <div className="px-2 pt-2">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Nav items */}
      <nav className={cn("flex-1 p-3 space-y-1", collapsed && "px-2")}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed
                  ? "justify-center gap-0"
                  : "gap-3",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Auth footer */}
      <div className={cn("p-3 border-t", collapsed && "px-2")}>
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isLoading ? (
                <span>Checking auth…</span>
              ) : isAdmin ? (
                <>
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span>Admin mode</span>
                </>
              ) : (
                <>
                  <span className="inline-flex h-2 w-2 rounded-full bg-gray-400" />
                  <span>Read-only</span>
                </>
              )}
            </div>
            {isAdmin ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-1.5 text-xs"
                onClick={() => logout()}
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </Button>
            ) : (
              <LoginDialog>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Admin Login
                </Button>
              </LoginDialog>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            {isAdmin ? (
              <button
                onClick={() => logout()}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            ) : (
              <LoginDialog>
                <button
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title="Admin Login"
                >
                  <LogIn className="h-4 w-4" />
                </button>
              </LoginDialog>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
