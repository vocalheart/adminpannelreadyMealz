// app/admin/categories/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import AdminProtectedRoute from "@/app/components/AdminProtectedRoute";
import api from "@/app/lib/axios"; // adjust path if needed
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaFolder,
  FaTags,
} from "react-icons/fa";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  next: string | null;
  previous: string | null;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const fetchCategories = useCallback(async (page: number = 1, search: string = "") => {
    try {
      setFetchLoading(true);
      setCurrentPage(page);
      const params: any = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      const res = await api.get("/category", { params });
      if (res.data.success) {
        setCategories(res.data.categories || []);
        setPagination({
          page: res.data.page,
          limit: res.data.limit,
          total: res.data.total,
          totalPages: res.data.totalPages,
          next: res.data.pagination?.next || null,
          previous: res.data.pagination?.previous || null,
        });
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load categories. Please check your connection.";
      showMessage(msg, "error");
    } finally {
      setFetchLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchCategories(currentPage, searchTerm);
  }, [currentPage, fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchCategories(1, searchTerm);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchCategories]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "name") {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
  };

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");

  const openModalForCreate = () => {
    setEditCategory(null);
    setFormData({ name: "", slug: "", description: "" });
    setModalOpen(true);
  };

  const openModalForEdit = (cat: Category) => {
    setEditCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setEditCategory(null);
      setFormData({ name: "", slug: "", description: "" });
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      showMessage("Name and Slug are required", "error");
      return;
    }

    try {
      setLoading(true);
      let res;

      if (editCategory) {
        res = await api.put(`/category/${editCategory._id}`, formData);
      } else {
        res = await api.post("/category/create", formData);
      }

      if (res.data.success) {
        showMessage(
          editCategory ? "Category updated successfully" : "Category created successfully",
          "success"
        );
        closeModal();
        fetchCategories(currentPage, searchTerm);
      } else {
        showMessage(res.data.message || "Operation failed", "error");
      }
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";
      showMessage(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id: string) => setDeleteModal({ open: true, id });

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    try {
      setLoading(true);
      const res = await api.delete(`/category/${deleteModal.id}`);

      if (res.data.success) {
        showMessage("Category deleted successfully", "success");
        fetchCategories(currentPage, searchTerm);
      } else {
        showMessage(res.data.message || "Delete operation failed", "error");
      }
    } catch (error: any) {
      let errMsg = "Only SuperAdmin Can Delete. Please try again.";

      if (error?.response) {
        const { status, data } = error.response;
        if (status === 403) {
          errMsg = "You do not have permission to delete categories (Superadmin only?)";
        } else if (status === 401) {
          errMsg = "Session expired. Please login again.";
        } else {
          errMsg = data?.message || errMsg;
        }
      }

      showMessage(errMsg, "error");
    } finally {
      setLoading(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), type === "error" ? 7000 : 5000);
  };

  const goToPage = (page: number) => {
    if (page < 1 || (pagination && page > pagination.totalPages)) return;
    setCurrentPage(page);
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50/60 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Category Management
              </h1>
              <p className="mt-1.5 text-gray-600 text-sm">
                Manage food categories • {categories.length} shown
              </p>
            </div>

            <button
              onClick={openModalForCreate}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
            >
              <FaPlus className="text-sm" />
              Create Category
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

          {/* Main Content Container */}
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            {/* Search */}
            <div className="p-5 sm:p-6 border-b border-gray-200">
              <div className="relative max-w-md">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition"
                />
              </div>
            </div>

            {fetchLoading ? (
              <div className="p-12 text-center text-gray-500">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center">
                <FaFolder className="mx-auto text-5xl text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">
                  {searchTerm ? "No matching categories" : "No categories yet"}
                </h3>
                <p className="text-gray-500 mt-2">
                  {searchTerm ? "Try different keywords" : "Create your first category"}
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
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Slug
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {categories.map((cat) => (
                        <tr key={cat._id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-mono">{cat.slug}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {cat.description || <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openModalForEdit(cat)}
                                className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => openDeleteModal(cat._id)}
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
                  {categories.map((cat) => (
                    <div key={cat._id} className="p-5">
                      <h3 className="font-semibold text-base mb-1">{cat.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Slug:</span> {cat.slug}
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        {cat.description || "No description provided"}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => openModalForEdit(cat)}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg text-sm font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(cat._id)}
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
                    <FaTags className="text-orange-600" />
                    {editCategory ? "Edit Category" : "Create New Category"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Slug *
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/40 resize-none"
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
                        ? "Processing..."
                        : editCategory
                        ? "Update Category"
                        : "Create Category"}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
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

        {/* Delete Confirmation Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Delete Category?
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                This action cannot be undone. Meals and items in this category may become uncategorized.
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