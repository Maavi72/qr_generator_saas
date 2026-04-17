import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function QRAnalytics({ qrId, onAnalyticsLoad }) {
  const { api } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasInitialized = useRef(false);

  const fetchAnalytics = useCallback(async () => {
    if (!qrId) return;
    
    // Only show loading spinner on initial load, not on refresh
    const isInitialLoad = !hasInitialized.current;
    if (isInitialLoad) {
      setLoading(true);
    }
    
    try {
      console.log('Fetching analytics for QR ID:', qrId);
      const res = await api.get(`qr/${qrId}/analytics/`);
      console.log('Analytics response:', res.data);
      setAnalytics(res.data);
      setError(null);
      if (onAnalyticsLoad) {
        onAnalyticsLoad(qrId, res.data);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to load analytics';
      setError(errorMessage);
    } finally {
      setLoading(false);
      hasInitialized.current = true;
    }
  }, [qrId, api, onAnalyticsLoad]);

  useEffect(() => {
    // Reset initialized flag when QR ID changes
    hasInitialized.current = false;
    if (qrId) {
      fetchAnalytics();
    }
  }, [qrId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-2xl">
        <div>⚠️ {error}</div>
        <div className="text-xs mt-2 text-red-600 dark:text-red-500">
          {error.includes('Dynamic') && 'This QR code is static. Only dynamic QR codes track analytics.'}
          {error.includes('Pro') && 'You need to upgrade to Pro to view analytics.'}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 p-4 rounded-2xl">
        ℹ️ No scan data yet. Share your QR code and wait for scans to see analytics.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <button
        onClick={fetchAnalytics}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-2xl text-sm font-medium transition disabled:opacity-50"
      >
        🔄 {loading ? 'Refreshing...' : 'Refresh Analytics'}
      </button>

      {/* No scans message */}
      {analytics.total_scans === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 p-4 rounded-2xl">
          ℹ️ This QR code hasn't been scanned yet. Share it to start tracking analytics!
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Scans */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl p-6 border border-blue-200 dark:border-blue-700">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Scans</div>
          <div className="text-4xl font-bold text-blue-900 dark:text-blue-100 mt-2">{analytics.total_scans || 0}</div>
          {analytics.last_scanned_at && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-3">
              Last scan: {new Date(analytics.last_scanned_at).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Mobile Users */}
        <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 rounded-2xl p-6 border border-violet-200 dark:border-violet-700">
          <div className="text-sm text-violet-600 dark:text-violet-400 font-medium">📱 Mobile</div>
          <div className="text-4xl font-bold text-violet-900 dark:text-violet-100 mt-2">
            {analytics.device_breakdown?.mobile || 0}
          </div>
          <div className="text-xs text-violet-600 dark:text-violet-400 mt-3">
            {analytics.total_scans > 0 ? Math.round(((analytics.device_breakdown?.mobile || 0) / analytics.total_scans) * 100) : 0}%
          </div>
        </div>

        {/* Desktop Users */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl p-6 border border-green-200 dark:border-green-700">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">💻 Desktop</div>
          <div className="text-4xl font-bold text-green-900 dark:text-green-100 mt-2">
            {analytics.device_breakdown?.desktop || 0}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-3">
            {analytics.total_scans > 0 ? Math.round(((analytics.device_breakdown?.desktop || 0) / analytics.total_scans) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Browser Breakdown */}
      {Object.keys(analytics.browser_breakdown || {}).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">🌐 Top Browsers</h3>
          <div className="space-y-3">
            {Object.entries(analytics.browser_breakdown || {})
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([browser, count]) => (
                <div key={browser} className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-gray-700 dark:text-gray-300">{browser}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / Math.max(...Object.values(analytics.browser_breakdown || {}))) * 100}%`
                        }}
                      />
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Scans */}
      {(analytics.scans || []).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">📊 Recent Scans (Last 10)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Device</th>
                  <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Browser</th>
                  <th className="text-left py-3 px-2 text-gray-600 dark:text-gray-400 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {(analytics.scans || []).slice(0, 10).map((scan, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-2 text-gray-700 dark:text-gray-300">
                      {scan.device === 'mobile' ? '📱' : scan.device === 'tablet' ? '📱' : '💻'} {scan.device}
                    </td>
                    <td className="py-3 px-2 text-gray-700 dark:text-gray-300">{scan.browser}</td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(scan.scanned_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}