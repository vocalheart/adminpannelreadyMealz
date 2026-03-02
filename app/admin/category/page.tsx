"use client";

import React, { useEffect, useState } from "react";
import AdminProtectedRoute from "@/app/components/AdminProtectedRoute";
import api from "../../lib/axios"; // adjust path if needed

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
};
export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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

  /* =========================
     FETCH CATEGORIES (with pagination support later if needed)
  ========================= */
  const fetchCategories = async () => {
    try {
      setFetchLoading(true);
      const res = await api.get("/category?limit=1000"); // increase limit temporarily or implement pagination
      const data = res.data.categories || [];
      setCategories(data);
      setFilteredCategories(data);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load categories. Please check your connection.";
      showMessage(msg, "error");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  /* =========================
     CLIENT-SIDE SEARCH FILTER
  ========================= */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(term) ||
        cat.slug.toLowerCase().includes(term)
    );
    setFilteredCategories(filtered);
  }, [searchTerm, categories]);

  /* =========================
     FORM HANDLERS
  ========================= */
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
        fetchCategories();
      } else {
        showMessage(res.data.message || "Operation failed", "error");
      }
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";
      showMessage(errMsg, "error");
      console.error("SAVE CATEGORY ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DELETE with better feedback
  ========================= */
  const openDeleteModal = (id: string) => setDeleteModal({ open: true, id });

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    try {
      setLoading(true); // reuse loading state
      const res = await api.delete(`/category/${deleteModal.id}`);

      if (res.data.success) {
        showMessage("Category deleted successfully", "success");
        fetchCategories();
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
      console.error("DELETE CATEGORY ERROR:", error);
    } finally {
      setLoading(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    // longer display for errors
    setTimeout(() => setMessage(null), type === "error" ? 7000 : 5000);
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Manage Categories
            </h1>
            <button
              onClick={openModalForCreate}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:brightness-105 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition text-sm sm:text-base whitespace-nowrap"
            >
              + Create Category
            </button>
          </div>

          {/* Message Toast - more visible on error */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl shadow-md border text-sm sm:text-base animate-fade-in ${
                message.type === "success"
                  ? "bg-green-50 border-green-300 text-green-800"
                  : "bg-red-50 border-red-300 text-red-800 font-medium"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Search + List */}
          <div className="bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden">
            {/* ... search input remains the same ... */}
            <div className="p-5 sm:p-6 border-b border-gray-200">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search by name or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {fetchLoading ? (
              <div className="text-center py-12 text-gray-500 text-sm">Loading categories...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                {searchTerm ? "No matching categories found" : "No categories yet. Create one!"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table */}
                <table className="w-full min-w-[640px] hidden md:table text-xs sm:text-sm">
                  <thead className="bg-orange-50">
                    <tr>
                      <th className="p-4 text-left font-semibold text-gray-700">Name</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Slug</th>
                      <th className="p-4 text-left font-semibold text-gray-700">Description</th>
                      <th className="p-4 text-center font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((cat) => (
                      <tr key={cat._id} className="border-b hover:bg-orange-50/60 transition">
                        <td className="p-4 font-medium">{cat.name}</td>
                        <td className="p-4 text-gray-600 font-mono">{cat.slug}</td>
                        <td className="p-4 text-gray-600">
                          {cat.description || <span className="text-gray-400">-</span>}
                        </td>
                        <td className="p-4 text-center space-x-3">
                          <button
                            onClick={() => openModalForEdit(cat)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(cat._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition shadow-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Cards - same as before */}
                <div className="md:hidden divide-y divide-gray-200">
                  {filteredCategories.map((cat) => (
                    <div key={cat._id} className="p-5">
                      <h3 className="font-semibold text-base mb-2">{cat.name}</h3>
                      <p className="text-xs text-gray-600 mb-1">
                        <span className="font-medium">Slug:</span> {cat.slug}
                      </p>
                      <p className="text-xs text-gray-600 mb-4">
                        {cat.description || "No description"}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => openModalForEdit(cat)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(cat._id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal - unchanged */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 md:p-7">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editCategory ? "Edit Category" : "Create New Category"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 text-sm">
                  {/* ... form fields same as before ... */}
                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">Category Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">Slug *</label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1.5">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 py-3 px-6 rounded-xl font-semibold text-white transition shadow-md ${
                        loading
                          ? "bg-orange-300 cursor-not-allowed"
                          : "bg-gradient-to-r from-orange-500 to-orange-600 hover:brightness-105"
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
                      className="flex-1 py-3 px-6 rounded-xl font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Category?</h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone. Associated items may be affected.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteModal({ open: false, id: null })}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition text-sm md:text-base"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-xl font-semibold text-white transition shadow-md text-sm md:text-base ${
                    loading
                      ? "bg-red-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
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