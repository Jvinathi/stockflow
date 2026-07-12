import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Layout from '../components/Layout';
import RoleGuard from '../components/RoleGuard';

const emptyForm = { name: '', sku: '', category: '', price: '', stock_quantity: '', reorder_threshold: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku || '',
      category: product.category || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      reorder_threshold: product.reorder_threshold,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name,
      sku: form.sku || null,
      category: form.category || null,
      price: parseFloat(form.price),
      stock_quantity: parseInt(form.stock_quantity, 10),
      reorder_threshold: parseInt(form.reorder_threshold, 10),
    };
    try {
      if (editingId) {
        await axiosClient.put(`/api/products/${editingId}`, payload);
      } else {
        await axiosClient.post('/api/products', payload);
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await axiosClient.delete(`/api/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete product');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus size={16} />
            Add Product
          </button>
        </RoleGuard>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500 text-sm">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">No products yet. Add your first one to get started.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Threshold</th>
                <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </RoleGuard>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.sku || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-right">₹{p.price.toFixed(2)}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      p.stock_quantity <= p.reorder_threshold ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {p.stock_quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{p.reorder_threshold}</td>
                  <RoleGuard allowedRoles={['OWNER', 'MANAGER']}>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <Pencil size={15} />
                        </button>
                        <RoleGuard allowedRoles={['OWNER']}>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={15} />
                          </button>
                        </RoleGuard>
                      </div>
                    </td>
                  </RoleGuard>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="SKU (optional)"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Category (optional)"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Stock"
                  value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Reorder at"
                  value={form.reorder_threshold}
                  onChange={(e) => setForm({ ...form, reorder_threshold: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}