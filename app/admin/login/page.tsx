"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/app/lib/axios";
import { useAdminAuth } from "@/app/context/AdminAuthContext";

interface LoginForm {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  admin?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminLogin() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, refreshAdmin } = useAdminAuth();

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // 🔐 AUTO REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/admin/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.email.trim() || !form.password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post<LoginResponse>(
        "/admin/login",
        {
          email: form.email.trim(),
          password: form.password,
        },
        {
          withCredentials: true, // VERY IMPORTANT for cookie auth
        }
      );

      const data = res.data;

      if (!data.success || !data.admin) {
        throw new Error(data.message || "Login failed");
      }

      // (Optional) Only for UI fallback — real auth should be backend cookie
      Cookies.set("admin_data", JSON.stringify(data.admin), {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      // 🔄 Refresh global admin state (important)
      await refreshAdmin();

      // 🚀 Redirect to dashboard
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid email or password. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ⏳ While checking auth, prevent flicker
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg font-semibold text-gray-600">
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-orange-100 p-6 sm:p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white text-3xl font-bold mb-4 shadow-md">
            🍱
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Admin Login
          </h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base">
            Access the ReadyMealz Admin Panel
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition disabled:opacity-60"
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition disabled:opacity-60 pr-12"
                disabled={loading}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-xl font-semibold shadow-md hover:brightness-105 transition disabled:opacity-60 disabled:cursor-not-allowed mt-3"
          >
            {loading ? "Logging in..." : "Login to Dashboard"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Protected area — only for authorized admins</p>
        </div>
      </div>
    </div>
  );
}