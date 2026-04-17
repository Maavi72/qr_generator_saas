import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            <span className="text-3xl">📱</span> QRify
          </Link>

          {user ? (
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Dashboard</Link>
              <Link to="/generate" className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">Create QR</Link>

              <div className="flex items-center gap-4">
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  title={isDark ? 'Light mode' : 'Dark mode'}
                >
                  {isDark ? '☀️' : '🌙'}
                </button>

                {user.is_pro && (
                  <span className="px-4 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1">
                    👑 PRO
                  </span>
                )}
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition" onClick={() => navigate('/dashboard')}>
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-bold">
                    {user.username?.[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</p>
                  </div>
                </div>

                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition">
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <Link to="/login" className="font-medium text-gray-700 dark:text-gray-300">Login</Link>
              <Link to="/register" className="bg-indigo-600 dark:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition">Get Started Free</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}