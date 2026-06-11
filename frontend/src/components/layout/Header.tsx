"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  onMenuToggle: () => void;
  notifications?: { id: string; title: string; read: boolean }[];
}

export default function Header({
  title,
  onMenuToggle,
  notifications = [],
}: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-gray-200 bg-white px-4 lg:px-6">
      <button
        onClick={onMenuToggle}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="ml-2 text-lg font-semibold text-gray-900 lg:ml-0">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
          />
        </div>

        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <span className="text-sm font-medium text-blue-700">JD</span>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-gray-500 sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-xs text-gray-500">john@example.com</p>
              </div>
              <div className="py-1">
                {[
                  { label: "Profile", icon: User },
                  { label: "Settings", icon: Settings },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="border-t border-gray-100 py-1">
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
