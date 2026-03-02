"use client";

import { useAdminAuth } from "../context/AdminAuthContext";
import AdminSidebar from "./AdminSidebar";
import MainContent from "./MainContent";

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading admin...
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <AdminSidebar />}
      <MainContent>{children}</MainContent>
    </>
  );
}