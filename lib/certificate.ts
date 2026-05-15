import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificateData {
  userName: string;
  level: string;
  score: number;
  date: string;
  certificateId: string;
}

export async function downloadCertificateAsPDF(
  certificateElement: HTMLElement,
  data: CertificateData
): Promise<void> {
  try {
    const canvas = await html2canvas(certificateElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (doc) => {
        doc.querySelectorAll('style').forEach((el) => {
          if (el.textContent?.includes('lab(') || el.textContent?.includes('oklch(')) {
            el.remove();
          }
        });
      },
    });

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`IJWI-LEARN-${data.level}-Certificate-${data.certificateId}.pdf`);
  } catch (error) {
    console.error('Error downloading certificate:', error);
    throw error;
  }
}

export async function downloadCertificateAsImage(
  certificateElement: HTMLElement
): Promise<void> {
  try {
    const canvas = await html2canvas(certificateElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const link = document.createElement('a');
    link.download = 'certificate.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error downloading certificate:', error);
    throw error;
  }
}

export function generateCertificateId(userId: string, level: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const levelCode = level.substring(0, 3).toUpperCase();
  const userCode = userId.substring(0, 6).toUpperCase();
  return `IJWI-${levelCode}-${userCode}-${timestamp}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}