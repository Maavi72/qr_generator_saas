import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Success() {
  const { fetchUser, confirmUpgrade } = useContext(AuthContext);

  const navigate = useNavigate();

  useEffect(() => {
    const updateAndRedirect = async () => {
      try {
        await confirmUpgrade();
        await fetchUser(localStorage.getItem('token'));
      } catch (err) {
        console.error('Failed to update user status:', err);
      }
      setTimeout(() => {
        navigate('/dashboard');
      }, 2500);
    };

    updateAndRedirect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
        <h1 className="text-6xl mb-6">🎉</h1>
        <h2 className="text-3xl font-bold mb-4">Payment Successful!</h2>
        <p className="text-lg text-emerald-600 font-semibold mb-6">You are now upgraded to PRO</p>
        <p className="text-gray-500 mb-8">Enjoy generating unlimited dynamic tracking QR codes.</p>
        <Link to="/dashboard" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white rounded-3xl font-medium text-lg w-full inline-block">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
