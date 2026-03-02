"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/axios";
import AdminProtectedRoute from "@/app/components/AdminProtectedRoute";

interface Admin {
  _id: string;          // ← using _id (most common with MongoDB)
  name: string;
  email: string;
  role: "admin" | "superadmin";
  isBlocked: boolean;
}

export default function AdminManagement() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" });

  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "block" | "unblock" | "role";
    id?: string;
    newRole?: "admin" | "superadmin";
    block?: boolean;
  } | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin");
      setAdmins(res.data.admins || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to load admins";
      setMessage({ text: msg, type: "error" });
      if ([401, 403].includes(err?.response?.status)) {
        router.push("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), type === "error" ? 6000 : 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      showMessage("All fields are required", "error");
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post("/admin/signup", form);
      if (res.data.success) {
        showMessage("Admin created successfully", "success");
        setForm({ name: "", email: "", password: "", role: "admin" });
        setShowCreateModal(false);
        fetchAdmins();
      }
    } catch (err: any) {
      showMessage(
        err?.response?.data?.message || "Failed to create admin",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const requestRoleChange = (id: string, newRole: "admin" | "superadmin") => {
    setConfirmAction({ type: "role", id, newRole });
  };

  const requestBlockToggle = (id: string, currentBlocked: boolean) => {
    setConfirmAction({
      type: currentBlocked ? "unblock" : "block",
      id,
      block: !currentBlocked,
    });
  };

  const requestDelete = (id: string) => {
    setConfirmAction({ type: "delete", id });
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction?.id) return;

    try {
      setActionLoading(true);
      let res;

      switch (confirmAction.type) {
        case "role":
          res = await api.put(`/admin/${confirmAction.id}`, {
            role: confirmAction.newRole,
          });
          break;
        case "block":
        case "unblock":
          const endpoint = confirmAction.type;
          res = await api.put(`/admin/${endpoint}/${confirmAction.id}`);
          break;
        case "delete":
          res = await api.delete(`/admin/${confirmAction.id}`);
          break;
      }

      if (res?.data.success) {
        showMessage(
          confirmAction.type === "delete" ? "Admin deleted" : "Action completed",
          "success"
        );
        fetchAdmins();
      }
    } catch (err: any) {
      showMessage(
        err?.response?.data?.message || `Failed to ${confirmAction.type}`,
        "error"
      );
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600 animate-pulse">Loading admins...</div>
      </div>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Admin Management
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:brightness-105 text-white px-6 py-3 rounded-xl font-medium shadow-md transition text-sm sm:text-base whitespace-nowrap"
            >
              + Add New Admin
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl shadow-sm border animate-fade-in ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800 font-medium"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* List */}
          {admins.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-500">
              No administrators found
            </div>
          ) : (
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {admins.map((admin) => (
                      <tr
                        key={admin._id}   // ← fixed key (using _id)
                        className="hover:bg-orange-50/40 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {admin.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {admin.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={admin.role}
                            onChange={(e) =>
                              requestRoleChange(
                                admin._id,
                                e.target.value as "admin" | "superadmin"
                              )
                            }
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none"
                          >
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              admin.isBlocked
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {admin.isBlocked ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() =>
                                requestBlockToggle(admin._id, admin.isBlocked)
                              }
                              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                admin.isBlocked
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "bg-orange-600 hover:bg-orange-700 text-white"
                              }`}
                            >
                              {admin.isBlocked ? "Unblock" : "Block"}
                            </button>
                            <button
                              onClick={() => requestDelete(admin._id)}
                              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view - cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {admins.map((admin) => (
                  <div key={admin._id} className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{admin.name}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{admin.email}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          admin.isBlocked
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {admin.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                      <select
                        value={admin.role}
                        onChange={(e) =>
                          requestRoleChange(
                            admin._id,
                            e.target.value as "admin" | "superadmin"
                          )
                        }
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-orange-400 focus:border-orange-400"
                      >
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>

                      <button
                        onClick={() =>
                          requestBlockToggle(admin._id, admin.isBlocked)
                        }
                        className={`py-2 rounded-lg text-sm font-medium ${
                          admin.isBlocked
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-orange-600 hover:bg-orange-700 text-white"
                        }`}
                      >
                        {admin.isBlocked ? "Unblock" : "Block"}
                      </button>

                      <button
                        onClick={() => requestDelete(admin._id)}
                        className="py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                      Add New Admin
                    </h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-3xl text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleCreate} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Role
                      </label>
                      <select
                        value={form.role}
                        onChange={(e) =>
                          setForm({ ...form, role: e.target.value as any })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                      >
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className={`flex-1 py-3 rounded-xl font-semibold text-white transition ${
                          actionLoading
                            ? "bg-orange-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-orange-500 to-orange-600 hover:brightness-105"
                        }`}
                      >
                        {actionLoading ? "Creating..." : "Create Admin"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          {confirmAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {confirmAction.type === "delete"
                    ? "Delete Admin?"
                    : confirmAction.type === "role"
                    ? "Change Role?"
                    : confirmAction.type === "block"
                    ? "Block Admin?"
                    : "Unblock Admin?"}
                </h3>

                <p className="text-gray-600 mb-6 leading-relaxed">
                  {confirmAction.type === "delete" &&
                    "This action cannot be undone. The admin will be permanently removed."}
                  {confirmAction.type === "role" &&
                    `Are you sure you want to change this admin's role to ${confirmAction.newRole}?`}
                  {confirmAction.type === "block" &&
                    "This will prevent the admin from logging in until unblocked."}
                  {confirmAction.type === "unblock" &&
                    "This will restore login access for this admin."}
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => setConfirmAction(null)}
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeConfirmedAction}
                    disabled={actionLoading}
                    className={`flex-1 py-3 rounded-xl font-semibold text-white transition ${
                      actionLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : confirmAction.type === "delete" || confirmAction.type === "block"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {actionLoading
                      ? "Processing..."
                      : confirmAction.type === "delete"
                      ? "Yes, Delete"
                      : confirmAction.type === "block"
                      ? "Yes, Block"
                      : confirmAction.type === "unblock"
                      ? "Yes, Unblock"
                      : "Yes, Change Role"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminProtectedRoute>
  );
}