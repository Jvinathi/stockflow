import { useState, useEffect } from 'react';
import { Plus, X, Trash2, Download } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import Layout from '../components/Layout';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [saving, setSaving] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/orders');
      setOrders(res.data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axiosClient.get('/api/products');
      setProducts(res.data);
    } catch (err) {
      // silently ignore -- products just won't be selectable in the modal
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setCustomerName('');
    setCartItems([]);
    setSelectedProductId('');
    setSelectedQty(1);
    setError('');
    setShowModal(true);
  };

  const addToCart = () => {
    if (!selectedProductId || selectedQty < 1) return;
    const product = products.find((p) => p.id === parseInt(selectedProductId, 10));
    if (!product) return;

    const existing = cartItems.find((item) => item.product_id === product.id);
    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + parseInt(selectedQty, 10) }
            : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          product_id: product.id,
          name: product.name,
          unit_price: product.price,
          quantity: parseInt(selectedQty, 10),
        },
      ]);
    }
    setSelectedProductId('');
    setSelectedQty(1);
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter((item) => item.product_id !== productId));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('Add at least one item to the order');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await axiosClient.post('/api/orders', {
        customer_name: customerName || null,
        items: cartItems.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
      });
      setShowModal(false);
      fetchOrders();
      fetchProducts(); // stock levels changed, refresh them too
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const res = await axiosClient.get(`/api/invoices/${orderId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_order_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download invoice');
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} />
          New Order
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-gray-500 text-sm">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-gray-500 text-sm">No orders yet. Create your first order above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Order #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">#{o.id}</td>
                  <td className="px-4 py-3 text-gray-600">{o.customer_name || 'Walk-in Customer'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">₹{o.total_amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => downloadInvoice(o.id)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">New Order</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                {error}
              </div>
            )}

            <input
              type="text"
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex gap-2 mb-4">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.price.toFixed(2)}, {p.stock_quantity} in stock)
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={selectedQty}
                onChange={(e) => setSelectedQty(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addToCart}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
              >
                Add
              </button>
            </div>

            {cartItems.length > 0 && (
              <div className="border border-gray-200 rounded-lg mb-4 divide-y divide-gray-100">
                {cartItems.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-gray-900">
                      {item.name} × {item.quantity}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">
                        ₹{(item.unit_price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-3 py-2 text-sm font-bold bg-gray-50">
                  <span>Total</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving || cartItems.length === 0}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating order...' : 'Create Order'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}