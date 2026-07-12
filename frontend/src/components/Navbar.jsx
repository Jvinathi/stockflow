import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
      isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-lg font-bold text-blue-600">StockFlow</span>
          <div className="flex items-center gap-1">
            <NavLink to="/dashboard" className={linkClass}>
              <LayoutDashboard size={16} />
              Dashboard
            </NavLink>
            <NavLink to="/products" className={linkClass}>
              <Package size={16} />
              Products
            </NavLink>
            <NavLink to="/orders" className={linkClass}>
              <ShoppingCart size={16} />
              Orders
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}