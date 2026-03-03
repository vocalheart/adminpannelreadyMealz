// app/admin/food-types/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import AdminProtectedRoute from "@/app/components/AdminProtectedRoute";
import api from "@/app/lib/axios"; // adjust path if needed
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaUtensils,
  FaLeaf,
} from "react-icons/fa";

interface FoodType {
  _id: string;
  name: string;
  createdBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  next: string | null;
  previous: string | null;
}

export default function FoodTypeManagement() {
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editFoodType, setEditFoodType] = useState<FoodType | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const fetchFoodTypes = useCallback(async (page: number = 1, search: string = "") => {
    try {
      setFetchLoading(true);
      setCurrentPage(page);

      const params: any = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();

      const res = await api.get("/admin/get-foodtypes", { params });

      if (res.data.success) {
        setFoodTypes(res.data.foodTypes || []);
        setPagination({
          page: res.data.page || page,
          limit: 10,
          total: res.data.count || res.data.foodTypes?.length || 0,
          totalPages: Math.ceil((res.data.count || res.data.foodTypes?.length || 0) / 10),
          next: null,
          previous: null,
        });
      }
    } catch (error: any) {
      showMessage(
        error?.response?.data?.message || "Failed to load food types",
        "error"
      );
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoodTypes(currentPage, searchTerm);
  }, [currentPage, fetchFoodTypes]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchFoodTypes(1, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchFoodTypes]);

  const openCreateModal = () => {
    setEditFoodType(null);
    setFormData({ name: "" });
    setModalOpen(true);
  };

  const openEditModal = (type: FoodType) => {
    setEditFoodType(type);
    setFormData({ name: type.name });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showMessage("Food type name is required", "error");
      return;
    }

    try {
      setLoading(true);
      let res;

      if (editFoodType) {
        res = await api.put(`/admin/update-foodtype/${editFoodType._id}`, formData);
      } else {
        res = await api.post("/admin/create-foodtype", formData);
      }

      if (res.data.success) {
        showMessage(
          editFoodType ? "Food type updated successfully" : "Food type created successfully",
          "success"
        );
        setModalOpen(false);
        fetchFoodTypes(currentPage, searchTerm);
      }
    } catch (err: any) {
      showMessage(
        err?.response?.data?.message || "Operation failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id: string) => setDeleteModal({ open: true, id });
  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setLoading(true);
      const res = await api.delete(`/admin/delete-foodtype/${deleteModal.id}`);
      if (res.data.success) {
        showMessage("Food type deleted successfully", "success");
        fetchFoodTypes(currentPage, searchTerm);
      }
    } catch (err: any) {
      showMessage(
        err?.response?.data?.message || "Delete failed",
        "error"
      );
    } finally {
      setLoading(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), type === "error" ? 6000 : 4000);
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50/60 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Food Type Management
              </h1>
              <p className="mt-1.5 text-gray-600 text-sm">
                Manage food categories like Veg, Non-Veg, Jain, etc. • {foodTypes.length} shown
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
            >
              <FaPlus className="text-sm" />
              Create Food Type
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
          {/* Main Content */}
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            {/* Search Bar */}
            <div className="p-5 sm:p-6 border-b border-gray-200">
              <div className="relative max-w-md">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search food types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition"
                />
              </div>
            </div>

            {fetchLoading ? (
              <div className="p-12 text-center text-gray-500">Loading food types...</div>
            ) : foodTypes.length === 0 ? (
              <div className="p-12 text-center">
                <FaUtensils className="mx-auto text-5xl text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">
                  {searchTerm ? "No matching food types found" : "No food types yet"}
                </h3>
                <p className="text-gray-500 mt-2">
                  {searchTerm ? "Try different keywords" : "Create your first food type (Veg, Non-Veg, Jain, etc.)"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Food Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Created By
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {foodTypes.map((type) => (
                        <tr key={type._id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                            <FaLeaf className="text-emerald-600" />
                            {type.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {type.createdBy?.name || "System"} (
                            {type.createdBy?.email || "—"})
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(type.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditModal(type)}
                                className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition"
                                title="Edit food type"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => openDeleteModal(type._id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                                title="Delete food type"
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
                  {foodTypes.map((type) => (
                    <div key={type._id} className="p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <FaLeaf className="text-emerald-600" />
                        <h3 className="font-semibold text-base">{type.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Created by: {type.createdBy?.name || "System"} (
                        {type.createdBy?.email || "—"})
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        {new Date(type.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEditModal(type)}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg text-sm font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(type._id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium transition"
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
                        disabled={currentPage === 1 || fetchLoading || loading}
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
                          currentPage === pagination.totalPages || fetchLoading || loading
                        }
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <FaUtensils className="text-orange-600" />
                    {editFoodType ? "Edit Food Type" : "Create New Food Type"}
                  </h2>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Food Type Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                      placeholder="e.g. Vegetarian, Non-Vegetarian, Jain, Vegan, Eggetarian"
                      required
                    />
                  </div>

                  <div className="flex gap-4 pt-6 border-t">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 py-2.5 rounded-lg font-medium text-white transition ${
                        loading
                          ? "bg-orange-400 cursor-not-allowed"
                          : "bg-orange-600 hover:bg-orange-700"
                      }`}
                    >
                      {loading
                        ? "Saving..."
                        : editFoodType
                        ? "Update Food Type"
                        : "Create Food Type"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
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

        {/* Delete Confirmation */}
        {deleteModal.open && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Delete Food Type?
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                This action cannot be undone. Meals assigned to this food type may lose classification.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteModal({ open: false, id: null })}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-lg font-medium text-white transition ${
                    loading ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {loading ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminProtectedRoute>
  );
}