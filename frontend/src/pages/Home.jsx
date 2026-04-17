import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { QRCodeSVG as QRCode } from 'qrcode.react';

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [demoText, setDemoText] = useState('https://yourwebsite.com');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-6 pt-20">
        {/* Rest of your Home code remains the same */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white px-5 py-2 rounded-3xl shadow-sm mb-6">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Static QR = Free • Dynamic QR = Pro</span>
            </div>

            <h1 className="text-6xl font-bold leading-none tracking-tighter text-gray-900 mb-6">
              Create beautiful QR codes<br />in seconds
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-md">
              Exactly as per your SOW: Static (Free), Dynamic (Pro), Stripe payments, and full dashboard.
            </p>

            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-indigo-600 text-white px-8 py-4 rounded-3xl text-lg font-semibold flex items-center gap-3 hover:scale-105 transition-all"
              >
                Go to Dashboard →
              </button>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-3xl text-lg font-semibold flex items-center gap-3 hover:scale-105 transition-all"
                >
                  Start for Free →
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="border border-gray-300 px-8 py-4 rounded-3xl text-lg font-semibold hover:bg-white"
                >
                  Login
                </button>
              </div>
            )}
          </div>

          {/* Live Demo QR */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md mx-auto lg:mx-0">
            <h3 className="text-center font-semibold mb-6 flex items-center justify-center gap-2">
              <span className="text-2xl">📱</span> Live Static Preview
            </h3>
            <div className="flex justify-center mb-8">
              <QRCode value={demoText} size={280} level="H" />
            </div>
            <input
              type="text"
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              className="w-full px-5 py-4 border border-gray-200 rounded-2xl text-center focus:outline-none focus:border-indigo-300"
              placeholder="Type any URL or text..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}