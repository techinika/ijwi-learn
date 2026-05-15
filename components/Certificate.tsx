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

function truncateId(id: string, prefixLen = 12, suffixLen = 6): string {
  if (id.length <= prefixLen + suffixLen + 3) return id;
  return id.slice(0, prefixLen) + '...' + id.slice(-suffixLen);
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
          width: '100%',
          maxWidth: '800px',
          aspectRatio: '4/3',
          position: 'relative',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '2px solid #f59e0b',
          overflow: 'hidden',
          color: '#111827',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '1%', backgroundColor: '#f59e0b' }}></div>

        <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', padding: '4%' }}>
          <div style={{ marginBottom: '1%' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '7%', minWidth: '40px', height: 'auto', aspectRatio: '1', backgroundColor: '#1c4d72', borderRadius: '12px' }}>
              <svg width="60%" height="60%" viewBox="0 0 100 100" fill="none">
                <path d="M50 20L65 35L65 55L50 70L35 55L35 35Z" stroke="white" strokeWidth="6" fill="none" />
                <circle cx="50" cy="45" r="10" fill="white" />
                <path d="M42 60L50 68L58 60" stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          </div>

          <h1 style={{ fontSize: '3.75%', fontWeight: 700, color: '#111827', marginBottom: '0.5%' }}>
            Certificate of Completion
          </h1>
          <p style={{ fontSize: '2.25%', color: '#4b5563', marginBottom: '0.5%' }}>IJWI-LEARN</p>
          <p style={{ fontSize: '1.75%', color: '#9ca3af', marginBottom: '3%' }}>
            Learning Kinyarwanda with IJWI-LEARN
          </p>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '1%' }}>This is to certify that</p>
            <h2 style={{ fontSize: '4.5%', fontWeight: 700, color: '#2563eb', marginBottom: '2.5%' }}>{userName}</h2>
            <p style={{ color: '#4b5563', marginBottom: '1%' }}>has successfully completed the</p>
            <h3 style={{ fontSize: '3%', fontWeight: 600, color: '#111827', marginBottom: '1.5%' }}>{level} Level</h3>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#d1fae5', color: '#047857', padding: '0.75% 2%', borderRadius: '9999px', margin: '0 auto', fontSize: '1.75%', fontWeight: 500 }}>
              <span>&#10003;</span>
              <span>Score: {score}%</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '3%' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '1.5%', color: '#6b7280' }}>Date</div>
              <div style={{ fontWeight: 500, color: '#111827', fontSize: '1.75%' }}>{date}</div>
            </div>

            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5%' }}>
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code" style={{ width: '6%', minWidth: '40px', height: 'auto', aspectRatio: '1' }} />
              )}
              <div style={{ fontSize: '1.25%', color: '#9ca3af' }}>Scan to verify</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5%', color: '#6b7280' }}>Certificate ID</div>
              <div style={{ fontWeight: 500, color: '#111827', fontSize: '1.5%' }}>{truncateId(certificateId)}</div>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '1%', backgroundColor: '#f59e0b' }}></div>
      </div>
    );
  }
);

Certificate.displayName = 'Certificate';

export default Certificate;
export type { CertificateProps };
