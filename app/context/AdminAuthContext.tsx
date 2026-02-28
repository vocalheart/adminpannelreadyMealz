"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/axios";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  admin: Admin | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshAdmin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  //  Check admin auth using /admin/me
  const fetchAdmin = async () => {
    try {
      const res = await api.get("/admin/me", {
        withCredentials: true, // important for cookies
      });

      if (res.data?.success && res.data?.admin) {
        setAdmin(res.data.admin);
      } else {
        setAdmin(null);
      }
    } catch (error) {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, []);

  const refreshAdmin = async () => {
    setLoading(true);
    await fetchAdmin();
  };

  const logout = async () => {
    try {
      await api.post("/admin/logout", {}, { withCredentials: true });
    } catch (error) {
      console.log("Logout error:", error);
    } finally {
      setAdmin(null);
      window.location.href = "/admin/login";
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        isAuthenticated: !!admin,
        refreshAdmin,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

// Custom hook
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
};