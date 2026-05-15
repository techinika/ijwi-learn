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
        style={{
          width: '800px',
          height: '600px',
          position: 'relative',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '2px solid #f59e0b',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', backgroundColor: '#f59e0b' }}></div>

        <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', padding: '32px' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', backgroundColor: '#fef3c7', borderRadius: '50%' }}>
              <span style={{ color: '#d97706', fontSize: '24px', fontWeight: 700 }}>I</span>
            </div>
          </div>

          <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            Certificate of Completion
          </h1>
          <p style={{ fontSize: '18px', color: '#4b5563', marginBottom: '4px' }}>IJWI-LEARN</p>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
            Learning Kinyarwanda with IJWI-LEARN
          </p>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '8px' }}>This is to certify that</p>
            <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#2563eb', marginBottom: '20px' }}>{userName}</h2>
            <p style={{ color: '#4b5563', marginBottom: '8px' }}>has successfully completed the</p>
            <h3 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>{level} Level</h3>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#d1fae5', color: '#047857', padding: '6px 16px', borderRadius: '9999px', margin: '0 auto', fontSize: '14px', fontWeight: 500 }}>
              <span>&#10003;</span>
              <span>Score: {score}%</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Date</div>
              <div style={{ fontWeight: 500, color: '#111827', fontSize: '14px' }}>{date}</div>
            </div>

            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code" style={{ width: '48px', height: '48px' }} />
              )}
              <div style={{ fontSize: '10px', color: '#9ca3af' }}>Scan to verify</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Certificate ID</div>
              <div style={{ fontWeight: 500, color: '#111827', fontSize: '12px' }}>{certificateId}</div>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '8px', backgroundColor: '#f59e0b' }}></div>
      </div>
    );
  }
);

Certificate.displayName = 'Certificate';

export default Certificate;
export type { CertificateProps };
