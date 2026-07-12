import { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Package, AlertTriangle } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Layout from '../components/Layout';
import RoleGuard from '../components/RoleGuard';
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

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // STAFF can't access analytics (backend returns 403), so skip the call for them.
    if (user?.role === 'STAFF') {
      setLoading(false);
      return;
    }
    axiosClient
      .get('/api/analytics/summary')
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back, {user?.full_name} · {user?.role}
        </p>
      </div>

      <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        ) : summary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
        ) : (
          <p className="text-gray-500 text-sm mb-8">Unable to load analytics right now.</p>
        )}

        {summary && summary.top_products.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Top Selling Products</h2>
            <table className="w-full text-sm">
              <thead className="text-gray-500 text-left">
                <tr>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium text-right">Units Sold</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.top_products.map((p) => (
                  <tr key={p.product_id} className="border-t border-gray-100">
                    <td className="py-2 text-gray-900">{p.product_name}</td>
                    <td className="py-2 text-right">{p.total_quantity_sold}</td>
                    <td className="py-2 text-right font-medium">₹{p.total_revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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