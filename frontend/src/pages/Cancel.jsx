import { Link } from 'react-router-dom';

export default function Cancel() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10">
        <h1 className="text-6xl mb-6">⚠️</h1>
        <h2 className="text-3xl font-bold mb-4">Payment Cancelled</h2>
        <p className="text-gray-500 mb-8">Your upgrade process was interrupted or cancelled. You have not been charged.</p>
        <Link to="/dashboard" className="px-8 py-4 bg-gray-100 hover:bg-gray-200 transition-colors text-gray-800 rounded-3xl font-medium text-lg w-full inline-block">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
