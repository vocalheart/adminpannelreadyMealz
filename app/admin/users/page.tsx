// app/admin/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import AdminProtectedRoute from "@/app/components/AdminProtectedRoute"; // adjust path if needed
import api from "@/app/lib/axios"; // adjust path if needed
import {
  FaSearch,
  FaEdit,
  FaBan,
  FaUnlock,
  FaTrashAlt,
  FaUserShield,
  FaCheckCircle,
  FaTimesCircle,
  FaUser,
} from "react-icons/fa";

interface User {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  role: "user" | "admin" | "superadmin";
  isBlocked: boolean;
  isActive: boolean;
  status: "pending" | "approved" | "rejected";
  profileImage?: string;
  createdAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [editModal, setEditModal] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User>>({});

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchUsers = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users", {
        params: { page, limit: 10, search: searchTerm.trim() },
      });

      if (res.data.success) {
        setUsers(res.data.users || []);
        setPagination(res.data.pagination);
        setCurrentPage(page);
      }
    } catch (err: any) {
      setMessage({
        text: err?.response?.data?.message || "Failed to load users",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, search);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1, search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleBlockToggle = async (id: string, shouldBlock: boolean) => {
    try {
      const endpoint = shouldBlock ? "block" : "unblock";
      const res = await api.put(`/admin/users/${id}/${endpoint}`);
      if (res.data.success) {
        setMessage({
          text: `User successfully ${shouldBlock ? "blocked" : "unblocked"}`,
          type: "success",
        });
        fetchUsers(currentPage, search);
      }
    } catch (err: any) {
      setMessage({
        text: err?.response?.data?.message || "Action failed",
        type: "error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data.success) {
        setMessage({ text: "User deleted successfully", type: "success" });
        fetchUsers(currentPage, search);
      }
    } catch (err: any) {
      setMessage({
        text: err?.response?.data?.message || "Delete failed",
        type: "error",
      });
    }
  };

  const openEdit = (user: User) => {
    setEditModal(user);
    setForm({
      name: user.name,
      email: user.email,
      mobile: user.mobile || "",
      role: user.role,
      status: user.status,
      isActive: user.isActive,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;

    try {
      const res = await api.put(`/admin/users/${editModal._id}`, form);
      if (res.data.success) {
        setMessage({ text: "User updated successfully", type: "success" });
        setEditModal(null);
        fetchUsers(currentPage, search);
      }
    } catch (err: any) {
      setMessage({
        text: err?.response?.data?.message || "Update failed",
        type: "error",
      });
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50/60 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                User Management
              </h1>
              <p className="mt-1.5 text-gray-600 text-sm">
                Manage all registered users • {users.length} shown
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition text-sm"
              />
            </div>
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
                <FaCheckCircle className="text-green-600 text-lg flex-shrink-0" />
              ) : (
                <FaTimesCircle className="text-red-600 text-lg flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Table / Loading / Empty */}
          {loading ? (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center text-gray-500">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center">
              <FaUser className="mx-auto text-5xl text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700">No users found</h3>
              <p className="text-gray-500 mt-2">
                {search ? "Try different search terms" : "No users registered yet"}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                        Mobile
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
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
                  <tbody className="bg-white divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.name}
                                className="h-9 w-9 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                          {user.mobile || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                          <span
                            className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                              user.role === "superadmin"
                                ? "bg-purple-100 text-purple-800"
                                : user.role === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${
                              user.isBlocked
                                ? "bg-red-50 text-red-700 border-red-200"
                                : user.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : user.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {user.isBlocked ? "Blocked" : user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                              onClick={() => openEdit(user)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                              title="Edit user"
                            >
                              <FaEdit />
                            </button>

                            {user.isBlocked ? (
                              <button
                                onClick={() => handleBlockToggle(user._id, false)}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition"
                                title="Unblock user"
                              >
                                <FaUnlock />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlockToggle(user._id, true)}
                                className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition"
                                title="Block user"
                              >
                                <FaBan />
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(user._id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                              title="Delete user"
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

              {/* Pagination */}
              {pagination && (
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-gray-600">
                  <div>
                    Showing {(currentPage - 1) * 10 + 1} –{" "}
                    {Math.min(currentPage * 10, pagination.total)} of {pagination.total}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
                    >
                      Previous
                    </button>

                    <span className="px-4 py-2 font-medium">
                      Page {currentPage} of {pagination.totalPages || 1}
                    </span>

                    <button
                      disabled={currentPage === pagination.totalPages}
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

          {/* Edit Modal */}
          {editModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 sm:p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <FaUserShield className="text-orange-600" />
                    Edit User
                  </h2>

                  <form onSubmit={handleUpdate} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={form.name || ""}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={form.email || ""}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={form.mobile || ""}
                        onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Role
                      </label>
                      <select
                        value={form.role || "user"}
                        onChange={(e) =>
                          setForm({ ...form, role: e.target.value as "user" | "admin" | "superadmin" })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40 bg-white"
                        disabled // only superadmin should change this – add logic later
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => setEditModal(null)}
                        className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium shadow-sm"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminProtectedRoute>
  );
}