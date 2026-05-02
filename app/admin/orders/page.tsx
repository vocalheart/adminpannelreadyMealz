"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "../../lib/axios";
import {Package, ChevronDown, ChevronUp, Search, Filter,Clock, CheckCircle2, XCircle, Truck, ChefHat,CreditCard, Banknote, RefreshCw, MapPin, Phone,
  User, Receipt, ShoppingBag, TrendingUp, AlertCircle,
  CheckCheck, RotateCcw, Loader2, IndianRupee, Calendar,
  BadgeCheck, Timer, ReceiptText, Pencil, ChevronRight
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────── */
interface OrderItem  { _id:string; meal:string; name:string; price:number; quantity:number; totalPrice:number }
interface DeliveryAddress { _id:string; recipientName:string; phoneNumber:string; fullAddress:string; city:string; pincode:string; state:string; isDefault:boolean }
interface StatusHistory   { status:string; timestamp:string; notes:string; _id?:string }

interface Order {
  _id:string; orderNumber:string;
  user: { _id:string; name:string; email:string; mobile?:string };
  items: OrderItem[];
  orderTotal:number; subtotal:number; discount:number; tax:number; deliveryCharge:number;
  paymentMethod:"online"|"cod"|"upi"|"wallet";
  paymentStatus:"paid"|"pending"|"refunded"|"failed";
  paymentReference:string|null;
  orderStatus:"placed"|"confirmed"|"preparing"|"ready"|"out_for_delivery"|"delivered"|"cancelled"|"returned";
  deliveryAddress: DeliveryAddress;
  notes:string; specialRequests:string;
  cancelledAt:string|null; cancelReason:string|null;
  refundAmount:number; refundStatus:string;
  estimatedDeliveryTime?:string; actualDeliveryTime?:string;
  statusHistory: StatusHistory[];
  createdAt:string; updatedAt:string;
}

interface Stats {
  totalRevenue?:number; totalOrders?:number; placedCount?:number; confirmedCount?:number;
  preparingCount?:number; deliveredCount?:number; cancelledCount?:number;
  pendingPayment?:number; refundedAmount?:number;
}

/* ─── Config ─────────────────────────────────────────────────── */
const S: Record<string,{label:string;color:string;bg:string;dot:string;icon:React.ReactNode}> = {
  placed:           {label:"Placed",          color:"#2563eb",bg:"#eff6ff",dot:"#2563eb", icon:<Clock className="w-3.5 h-3.5"/>},
  confirmed:        {label:"Confirmed",        color:"#7c3aed",bg:"#f5f3ff",dot:"#7c3aed", icon:<BadgeCheck className="w-3.5 h-3.5"/>},
  preparing:        {label:"Preparing",        color:"#d97706",bg:"#fffbeb",dot:"#d97706", icon:<ChefHat className="w-3.5 h-3.5"/>},
  ready:            {label:"Ready",            color:"#0891b2",bg:"#ecfeff",dot:"#0891b2", icon:<CheckCheck className="w-3.5 h-3.5"/>},
  out_for_delivery: {label:"Out for Delivery", color:"#0369a1",bg:"#f0f9ff",dot:"#0369a1", icon:<Truck className="w-3.5 h-3.5"/>},
  delivered:        {label:"Delivered",        color:"#16a34a",bg:"#f0fdf4",dot:"#16a34a", icon:<CheckCircle2 className="w-3.5 h-3.5"/>},
  cancelled:        {label:"Cancelled",        color:"#dc2626",bg:"#fef2f2",dot:"#dc2626", icon:<XCircle className="w-3.5 h-3.5"/>},
  returned:         {label:"Returned",         color:"#9333ea",bg:"#fdf4ff",dot:"#9333ea", icon:<RotateCcw className="w-3.5 h-3.5"/>},
};

const PS: Record<string,{label:string;color:string;bg:string}> = {
  paid:    {label:"Paid",    color:"#16a34a",bg:"#f0fdf4"},
  pending: {label:"Pending", color:"#d97706",bg:"#fffbeb"},
  refunded:{label:"Refunded",color:"#7c3aed",bg:"#f5f3ff"},
  failed:  {label:"Failed",  color:"#dc2626",bg:"#fef2f2"},
};

const PM: Record<string,string> = {cod:"Cash on Delivery",online:"Online",upi:"UPI",wallet:"Wallet"};
const RS: Record<string,string> = {pending:"Pending",processed:"Processed",rejected:"Rejected"};
const STATUSES = ["placed","confirmed","preparing","ready","out_for_delivery","delivered","cancelled","returned"];
const PAY_STATUSES = ["pending","paid","failed","refunded"];

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmt  = (n:number) => `₹${Number(n||0).toFixed(2)}`;
const fmtK = (n:number) => n >= 1000 ? `₹${(n/1000).toFixed(1)}k` : fmt(n);
const fmtD = (d:string) => new Date(d).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
const fmtDShort = (d:string) => new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
/* ─── Badges ──────────────────────────────────────────────────── */
function SBadge({status}:{status:string}) {
  const c = S[status]??S.placed;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap" style={{color:c.color,background:c.bg}}>{c.icon}{c.label}</span>;
};
function PBadge({status}:{status:string}) {
  const c = PS[status]??PS.pending;
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{color:c.color,background:c.bg}}>{c.label}</span>;
};
/* ─── Stat Card ───────────────────────────────────────────────── */
function StatCard({icon,label,value,sub,color,active}:{icon:React.ReactNode;label:string;value:string|number;sub?:string;color:string;active?:boolean}) {
  return (
    <div className="bg-white rounded-2xl p-4 border flex items-center gap-3 transition-all"
      style={{borderColor: active ? color+"60":"#f0f0f0", boxShadow: active ? `0 4px 16px ${color}20`:"0 1px 4px rgba(0,0,0,0.04)"}}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:color+"15",color}}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">{label}</p>
        <p className="text-lg font-extrabold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 truncate">{sub}</p>}
      </div>
    </div>
  );
};
/* ─── Order Card ──────────────────────────────────────────────── */
function OrderCard({order,onStatusChange,onPaymentChange,onRefund,onSetDeliveryTime,updating}:{
  order:Order;
  onStatusChange:(id:string,status:string,notes:string)=>void;
  onPaymentChange:(id:string,status:string,ref:string)=>void;
  onRefund:(id:string,amount:number,status:string,notes:string)=>void;
  onSetDeliveryTime:(id:string,time:string)=>void;
  updating:string|null;
}) {
  const [open, setOpen]           = useState(false);
  const [tab, setTab]             = useState<"details"|"status"|"payment"|"refund"|"delivery">("details");
  const [newStatus, setNewStatus] = useState(order.orderStatus);
  const [statusNote, setStatusNote] = useState("");
  const [newPayStatus, setNewPayStatus] = useState(order.paymentStatus);
  const [payRef, setPayRef]       = useState(order.paymentReference||"");
  const [refundAmt, setRefundAmt] = useState(order.refundAmount||0);
  const [refundStatus, setRefundStatus] = useState(order.refundStatus||"pending");
  const [refundNote, setRefundNote] = useState("");
  const [deliveryTime, setDeliveryTime] = useState(order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime).toISOString().slice(0,16) : "");
  const locked = ["delivered","cancelled","returned"].includes(order.orderStatus);
  const isUpdating = updating === order._id;
  const TABS = [
    {id:"details",   label:"Details",  icon:<ReceiptText className="w-3.5 h-3.5"/>},
    {id:"status",    label:"Status",   icon:<Pencil className="w-3.5 h-3.5"/>},
    {id:"payment",   label:"Payment",  icon:<CreditCard className="w-3.5 h-3.5"/>},
    {id:"refund",    label:"Refund",   icon:<RotateCcw className="w-3.5 h-3.5"/>},
    {id:"delivery",  label:"Delivery", icon:<Timer className="w-3.5 h-3.5"/>},
  ];
  return (
    <div className="bg-white border rounded-2xl overflow-hidden transition-all"
      style={{borderColor: open?"#fed7aa":"#f0f0f0", boxShadow: open?"0 8px 28px rgba(0,0,0,0.08)":"0 1px 4px rgba(0,0,0,0.04)"}}>
      {/* ── Header row ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-orange-50/30 transition-colors select-none"
        onClick={()=>setOpen(v=>!v)}>
        {/* Status dot */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background: S[order.orderStatus]?.dot||"#ccc"}} />
        {/* Order num + date */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-gray-900 tracking-tight">{order.orderNumber}</span>
            <SBadge status={order.orderStatus}/>
            {order.paymentStatus !== "paid" && <PBadge status={order.paymentStatus}/>}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{fmtD(order.createdAt)}</p>
        </div>
        {/* Customer */}
        <div className="hidden sm:block w-32 min-w-0">
          <p className="text-sm font-semibold text-gray-700 truncate">{order.user.name}</p>
          <p className="text-xs text-gray-400 truncate">{order.deliveryAddress?.city}</p>
        </div>
        {/* Items */}
        <div className="hidden md:flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
          <ShoppingBag className="w-3 h-3"/>{order.items.length}
        </div>
        {/* Amount */}
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900">{fmt(order.orderTotal)}</p>
          <p className="text-xs text-gray-400">{PM[order.paymentMethod]||order.paymentMethod}</p>
        </div>
        <span className="text-gray-400 shrink-0 ml-1">{open?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}</span>
      </div>
      {/* ── Expanded body ── */}
      {open && (
        <div className="border-t border-orange-100">
          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b border-gray-100 bg-gray-50/50">
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id as any)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all border-b-2"
                style={{borderColor: tab===t.id?"#f97316":"transparent", color: tab===t.id?"#f97316":"#6b7280", background: tab===t.id?"#fff":"transparent"}}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>       
          <div className="p-4">
            {/* ══ DETAILS TAB ══ */}
            {tab==="details" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Items */}
                <div>
                  <p className="section-title text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Items</p>
                  <div className="space-y-2">
                    {order.items.map(item=>(
                      <div key={item._id} className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100 flex justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-400">{fmt(item.price)} × {item.quantity}</p>
                        </div>
                        <span className="text-sm font-bold text-orange-500 self-center">{fmt(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                  {/* Bill */}
                  <div className="mt-3 bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-1.5 text-xs">
                    {[["Subtotal",fmt(order.subtotal)],["Tax",fmt(order.tax)],["Delivery",fmt(order.deliveryCharge)],
                      ...(order.discount>0?[["Discount",`-${fmt(order.discount)}`]]:[])
                    ].map(([k,v])=>(
                      <div key={k} className="flex justify-between text-gray-500"><span>{k}</span><span>{v}</span></div>
                    ))}
                    <div className="flex justify-between font-bold text-sm text-gray-900 pt-1.5 border-t border-gray-200">
                      <span>Total</span><span className="text-orange-500">{fmt(order.orderTotal)}</span>
                    </div>
                  </div>
                </div>
                {/* Address + History */}
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Delivery Address</p>
                    <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2">
                      <div className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-orange-400 shrink-0"/>
                        <span className="text-sm font-semibold text-gray-800">{order.deliveryAddress?.recipientName}</span>
                        {order.deliveryAddress?.isDefault && <span className="text-[10px] bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded-full font-semibold">Default</span>}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-3.5 h-3.5 text-orange-400 shrink-0"/>{order.deliveryAddress?.phoneNumber}</div>
                      <div className="flex items-start gap-2 text-sm text-gray-600"><MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5"/>
                        <span className="leading-snug">{order.deliveryAddress?.fullAddress}, <b>{order.deliveryAddress?.city}</b>, {order.deliveryAddress?.state} — {order.deliveryAddress?.pincode}</span>
                      </div>
                    </div>
                  </div>
                  {(order.notes||order.specialRequests) && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-1 text-xs">
                      {order.notes && <p className="text-amber-700"><b>Note:</b> {order.notes}</p>}
                      {order.specialRequests && <p className="text-amber-700"><b>Special:</b> {order.specialRequests}</p>}
                    </div>
                  )}

                  {order.estimatedDeliveryTime && (
                    <div className="flex items-center gap-2 text-xs bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-blue-700">
                      <Timer className="w-3.5 h-3.5 shrink-0"/><span><b>ETA:</b> {fmtD(order.estimatedDeliveryTime)}</span>
                    </div>
                  )}
                  {order.actualDeliveryTime && (
                    <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 text-green-700">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0"/><span><b>Delivered:</b> {fmtD(order.actualDeliveryTime)}</span>
                    </div>
                  )}

                  {/* Timeline */}
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Timeline</p>
                  <div className="space-y-2">
                    {order.statusHistory.map((h,i)=>{
                      const cfg = S[h.status]??{label:h.status,color:"#6b7280",bg:"#f3f4f6",icon:<Clock className="w-3 h-3"/>};
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]" style={{background:cfg.bg,color:cfg.color}}>{cfg.icon}</div>
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{cfg.label}</p>
                            <p className="text-[11px] text-gray-400">{fmtD(h.timestamp)}</p>
                            {h.notes && <p className="text-[11px] text-gray-500 italic">"{h.notes}"</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {/* ══ STATUS TAB ══ */}
            {tab==="status" && (
              <div className="max-w-sm space-y-4">
                {locked ? (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-gray-400"/>Order is <b>{S[order.orderStatus]?.label}</b> — locked
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">New Status</label>
                      <select value={newStatus} onChange={e=>setNewStatus(e.target.value as any)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 bg-gray-50 font-semibold cursor-pointer">
                        {STATUSES.map(s=><option key={s} value={s}>{S[s]?.label||s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Notes (optional)</label>
                      <input type="text" value={statusNote} onChange={e=>setStatusNote(e.target.value)}
                        placeholder="e.g. Assigned to rider #12"
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 bg-gray-50"/>
                    </div>
                    <button onClick={()=>onStatusChange(order._id,newStatus,statusNote)}
                      disabled={newStatus===order.orderStatus||isUpdating}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{background:"linear-gradient(135deg,#f97316,#ea580c)",boxShadow:"0 4px 12px rgba(249,115,22,0.3)"}}>
                      {isUpdating?<><Loader2 className="w-4 h-4 animate-spin"/>Updating…</>:<>Update Status <ChevronRight className="w-4 h-4"/></>}
                    </button>
                  </>
                )}
              </div>
            )}
            {/* ══ PAYMENT TAB ══ */}
            {tab==="payment" && (
              <div className="max-w-sm space-y-4">
                {/* Current info */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-semibold">{PM[order.paymentMethod]}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Current</span><PBadge status={order.paymentStatus}/></div>
                  {order.paymentReference && <div className="flex justify-between gap-2"><span className="text-gray-500 shrink-0">Ref</span><span className="font-mono truncate text-[11px] text-gray-600">{order.paymentReference}</span></div>}
                  <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold text-orange-500">{fmt(order.orderTotal)}</span></div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Update Payment Status</label>
                  <select value={newPayStatus} onChange={e=>setNewPayStatus(e.target.value as any)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 bg-gray-50 font-semibold cursor-pointer">
                    {PAY_STATUSES.map(s=><option key={s} value={s}>{PS[s]?.label||s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Payment Reference</label>
                  <input type="text" value={payRef} onChange={e=>setPayRef(e.target.value)}
                    placeholder="pay_xxx or txn ID"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-400 bg-gray-50 font-mono"/>
                </div>
                <button onClick={()=>onPaymentChange(order._id,newPayStatus,payRef)}
                  disabled={isUpdating}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{background:"linear-gradient(135deg,#16a34a,#15803d)",boxShadow:"0 4px 12px rgba(22,163,74,0.3)"}}>
                  {isUpdating?<><Loader2 className="w-4 h-4 animate-spin"/>Updating…</>:<><CreditCard className="w-4 h-4"/>Update Payment</>}
                </button>
              </div>
            )};
            {/* ══ REFUND TAB ══ */}
            {tab==="refund" && (
              <div className="max-w-sm space-y-4">
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-purple-600">Current Refund</span><span className="font-bold text-purple-700">{fmt(order.refundAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-purple-600">Refund Status</span><span className="font-semibold text-purple-700">{RS[order.refundStatus]||order.refundStatus}</span></div>
                  <div className="flex justify-between"><span className="text-purple-600">Order Total</span><span className="font-semibold">{fmt(order.orderTotal)}</span></div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Refund Amount (₹)</label>
                  <input type="number" value={refundAmt} onChange={e=>setRefundAmt(Number(e.target.value))}
                    min={0} max={order.orderTotal} step={0.01}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 bg-gray-50"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Refund Status</label>
                  <select value={refundStatus} onChange={e=>setRefundStatus(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 bg-gray-50 font-semibold cursor-pointer">
                    {["pending","processed","rejected"].map(s=><option key={s} value={s}>{RS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
                  <input type="text" value={refundNote} onChange={e=>setRefundNote(e.target.value)}
                    placeholder="Reason for refund decision"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 bg-gray-50"/>
                </div>
                <button onClick={()=>onRefund(order._id,refundAmt,refundStatus,refundNote)}
                  disabled={isUpdating}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{background:"linear-gradient(135deg,#9333ea,#7e22ce)",boxShadow:"0 4px 12px rgba(147,51,234,0.3)"}}>
                  {isUpdating?<><Loader2 className="w-4 h-4 animate-spin"/>Processing…</>:<><RotateCcw className="w-4 h-4"/>Process Refund</>}
                </button>
              </div>
            )};
            {/* ══ DELIVERY TIME TAB ══ */}
            {tab==="delivery" && (
              <div className="max-w-sm space-y-4">
                {order.estimatedDeliveryTime && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                    <p className="font-bold mb-0.5">Current ETA</p>
                    <p>{fmtD(order.estimatedDeliveryTime)}</p>
                  </div>
                )}
                {order.actualDeliveryTime && (
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-xs text-green-700">
                    <p className="font-bold mb-0.5">Actual Delivery</p>
                    <p>{fmtD(order.actualDeliveryTime)}</p>
                  </div>
                )};
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Set Estimated Delivery Time</label>
                  <input type="datetime-local" value={deliveryTime} onChange={e=>setDeliveryTime(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 bg-gray-50"/>
                </div>
                <button onClick={()=>deliveryTime&&onSetDeliveryTime(order._id,new Date(deliveryTime).toISOString())}
                  disabled={!deliveryTime||isUpdating}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{background:"linear-gradient(135deg,#2563eb,#1d4ed8)",boxShadow:"0 4px 12px rgba(37,99,235,0.3)"}}>
                  {isUpdating?<><Loader2 className="w-4 h-4 animate-spin"/>Setting…</>:<><Timer className="w-4 h-4"/>Set Delivery Time</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Admin Orders Page ──────────────────────────────────── */
export default function AdminOrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [stats, setStats]     = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [updating, setUpdating] = useState<string|null>(null);
  const [search, setSearch]   = useState("");
  const [statusF, setStatusF] = useState("all");
  const [payF, setPayF]       = useState("all");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const params: any = {};
      if (statusF !== "all") params.status  = statusF;
      if (payF    !== "all") params.payment = payF;
      const {data} = await api.get("/admin/meals/orders", {params});
      setOrders(data.data || []);
      if (data.stats) setStats(data.stats);
    } catch(e:any) {
      setError(e.response?.data?.message || "Failed to load orders");
    } finally { setLoading(false); }
  }, [statusF, payF]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  /* actions */
  const withUpdate = async (id:string, fn:()=>Promise<any>) => {
    setUpdating(id);
    try {
      const {data} = await fn();
      setOrders(prev => prev.map(o => o._id===id ? {...o,...data.data} : o));
    } catch(e:any) { alert(e.response?.data?.message || "Failed"); }
    finally { setUpdating(null); }
  };

  const handleStatus    = (id:string,status:string,notes:string)   => withUpdate(id,()=>api.put(`/admin/order-status/${id}`,{status,notes}));
  const handlePayment   = (id:string,paymentStatus:string,ref:string) => withUpdate(id,()=>api.put(`/admin/payment-status/${id}`,{paymentStatus,paymentReference:ref}));
  const handleRefund    = (id:string,refundAmount:number,refundStatus:string,notes:string) => withUpdate(id,()=>api.put(`/admin/refund/${id}`,{refundAmount,refundStatus,notes}));
  const handleDelivery  = (id:string,time:string)                  => withUpdate(id,()=>api.put(`/admin/delivery-time/${id}`,{estimatedDeliveryTime:time}));

  /* filter */
  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (!q || o.orderNumber.toLowerCase().includes(q) || o.user.name.toLowerCase().includes(q) || o.user.email.toLowerCase().includes(q) || o.deliveryAddress?.city?.toLowerCase().includes(q));
  });

  const revenue = orders.filter(o=>o.paymentStatus==="paid").reduce((s,o)=>s+o.orderTotal,0);
  const active  = orders.filter(o=>!["delivered","cancelled","returned"].includes(o.orderStatus)).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .op{font-family:'DM Sans',sans-serif}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .ocard{animation:fadeUp 0.3s ease both}
        .ocard:nth-child(1){animation-delay:.04s}.ocard:nth-child(2){animation-delay:.08s}
        .ocard:nth-child(3){animation-delay:.12s}.ocard:nth-child(4){animation-delay:.16s}
        .ocard:nth-child(5){animation-delay:.20s}
      `}</style>

      <div className="op min-h-screen pb-16" style={{background:"#f7f8fc"}}>
        <div className="max-w-5xl mx-auto px-4 pt-8 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900" style={{fontFamily:"'Syne',sans-serif",letterSpacing:"-0.02em"}}>Orders</h1>
              <p className="text-sm text-gray-400 mt-0.5">{orders.length} total · {filtered.length} shown</p>
            </div>
            <button onClick={fetchOrders}
              className="flex items-center gap-2 text-sm font-semibold text-gray-600 border border-gray-200 bg-white px-4 py-2 rounded-xl hover:bg-gray-50 transition-all"
              style={{boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
              <RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/> Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<Package className="w-5 h-5"/>}    label="Total Orders" value={orders.length}  color="#f97316"/>
            <StatCard icon={<IndianRupee className="w-5 h-5"/>} label="Revenue"      value={fmtK(revenue)}  sub="from paid" color="#16a34a"/>
            <StatCard icon={<Truck className="w-5 h-5"/>}       label="Active"       value={active}          color="#2563eb"/>
            <StatCard icon={<XCircle className="w-5 h-5"/>}     label="Cancelled"    value={stats.cancelledCount??orders.filter(o=>o.orderStatus==="cancelled").length} color="#dc2626"/>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex-1 min-w-[180px]" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <Search className="w-4 h-4 text-gray-400 shrink-0"/>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Order, customer, city…"
                className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"/>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2.5" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <Filter className="w-3.5 h-3.5 text-gray-400"/>
              <select value={statusF} onChange={e=>setStatusF(e.target.value)} className="text-sm outline-none bg-transparent text-gray-700 font-medium cursor-pointer">
                <option value="all">All Status</option>
                {Object.entries(S).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2.5" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              <CreditCard className="w-3.5 h-3.5 text-gray-400"/>
              <select value={payF} onChange={e=>setPayF(e.target.value)} className="text-sm outline-none bg-transparent text-gray-700 font-medium cursor-pointer">
                <option value="all">All Payments</option>
                {Object.entries(PS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i=>(
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                  <div className="flex gap-3"><div className="w-2.5 h-2.5 rounded-full bg-gray-200 mt-1.5 shrink-0"/>
                    <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-48"/><div className="h-3 bg-gray-100 rounded w-32"/></div>
                    <div className="h-4 bg-gray-200 rounded w-16"/>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2"/>
              <p className="text-red-600 font-semibold">{error}</p>
              <button onClick={fetchOrders} className="mt-3 text-sm text-red-500 underline">Try again</button>
            </div>
          ) : filtered.length===0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-3"/>
              <p className="text-gray-500 font-semibold">No orders found</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map(order=>(
                <div key={order._id} className="ocard">
                  <OrderCard order={order} onStatusChange={handleStatus} onPaymentChange={handlePayment} onRefund={handleRefund} onSetDeliveryTime={handleDelivery} updating={updating}/>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}