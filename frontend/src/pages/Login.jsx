import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error details:', err.response?.data || err);
      const backendError = err.response?.data?.message || err.response?.data?.detail || err.response?.data?.error;
      const errorMsg = backendError ? (typeof backendError === 'string' ? backendError : JSON.stringify(backendError)) : (err.message || 'Invalid email or password');
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
        <div className="flex justify-center mb-8 text-3xl font-bold text-indigo-600">📱 QRify</div>
        <h2 className="text-3xl font-semibold text-center mb-2">Welcome back</h2>
        <p className="text-center text-gray-500 mb-8">Sign in to manage your QR codes</p>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-300"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-300"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-semibold text-lg hover:bg-indigo-700 transition-all disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-medium">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}