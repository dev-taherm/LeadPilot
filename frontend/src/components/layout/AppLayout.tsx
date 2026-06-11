"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface AppLayoutProps {
  children: ReactNode;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads": "Leads",
  "/conversations": "Conversations",
  "/calendar": "Calendar",
  "/knowledge-base": "Knowledge Base",
  "/analytics": "Analytics",
  "/ai-settings": "AI Settings",
  "/team": "Team",
  "/profile": "Profile",
};

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; read: boolean }[]
  >([]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch {
        // silently ignore – notifications are non-critical
      }
    }
    fetchNotifications();
  }, []);

  const title =
    pageTitles[pathname] ||
    pathname
      .split("/")
      .pop()
      ?.replace(/-/g, " ")
      ?.replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "LeadFlow AI";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          isCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <Header
          title={title}
          onMenuToggle={() => setIsMobileOpen(true)}
          notifications={notifications}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
