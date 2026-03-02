"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";

// ────────────────────────────────────────────────
// Import only the icons we need (tree-shakable)
import {
  // Navigation icons
  FaHome,
  FaBox,
  FaUtensils,
  FaUsers,
  FaSyncAlt,
  FaChartBar,
  FaCog,
  FaUserCircle,
  // Others
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: FaHome, label: "Dashboard" },
  { href: "/admin/orders",     icon: FaBox,   label: "Orders"     },
  { href: "/admin/meals",      icon: FaUtensils, label: "Meals"   },
  { href: "/admin/users",      icon: FaUsers, label: "Users"      },
  { href: "/admin/subscriptions", icon: FaSyncAlt, label: "Subscriptions" },
  { href: "/admin/analytics",  icon: FaChartBar, label: "Analytics" },
  { href: "/admin/settings",   icon: FaCog,   label: "Settings"   },
  { href: "/admin/profile",    icon: FaUserCircle, label: "My Profile" },
];

export default function AdminSidebar() {
  const { admin, logout, loading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
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
    <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
              ${
                isActive
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
              }
              ${collapsed ? "justify-center" : ""}
            `}
          >
            <Icon className="text-lg flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* TOP NAVBAR — always visible */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-orange-100 shadow-sm">
        <div className="flex items-center justify-between h-full px-4 md:px-6">
          {/* Left: hamburger / collapse toggle + logo */}
          <div className="flex items-center gap-3">
            {/* Mobile: open drawer */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-orange-600 hover:bg-orange-50 transition"
              aria-label="Open menu"
            >
              <FaBars className="w-5 h-5" />
            </button>

            {/* Desktop: collapse/expand sidebar */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex p-2 rounded-lg text-orange-600 hover:bg-orange-50 transition"
              aria-label="Toggle sidebar"
            >
              <FaBars className="w-5 h-5" />
            </button>

            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 font-bold text-xl text-orange-600"
            >
              <FaUtensils className="text-2xl" />
              <span className="hidden sm:inline">ReadyMealz Admin</span>
            </Link>
          </div>

          {/* Right: avatar dropdown / login button */}
          <div className="flex items-center gap-4">
            {!admin && (
              <button
                onClick={() => router.push("/admin/login")}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-5 py-2 rounded-lg transition font-medium shadow-sm"
              >
                Admin Login
              </button>
            )}

            {admin && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg hover:bg-orange-200 transition focus:outline-none focus:ring-2 focus:ring-orange-400"
                  title="Account"
                >
                  {admin.name?.charAt(0)?.toUpperCase() || "A"}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                    <div className="px-5 py-4 border-b bg-gradient-to-r from-orange-50 to-white">
                      <p className="text-base font-semibold text-gray-900 truncate">
                        {admin.name || "Admin"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {admin.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          router.push("/admin/profile");
                        }}
                        className={`w-full text-left px-5 py-3 text-sm transition hover:bg-orange-50 ${
                          pathname === "/admin/profile"
                            ? "text-orange-600 font-medium bg-orange-50/70"
                            : "text-gray-700"
                        }`}
                      >
                        <FaUserCircle className="inline mr-2 text-lg" />
                        My Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition font-medium flex items-center gap-2"
                      >
                        <FaSignOutAlt className="text-lg" />
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

      {/* MOBILE: Overlay backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE: Drawer slides in from left */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-orange-100 flex-shrink-0">
          <div className="flex items-center gap-2 font-bold text-orange-600 text-lg">
            <FaUtensils /> ReadyMealz
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
            aria-label="Close menu"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <SidebarLinks onLinkClick={() => setMobileOpen(false)} />

        {/* Mobile bottom: user + logout */}
        {admin && (
          <div className="border-t border-orange-100 p-3 flex-shrink-0">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                {admin.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {admin.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{admin.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
            >
              <FaSignOutAlt className="text-lg" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* DESKTOP: Fixed sidebar (sits below navbar) */}
      <aside
        className={`hidden md:flex flex-col fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-orange-100 shadow-sm z-30 transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-60"}
        `}
      >
        <SidebarLinks />

        {/* Desktop bottom: user + logout */}
        {admin && (
          <div className="border-t border-orange-100 p-3 flex-shrink-0">
            {!collapsed && (
              <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                  {admin.name?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {admin.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {admin.email}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title={collapsed ? "Sign Out" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition
                ${collapsed ? "justify-center" : ""}
              `}
            >
              <FaSignOutAlt className="text-lg" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}