// app/admin/admins/page.tsx  (or wherever your route is)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/axios"; // adjust path
import AdminProtectedRoute from "@/app/components/AdminProtectedRoute";
import {
  FaUserShield,
  FaPlus,
  FaEdit,
  FaBan,
  FaUnlock,
  FaTrashAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCog,
  FaSearch,
} from "react-icons/fa";

interface Admin {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  isBlocked: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  count: number;
  next: string | null;
  previous: string | null;
}

export default function AdminManagement() {
  const router = useRouter();

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "superadmin",
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "block" | "unblock" | "role";
    id?: string;
    newRole?: "admin" | "superadmin";
  } | null>(null);

  const fetchAdmins = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await api.get("/admin", {
        params: { page, limit: 10 },
      });

      if (res.data.success) {
        setAdmins(res.data.admins || []);
        setPagination(res.data.pagination || null);
        setCurrentPage(page);
      }
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

  useEffect(() => {
    fetchAdmins();
  }, []);

  const validateForm = () => {
    const errors: typeof formErrors = {};
    let valid = true;

    if (!form.name.trim()) {
      errors.name = "Name is required";
      valid = false;
    }
    if (!form.email.trim()) {
      errors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = "Invalid email format";
      valid = false;
    }
    if (!form.password.trim()) {
      errors.password = "Password is required";
      valid = false;
    } else if (form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      valid = false;
    }          

    setFormErrors(errors);
    return valid;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!validateForm()) return;

    try {
      setActionLoading(true);
      const res = await api.post("/admin/signup", form);

      if (res.data.success) {
        setMessage({ text: "Admin created successfully", type: "success" });
        setForm({ name: "", email: "", password: "", role: "admin" });
        setShowCreateModal(false);
        fetchAdmins(1);
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || "Failed to create admin";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const requestAction = (
    type: "delete" | "block" | "unblock" | "role",
    id: string,
    newRole?: "admin" | "superadmin"
  ) => {
    setConfirmAction({ type, id, newRole });
  };

  const executeAction = async () => {
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
          res = await api.put(`/admin/block/${confirmAction.id}`);
          break;
        case "unblock":
          res = await api.put(`/admin/unblock/${confirmAction.id}`);
          break;
        case "delete":
          res = await api.delete(`/admin/${confirmAction.id}`);
          break;
      }

      if (res?.data.success) {
        setMessage({
          text:
            confirmAction.type === "delete"
              ? "Admin deleted"
              : "Action completed",
          type: "success",
        });
        fetchAdmins(currentPage);
      }
    } catch (err: any) {
      setMessage({
        text: err?.response?.data?.message || "Action failed",
        type: "error",
      });
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50/60 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Admin Management
              </h1>
              <p className="mt-1.5 text-gray-600 text-sm">
                Manage platform administrators • {admins.length} shown
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
            >
              <FaPlus className="text-sm" />
              Add New Admin
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg border flex items-center gap-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <FaCheckCircle className="text-green-600 text-lg" />
              ) : (
                <FaTimesCircle className="text-red-600 text-lg" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Table / Loading / Empty */}
          {loading ? (
            <div className="bg-white rounded-xl shadow border p-12 text-center text-gray-500">
              Loading administrators...
            </div>
          ) : admins.length === 0 ? (
            <div className="bg-white rounded-xl shadow border p-12 text-center">
              <FaUserShield className="mx-auto text-5xl text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No admins found</h3>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {admins.map((admin) => (
                      <tr key={admin._id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {admin.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {admin.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={admin.role}
                            onChange={(e) =>
                              requestAction(
                                "role",
                                admin._id,
                                e.target.value as "admin" | "superadmin"
                              )
                            }
                            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${
                              admin.isBlocked
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {admin.isBlocked ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {admin.isBlocked ? (
                              <button
                                onClick={() => requestAction("unblock", admin._id)}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                                title="Unblock"
                              >
                                <FaUnlock />
                              </button>
                            ) : (
                              <button
                                onClick={() => requestAction("block", admin._id)}
                                className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition"
                                title="Block"
                              >
                                <FaBan />
                              </button>
                            )}

                            <button
                              onClick={() => requestAction("delete", admin._id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {admins.map((admin) => (
                  <div key={admin._id} className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-base">{admin.name}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{admin.email}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          admin.isBlocked
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {admin.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={admin.role}
                        onChange={(e) =>
                          requestAction(
                            "role",
                            admin._id,
                            e.target.value as "admin" | "superadmin"
                          )
                        }
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>

                      {admin.isBlocked ? (
                        <button
                          onClick={() => requestAction("unblock", admin._id)}
                          className="py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => requestAction("block", admin._id)}
                          className="py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition"
                        >
                          Block
                        </button>
                      )}

                      <button
                        onClick={() => requestAction("delete", admin._id)}
                        className="py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600">
                  <div>
                    Showing {(currentPage - 1) * 10 + 1} –{" "}
                    {Math.min(currentPage * 10, pagination.total)} of {pagination.total}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      disabled={currentPage === 1 || actionLoading || loading}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
                    >
                      Previous
                    </button>

                    <span className="px-4 py-2 font-medium">
                      Page {currentPage} of {pagination.totalPages}
                    </span>

                    <button
                      disabled={
                        currentPage === pagination.totalPages || actionLoading || loading
                      }
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create Admin Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 sm:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <FaUserCog className="text-orange-600" />
                      Add New Admin
                    </h2>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setFormErrors({});
                      }}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
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
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40 ${
                          formErrors.name ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40 ${
                          formErrors.email ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40 ${
                          formErrors.password ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {formErrors.password && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Role
                      </label>
                      <select
                        value={form.role}
                        onChange={(e) =>
                          setForm({ ...form, role: e.target.value as "admin" | "superadmin" })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40 bg-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </div>

                    <div className="flex gap-4 pt-6 border-t">
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className={`flex-1 py-2.5 rounded-lg font-medium text-white transition ${
                          actionLoading
                            ? "bg-orange-400 cursor-not-allowed"
                            : "bg-orange-600 hover:bg-orange-700"
                        }`}
                      >
                        {actionLoading ? "Creating..." : "Create Admin"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateModal(false);
                          setFormErrors({});
                        }}
                        className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {confirmAction && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {confirmAction.type === "delete"
                    ? "Delete Admin?"
                    : confirmAction.type === "role"
                    ? "Change Role?"
                    : confirmAction.type === "block"
                    ? "Block Admin?"
                    : "Unblock Admin?"}
                </h3>

                <p className="text-gray-600 mb-6">
                  {confirmAction.type === "delete" &&
                    "This action is permanent and cannot be undone."}
                  {confirmAction.type === "role" &&
                    `Change role to ${confirmAction.newRole}?`}
                  {confirmAction.type === "block" &&
                    "Blocked admins cannot log in until unblocked."}
                  {confirmAction.type === "unblock" && "Restore access for this admin?"}
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => setConfirmAction(null)}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeAction}
                    disabled={actionLoading}
                    className={`flex-1 py-2.5 rounded-lg font-medium text-white transition ${
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
                      ? "Delete"
                      : confirmAction.type === "block"
                      ? "Block"
                      : confirmAction.type === "unblock"
                      ? "Unblock"
                      : "Change Role"}
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