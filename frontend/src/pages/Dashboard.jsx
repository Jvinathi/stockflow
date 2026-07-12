import { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Package, AlertTriangle } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Layout from '../components/Layout';
import RoleGuard from '../components/RoleGuard';
import RevenueChart from '../components/RevenueChart';
import TopProductsChart from '../components/TopProductsChart';
import { useAuth } from '../context/AuthContext';

function StatCard({ icon: Icon, label, value, tone }) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${toneClasses[tone]}`}>
          <Icon size={18} />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

const PERIOD_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (user?.role === 'STAFF') {
      setLoading(false);
      return;
    }
    setLoading(true);
    axiosClient
      .get(`/api/analytics/summary?days=${days}`)
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [user, days]);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back, {user?.full_name} · {user?.role}
          </p>
        </div>

        <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  days === opt.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </RoleGuard>
      </div>

      <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={DollarSign}
                label="Total Revenue"
                value={`₹${summary.total_revenue.toFixed(2)}`}
                tone="green"
              />
              <StatCard icon={ShoppingBag} label="Total Orders" value={summary.total_orders} tone="blue" />
              <StatCard icon={Package} label="Total Products" value={summary.total_products} tone="purple" />
              <StatCard
                icon={AlertTriangle}
                label="Low Stock Items"
                value={summary.low_stock_count}
                tone="red"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">Revenue Trend</h2>
                <RevenueChart data={summary.revenue_trend} />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4">Top Selling Products</h2>
                <TopProductsChart data={summary.top_products} />
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm mb-8">Unable to load analytics right now.</p>
        )}
      </RoleGuard>

      <RoleGuard allowedRoles={['STAFF']}>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-gray-600 text-sm">
            You're logged in as staff. Head to the <strong>Orders</strong> page to create new sales, or check{' '}
            <strong>Products</strong> to view current stock.
          </p>
        </div>
      </RoleGuard>
    </Layout>
  );
}