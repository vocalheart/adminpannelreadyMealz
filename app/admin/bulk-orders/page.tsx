"use client";

import React, { useEffect, useState, useCallback } from "react";
import AdminProtectedRoute from "@/app/components/AdminProtectedRoute";
import api from "@/app/lib/axios";
import {
  Search, Eye, Trash2, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Clock, Phone, Mail, Building2,
  CalendarDays, Package, Users, IndianRupee, RefreshCw,
  CreditCard, Hash, AlertCircle, ShieldCheck,
} from "lucide-react";

/* ─── Types ─────────────────────────────────── */
interface BulkOrderRef {
  _id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: { url: string; key: string; _id: string }[];
}

interface Quote {
  _id: string;
  bulkOrder?: BulkOrderRef;
  name: string;
  email: string;
  phone: string;
  company?: string;
  eventType: string;
  eventDate: string;
  quantity: number;
  requirements?: string;
  estimatedTotal: number;
  status: "pending" | "contacted" | "confirmed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

/* ─── Status config ──────────────────────────── */
const STATUS_CONFIG: Record<
  Quote["status"],
  { label: string; cls: string; dot: string }
> = {
  pending:   { label: "Pending",   cls: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-400" },
  contacted: { label: "Contacted", cls: "bg-blue-50 text-blue-700 border-blue-200",       dot: "bg-blue-400"   },
  confirmed: { label: "Confirmed", cls: "bg-green-50 text-green-700 border-green-200",    dot: "bg-green-500"  },
  cancelled: { label: "Cancelled", cls: "bg-red-50 text-red-600 border-red-200",          dot: "bg-red-400"    },
};

/* ─── Payment Status config ──────────────────── */
const PAYMENT_CONFIG: Record<
  Quote["paymentStatus"],
  { label: string; cls: string; dot: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Unpaid",
    cls: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-400",
    icon: <Clock className="w-3 h-3" />,
  },
  paid: {
    label: "Paid",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    icon: <ShieldCheck className="w-3 h-3" />,
  },
  failed: {
    label: "Failed",
    cls: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-400",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

const STATUS_OPTIONS: Quote["status"][] = ["pending", "contacted", "confirmed", "cancelled"];

/* ─── Helpers ────────────────────────────────── */
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

/* ─── Status Badge ───────────────────────────── */
function StatusBadge({ status }: { status: Quote["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ─── Payment Badge ──────────────────────────── */
function PaymentBadge({ status }: { status: Quote["paymentStatus"] }) {
  const cfg = PAYMENT_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/* ─── Detail Modal ───────────────────────────── */
function DetailModal({
  quote,
  onClose,
  onStatusChange,
  statusLoading,
}: {
  quote: Quote;
  onClose: () => void;
  onStatusChange: (id: string, status: Quote["status"]) => void;
  statusLoading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl my-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Quote Details</h2>
            <p className="text-xs text-gray-400 mt-0.5">Submitted {fmtDateTime(quote.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <PaymentBadge status={quote.paymentStatus} />
            <StatusBadge status={quote.status} />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition text-xl"
            >×</button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Bulk Order Pack */}
          {quote.bulkOrder && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
              {quote.bulkOrder.imageUrl?.[0]?.url ? (
                <img
                  src={quote.bulkOrder.imageUrl[0].url}
                  alt={quote.bulkOrder.name}
                  className="w-12 h-12 rounded-lg object-cover border border-orange-200 flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{quote.bulkOrder.name}</p>
                <p className="text-xs text-gray-500">
                  ₹{quote.bulkOrder.price.toLocaleString("en-IN")} / unit
                  {quote.bulkOrder.category && <span className="ml-2 capitalize">· {quote.bulkOrder.category}</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">Estimated</p>
                <p className="text-base font-bold text-orange-500">₹{quote.estimatedTotal.toLocaleString("en-IN")}</p>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={<Users className="w-4 h-4" />}    label="Name"    value={quote.name} />
              <InfoRow icon={<Mail className="w-4 h-4" />}     label="Email"   value={quote.email} />
              <InfoRow icon={<Phone className="w-4 h-4" />}    label="Phone"   value={quote.phone} />
              {quote.company && (
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Company" value={quote.company} />
              )}
            </div>
          </div>

          {/* Event Details */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Event Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={<Package className="w-4 h-4" />}      label="Event Type" value={quote.eventType} />
              <InfoRow icon={<CalendarDays className="w-4 h-4" />} label="Event Date" value={fmtDate(quote.eventDate)} />
              <InfoRow icon={<Users className="w-4 h-4" />}        label="Quantity"   value={`${quote.quantity} units`} />
              <InfoRow icon={<IndianRupee className="w-4 h-4" />}  label="Est. Total" value={`₹${quote.estimatedTotal.toLocaleString("en-IN")}`} bold />
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment Information</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Payment Status display */}
              <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 mt-0.5 shrink-0"><CreditCard className="w-4 h-4" /></span>
                <div>
                  <p className="text-xs text-gray-400">Payment Status</p>
                  <div className="mt-1">
                    <PaymentBadge status={quote.paymentStatus} />
                  </div>
                </div>
              </div>

              {/* Razorpay Order ID */}
              <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 mt-0.5 shrink-0"><Hash className="w-4 h-4" /></span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Razorpay Order ID</p>
                  {quote.razorpayOrderId ? (
                    <p className="text-xs font-mono font-medium text-gray-700 mt-0.5 break-all">{quote.razorpayOrderId}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5 italic">Not generated</p>
                  )}
                </div>
              </div>

              {/* Razorpay Payment ID */}
              <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3 sm:col-span-2">
                <span className="text-gray-400 mt-0.5 shrink-0"><ShieldCheck className="w-4 h-4" /></span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Razorpay Payment ID</p>
                  {quote.razorpayPaymentId ? (
                    <p className="text-xs font-mono font-medium text-emerald-700 mt-0.5 break-all">{quote.razorpayPaymentId}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5 italic">Not captured</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {quote.requirements && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Additional Requirements</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">{quote.requirements}</p>
            </div>
          )}

          {/* Status update */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Update Quote Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => {
                const cfg = STATUS_CONFIG[s];
                const isActive = quote.status === s;
                return (
                  <button
                    key={s}
                    disabled={statusLoading || isActive}
                    onClick={() => onStatusChange(quote._id, s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      isActive
                        ? cfg.cls + " cursor-default"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                    } disabled:opacity-60`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── InfoRow ────────────────────────────────── */
function InfoRow({
  icon, label, value, bold,
}: {
  icon: React.ReactNode; label: string; value: string; bold?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm mt-0.5 ${bold ? "font-bold text-orange-500" : "text-gray-800 font-medium"}`}>{value}</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function BulkQuotesAdminPage() {
  const [quotes, setQuotes]           = useState<Quote[]>([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch]                     = useState("");
  const [filterStatus, setFilterStatus]         = useState<string>("");
  const [filterPayment, setFilterPayment]       = useState<string>("");
  const [loading, setLoading]                   = useState(false);
  const [statusLoading, setStatusLoading]       = useState(false);
  const [message, setMessage]                   = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [detailQuote, setDetailQuote]   = useState<Quote | null>(null);
  const [deleteModal, setDeleteModal]   = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const LIMIT = 12;

  const showMsg = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  /* ── Fetch quotes ── */
  const fetchQuotes = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: LIMIT };
      if (search.trim())   params.search        = search.trim();
      if (filterStatus)    params.status        = filterStatus;
      if (filterPayment)   params.paymentStatus = filterPayment;

      const res = await api.get("/bulk-quotes", { params });
      if (res.data.success) {
        setQuotes(res.data.quotes || []);
        setTotal(res.data.total || 0);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (err: any) {
      showMsg(err?.response?.data?.message || "Failed to fetch quotes", "error");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPayment]);

  useEffect(() => { setCurrentPage(1); fetchQuotes(1); }, [filterStatus, filterPayment]);
  useEffect(() => {
    const t = setTimeout(() => { setCurrentPage(1); fetchQuotes(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { fetchQuotes(currentPage); }, [currentPage]);

  /* ── Update status ── */
  const handleStatusChange = async (id: string, status: Quote["status"]) => {
    setStatusLoading(true);
    try {
      const res = await api.patch(`/bulk-quotes/${id}/status`, { status });
      if (res.data.success) {
        showMsg("Status updated", "success");
        setQuotes((p) => p.map((q) => q._id === id ? { ...q, status } : q));
        if (detailQuote?._id === id) setDetailQuote((p) => p ? { ...p, status } : p);
      } else showMsg(res.data.message || "Update failed", "error");
    } catch (err: any) {
      showMsg(err?.response?.data?.message || "Failed to update", "error");
    } finally {
      setStatusLoading(false);
    }
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      const res = await api.delete(`/bulk-quotes/${deleteModal.id}`);
      if (res.data.success) {
        showMsg("Quote deleted", "success");
        setQuotes((p) => p.filter((q) => q._id !== deleteModal.id));
        setTotal((p) => p - 1);
        if (detailQuote?._id === deleteModal.id) setDetailQuote(null);
      } else showMsg(res.data.message || "Delete failed", "error");
    } catch (err: any) {
      showMsg(err?.response?.data?.message || "Failed to delete", "error");
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  };

  /* ── Status counts (from current loaded data) ── */
  const counts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  const paymentCounts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.paymentStatus] = (acc[q.paymentStatus] || 0) + 1;
    return acc;
  }, {});

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50/60 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bulk Order Quotes</h1>
              <p className="text-gray-500 text-sm mt-1">{total} total requests</p>
            </div>
            <button
              onClick={() => fetchQuotes(currentPage)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>

          {/* ── Toast ── */}
          {message && (
            <div className={`mb-5 p-4 rounded-xl flex items-center gap-3 text-sm border ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}>
              {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          {/* ── Quote Status Stats Strip ── */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quote Status</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {STATUS_OPTIONS.map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
                  className={`p-4 rounded-2xl border text-left transition ${
                    filterStatus === s
                      ? cfg.cls + " shadow-sm"
                      : "bg-white border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <p className={`text-2xl font-bold ${filterStatus === s ? "" : "text-gray-800"}`}>
                    {counts[s] ?? 0}
                  </p>
                  <p className={`text-xs mt-0.5 font-medium ${filterStatus === s ? "" : "text-gray-500"}`}>
                    {cfg.label}
                  </p>
                </button>
              );
            })}
          </div>

          {/* ── Payment Stats Strip ── */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payment Status</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(["pending", "paid", "failed"] as Quote["paymentStatus"][]).map((s) => {
              const cfg = PAYMENT_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => setFilterPayment(filterPayment === s ? "" : s)}
                  className={`p-4 rounded-2xl border text-left transition ${
                    filterPayment === s
                      ? cfg.cls + " shadow-sm"
                      : "bg-white border-gray-100 hover:border-gray-300"
                  }`}
                >
                  <p className={`text-2xl font-bold ${filterPayment === s ? "" : "text-gray-800"}`}>
                    {paymentCounts[s] ?? 0}
                  </p>
                  <p className={`text-xs mt-0.5 font-medium ${filterPayment === s ? "" : "text-gray-500"}`}>
                    {cfg.label}
                  </p>
                </button>
              );
            })}
          </div>

          {/* ── Search + Filters ── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none bg-white"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-gray-700"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none text-gray-700"
            >
              <option value="">All Payments</option>
              <option value="pending">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* ── Table ── */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 animate-pulse">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-6 bg-gray-100 rounded-full w-20 shrink-0" />
                  <div className="h-8 bg-gray-100 rounded-lg w-16 shrink-0" />
                </div>
              ))}
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500 font-medium">No quotes found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Customer", "Bulk Pack", "Event", "Qty / Total", "Payment", "Date", "Status", "Actions"].map((h) => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quotes.map((q) => (
                      <tr key={q._id} className="hover:bg-orange-50/20 transition">
                        {/* Customer */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900">{q.name}</p>
                          <p className="text-xs text-gray-400">{q.email}</p>
                          <p className="text-xs text-gray-400">{q.phone}</p>
                        </td>
                        {/* Bulk Pack */}
                        <td className="px-5 py-4">
                          {q.bulkOrder ? (
                            <div className="flex items-center gap-2">
                              {q.bulkOrder.imageUrl?.[0]?.url && (
                                <img
                                  src={q.bulkOrder.imageUrl[0].url}
                                  alt=""
                                  className="w-8 h-8 rounded-lg object-cover border flex-shrink-0"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900 leading-tight">{q.bulkOrder.name}</p>
                                <p className="text-xs text-gray-400">₹{q.bulkOrder.price.toLocaleString("en-IN")}/unit</p>
                              </div>
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        {/* Event */}
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-700">{q.eventType}</p>
                          <p className="text-xs text-gray-400">{fmtDate(q.eventDate)}</p>
                        </td>
                        {/* Qty / Total */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900">{q.quantity} units</p>
                          <p className="text-xs font-semibold text-orange-500">₹{q.estimatedTotal.toLocaleString("en-IN")}</p>
                        </td>
                        {/* Payment */}
                        <td className="px-5 py-4">
                          <PaymentBadge status={q.paymentStatus} />
                          {q.razorpayPaymentId && (
                            <p className="text-xs text-gray-400 font-mono mt-1 max-w-[120px] truncate" title={q.razorpayPaymentId}>
                              {q.razorpayPaymentId}
                            </p>
                          )}
                        </td>
                        {/* Submitted */}
                        <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                          {fmtDate(q.createdAt)}
                        </td>
                        {/* Status */}
                        <td className="px-5 py-4">
                          <select
                            value={q.status}
                            onChange={(e) => handleStatusChange(q._id, e.target.value as Quote["status"])}
                            disabled={statusLoading}
                            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer transition ${STATUS_CONFIG[q.status].cls}`}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                            ))}
                          </select>
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setDetailQuote(q)}
                              className="p-2 rounded-lg bg-gray-50 hover:bg-orange-50 text-gray-500 hover:text-orange-600 transition"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteModal({ open: true, id: q._id })}
                              className="p-2 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {quotes.map((q) => (
                  <div key={q._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{q.name}</p>
                        <p className="text-xs text-gray-400">{q.phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={q.status} />
                        <PaymentBadge status={q.paymentStatus} />
                      </div>
                    </div>
                    {q.bulkOrder && (
                      <p className="text-xs text-gray-500 mb-2">
                        Pack: <span className="font-medium text-gray-700">{q.bulkOrder.name}</span>
                      </p>
                    )}
                    {q.razorpayPaymentId && (
                      <p className="text-xs text-gray-400 font-mono mb-2 truncate">
                        <span className="text-gray-500 font-sans">Payment ID: </span>
                        {q.razorpayPaymentId}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{q.quantity} units</span>
                      <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />₹{q.estimatedTotal.toLocaleString("en-IN")}</span>
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{fmtDate(q.eventDate)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDetailQuote(q)}
                        className="flex-1 py-2 bg-orange-500 text-white text-sm font-semibold rounded-xl"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, id: q._id })}
                        className="px-4 py-2 bg-red-50 text-red-600 text-sm font-semibold rounded-xl"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p as number)}
                          className={`w-9 h-9 rounded-xl text-sm font-medium transition ${
                            currentPage === p
                              ? "bg-orange-500 text-white shadow-sm"
                              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* ── Detail Modal ── */}
      {detailQuote && (
        <DetailModal
          quote={detailQuote}
          onClose={() => setDetailQuote(null)}
          onStatusChange={handleStatusChange}
          statusLoading={statusLoading}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-7 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete this quote?</h3>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, id: null })}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminProtectedRoute>
  );
}