"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { useSidebar } from "./SidebarContext";

// Lucide Icons
import {
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  UserCircle,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/orders",     icon: ShoppingBag,    label: "Orders" },
  { href: "/admin/meals",      icon: Utensils,       label: "Meals" },
  { href: "/admin/users",      icon: Users,          label: "Users" },
   { href: "/admin/admins",      icon: Users,          label: "Admins" },
{ href: "/admin/category",      icon: Users,          label: "Category" },
  { href: "/admin/subscriptions", icon: CreditCard, label: "Subscriptions" },
  { href: "/admin/analytics",  icon: BarChart3,      label: "Analytics" },
  { href: "/admin/settings",   icon: Settings,       label: "Settings" },
  { href: "/admin/profile",    icon: UserCircle,     label: "My Profile" },
];

export default function AdminSidebar() {
  const { admin, logout, loading } = useAdminAuth();
  const { collapsed, setCollapsed } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push("/admin/login");
  };

  if (loading) return null;

  const SidebarLinks = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            title={collapsed ? item.label : undefined}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
              }
              ${collapsed ? "justify-center" : ""}
            `}
          >
            <item.icon
              className={`h-5 w-5 flex-shrink-0 transition-colors ${
                isActive ? "text-white" : "text-gray-500 group-hover:text-orange-600"
              }`}
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ─── TOP NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-orange-100 shadow-sm">
        <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">

          {/* Left */}
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-orange-600 hover:bg-orange-50 transition"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-2 rounded-lg text-orange-600 hover:bg-orange-50 transition"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-6 w-6" />
              ) : (
                <ChevronLeft className="h-6 w-6" />
              )}
            </button>

            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2.5 font-bold text-xl sm:text-2xl text-orange-600 tracking-tight"
            >
              🍱 <span className="hidden sm:inline">ReadyMealz Admin</span>
            </Link>
          </div>

          {/* Right - Profile / Login */}
          <div className="flex items-center gap-4 sm:gap-6">
            {!admin ? (
              <button
                onClick={() => router.push("/admin/login")}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm sm:text-base px-5 py-2.5 rounded-xl font-medium transition shadow-sm"
              >
                <span>Admin Login</span>
              </button>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 rounded-full p-1 transition"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-lg sm:text-xl hover:bg-orange-200 transition">
                    {admin.name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 sm:w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    <div className="px-5 py-4 border-b bg-gradient-to-r from-orange-50 to-white">
                      <p className="font-semibold text-gray-900 truncate text-base">
                        {admin.name || "Admin"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {admin.email}
                      </p>
                    </div>

                    <div className="py-2 text-sm">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          router.push("/admin/profile");
                        }}
                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition hover:bg-orange-50 ${
                          pathname === "/admin/profile"
                            ? "text-orange-600 font-medium bg-orange-50/60"
                            : "text-gray-700 hover:text-orange-700"
                        }`}
                      >
                        <UserCircle className="h-5 w-5" />
                        My Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left text-red-600 hover:bg-red-50 transition font-medium"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ─── MOBILE OVERLAY ─── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── MOBILE SIDEBAR DRAWER ─── */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-orange-100 flex-shrink-0">
          <span className="font-bold text-xl text-orange-600">ReadyMealz</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <SidebarLinks onLinkClick={() => setMobileOpen(false)} />

        {admin && (
          <div className="border-t border-orange-100 p-4 flex-shrink-0">
            <div className="flex items-center gap-3 px-2 py-3 mb-3 bg-orange-50/40 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl flex-shrink-0">
                {admin.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{admin.name}</p>
                <p className="text-sm text-gray-500 truncate">{admin.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition font-medium"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* ─── DESKTOP FIXED SIDEBAR ─── */}
      <aside
        className={`hidden md:flex flex-col fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-orange-100 shadow-sm z-30 transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-64"}
        `}
      >
        <SidebarLinks />

        {admin && (
          <div className="border-t border-orange-100 p-4 flex-shrink-0">
            {!collapsed && (
              <div className="flex items-center gap-3 px-2 py-3 mb-4 bg-orange-50/40 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl flex-shrink-0">
                  {admin.name?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{admin.name}</p>
                  <p className="text-sm text-gray-500 truncate">{admin.email}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              title={collapsed ? "Sign Out" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition font-medium
                ${collapsed ? "justify-center" : ""}
              `}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}