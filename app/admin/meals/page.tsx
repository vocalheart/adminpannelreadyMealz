"use client";

import { useState, useEffect, useCallback } from "react";
import AdminProtectedRoute from "@/app/components/AdminProtectedRoute";
import api from "@/app/lib/axios";
import {
  FaPlus, FaEdit, FaTrashAlt, FaSearch, FaCheckCircle,
  FaTimesCircle, FaImage, FaUpload, FaTrash, FaFire,
  FaStar, FaBoxOpen, FaToggleOn, FaToggleOff, FaChevronDown,
} from "react-icons/fa";

/* ─── Types ─────────────────────────────────────── */
interface Category  { _id: string; name: string; }
interface FoodType  { _id: string; name: string; }
interface Tag       { _id: string; name: string; }

interface MealImage { _id?: string; url: string; key: string; }

interface Meal {
  _id: string;
  name: string;
  slug?: string;
  price: number;
  description: string;
  category?: Category;
  foodType?: FoodType;
  tags?: Tag[];
  images: MealImage[];
  // discount
  discountPercentage?: number;
  discountPrice?: number;
  // availability
  isAvailable?: boolean;
  isFeatured?: boolean;
  status?: "active" | "inactive";
  // stock
  stock?: number;
  isUnlimitedStock?: boolean;
  // prep
  preparationTime?: number;
  servingSize?: string;
  // nutrition
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  createdAt: string;
}

type FormState = {
  name: string;
  price: string;
  description: string;
  category: string;
  foodType: string;
  tags: string[];
  discountPercentage: string;
  discountPrice: string;
  isAvailable: boolean;
  isFeatured: boolean;
  status: "active" | "inactive";
  stock: string;
  isUnlimitedStock: boolean;
  preparationTime: string;
  servingSize: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
};

const defaultForm: FormState = {
  name: "", price: "", description: "",
  category: "", foodType: "", tags: [],
  discountPercentage: "", discountPrice: "",
  isAvailable: true, isFeatured: false, status: "active",
  stock: "0", isUnlimitedStock: true,
  preparationTime: "", servingSize: "",
  calories: "", protein: "", carbs: "", fat: "",
};

/* ─── Helpers ────────────────────────────────────── */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden">
    <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition";

/* ─── Main Component ─────────────────────────────── */
export default function MealManagement() {
  const [meals, setMeals]             = useState<Meal[]>([]);
  const [pagination, setPagination]   = useState<any>(null);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [foodTypes, setFoodTypes]     = useState<FoodType[]>([]);
  const [allTags, setAllTags]         = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm]   = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editMeal, setEditMeal]       = useState<Meal | null>(null);
  const [form, setForm]               = useState<FormState>(defaultForm);
  const [newImages, setNewImages]     = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [loading, setLoading]         = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [message, setMessage]         = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    discount: false, stock: false, nutrition: false,
  });

  /* ── fetch meals ── */
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
          total: res.data.total || 0,
          totalPages: res.data.totalPages || 1,
        });
      }
    } catch (err: any) {
      showMessage(err?.response?.data?.message || "Failed to load meals", "error");
    } finally {
      setFetchLoading(false);
    }
  }, []);

  /* ── load filter data ── */
  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, ftRes, tagRes] = await Promise.all([
          api.get("/admin/get-category"),
          api.get("/admin/get-foodtypes"),
          api.get("/admin/get-tags"),
        ]);
        setCategories(catRes.data.categories || catRes.data.data || []);
        setFoodTypes(ftRes.data.foodTypes   || ftRes.data.data  || []);
        setAllTags(tagRes.data.tags         || tagRes.data.data || []);
      } catch (e) { console.error("Filter load failed", e); }
    };
    load();
  }, []);

  useEffect(() => { fetchMeals(currentPage, searchTerm); }, [currentPage, fetchMeals]);

  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); fetchMeals(1, searchTerm); }, 600);
    return () => clearTimeout(t);
  }, [searchTerm, fetchMeals]);

  /* ── open modals ── */
  const openCreate = () => {
    setEditMeal(null);
    setForm(defaultForm);
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
      tags: meal.tags?.map((t) => t._id) || [],
      discountPercentage: meal.discountPercentage?.toString() || "",
      discountPrice: meal.discountPrice?.toString() || "",
      isAvailable: meal.isAvailable ?? true,
      isFeatured: meal.isFeatured ?? false,
      status: meal.status || "active",
      stock: meal.stock?.toString() || "0",
      isUnlimitedStock: meal.isUnlimitedStock ?? true,
      preparationTime: meal.preparationTime?.toString() || "",
      servingSize: meal.servingSize || "",
      calories: meal.calories?.toString() || "",
      protein: meal.protein?.toString() || "",
      carbs: meal.carbs?.toString() || "",
      fat: meal.fat?.toString() || "",
    });
    setNewImages([]);
    setImagesToDelete([]);
    setModalOpen(true);
  };

  /* ── form submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price.trim()) {
      showMessage("Name and price are required", "error");
      return;
    }
    const currentCount = editMeal ? editMeal.images.length - imagesToDelete.length : 0;
    if (currentCount + newImages.length > 5) {
      showMessage("Maximum 5 images allowed", "error");
      return;
    }
    if (!editMeal && newImages.length === 0) {
      showMessage("At least one image is required", "error");
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();

      // basic
      data.append("name", form.name.trim());
      data.append("price", form.price);
      data.append("description", form.description.trim());
      if (form.category)  data.append("categoryId", form.category);
      if (form.foodType)  data.append("foodType", form.foodType);
      form.tags.forEach((t) => data.append("tags", t));

      // discount
      if (form.discountPercentage) data.append("discountPercentage", form.discountPercentage);
      if (form.discountPrice)      data.append("discountPrice", form.discountPrice);

      // availability
      data.append("isAvailable",    String(form.isAvailable));
      data.append("isFeatured",     String(form.isFeatured));
      data.append("status",         form.status);

      // stock
      data.append("isUnlimitedStock", String(form.isUnlimitedStock));
      if (!form.isUnlimitedStock)  data.append("stock", form.stock);

      // prep
      if (form.preparationTime) data.append("preparationTime", form.preparationTime);
      if (form.servingSize)     data.append("servingSize", form.servingSize.trim());

      // nutrition
      if (form.calories) data.append("calories", form.calories);
      if (form.protein)  data.append("protein",  form.protein);
      if (form.carbs)    data.append("carbs",    form.carbs);
      if (form.fat)      data.append("fat",      form.fat);

      // images
      newImages.forEach((f) => data.append("images", f));
      if (editMeal && imagesToDelete.length) {
        imagesToDelete.forEach((k) => data.append("deleteImages", k));
      }

      const endpoint = editMeal ? `/admin/update-meal/${editMeal._id}` : "/admin/add-meal";
      const method   = editMeal ? "put" : "post";
      const res      = await api[method](endpoint, data, { headers: { "Content-Type": "multipart/form-data" } });

      if (res.data.success) {
        showMessage(editMeal ? "Meal updated!" : "Meal created!", "success");
        setModalOpen(false);
        fetchMeals(currentPage, searchTerm);
      } else {
        showMessage(res.data.message || "Operation failed", "error");
      }
    } catch (err: any) {
      showMessage(err?.response?.data?.message || "Failed to save meal", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── image helpers ── */
  const markImageForDelete = (key: string) =>
    setImagesToDelete((p) => [...new Set([...p, key])]);

  const removeNewImage = (i: number) =>
    setNewImages((p) => p.filter((_, idx) => idx !== i));

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const arr   = Array.from(files);
    const current = (editMeal?.images?.length || 0) - imagesToDelete.length + newImages.length;
    if (current + arr.length > 5) {
      showMessage("Maximum 5 images allowed", "error");
      return;
    }
    setNewImages((p) => [...p, ...arr]);
  };

  /* ── delete meal ── */
  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setLoading(true);
      const res = await api.delete(`/admin/delete-meal/${deleteModal.id}`);
      if (res.data.success) {
        showMessage("Meal deleted", "success");
        fetchMeals(currentPage, searchTerm);
      } else showMessage(res.data.message || "Delete failed", "error");
    } catch (err: any) {
      showMessage(err?.response?.data?.message || "Failed to delete", "error");
    } finally {
      setLoading(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const toggleSection = (key: string) =>
    setExpandedSections((p) => ({ ...p, [key]: !p[key] }));

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  /* ─────────────── RENDER ─────────────── */
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50/60 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meal Management</h1>
              <p className="text-gray-500 mt-1 text-sm">{pagination?.total || meals.length} meals total</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition"
            >
              <FaPlus /> Add Meal
            </button>
          </div>

          {/* ── Toast ── */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {message.type === "success" ? <FaCheckCircle /> : <FaTimesCircle />}
              {message.text}
            </div>
          )}

          {/* ── Search ── */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search meals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          {/* ── Table ── */}
          {fetchLoading ? (
            <div className="text-center py-16 text-gray-400">Loading meals...</div>
          ) : meals.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No meals found. Add your first meal.</div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Image","Name","Price / Discount","Category · Type","Status","Actions"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {meals.map((m) => (
                      <tr key={m._id} className="hover:bg-orange-50/20 transition">
                        <td className="px-5 py-4">
                          {m.images?.[0]?.url
                            ? <img src={m.images[0].url} alt="" className="h-12 w-12 object-cover rounded-lg" />
                            : <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center"><FaImage className="text-gray-300 text-xl" /></div>
                          }
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900 text-sm">{m.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{m.description || "—"}</div>
                          <div className="flex gap-1 mt-1">
                            {m.isFeatured && <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full"><FaStar className="text-[10px]" />Featured</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-gray-900">₹{m.price}</div>
                          {(m.discountPercentage ?? 0) > 0 && (
                            <div className="text-xs text-green-600 font-medium mt-0.5">
                              {m.discountPercentage}% off → ₹{m.discountPrice?.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          <span>{m.category?.name || "—"}</span>
                          <span className="text-gray-400 mx-1">·</span>
                          <span>{m.foodType?.name || "—"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                            m.status === "active" && m.isAvailable
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-gray-100 text-gray-500 border border-gray-200"
                          }`}>
                            {m.status === "active" && m.isAvailable ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => openEdit(m)} className="text-orange-500 hover:text-orange-700 transition" title="Edit"><FaEdit /></button>
                            <button onClick={() => setDeleteModal({ open: true, id: m._id })} className="text-red-500 hover:text-red-700 transition" title="Delete"><FaTrashAlt /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {meals.map((m) => (
                  <div key={m._id} className="p-4">
                    <div className="flex gap-3 mb-3">
                      {m.images?.[0]?.url
                        ? <img src={m.images[0].url} alt="" className="h-16 w-16 object-cover rounded-lg flex-shrink-0" />
                        : <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><FaImage className="text-gray-300 text-xl" /></div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{m.name}</p>
                        <p className="text-sm font-medium text-gray-700 mt-0.5">₹{m.price}
                          {(m.discountPercentage ?? 0) > 0 && <span className="text-green-600 text-xs ml-2">-{m.discountPercentage}%</span>}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{m.category?.name || "—"} · {m.foodType?.name || "—"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(m)} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium">Edit</button>
                      <button onClick={() => setDeleteModal({ open: true, id: m._id })} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium">Delete</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {(pagination?.totalPages || 0) > 1 && (
                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}
                    className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">Previous</button>
                  <span className="text-sm text-gray-600">Page {currentPage} of {pagination.totalPages}</span>
                  <button disabled={currentPage === pagination.totalPages} onClick={() => setCurrentPage((p) => p + 1)}
                    className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">Next</button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ CREATE / EDIT MODAL ══════════════ */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl w-full max-w-4xl my-8 shadow-2xl">

                {/* Modal Header */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                  <h2 className="text-xl font-bold text-gray-900">{editMeal ? "Edit Meal" : "Add New Meal"}</h2>
                  <button onClick={() => setModalOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xl transition">×</button>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">

                  {/* ── Basic Info ── */}
                  <Section title="Basic Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="Meal Name" required>
                        <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)}
                          className={inputCls} placeholder="e.g. Chicken Biryani" required />
                      </Field>
                      <Field label="Price (₹)" required>
                        <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setField("price", e.target.value)}
                          className={inputCls} placeholder="0.00" required />
                      </Field>
                    </div>
                    <div className="mt-5">
                      <Field label="Description">
                        <textarea value={form.description} onChange={(e) => setField("description", e.target.value)}
                          rows={3} className={inputCls} placeholder="Brief description of the meal..." />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                      <Field label="Preparation Time (mins)">
                        <input type="number" min="0" value={form.preparationTime} onChange={(e) => setField("preparationTime", e.target.value)}
                          className={inputCls} placeholder="e.g. 30" />
                      </Field>
                      <Field label="Serving Size">
                        <input type="text" value={form.servingSize} onChange={(e) => setField("servingSize", e.target.value)}
                          className={inputCls} placeholder="e.g. 1 bowl (350g)" />
                      </Field>
                    </div>
                  </Section>

                  {/* ── Category & Tags ── */}
                  <Section title="Category & Tags">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <Field label="Category">
                        <select value={form.category} onChange={(e) => setField("category", e.target.value)} className={inputCls}>
                          <option value="">None</option>
                          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Food Type">
                        <select value={form.foodType} onChange={(e) => setField("foodType", e.target.value)} className={inputCls}>
                          <option value="">None</option>
                          {foodTypes.map((ft) => <option key={ft._id} value={ft._id}>{ft.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Tags (multi-select)">
                        <select multiple value={form.tags}
                          onChange={(e) => setField("tags", Array.from(e.target.selectedOptions, (o) => o.value))}
                          className={`${inputCls} h-28`}>
                          {allTags.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                      </Field>
                    </div>
                  </Section>

                  {/* ── Availability & Status ── */}
                  <Section title="Availability & Status">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <Field label="Status">
                        <select value={form.status} onChange={(e) => setField("status", e.target.value as "active"|"inactive")} className={inputCls}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </Field>

                      {/* Toggle: Is Available */}
                      <Field label="Is Available">
                        <button type="button" onClick={() => setField("isAvailable", !form.isAvailable)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition w-full ${
                            form.isAvailable ? "bg-green-50 border-green-300 text-green-700" : "bg-gray-50 border-gray-300 text-gray-500"
                          }`}>
                          {form.isAvailable ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
                          {form.isAvailable ? "Available" : "Unavailable"}
                        </button>
                      </Field>

                      {/* Toggle: Is Featured */}
                      <Field label="Featured Meal">
                        <button type="button" onClick={() => setField("isFeatured", !form.isFeatured)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition w-full ${
                            form.isFeatured ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-gray-50 border-gray-300 text-gray-500"
                          }`}>
                          <FaStar className={form.isFeatured ? "text-amber-500" : "text-gray-400"} />
                          {form.isFeatured ? "Featured" : "Not Featured"}
                        </button>
                      </Field>
                    </div>
                  </Section>

                  {/* ── Discount (collapsible) ── */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button type="button" onClick={() => toggleSection("discount")}
                      className="w-full flex items-center justify-between bg-gray-50 px-5 py-3 border-b border-gray-200 hover:bg-gray-100 transition">
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                        <FaFire className="text-orange-400" /> Discount (Optional)
                      </span>
                      <FaChevronDown className={`text-gray-400 text-xs transition-transform ${expandedSections.discount ? "rotate-180" : ""}`} />
                    </button>
                    {expandedSections.discount && (
                      <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <Field label="Discount %">
                            <input type="number" min="0" max="100" value={form.discountPercentage}
                              onChange={(e) => setField("discountPercentage", e.target.value)}
                              className={inputCls} placeholder="e.g. 10" />
                          </Field>
                          <Field label="Discount Price (₹) — auto-calculated if left blank">
                            <input type="number" step="0.01" min="0" value={form.discountPrice}
                              onChange={(e) => setField("discountPrice", e.target.value)}
                              className={inputCls} placeholder="Override calculated price" />
                          </Field>
                        </div>
                        {form.discountPercentage && form.price && !form.discountPrice && (
                          <p className="text-xs text-green-600 mt-2">
                            Auto price: ₹{(Number(form.price) - (Number(form.price) * Number(form.discountPercentage)) / 100).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Stock (collapsible) ── */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button type="button" onClick={() => toggleSection("stock")}
                      className="w-full flex items-center justify-between bg-gray-50 px-5 py-3 border-b border-gray-200 hover:bg-gray-100 transition">
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                        <FaBoxOpen className="text-blue-400" /> Stock Control (Optional)
                      </span>
                      <FaChevronDown className={`text-gray-400 text-xs transition-transform ${expandedSections.stock ? "rotate-180" : ""}`} />
                    </button>
                    {expandedSections.stock && (
                      <div className="p-5">
                        <div className="flex items-center gap-4 mb-4">
                          <button type="button" onClick={() => setField("isUnlimitedStock", !form.isUnlimitedStock)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                              form.isUnlimitedStock ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-300 text-gray-500"
                            }`}>
                            {form.isUnlimitedStock ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}
                            Unlimited Stock
                          </button>
                        </div>
                        {!form.isUnlimitedStock && (
                          <Field label="Stock Quantity">
                            <input type="number" min="0" value={form.stock}
                              onChange={(e) => setField("stock", e.target.value)}
                              className={`${inputCls} max-w-[200px]`} placeholder="0" />
                          </Field>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Nutrition (collapsible) ── */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button type="button" onClick={() => toggleSection("nutrition")}
                      className="w-full flex items-center justify-between bg-gray-50 px-5 py-3 border-b border-gray-200 hover:bg-gray-100 transition">
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Nutrition Info (Optional)</span>
                      <FaChevronDown className={`text-gray-400 text-xs transition-transform ${expandedSections.nutrition ? "rotate-180" : ""}`} />
                    </button>
                    {expandedSections.nutrition && (
                      <div className="p-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                          {[
                            { label: "Calories (kcal)", key: "calories" as const, placeholder: "0" },
                            { label: "Protein (g)",     key: "protein"  as const, placeholder: "0" },
                            { label: "Carbs (g)",       key: "carbs"    as const, placeholder: "0" },
                            { label: "Fat (g)",         key: "fat"      as const, placeholder: "0" },
                          ].map(({ label, key, placeholder }) => (
                            <Field key={key} label={label}>
                              <input type="number" min="0" step="0.1" value={form[key]}
                                onChange={(e) => setField(key, e.target.value)}
                                className={inputCls} placeholder={placeholder} />
                            </Field>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Images ── */}
                  <Section title="Images (max 5)">
                    {/* Existing images — edit mode */}
                    {editMeal && editMeal.images?.length > 0 && (
                      <div className="mb-5">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Current Images</p>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {editMeal.images
                            .filter((img) => !imagesToDelete.includes(img.key))
                            .map((img) => (
                              <div key={img.key} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                                <img src={img.url} alt="" className="h-full w-full object-cover" />
                                <button type="button" onClick={() => markImageForDelete(img.key)}
                                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                  <FaTrash className="text-white text-sm" />
                                </button>
                              </div>
                            ))}
                        </div>
                        {imagesToDelete.length > 0 && (
                          <p className="text-xs text-red-500 mt-1">{imagesToDelete.length} image(s) marked for deletion</p>
                        )}
                      </div>
                    )}

                    {/* New image previews */}
                    {newImages.length > 0 && (
                      <div className="mb-5">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">New Images</p>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {newImages.map((file, idx) => (
                            <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                              <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                              <button type="button" onClick={() => removeNewImage(idx)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <FaTrash className="text-white text-sm" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload button */}
                    <label className="cursor-pointer inline-flex items-center gap-2 border-2 border-dashed border-orange-300 hover:border-orange-400 bg-orange-50 hover:bg-orange-100 px-5 py-3 rounded-xl text-orange-700 font-medium text-sm transition">
                      <FaUpload /> Upload Images
                      <input type="file" multiple accept="image/*" onChange={(e) => handleImageFiles(e.target.files)} className="hidden" />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">
                      {(editMeal?.images?.length || 0) - imagesToDelete.length + newImages.length} / 5 images selected
                    </p>
                  </Section>

                  {/* ── Submit ── */}
                  <div className="flex gap-4 pt-2">
                    <button type="submit" disabled={loading}
                      className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm transition shadow-sm ${
                        loading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
                      }`}>
                      {loading ? "Saving..." : editMeal ? "Update Meal" : "Create Meal"}
                    </button>
                    <button type="button" onClick={() => setModalOpen(false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm text-gray-700 transition">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Delete Confirm Modal ── */}
          {deleteModal.open && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-7 shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Meal?</h3>
                <p className="text-gray-500 text-sm mb-6">This cannot be undone. The meal and all its images will be permanently removed.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteModal({ open: false, id: null })}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm text-gray-700 transition">
                    Cancel
                  </button>
                  <button onClick={confirmDelete} disabled={loading}
                    className={`flex-1 py-3 text-white rounded-xl font-semibold text-sm transition ${
                      loading ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
                    }`}>
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