import { useRef } from 'react';

export default function QRDisplay({ value, imageUrl, size = 220, title }) {
  const getOutputImage = () => {
    if (!imageUrl) return null;
    const backendOrigin = import.meta.env.VITE_API_URL?.replace(/\/?api\/?$/i, '') || 'http://127.0.0.1:8000';
    return imageUrl.startsWith('http') ? imageUrl : `${backendOrigin}${imageUrl}`;
  };

  const currentImage = getOutputImage();

  const downloadQR = async () => {
    if (!currentImage) return;
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'qr-code'}.png`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-6 rounded-3xl shadow-inner border flex justify-center items-center" style={{ width: size + 48, height: size + 48 }}>
        {currentImage ? (
          <img src={currentImage} alt={title || "QR Code"} width={size} height={size} className="object-contain border-0" />
        ) : (
          <p className="text-gray-400 text-sm text-center">No image</p>
        )}
      </div>
      {title && <p className="mt-4 text-sm font-medium text-center text-gray-700">{title}</p>}
      {currentImage && (
        <button
          onClick={downloadQR}
          className="mt-6 flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-sm font-medium hover:bg-black transition-colors"
        >
          📥 Download PNG
        </button>
      )}
    </div>
  );
}