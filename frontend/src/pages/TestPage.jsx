import { useEffect, useState } from 'react';

export default function TestPage() {
  const [timestamp, setTimestamp] = useState(new Date().toLocaleString());

  useEffect(() => {
    document.title = "QR Code Test Landing Page";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Success!</h1>
          <p className="text-gray-600">Your QR code redirect is working perfectly</p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">Page loaded at:</p>
          <p className="text-lg font-mono font-bold text-green-700">{timestamp}</p>
        </div>

        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="font-semibold text-gray-700">Current URL:</p>
              <p className="text-sm text-gray-600 break-all">{window.location.href}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl">📱</span>
            <div>
              <p className="font-semibold text-gray-700">How it works:</p>
              <p className="text-sm text-gray-600">You scanned a QR code that redirected here through our backend redirect service.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-xl">🔄</span>
            <div>
              <p className="font-semibold text-gray-700">Analytics:</p>
              <p className="text-sm text-gray-600">This click was tracked on your QR code dashboard.</p>
            </div>
          </div>
        </div>

        <a 
          href="/" 
          className="mt-6 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-2xl transition-colors"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
