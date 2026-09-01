import React, { useState, useEffect } from 'react';
import { QrCode, Copy, Check, Download, X, Share2, ExternalLink } from 'lucide-react';
import { api } from '../../lib/api.ts';

interface QRShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicUrl: string;
  candidateName: string;
}

export const QRShareModal: React.FC<QRShareModalProps> = ({
  isOpen,
  onClose,
  publicUrl,
  candidateName,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen && publicUrl) {
      setLoading(true);
      api.getQRCode(publicUrl)
        .then(res => setQrDataUrl(res.dataUrl))
        .catch(err => console.error('Failed to generate QR:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, publicUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${candidateName.replace(/\s+/g, '_')}_DigitalCV_QR.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">Share Digital CV</h3>
          <p className="text-xs text-neutral-400">
            Scan to instantly view {candidateName}'s digital portfolio on mobile
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl mx-auto w-56 h-56 flex items-center justify-center shadow-lg">
          {loading ? (
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Digital CV QR Code"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <p className="text-xs text-neutral-500">Failed to render QR</p>
          )}
        </div>

        {/* URL Box & Copy */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-left">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className="flex-1 bg-transparent text-xs text-neutral-300 px-2 outline-none truncate font-mono"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleDownloadQR}
            disabled={!qrDataUrl}
            className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download QR PNG
          </button>
        </div>
      </div>
    </div>
  );
};
