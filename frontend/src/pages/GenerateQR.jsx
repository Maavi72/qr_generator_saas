import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import QRDisplay from '../components/QRDisplay';

export default function GenerateQR() {
  const { user, api } = useContext(AuthContext);
  const { isDark } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [type, setType] = useState('static');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [destination, setDestination] = useState('');
  const [fillColor, setFillColor] = useState('#000000');
  const [backColor, setBackColor] = useState('#FFFFFF');
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const colorPresets = [
    { fill: '#000000', back: '#FFFFFF', name: 'Classic Black' },
    { fill: '#1e3a8a', back: '#FFFFFF', name: 'Navy Blue' },
    { fill: '#7c2d12', back: '#FFFFFF', name: 'Deep Orange' },
    { fill: '#15803d', back: '#FFFFFF', name: 'Forest Green' },
    { fill: '#6b21a8', back: '#FFFFFF', name: 'Deep Purple' },
    { fill: '#000000', back: '#FEF3C7', name: 'Black & Cream' },
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('edit')) {
      const id = params.get('edit');
      setEditId(id);
      setType('dynamic');
      // Fetch the QR data to populate the form
      const fetchQR = async () => {
        try {
          const res = await api.get(`qr/${id}/`);
          setDestination(res.data.redirect_url);
          setName(res.data.name || '');
          setFillColor(res.data.fill_color || '#000000');
          setBackColor(res.data.back_color || '#FFFFFF');
        } catch (err) {
          console.error('Failed to load QR:', err);
        }
      };
      fetchQR();
    }
  }, [location]);

  const generateQR = async () => {
    if (!user.is_pro && type === 'dynamic') {
      alert('Dynamic QR codes are only for Pro users. Please upgrade.');
      return;
    }

    // Validation
    if (type === 'static' && !content.trim()) {
      alert('⚠️ Please enter a URL for the Static QR code');
      return;
    }

    if (type === 'dynamic' && !destination.trim()) {
      alert('⚠️ Please enter a destination URL for the Dynamic QR code');
      return;
    }

    setLoading(true);
    try {
      const payload = { name: name || 'My QR' };
      let res;

      if (editId && type === 'dynamic') {
        // Update existing dynamic QR
        payload.redirect_url = destination;
        payload.fill_color = fillColor;
        payload.back_color = backColor;
        res = await api.patch(`qr/${editId}/`, payload);
        alert('✅ Dynamic QR updated successfully!');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else if (type === 'static') {
        payload.data = content;
        res = await api.post('qr/create-static/', payload);
      } else {
        payload.redirect_url = destination;
        payload.fill_color = fillColor;
        payload.back_color = backColor;
        res = await api.post('qr/create-dynamic/', payload);
      }

      if (!editId) {
        setQrData({ ...res.data, type, value: type === 'static' ? payload.data : res.data.redirect_url });
      }
    } catch (err) {
      alert('Failed to generate QR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950' : 'bg-gray-50'} py-10 transition-colors`}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{editId ? '✏️ Edit Dynamic QR' : '🆕 Create New QR Code'}</h1>
            {editId ? (
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Update the destination URL for your dynamic QR code</p>
            ) : (
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Choose between static (fixed) or dynamic (editable) QR codes</p>
            )}
          </div>
          {editId && (
            <button
              onClick={() => navigate('/dashboard')}
              className={`px-6 py-2 rounded-3xl font-medium hover:opacity-80 transition ${isDark ? 'bg-gray-800 text-gray-100 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              ← Back to Dashboard
            </button>
          )}
        </div>

        {!editId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setType('static')}
              className={`p-6 rounded-3xl font-medium text-left border-2 transition ${
                type === 'static'
                  ? isDark ? 'border-sky-500 bg-sky-900/30 text-sky-300' : 'border-sky-500 bg-sky-50 text-sky-900'
                  : isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600 text-gray-300' : 'border-gray-200 bg-white hover:border-gray-300 text-gray-900'
              }`}
            >
              <div className="text-2xl mb-2">📌 Static QR</div>
              <div className="text-sm">✓ Free Plan • Fixed content • Can't edit after creation</div>
            </button>
            <button
              onClick={() => setType('dynamic')}
              className={`p-6 rounded-3xl font-medium text-left border-2 transition ${
                type === 'dynamic'
                  ? isDark ? 'border-violet-500 bg-violet-900/30 text-violet-300' : 'border-violet-500 bg-violet-50 text-violet-900'
                  : isDark ? 'border-gray-700 bg-gray-800 hover:border-gray-600 text-gray-300' : 'border-gray-200 bg-white hover:border-gray-300 text-gray-900'
              }`}
              disabled={!user?.is_pro}
            >
              <div className="text-2xl mb-2">🔄 Dynamic QR {!user?.is_pro ? '👑' : ''}</div>
              <div className="text-sm">✓ Pro Plan • Editable URL • Change destination anytime</div>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form */}
          <div className={`lg:col-span-7 rounded-3xl p-8 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
            <div className="space-y-8">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>QR Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-5 py-4 border rounded-2xl transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-violet-500' : 'border-gray-200 placeholder-gray-500'}`}
                  placeholder="My Website QR"
                />
              </div>

              {type === 'static' ? (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>📌 Static Content <span className="text-red-500">*</span></label>
                  <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>The QR code will encode this URL directly and cannot be changed after creation.</p>
                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className={`w-full px-5 py-4 border rounded-2xl transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'border-sky-200 placeholder-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'}`}
                    placeholder="https://yourwebsite.com"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>🔄 Destination URL (Editable) <span className="text-red-500">*</span></label>
                  <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>You can change this URL anytime without regenerating the QR code. Scans will always redirect to the current URL.</p>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className={`w-full px-5 py-4 border rounded-2xl focus:outline-none focus:ring-2 transition ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-violet-500 focus:border-violet-500' : 'border-violet-200 focus:border-violet-500 focus:ring-violet-500 placeholder-gray-500'}`}
                    placeholder="https://yourwebsite.com"
                    required
                  />
                  
                  {/* Color Customization */}
                  <div className="mt-8">
                    <h3 className={`text-sm font-medium mb-4 flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>🎨 Customize Colors</h3>
                    
                    {/* Color Presets */}
                    <div className="mb-6">
                      <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Quick Presets:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {colorPresets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => {
                              setFillColor(preset.fill);
                              setBackColor(preset.back);
                            }}
                            className={`p-3 rounded-2xl border-2 transition flex items-center gap-2 text-sm ${isDark ? 'hover:opacity-80' : 'hover:border-gray-300'}`}
                            style={{
                              backgroundColor: preset.back,
                              borderColor: preset.fill === fillColor && preset.back === backColor ? preset.fill : isDark ? '#374151' : '#ddd'
                            }}
                          >
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: preset.fill }}
                            />
                            <span style={{ color: preset.fill === '#000000' ? '#000' : '#fff' }}>
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Colors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>QR Code Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={fillColor}
                            onChange={(e) => setFillColor(e.target.value)}
                            className={`w-12 h-10 border rounded-lg cursor-pointer ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                          />
                          <input
                            type="text"
                            value={fillColor}
                            onChange={(e) => setFillColor(e.target.value)}
                            className={`flex-1 px-3 py-2 border rounded-lg text-xs font-mono transition ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                      <div>
                        <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Background Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={backColor}
                            onChange={(e) => setBackColor(e.target.value)}
                            className={`w-12 h-10 border rounded-lg cursor-pointer ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                          />
                          <input
                            type="text"
                            value={backColor}
                            onChange={(e) => setBackColor(e.target.value)}
                            className={`flex-1 px-3 py-2 border rounded-lg text-xs font-mono transition ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200'}`}
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={generateQR}
                disabled={loading}
                className={`w-full py-5 rounded-3xl text-xl font-semibold transition-all ${
                  editId
                    ? 'bg-violet-600 hover:bg-violet-700 text-white'
                    : type === 'dynamic'
                    ? 'bg-violet-600 hover:bg-violet-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {loading ? '⏳ Processing...' : editId ? '💾 Save Changes' : '✨ Generate & Save QR'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-5">
            {qrData ? (
              <QRDisplay value={qrData.value} imageUrl={qrData.qr_image} size={300} title={qrData.name} />
            ) : (
              <div className={`h-96 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center transition ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="text-7xl mb-6">📱</p>
                <p className={`text-xl font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Live preview will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}