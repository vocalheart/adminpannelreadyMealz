"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin, loading, isAuthenticated } = useAdminAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">...</p>
      </div>
    );
  }
  if (!admin) return null;
  return <>{children}</>;
}