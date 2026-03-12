"use client";

import React, { useEffect, useState, useCallback } from "react";
import AdminProtectedRoute from "@/app/components/AdminProtectedRoute";
import api from "@/app/lib/axios";
import {
  FaPlus, FaEdit, FaTrashAlt, FaSearch, FaCheckCircle,
  FaTimesCircle, FaImage, FaUpload, FaTrash, FaUtensils,
} from "react-icons/fa";

/* ─── Types ─────────────────────────────────── */
interface TiffinImage {
  url: string;
  key: string;
}

interface Tiffin {
  _id: string;
  name: string;
  description: string;
  image?: TiffinImage;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

type FormState = {
  name: string;
  description: string;
};

const defaultForm: FormState = {
  name: "",
  description: "",
};

/* ─── Input class ────────────────────────────── */
const inputCls = "w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition";

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
export default function TiffinManagement() {
  const [tiffins, setTiffins] = useState<Tiffin[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTiffin, setEditTiffin] = useState<Tiffin | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  // Image state
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  /* ── Helpers ── */
  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  /* ── Fetch all tiffins ── */
  const fetchTiffins = useCallback(async () => {
    setFetchLoading(true);
    try {
      const res = await api.get("/admin/tiffin/");
      if (res.data.success) setTiffins(res.data.data || []);
    } catch (err: any) {
      showMessage(err?.response?.data?.message || "Failed to load tiffins", "error");
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => { fetchTiffins(); }, [fetchTiffins]);

  /* ── Open create modal ── */
  const openCreate = () => {
    setEditTiffin(null);
    setForm(defaultForm);
    setNewImage(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  /* ── Open edit modal ── */
  const openEdit = (tiffin: Tiffin) => {
    setEditTiffin(tiffin);
    setForm({
      name: tiffin.name,
      description: tiffin.description,
    });
    setNewImage(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  /* ── Handle image selection ── */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /* ── Submit create / update ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) {
      showMessage("Name and description are required", "error");
      return;
    }

    try {
      setLoading(true);

      if (editTiffin) {
        /* ── UPDATE ── */
        const data = new FormData();
        data.append("name", form.name.trim());
        data.append("description", form.description.trim());
        if (newImage) {
          data.append("image", newImage);
        }

        const res = await api.put(`/admin/tiffin/update-tiffin/${editTiffin._id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) {
          showMessage("Tiffin updated!", "success");
          setModalOpen(false);
          fetchTiffins();
        } else {
          showMessage(res.data.message || "Update failed", "error");
        }
      } else {
        /* ── CREATE ── */
        if (!newImage) {
          showMessage("Image is required", "error");
          setLoading(false);
          return;
        }
        const data = new FormData();
        data.append("name", form.name.trim());
        data.append("description", form.description.trim());
        data.append("image", newImage);

        const res = await api.post("/admin/tiffin/create-tiffin", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) {
          showMessage("Tiffin created!", "success");
          setModalOpen(false);
          fetchTiffins();
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

  /* ── Delete tiffin ── */
  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      setLoading(true);
      const res = await api.delete(`/admin/tiffin/delete-tiffin/${deleteModal.id}`);
      if (res.data.success) {
        showMessage("Tiffin deleted", "success");
        fetchTiffins();
      } else showMessage(res.data.message || "Delete failed", "error");
    } catch (err: any) {
      showMessage(err?.response?.data?.message || "Failed to delete", "error");
    } finally {
      setLoading(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  /* ── Filtered list ── */
  const filtered = tiffins.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ─────────────── RENDER ─────────────── */
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50/60 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FaUtensils className="text-orange-600" />
                Tiffin Management
              </h1>
              <p className="text-gray-500 mt-1 text-sm">{tiffins.length} tiffins total</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition"
            >
              <FaPlus /> Add Tiffin
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
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Grid */}
          {fetchLoading ? (
            <div className="text-center py-16 text-gray-400">Loading tiffins...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <FaUtensils className="mx-auto text-4xl text-gray-200 mb-3" />
              <p className="text-gray-400">No tiffins found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((tiffin) => (
                <div key={tiffin._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                  
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
                    {tiffin.image?.url ? (
                      <img
                        src={tiffin.image.url}
                        alt={tiffin.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaImage className="text-4xl text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{tiffin.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tiffin.description}</p>
                    
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => openEdit(tiffin)}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                      >
                        <FaEdit className="text-xs" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, id: tiffin._id })}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                      >
                        <FaTrashAlt className="text-xs" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══════════ CREATE / EDIT MODAL ══════════ */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">

                {/* Modal Header */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editTiffin ? "Edit Tiffin" : "Add Tiffin"}
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
                    <div className="space-y-5">
                      <Field label="Name" required>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setField("name", e.target.value)}
                          className={inputCls}
                          placeholder="e.g. Home-style Dal Makhani"
                          required
                        />
                      </Field>
                      <Field label="Description" required>
                        <textarea
                          value={form.description}
                          onChange={(e) => setField("description", e.target.value)}
                          rows={4}
                          className={inputCls}
                          placeholder="Describe your tiffin dish, ingredients, and preparation details..."
                          required
                        />
                      </Field>
                    </div>
                  </Section>

                  {/* ── Image ── */}
                  <Section title={editTiffin ? "Update Image (optional)" : "Image (required)"}>

                    {/* Current image in edit mode */}
                    {editTiffin && editTiffin.image?.url && !imagePreview && (
                      <div className="mb-5">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-3">Current Image</p>
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video max-w-xs">
                          <img src={editTiffin.image.url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewImage(null)}
                            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition"
                          >
                            <FaTrash className="text-white text-lg" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* New image preview */}
                    {imagePreview && (
                      <div className="mb-5">
                        <p className="text-xs font-medium text-gray-500 uppercase mb-3">New Image Preview</p>
                        <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video max-w-xs">
                          <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setNewImage(null);
                              setImagePreview(null);
                            }}
                            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition"
                          >
                            <FaTrash className="text-white text-lg" />
                          </button>
                        </div>
                      </div>
                    )}

                    <label className="cursor-pointer inline-flex items-center gap-2 border-2 border-dashed border-orange-300 hover:border-orange-400 bg-orange-50 hover:bg-orange-100 px-5 py-3 rounded-xl text-orange-700 font-medium text-sm transition">
                      <FaUpload /> {imagePreview ? "Change Image" : "Upload Image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
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
                      {loading ? "Saving..." : editTiffin ? "Update Tiffin" : "Create Tiffin"}
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

          {/* ══════════ DELETE MODAL ══════════ */}
          {deleteModal.open && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-7 shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Tiffin?</h3>
                <p className="text-gray-500 text-sm mb-6">
                  This cannot be undone. The tiffin and its image will be permanently removed.
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

        </div>
      </div>
    </AdminProtectedRoute>
  );
}