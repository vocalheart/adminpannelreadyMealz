"use client";

import AdminProtectedRoute from "@/app/components/AdminProtectedRoute";
import { useAdminAuth } from "@/app/context/AdminAuthContext";
import { useState } from "react";
import {
  FaUtensils,
  FaShoppingBag,
  FaRupeeSign,
  FaUsers,
  FaMotorcycle,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaEye,
} from "react-icons/fa";

export default function AdminDashboard() {
  const { admin } = useAdminAuth();

  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");

  // ────────────────────────────────────────────────
  // Mock data (replace with real API fetch later)
  // ────────────────────────────────────────────────
  const stats = {
    todayOrders: 142,
    todayRevenue: 48760,
    activeUsers: 3240,
    activeDeliveries: 28,
    avgDeliveryTime: "32 min",
    cancellationRate: "4.2%",
    avgRating: "4.7",
  };

  const recentOrders = [
    { id: "ORD-7842", customer: "Priya Sharma", items: "Butter Chicken ×2, Naan", amount: 890, status: "Delivered", time: "12 min ago" },
    { id: "ORD-7841", customer: "Rahul Verma", items: "Paneer Tikka Masala, Jeera Rice", amount: 650, status: "Out for Delivery", time: "8 min ago" },
    { id: "ORD-7840", customer: "Anjali Patel", items: "Veg Biryani Family Pack", amount: 1240, status: "Preparing", time: "21 min ago" },
    { id: "ORD-7839", customer: "Vikram Singh", items: "Pizza Margherita + Coke", amount: 420, status: "Cancelled", time: "47 min ago" },
    { id: "ORD-7838", customer: "Sneha Gupta", items: "Chole Bhature (2 plates)", amount: 380, status: "Delivered", time: "1 hr ago" },
  ];

  const popularMeals = [
    { name: "Butter Chicken", orders: 184, percentage: 28 },
    { name: "Paneer Butter Masala", orders: 136, percentage: 21 },
    { name: "Veg Biryani", orders: 112, percentage: 17 },
    { name: "Margherita Pizza", orders: 89, percentage: 14 },
    { name: "Chole Bhature", orders: 65, percentage: 10 },
  ];

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50/50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-16 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                  Welcome, {admin?.name || "Admin"}
                </h1>
                <p className="mt-1.5 text-gray-600 text-[15px]">
                  ReadyMealz Admin • {admin?.email}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="min-w-[140px] px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>

                <button className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2">
                  <span>Download Report</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 lg:gap-5 mb-10">
            <StatCard
              icon={<FaShoppingBag />}
              title="Today's Orders"
              value={stats.todayOrders.toLocaleString()}
              color="orange"
            />
            <StatCard
              icon={<FaRupeeSign />}
              title="Revenue Today"
              value={`₹${stats.todayRevenue.toLocaleString()}`}
              color="emerald"
            />
            <StatCard
              icon={<FaUsers />}
              title="Active Users"
              value={stats.activeUsers.toLocaleString()}
              color="blue"
            />
            <StatCard
              icon={<FaMotorcycle />}
              title="Live Deliveries"
              value={stats.activeDeliveries}
              color="violet"
            />
            <StatCard
              icon={<FaClock />}
              title="Avg. Delivery Time"
              value={stats.avgDeliveryTime}
              color="amber"
            />
            <StatCard
              icon={<FaTimesCircle />}
              title="Cancellation Rate"
              value={stats.cancellationRate}
              color="rose"
            />
            <StatCard
              icon={<FaStar />}
              title="Avg. Rating"
              value={stats.avgRating}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow border border-gray-200/70 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
                <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
                <button className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1.5 transition">
                  View All <FaEye className="text-xs" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Items</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.customer}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell max-w-xs truncate">{order.items}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{order.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{order.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6 lg:space-y-7">
              {/* Top Meals */}
              <div className="bg-white rounded-xl shadow border border-gray-200/70 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/70">
                  <h2 className="text-lg font-semibold text-gray-800">Top Selling Meals</h2>
                </div>
                <div className="p-6 space-y-5">
                  {popularMeals.map((meal, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-800">{meal.name}</span>
                        <span className="text-gray-600">{meal.orders} orders</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                          style={{ width: `${meal.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Insights */}
              <div className="bg-white rounded-xl shadow border border-gray-200/70 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-5">Quick Insights</h3>
                <ul className="space-y-4 text-sm">
                  <InsightItem icon={<FaChartLine />} text="Revenue up 18% compared to last week" color="orange" />
                  <InsightItem icon={<FaCheckCircle />} text="92% orders delivered under 45 minutes" color="emerald" />
                  <InsightItem icon={<FaUsers />} text="214 new users registered today" color="blue" />
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-gray-500 text-sm">
            Advanced analytics • Heatmaps • Low-stock alerts • Customer feedback • Coming soon...
          </div>
        </main>
      </div>
    </AdminProtectedRoute>
  );
}

// ────────────────────────────────────────────────
// Reusable Components
// ────────────────────────────────────────────────

function StatCard({
  icon,
  title,
  value,
  color = "gray",
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color?: string;
}) {
  const colors = {
    orange:  "from-orange-50 to-orange-100 text-orange-700 border-orange-200 hover:border-orange-300",
    emerald: "from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 hover:border-emerald-300",
    blue:    "from-blue-50 to-blue-100 text-blue-700 border-blue-200 hover:border-blue-300",
    violet:  "from-violet-50 to-violet-100 text-violet-700 border-violet-200 hover:border-violet-300",
    amber:   "from-amber-50 to-amber-100 text-amber-700 border-amber-200 hover:border-amber-300",
    rose:    "from-rose-50 to-rose-100 text-rose-700 border-rose-200 hover:border-rose-300",
    gray:    "from-gray-50 to-gray-100 text-gray-700 border-gray-200 hover:border-gray-300",
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colors[color as keyof typeof colors]} p-5 transition-all hover:shadow-md hover:scale-[1.02] duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className="p-3 rounded-lg bg-white/60 text-xl">{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Delivered:       "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Out for Delivery": "bg-blue-100 text-blue-800 border-blue-200",
    Preparing:       "bg-amber-100 text-amber-800 border-amber-200",
    Cancelled:       "bg-rose-100 text-rose-800 border-rose-200",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

function InsightItem({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  const colorClasses = {
    orange:  "text-orange-600",
    emerald: "text-emerald-600",
    blue:    "text-blue-600",
  };

  return (
    <li className="flex items-start gap-3">
      <div className={`mt-0.5 text-lg ${colorClasses[color as keyof typeof colorClasses]}`}>{icon}</div>
      <span className="text-gray-700">{text}</span>
    </li>
  );
}