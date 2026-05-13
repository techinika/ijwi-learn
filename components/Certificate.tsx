'use client';

import { forwardRef } from 'react';
import { GraduationCap, Award, CheckCircle } from 'lucide-react';

interface CertificateProps {
  userName: string;
  level: string;
  score: number;
  date: string;
  certificateId: string;
}

const Certificate = forwardRef<HTMLDivElement, CertificateProps>(
  ({ userName, level, score, date, certificateId }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl border-2 border-amber-200"
        style={{ width: '800px', height: '600px', position: 'relative' }}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400"></div>
        
        <div className="text-center h-full flex flex-col">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full">
              <GraduationCap size={32} className="text-amber-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Certificate of Completion
          </h1>
          <p className="text-lg text-gray-600 mb-8">IJWI-LEARN</p>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-gray-500 mb-2">This is to certify that</p>
            <h2 className="text-4xl font-bold text-blue-600 mb-6">{userName}</h2>
            <p className="text-gray-600 mb-2">has successfully completed the</p>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">{level} Level</h3>
            
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <CheckCircle size={20} />
              <span className="font-medium">Score: {score}%</span>
            </div>
          </div>

          <div className="flex justify-between items-end mt-8">
            <div className="text-left">
              <div className="text-sm text-gray-500">Date</div>
              <div className="font-medium text-gray-900">{date}</div>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-16 flex items-center justify-center">
                <Award size={48} className="text-amber-500" />
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Certificate ID</div>
              <div className="font-medium text-gray-900 text-sm">{certificateId}</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400"></div>
      </div>
    );
  }
);

Certificate.displayName = 'Certificate';

export default Certificate;
export type { CertificateProps };