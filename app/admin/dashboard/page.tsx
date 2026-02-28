"use client";

import AdminProtectedRoute from "@/app/components/AdminProtectedRoute";
import { useAdminAuth } from "@/app/context/AdminAuthContext";

export default function AdminDashboard() {
  const { admin, logout } = useAdminAuth();

  return (
    <AdminProtectedRoute>
      <div className="p-6">
        <h1 className="text-2xl font-bold">
          Welcome, {admin?.name} 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Email: {admin?.email}
        </p>

        <button
          onClick={logout}
          className="mt-6 bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    </AdminProtectedRoute>
  );
}