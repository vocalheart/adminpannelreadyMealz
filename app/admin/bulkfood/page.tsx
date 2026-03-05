"use client";

import React, { useEffect, useState, useCallback } from "react";
import AdminProtectedRoute from "@/app/components/AdminProtectedRoute";
import api from "@/app/lib/axios";
import {
  FaPlus, FaEdit, FaTrashAlt, FaSearch, FaCheckCircle,
  FaTimesCircle, FaImage, FaUpload, FaTrash, FaBoxOpen,
} from "react-icons/fa";

/* ─── Types ─────────────────────────────────── */
interface BulkImage {
  _id: string;
  url: string;
  key: string;
}

interface BulkOrder {
  _id: string;
  name: string;
  description?: string;
  price: number;
  minQuantity?: number;
  maxQuantity?: number;
  category?: string;
  preparationTime?: number;
  imageUrl: BulkImage[];
  isAvailable?: boolean;
  createdAt: string;
}

type FormState = {
  name: string;
  description: string;
  price: string;
  minQuantity: string;
  maxQuantity: string;
  category: string;
  preparationTime: string;
};

const defaultForm: FormState = {
  name: "",
  description: "",
  price: "",
  minQuantity: "",
  maxQuantity: "",
  category: "",
  preparationTime: "",
};

/* ─── Input class ────────────────────────────── */
const inputCls =
  "w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition";

/* ─── Field wrapper ──────────────────────────── */
const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

/* ─── Section wrapper ────────────────────────── */
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden">
    <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
        {title}
      </h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function BulkOrderManagement() {
  const [orders, setOrders]         = useState<BulkOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen]   = useState(false);
  const [editOrder, setEditOrder]   = useState<BulkOrder | null>(null);
  const [form, setForm]             = useState<FormState>(defaultForm);

  // Images
  const [newImages, setNewImages]               = useState<File[]>([]);
  const [uploadModalOpen, setUploadModalOpen]   = useState<string | null>(null); // holds order _id
  const [uploadFiles, setUploadFiles]           = useState<File[]>([]);

  // UI state
  const [loading, setLoading]         = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [message, setMessage]         = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [deleteImageModal, setDeleteImageModal] = useState<{
    open: boolean; orderId: string | null; imageId: string | null;
  }>({ open: false, orderId: null, imageId: null });

  /* ── Helpers ── */
  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  /* ── Fetch all orders ── */
  const fetchOrders = useCallback(async () => {
    setFetchLoading(true);
    try {
      const res = await api.get("/bulk/");
      if (res.data.success) setOrders(res.data.data || []);
    } catch (err: any) {
      showMessage(err?.response?.data?.message || "Failed to load bulk orders", "error");
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* ── Open create modal ── */
  const openCreate = () => {
    setEditOrder(null);
    setForm(defaultForm);
    setNewImages([]);
    setModalOpen(true);
  };

  /* ── Open edit modal ── */
  const openEdit = (order: BulkOrder) => {
    setEditOrder(order);
    setForm({
      name:            order.name,
      description:     order.description || "",
      price:           order.price.toString(),
      minQuantity:     order.minQuantity?.toString() || "",
      maxQuantity:     order.maxQuantity?.toString() || "",
      category:        order.category || "",
      preparationTime: order.preparationTime?.toString() || "",
    });
    setNewImages([]);
    setModalOpen(true);
  };

  /* ── Submit create / update ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price.trim()) {
      showMessage("Name and price are required", "error");
      return;
    }

    try {
      setLoading(true);

      if (editOrder) {
        /* ── UPDATE basic fields only (PUT /update/:id) ── */
        const payload: Record<string, any> = {
          name:        form.name.trim(),
          description: form.description.trim(),
          price:       Number(form.price),
        };
        if (form.minQuantity)     payload.minQuantity     = Number(form.minQuantity);
        if (form.maxQuantity)     payload.maxQuantity     = Number(form.maxQuantity);
        if (form.category)        payload.category        = form.category.trim();
        if (form.preparationTime) payload.preparationTime = Number(form.preparationTime);

        const res = await api.put(`/bulk/update/${editOrder._id}`, payload);
        if (res.data.success) {
          // If new images were selected, upload them via /update-image/:id
          if (newImages.length) {
            const imgData = new FormData();
            newImages.forEach((f) => imgData.append("images", f));
            await api.put(`/bulk/update-image/${editOrder._id}`, imgData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          }
          showMessage("Bulk order updated!", "success");
          setModalOpen(false);
          fetchOrders();
        } else {
          showMessage(res.data.message || "Update failed", "error");
        }
      } else {
        /* ── CREATE (POST /create with images) ── */
        if (!newImages.length) {
          showMessage("At least one image is required", "error");
          setLoading(false);
          return;
        }
        const data = new FormData();
        data.append("name",        form.name.trim());
        data.append("description", form.description.trim());
        data.append("price",       form.price);
        if (form.minQuantity)     data.append("minQuantity",     form.minQuantity);
        if (form.maxQuantity)     data.append("maxQuantity",     form.maxQuantity);
        if (form.category)        data.append("category",        form.category.trim());
        if (form.preparationTime) data.append("preparationTime", form.preparationTime);
        newImages.forEach((f) => data.append("images", f));

        const res = await api.post("/bulk/create", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) {
          showMessage("Bulk order created!", "success");
          setModalOpen(false);
          fetchOrders();
        } else {
          showMessage(res.data.message || "Create failed", "error");
        }
      }
    } catch (err: any) {
      showMessage(err?.response?.data?.message || "Failed to save", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── Delete order ── */
  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setLoading(true);
      const res = await api.delete(`/bulk/delete/${deleteModal.id}`);
      if (res.data.success) {
        showMessage("Bulk order deleted", "success");
        fetchOrders();
      } else showMessage(res.data.message || "Delete failed", "error");
    } catch (err: any) {
      showMessage(err?.response?.data?.message || "Failed to delete", "error");
    } finally {
      setLoading(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  /* ── Delete single image ── */
  const confirmDeleteImage = async () => {
    const { orderId, imageId } = deleteImageModal;
    if (!orderId || !imageId) return;
    try {
      setLoading(true);
      const res = await api.delete(`/bulk/delete-image/${orderId}/${imageId}`);
      if (res.data.success) {
        showMessage("Image deleted", "success");
        fetchOrders();
      } else showMessage(res.data.message || "Failed", "error");
    } catch (err: any) {
      showMessage(err?.response?.data?.message || "Failed to delete image", "error");
    } finally {
      setLoading(false);
      setDeleteImageModal({ open: false, orderId: null, imageId: null });
    }
  };

  /* ── Upload additional images (from table row) ── */
  const handleUploadImages = async () => {
    if (!uploadModalOpen || !uploadFiles.length) return;
    try {
      setLoading(true);
      const data = new FormData();
      uploadFiles.forEach((f) => data.append("images", f));
      const res = await api.put(`/bulk/update-image/${uploadModalOpen}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        showMessage("Images uploaded", "success");
        fetchOrders();
      } else showMessage(res.data.message || "Upload failed", "error");
    } catch (err: any) {
      showMessage(err?.response?.data?.message || "Upload failed", "error");
    } finally {
      setLoading(false);
      setUploadModalOpen(null);
      setUploadFiles([]);
    }
  };

  /* ── Filtered list ── */
  const filtered = orders.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ─────────────── RENDER ─────────────── */
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50/60 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bulk Order Management</h1>
              <p className="text-gray-500 mt-1 text-sm">{orders.length} bulk orders total</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition"
            >
              <FaPlus /> Add Bulk Order
            </button>
          </div>

          {/* Toast */}
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

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Table */}
          {fetchLoading ? (
            <div className="text-center py-16 text-gray-400">Loading bulk orders...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No bulk orders found.</div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Images", "Name", "Price", "Qty Range", "Category", "Prep Time", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((order) => (
                      <tr key={order._id} className="hover:bg-orange-50/20 transition">
                        {/* Images */}
                        <td className="px-5 py-4">
                          <div className="flex gap-1.5">
                            {order.imageUrl?.length ? (
                              order.imageUrl.slice(0, 3).map((img) => (
                                <div key={img._id} className="relative group">
                                  <img
                                    src={img.url}
                                    alt=""
                                    className="h-10 w-10 object-cover rounded-lg border"
                                  />
                                  {/* Delete image on hover */}
                                  <button
                                    onClick={() => setDeleteImageModal({ open: true, orderId: order._id, imageId: img._id })}
                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                    title="Delete image"
                                  >
                                    <FaTrash className="text-[8px]" />
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FaImage className="text-gray-300" />
                              </div>
                            )}
                            {/* Upload more images button */}
                            <button
                              onClick={() => { setUploadModalOpen(order._id); setUploadFiles([]); }}
                              className="h-10 w-10 bg-orange-50 border border-dashed border-orange-300 rounded-lg flex items-center justify-center text-orange-400 hover:bg-orange-100 transition"
                              title="Add images"
                            >
                              <FaPlus className="text-xs" />
                            </button>
                          </div>
                          {order.imageUrl?.length > 3 && (
                            <p className="text-xs text-gray-400 mt-1">+{order.imageUrl.length - 3} more</p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-sm text-gray-900">{order.name}</p>
                          {order.description && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{order.description}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">₹{order.price}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {order.minQuantity || "—"} – {order.maxQuantity || "—"}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600">{order.category || "—"}</td>
                        <td className="px-5 py-4 text-sm text-gray-600">
                          {order.preparationTime ? `${order.preparationTime} mins` : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <button onClick={() => openEdit(order)} className="text-orange-500 hover:text-orange-700 transition" title="Edit">
                              <FaEdit />
                            </button>
                            <button onClick={() => setDeleteModal({ open: true, id: order._id })} className="text-red-500 hover:text-red-700 transition" title="Delete">
                              <FaTrashAlt />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map((order) => (
                  <div key={order._id} className="p-4">
                    <div className="flex gap-3 mb-3">
                      {order.imageUrl?.[0]?.url ? (
                        <img src={order.imageUrl[0].url} alt="" className="h-16 w-16 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FaBoxOpen className="text-gray-300 text-2xl" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{order.name}</p>
                        <p className="text-sm font-medium text-orange-600 mt-0.5">₹{order.price}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Qty: {order.minQuantity || "—"} – {order.maxQuantity || "—"}
                        </p>
                        {order.category && <p className="text-xs text-gray-400">{order.category}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(order)} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium">Edit</button>
                      <button onClick={() => setDeleteModal({ open: true, id: order._id })} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ CREATE / EDIT MODAL ══════════ */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">

                {/* Modal Header */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editOrder ? "Edit Bulk Order" : "Add Bulk Order"}
                  </h2>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xl transition"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">

                  {/* ── Basic Info ── */}
                  <Section title="Basic Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Field label="Name" required>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setField("name", e.target.value)}
                          className={inputCls}
                          placeholder="e.g. Party Platter"
                          required
                        />
                      </Field>
                      <Field label="Price (₹)" required>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.price}
                          onChange={(e) => setField("price", e.target.value)}
                          className={inputCls}
                          placeholder="0.00"
                          required
                        />
                      </Field>
                    </div>
                    <div className="mt-5">
                      <Field label="Description">
                        <textarea
                          value={form.description}
                          onChange={(e) => setField("description", e.target.value)}
                          rows={3}
                          className={inputCls}
                          placeholder="Brief description..."
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* ── Details ── */}
                  <Section title="Order Details">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label="Min Quantity">
                        <input
                          type="number"
                          min="0"
                          value={form.minQuantity}
                          onChange={(e) => setField("minQuantity", e.target.value)}
                          className={inputCls}
                          placeholder="e.g. 10"
                        />
                      </Field>
                      <Field label="Max Quantity">
                        <input
                          type="number"
                          min="0"
                          value={form.maxQuantity}
                          onChange={(e) => setField("maxQuantity", e.target.value)}
                          className={inputCls}
                          placeholder="e.g. 500"
                        />
                      </Field>
                      <Field label="Category">
                        <input
                          type="text"
                          value={form.category}
                          onChange={(e) => setField("category", e.target.value)}
                          className={inputCls}
                          placeholder="e.g. Corporate, Wedding"
                        />
                      </Field>
                      <Field label="Preparation Time (mins)">
                        <input
                          type="number"
                          min="0"
                          value={form.preparationTime}
                          onChange={(e) => setField("preparationTime", e.target.value)}
                          className={inputCls}
                          placeholder="e.g. 60"
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* ── Images ── */}
                  <Section title={editOrder ? "Add More Images" : "Images (required)"}>

                    {/* Show existing images in edit mode */}
                    {editOrder && editOrder.imageUrl?.length > 0 && (
                      <div className="mb-5">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Current Images</p>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {editOrder.imageUrl.map((img) => (
                            <div key={img._id} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                              <img src={img.url} alt="" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setDeleteImageModal({ open: true, orderId: editOrder._id, imageId: img._id })}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                              >
                                <FaTrash className="text-white text-sm" />
                              </button>
                            </div>
                          ))}
                        </div>
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
                              <button
                                type="button"
                                onClick={() => setNewImages((p) => p.filter((_, i) => i !== idx))}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                              >
                                <FaTrash className="text-white text-sm" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <label className="cursor-pointer inline-flex items-center gap-2 border-2 border-dashed border-orange-300 hover:border-orange-400 bg-orange-50 hover:bg-orange-100 px-5 py-3 rounded-xl text-orange-700 font-medium text-sm transition">
                      <FaUpload /> Upload Images
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files) {
                            const files = Array.from(e.target.files);
                            if (newImages.length + files.length > 5) {
                              showMessage("Maximum 5 images allowed", "error");
                              return;
                            }
                            setNewImages((p) => [...p, ...files]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">{newImages.length} / 5 new images selected</p>
                  </Section>

                  {/* Submit */}
                  <div className="flex gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm transition shadow-sm ${
                        loading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
                      }`}
                    >
                      {loading ? "Saving..." : editOrder ? "Update Order" : "Create Order"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm text-gray-700 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ══════════ UPLOAD IMAGES MODAL (from table) ══════════ */}
          {uploadModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-7 shadow-2xl">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-bold text-gray-900">Upload Images</h3>
                  <button onClick={() => { setUploadModalOpen(null); setUploadFiles([]); }}
                    className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                </div>

                {/* Preview */}
                {uploadFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {uploadFiles.map((f, i) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border">
                        <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setUploadFiles((p) => p.filter((_, idx) => idx !== i))}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                        >
                          <FaTrash className="text-white text-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="cursor-pointer inline-flex items-center gap-2 border-2 border-dashed border-orange-300 bg-orange-50 hover:bg-orange-100 px-5 py-3 rounded-xl text-orange-700 font-medium text-sm transition mb-5 w-full justify-center">
                  <FaUpload /> Choose Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setUploadFiles((p) => [...p, ...files].slice(0, 5));
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <div className="flex gap-3">
                  <button onClick={() => { setUploadModalOpen(null); setUploadFiles([]); }}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm text-gray-700 transition">
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadImages}
                    disabled={loading || !uploadFiles.length}
                    className={`flex-1 py-3 text-white rounded-xl font-semibold text-sm transition ${
                      loading || !uploadFiles.length ? "bg-orange-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"
                    }`}
                  >
                    {loading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ DELETE ORDER MODAL ══════════ */}
          {deleteModal.open && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-7 shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Bulk Order?</h3>
                <p className="text-gray-500 text-sm mb-6">
                  This cannot be undone. The order and all its images will be permanently removed.
                </p>
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

          {/* ══════════ DELETE IMAGE MODAL ══════════ */}
          {deleteImageModal.open && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-7 shadow-2xl">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete this image?</h3>
                <p className="text-gray-500 text-sm mb-6">This image will be permanently removed from S3.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteImageModal({ open: false, orderId: null, imageId: null })}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm text-gray-700 transition">
                    Cancel
                  </button>
                  <button onClick={confirmDeleteImage} disabled={loading}
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