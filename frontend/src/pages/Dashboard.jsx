import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome, {user?.full_name} ({user?.role})</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Log out
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-gray-600">
            🎉 You're logged in! Products, Orders, and Analytics pages are coming in the next phase.
          </p>
        </div>
      </div>
    </div>
  );
}