"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminNavbar() {
  const { admin, logout, loading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/admin/login");
    // Optional: router.refresh() if you face stale data after logout
  };

  // Don't show navbar while checking auth state (prevents flash)
  if (loading) return null;

  return (
    <nav className="w-full bg-white border-b border-orange-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo - always visible */}
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 font-bold text-xl text-orange-600"
          >
            🍱 ReadyMealz Admin
          </Link>

          {/* Right side - conditional rendering */}
          <div className="flex items-center gap-4">

            {/* ─── Not logged in ─── */}
            {!admin && (
              <button
                onClick={() => router.push("/admin/login")}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-5 py-2 rounded-lg transition font-medium shadow-sm"
              >
                Admin Login
              </button>
            )}

            {/* ─── Logged in ─── */}
            {admin && (
              <div className="relative" ref={dropdownRef}>
                {/* Avatar button */}
                <button
                  onClick={() => setOpen(!open)}
                  className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg hover:bg-orange-200 transition focus:outline-none focus:ring-2 focus:ring-orange-400"
                  title="Account"
                >
                  {admin.name?.charAt(0)?.toUpperCase() || "A"}
                </button>

                {/* Dropdown menu */}
                {open && (
                  <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                    {/* User info header */}
                    <div className="px-5 py-4 border-b bg-gradient-to-r from-orange-50 to-white">
                      <p className="text-base font-semibold text-gray-900 truncate">
                        {admin.name || "Admin"}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {admin.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setOpen(false);
                          router.push("/admin/profile");
                        }}
                        className={`w-full text-left px-5 py-3 text-sm transition hover:bg-orange-50 ${
                          pathname === "/admin/profile"
                            ? "text-orange-600 font-medium bg-orange-50/70"
                            : "text-gray-700"
                        }`}
                      >
                        👤 My Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition font-medium"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}