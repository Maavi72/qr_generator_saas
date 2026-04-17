import { useContext, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import QRDisplay from '../components/QRDisplay';
import QRAnalytics from '../components/QRAnalytics';

export default function Dashboard() {
  const { user, api, upgradeToPro } = useContext(AuthContext);
  const { isDark } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRId, setSelectedQRId] = useState(null);

  const syncAnalyticsToQR = useCallback((qrId, analytics) => {
    setQrs((prev) =>
      prev.map((qr) =>
        qr.id === qrId
          ? {
              ...qr,
              scan_count: analytics.total_scans,
              last_scanned_at: analytics.last_scanned_at,
            }
          : qr
      )
    );
  }, []);

  useEffect(() => {
    const fetchQRs = async () => {
      try {
        const res = await api.get('dashboard/');
        setQrs(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Check QR debug info
    const checkDebugInfo = async () => {
      try {
        const debugRes = await api.get('qr/debug/');
        console.log('QR Debug Info:', debugRes.data);
      } catch (err) {
        console.warn('Could not fetch QR debug info');
      }
    };
    
    fetchQRs();
    checkDebugInfo();

    // Check for Stripe success
    if (location.search.includes('success=true')) {
      alert('🎉 Payment successful! You are now Pro.');
    }
  }, []);

  const deleteQR = async (id) => {
    if (confirm('Delete this QR code?')) {
      await api.delete(`qr/${id}/`);
      setQrs(qrs.filter(q => q.id !== id));
      if (selectedQRId === id) {
        setSelectedQRId(null);
      }
    }
  };

  const editDynamicQR = (id) => {
    navigate(`/generate?edit=${id}`);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'} transition-colors`}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10">
          <div>
            <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>My QR Codes</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mt-2`}>
              {qrs.length} total • <span className={user?.is_pro ? 'text-emerald-500' : 'text-amber-500'}>{user?.is_pro ? '👑 Pro Plan' : '⭐ Free Plan'}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              to="/generate" 
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-6 py-3 rounded-3xl flex items-center gap-2 font-medium shadow-lg transition"
            >
              ✨ Create New QR
            </Link>
            {!user?.is_pro && (
              <button 
                onClick={upgradeToPro} 
                className={`border-2 border-emerald-500 ${isDark ? 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-900/40' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} px-6 py-3 rounded-3xl flex items-center gap-2 font-medium transition`}
              >
                👑 Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 animate-pulse`}>
                <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4 mb-4`}></div>
                <div className={`h-40 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-2xl mb-4`}></div>
                <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-full`}></div>
              </div>
            ))}
          </div>
        ) : qrs.length === 0 ? (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl p-12 text-center border`}>
            <p className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>📱 No QR codes yet</p>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Create your first QR code to get started</p>
            <Link to="/generate" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-3xl mt-6 font-medium transition">
              Create Your First QR
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* QR Codes List */}
            <div className="lg:col-span-2">
              <div className="grid gap-6">
                {qrs.map(qr => (
                  <div
                    key={qr.id}
                    onClick={() => qr.is_dynamic && user?.is_pro && setSelectedQRId(qr.id)}
                    className={`rounded-3xl p-6 border-2 cursor-pointer transition ${
                      selectedQRId === qr.id
                        ? qr.is_dynamic
                          ? 'border-violet-500 shadow-lg'
                          : 'border-sky-500 shadow-lg'
                        : qr.is_dynamic
                        ? isDark ? 'bg-gray-800 border-violet-700 hover:border-violet-600' : 'bg-gradient-to-br from-violet-50 to-white border-violet-200 hover:border-violet-300'
                        : isDark ? 'bg-gray-800 border-sky-700 hover:border-sky-600' : 'bg-white border-sky-200 hover:border-sky-300'
                    }`}
                  >
                    <div className="flex gap-6">
                      <div className="flex-shrink-0">
                        <div className="mb-3">
                          <span className={`inline-block px-4 py-2 text-xs font-bold rounded-2xl ${
                            qr.is_dynamic
                              ? isDark ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-700'
                              : isDark ? 'bg-sky-900/50 text-sky-300' : 'bg-sky-100 text-sky-700'
                          }`}>
                            {qr.is_dynamic ? '🔄 DYNAMIC (Editable)' : '📌 STATIC (Fixed)'}
                          </span>
                        </div>
                        <QRDisplay value={qr.redirect_url || qr.data} imageUrl={qr.qr_image} size={120} title={qr.name} />
                      </div>

                      <div className="flex-grow">
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{qr.name}</h3>
                        
                        {qr.is_dynamic && (
                          <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => window.open(qr.redirect_url, '_blank')}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition"
                              >
                                🔗 Direct Link
                              </button>
                              <span className="text-xs text-gray-500">Test redirect</span>
                            </div>
                          </p>
                        )}

                        {qr.is_dynamic && user?.is_pro && (
                          <p className={`text-xs mt-2 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            📊 {qr.scan_count} scans {qr.last_scanned_at && `(Last: ${new Date(qr.last_scanned_at).toLocaleDateString()})`}
                          </p>
                        )}

                        <div className="flex gap-2 mt-4">
                          {qr.is_dynamic && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                editDynamicQR(qr.id);
                              }} 
                              className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${
                                isDark 
                                  ? 'bg-violet-900/50 text-violet-300 hover:bg-violet-900/70'
                                  : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                              }`}
                            >
                              ✏️ Edit URL
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteQR(qr.id);
                            }} 
                            className={`flex-1 px-4 py-2 rounded-2xl text-sm font-medium transition ${
                              isDark
                                ? 'text-red-400 hover:bg-red-900/30'
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics Sidebar */}
            {selectedQRId && user?.is_pro && (
              <div className="lg:col-span-1">
                <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl p-6 border sticky top-24`}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>📊 Analytics</h2>
                    <button
                      onClick={() => setSelectedQRId(null)}
                      className={`p-1 rounded hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition`}
                    >
                      ✕
                    </button>
                  </div>
                  <QRAnalytics qrId={selectedQRId} onAnalyticsLoad={syncAnalyticsToQR} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}