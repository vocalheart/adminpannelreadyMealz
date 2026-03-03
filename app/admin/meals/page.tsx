"use client";

import { useState, useEffect, useCallback } from "react";
import AdminProtectedRoute from "@/app/components/AdminProtectedRoute";
import api from "@/app/lib/axios";
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaSearch,
  FaUtensils,
  FaCheckCircle,
  FaTimesCircle,
  FaImage,
  FaUpload,
  FaTrash,
} from "react-icons/fa";

interface Category { _id: string; name: string; }
interface FoodType { _id: string; name: string; }
interface Tag { _id: string; name: string; }

interface MealImage {
  _id?: string;
  url: string;
  key: string;
}

interface Meal {
  _id: string;
  name: string;
  price: number;
  description: string;
  category?: Category;
  foodType?: FoodType;
  tags?: Tag[];
  images: MealImage[];
  createdAt: string;
}

export default function MealManagement() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [pagination, setPagination] = useState<any>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editMeal, setEditMeal] = useState<Meal | null>(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    foodType: "",
    tags: [] as string[],
  });

  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  // Fetch meals
  const fetchMeals = useCallback(async (page = 1, search = "") => {
    setFetchLoading(true);
    try {
      const res = await api.get("/admin/get-meals", {
        params: { page, limit: 10, search: search.trim() },
      });

      if (res.data.success) {
        setMeals(res.data.meals || []);
        setPagination({
          page: res.data.page || page,
          limit: 10,
          total: res.data.total || res.data.meals?.length || 0,
          totalPages: res.data.totalPages || Math.ceil((res.data.meals?.length || 0) / 10),
        });
      }
    } catch (err: any) {
      showMessage(err?.response?.data?.message || "Failed to load meals", "error");
    } finally {
      setFetchLoading(false);
    }
  }, []);

  // Load filter data once
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, ftRes, tagRes] = await Promise.all([
          api.get("/admin/get-category"),
          api.get("/admin/get-foodtypes"),
          api.get("/admin/get-tags"),
        ]);

        setCategories(catRes.data.categories || catRes.data.data || []);
        setFoodTypes(ftRes.data.foodTypes || ftRes.data.data || []);
        setAllTags(tagRes.data.tags || tagRes.data.data || []);
      } catch (err) {
        console.error("Failed to load filter data:", err);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    fetchMeals(currentPage, searchTerm);
  }, [currentPage, fetchMeals]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchMeals(1, searchTerm);
    }, 600);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchMeals]);

  const openCreate = () => {
    setEditMeal(null);
    setForm({
      name: "",
      price: "",
      description: "",
      category: "",
      foodType: "",
      tags: [],
    });
    setNewImages([]);
    setImagesToDelete([]);
    setModalOpen(true);
  };

  const openEdit = (meal: Meal) => {
    setEditMeal(meal);
    setForm({
      name: meal.name,
      price: meal.price.toString(),
      description: meal.description || "",
      category: meal.category?._id || "",
      foodType: meal.foodType?._id || "",
      tags: meal.tags?.map((t: Tag) => t._id) || [],
    });
    setNewImages([]);
    setImagesToDelete([]);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.price.trim()) {
      showMessage("Name and price are required", "error");
      return;
    }

    // Optional: total images check
    const currentImagesCount = editMeal ? editMeal.images.length - imagesToDelete.length : 0;
    if (currentImagesCount + newImages.length > 5) {
      showMessage("Maximum 5 images allowed in total", "error");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();

      data.append("name", form.name.trim());
      data.append("price", form.price);
      data.append("description", form.description.trim());
      if (form.category) data.append("categoryId", form.category);
      if (form.foodType) data.append("foodType", form.foodType);
      form.tags.forEach((t) => data.append("tags", t));

      newImages.forEach((file) => data.append("images", file));

      if (editMeal && imagesToDelete.length) {
        imagesToDelete.forEach((k) => data.append("deleteImages", k));
      }

      const endpoint = editMeal
        ? `/admin/update-meal/${editMeal._id}`
        : "/admin/add-meal";

      const method = editMeal ? "put" : "post";

      const res = await api[method](endpoint, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        showMessage(
          editMeal ? "Meal updated successfully" : "Meal created successfully",
          "success"
        );
        setModalOpen(false);
        fetchMeals(currentPage, searchTerm);
      } else {
        showMessage(res.data.message || "Operation failed", "error");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to save meal";
      showMessage(msg, "error");
      console.error("SAVE MEAL ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mark existing image for deletion (edit mode only)
  const markImageForDelete = (key: string) => {
    setImagesToDelete((prev) => [...new Set([...prev, key])]); // avoid duplicates
  };

  // Remove newly selected image (before submit)
  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;

    try {
      setLoading(true);
      const res = await api.delete(`/admin/delete-meal/${deleteModal.id}`);

      if (res.data.success) {
        showMessage("Meal deleted successfully", "success");
        fetchMeals(currentPage, searchTerm);
      } else {
        showMessage(res.data.message || "Delete failed", "error");
      }
    } catch (err: any) {
      showMessage(
        err?.response?.data?.message || "Failed to delete meal",
        "error"
      );
    } finally {
      setLoading(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50/60 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Meal Management
              </h1>
              <p className="text-gray-600 mt-1">{meals.length} meals found</p>
            </div>
            <button
              onClick={openCreate}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
            >
              <FaPlus /> Add Meal
            </button>
          </div>

          {/* Global message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.type === "success" ? <FaCheckCircle /> : <FaTimesCircle />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Meals list */}
          {fetchLoading ? (
            <div className="text-center py-12">Loading meals...</div>
          ) : meals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No meals found. Add your first meal.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow border overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category/Type</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {meals.map((m) => (
                      <tr key={m._id} className="hover:bg-orange-50/30">
                        <td className="px-6 py-4">
                          {m.images?.[0]?.url ? (
                            <img src={m.images[0].url} alt="" className="h-12 w-12 object-cover rounded" />
                          ) : (
                            <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                              <FaImage className="text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium">{m.name}</td>
                        <td className="px-6 py-4">₹{m.price}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {m.category?.name || "-"} • {m.foodType?.name || "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openEdit(m)}
                            className="text-orange-600 hover:text-orange-800 mr-3"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, id: m._id })}
                            className="text-red-600 hover:text-red-800"
                          >
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-200">
                {meals.map((m) => (
                  <div key={m._id} className="p-5">
                    <div className="flex gap-4 mb-3">
                      {m.images?.[0]?.url ? (
                        <img src={m.images[0].url} alt="" className="h-16 w-16 object-cover rounded" />
                      ) : (
                        <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center">
                          <FaImage className="text-gray-400 text-2xl" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{m.name}</h3>
                        <p className="text-sm text-gray-700">₹{m.price}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {m.category?.name || "-"} • {m.foodType?.name || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => openEdit(m)}
                        className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, id: m._id })}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination?.totalPages > 1 && (
                <div className="flex justify-between items-center p-6 border-t">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span>Page {currentPage} of {pagination.totalPages}</span>
                  <button
                    disabled={currentPage === pagination.totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Create / Edit Modal */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 sm:p-8">
                  <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 py-2">
                    <h2 className="text-2xl font-bold">
                      {editMeal ? "Edit Meal" : "Add New Meal"}
                    </h2>
                    <button onClick={() => setModalOpen(false)} className="text-3xl text-gray-500 hover:text-gray-700">
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Name *</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Price (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                          className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">Category</label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">None</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5">Food Type</label>
                        <select
                          value={form.foodType}
                          onChange={(e) => setForm({ ...form, foodType: e.target.value })}
                          className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">None</option>
                          {foodTypes.map((ft) => (
                            <option key={ft._id} value={ft._id}>
                              {ft.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1.5">Tags</label>
                        <select
                          multiple
                          value={form.tags}
                          onChange={(e) => {
                            const vals = Array.from(e.target.selectedOptions, (o) => o.value);
                            setForm({ ...form, tags: vals });
                          }}
                          className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 h-28"
                        >
                          {allTags.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Images Management */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Images (max 5 total)</label>

                      {/* Current images (edit mode only) */}
                      {editMeal && (editMeal.images?.length || 0) > 0 && (
                        <div className="mb-6">
                          <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                            {editMeal.images
                              .filter((img) => !imagesToDelete.includes(img.key)) // hide marked deleted
                              .map((img) => (
                                <div key={img.key} className="relative group rounded-lg overflow-hidden border">
                                  <img
                                    src={img.url}
                                    alt="meal"
                                    className="h-24 w-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => markImageForDelete(img.key)}
                                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md"
                                    title="Delete this image"
                                  >
                                    <FaTrash className="text-sm" />
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* New uploaded images preview */}
                      {newImages.length > 0 && (
                        <div className="mb-6">
                          <p className="text-sm text-gray-600 mb-2">New Images to Upload:</p>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                            {newImages.map((file, idx) => (
                              <div key={idx} className="relative group rounded-lg overflow-hidden border">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt="preview"
                                  className="h-24 w-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeNewImage(idx)}
                                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition shadow-md"
                                  title="Remove"
                                >
                                  <FaTrash className="text-sm" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Upload button */}
                      <label className="cursor-pointer inline-flex items-center gap-3 bg-orange-50 hover:bg-orange-100 px-6 py-3 rounded-lg border border-orange-200 text-orange-700 font-medium transition">
                        <FaUpload className="text-lg" />
                        <span>Upload New Images</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              const files = Array.from(e.target.files);
                              const totalAfter = (editMeal?.images?.length || 0) - imagesToDelete.length + newImages.length + files.length;
                              if (totalAfter > 5) {
                                showMessage("Maximum 5 images allowed in total", "error");
                                return;
                              }
                              setNewImages((prev) => [...prev, ...files]);
                            }
                          }}
                          className="hidden"
                        />
                      </label>

                      <p className="text-sm text-gray-500 mt-2">
                        {(editMeal?.images?.length || 0) - imagesToDelete.length + newImages.length} / 5 images
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4 pt-6 border-t">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`flex-1 py-3 rounded-lg text-white font-medium transition ${
                          loading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
                        }`}
                      >
                        {loading ? "Saving..." : editMeal ? "Update Meal" : "Create Meal"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalOpen(false)}
                        className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
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
              <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold mb-4">Delete Meal?</h3>
                <p className="text-gray-600 mb-6">
                  This action cannot be undone. The meal and its images will be permanently removed.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setDeleteModal({ open: false, id: null })}
                    className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={loading}
                    className={`flex-1 py-3 text-white rounded-lg font-medium transition ${
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
      </div>
    </AdminProtectedRoute>
  );
}