"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  BookOpen,
  BarChart3,
  Brain,
  UsersRound,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Leads", icon: Users, href: "/leads" },
  { label: "Conversations", icon: MessageSquare, href: "/conversations" },
  { label: "Channels", icon: Radio, href: "/channels" },
  { label: "Calendar", icon: Calendar, href: "/calendar" },
  { label: "Knowledge Base", icon: BookOpen, href: "/knowledge-base" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
];

const bottomNavItems = [
  { label: "AI Settings", icon: Brain, href: "/ai-settings" },
  { label: "Team", icon: UsersRound, href: "/team" },
  { label: "Profile", icon: UserCircle, href: "/profile" },
];

function NavItem({
  item,
  isActive,
  isCollapsed,
}: {
  item: (typeof navItems)[number];
  isActive: boolean;
  isCollapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
        isCollapsed && "justify-center px-2"
      )}
      title={isCollapsed ? item.label : undefined}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!isCollapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function Sidebar({
  isCollapsed,
  onToggle,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 items-center border-b border-gray-200 px-4",
          isCollapsed && "justify-center px-2"
        )}
      >
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-sm font-bold text-white">LF</span>
            </div>
            <span className="text-lg font-bold text-gray-900">LeadFlow AI</span>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">LF</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            isCollapsed={isCollapsed}
          />
        ))}

        <div className="my-3 border-t border-gray-200" />

        {bottomNavItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900",
            isCollapsed && "justify-center px-2"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-gray-200 bg-white transition-all duration-300 lg:block",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white transition-transform duration-300 lg:hidden">
            <button
              onClick={onMobileClose}
              className="absolute right-3 top-3.5 rounded-md p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
