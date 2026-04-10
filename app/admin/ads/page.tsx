"use client";

import React, { useEffect, useState } from "react";
import api from "../../lib/axios";
import { toast } from "react-hot-toast";
import { Edit2, Trash2, Plus, X } from "lucide-react";

interface Ad {
  _id: string;
  title: string;
  description?: string;
  image: string;
  link?: string;
  priority: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAd, setEditAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    startDate: "",
    endDate: "",
    priority: 1,
    isActive: true,
  });

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch All Ads
  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/ads");
      setAds(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load advertisements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // Handle Input Change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Open Modal for Create / Edit
  const openModal = (ad?: Ad) => {
    if (ad) {
      setEditAd(ad);
      setFormData({
        title: ad.title,
        description: ad.description || "",
        link: ad.link || "",
        startDate: ad.startDate ? ad.startDate.split("T")[0] : "",
        endDate: ad.endDate ? ad.endDate.split("T")[0] : "",
        priority: ad.priority,
        isActive: ad.isActive,
      });
      setImagePreview(ad.image);
    } else {
      setEditAd(null);
      setFormData({
        title: "",
        description: "",
        link: "",
        startDate: "",
        endDate: "",
        priority: 1,
        isActive: true,
      });
      setImage(null);
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  // Close Modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditAd(null);
    setImage(null);
    setImagePreview(null);
  };

  // Submit Create / Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editAd && !image) {
      toast.error("Image is required for new advertisement");
      return;
    }

    setSubmitting(true);
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== "") data.append(key, String(value));
    });

    if (image) data.append("image", image);

    try {
      if (editAd) {
        await api.put(`/admin/ads/${editAd._id}`, data);
        toast.success("Advertisement updated successfully");
      } else {
        await api.post("/admin/ads/create", data);
        toast.success("Advertisement created successfully");
      }

      closeModal();
      fetchAds();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Ad
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this advertisement?")) return;

    try {
      await api.delete(`/admin/ads/${id}`);
      toast.success("Advertisement deleted");
      fetchAds();
    } catch {
      toast.error("Failed to delete advertisement");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advertisement Management</h1>
          <p className="text-gray-600 mt-1">Manage your active and inactive ads</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition"
        >
          <Plus size={20} />
          Create New Ad
        </button>
      </div>

      {/* Ads Grid */}
      {loading ? (
        <p className="text-center py-10 text-gray-500">Loading advertisements...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <div
              key={ad._id}
              className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition"
            >
              <div className="relative">
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="w-full h-52 object-cover"
                />
                <div
                  className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full ${
                    ad.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {ad.isActive ? "Active" : "Inactive"}
                </div>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                    {ad.title}
                  </h3>
                  <span className="text-orange-600 font-bold text-lg">
                    #{ad.priority}
                  </span>
                </div>

                {ad.description && (
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {ad.description}
                  </p>
                )}

                {ad.link && (
                  <a
                    href={ad.link}
                    target="_blank"
                    className="text-orange-600 text-sm mt-2 block hover:underline"
                  >
                    {ad.link.length > 40 ? ad.link.substring(0, 37) + "..." : ad.link}
                  </a>
                )}

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => openModal(ad)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Edit2 size={18} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ad._id)}
                    className="flex-1 bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-700 py-3 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[95vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-semibold">
                {editAd ? "Edit Advertisement" : "Create New Advertisement"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advertisement Image {editAd ? "" : <span className="text-red-500">*</span>}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full border border-gray-300 rounded-xl p-3 text-sm"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-4 w-full h-48 object-cover rounded-2xl border"
                  />
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Summer Sale Banner"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500"
                  placeholder="Limited period offer..."
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Redirect Link</label>
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-orange-500"
                  placeholder="https://yourwebsite.com/offer"
                />
              </div>

              {/* Dates & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-5 h-5 accent-orange-600"
                />
                <label className="text-gray-700 font-medium">Make this advertisement active</label>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-4 border border-gray-300 rounded-2xl font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white py-4 rounded-2xl font-semibold transition"
                >
                  {submitting
                    ? "Saving..."
                    : editAd
                    ? "Update Advertisement"
                    : "Create Advertisement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}