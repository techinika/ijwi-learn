'use client';

import { useState, useEffect, forwardRef } from 'react';
import QRCode from 'qrcode';

interface CertificateProps {
  userName: string;
  level: string;
  score: number;
  date: string;
  certificateId: string;
}

const Certificate = forwardRef<HTMLDivElement, CertificateProps>(
  ({ userName, level, score, date, certificateId }, ref) => {
    const [qrDataUrl, setQrDataUrl] = useState('');

    useEffect(() => {
      QRCode.toDataURL(certificateId, {
        width: 100,
        margin: 1,
        color: { dark: '#1e293b', light: '#ffffff' },
      }).then(setQrDataUrl);
    }, [certificateId]);

    return (
      <div
        ref={ref}
        className="bg-white p-8 rounded-xl border-2 border-amber-200"
        style={{ width: '800px', height: '600px', position: 'relative' }}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>

        <div className="text-center h-full flex flex-col">
          <div className="mb-2">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full">
              <span className="text-amber-600 text-2xl font-bold">I</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Certificate of Completion
          </h1>
          <p className="text-lg text-gray-600 mb-1">IJWI-LEARN</p>
          <p className="text-sm text-gray-400 mb-6">
            Learning Kinyarwanda with IJWI-LEARN
          </p>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-gray-500 mb-2">This is to certify that</p>
            <h2 className="text-4xl font-bold text-blue-600 mb-5">{userName}</h2>
            <p className="text-gray-600 mb-2">has successfully completed the</p>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">{level} Level</h3>

            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full mx-auto text-sm font-medium">
              <span>✓</span>
              <span>Score: {score}%</span>
            </div>
          </div>

          <div className="flex justify-between items-end mt-6">
            <div className="text-left">
              <div className="text-xs text-gray-500">Date</div>
              <div className="font-medium text-gray-900 text-sm">{date}</div>
            </div>

            <div className="text-center flex flex-col items-center gap-1">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code" className="w-12 h-12" />
              )}
              <div className="text-[10px] text-gray-400">Scan to verify</div>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500">Certificate ID</div>
              <div className="font-medium text-gray-900 text-xs">{certificateId}</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-2 bg-amber-500"></div>
      </div>
    );
  }
);

Certificate.displayName = 'Certificate';

export default Certificate;
export type { CertificateProps };