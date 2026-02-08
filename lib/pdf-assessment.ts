import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SubmitAssessmentInput } from '@/app/actions/assessment';

const FONT_SIZE = 10;
const MARGIN = 14;

function buildAssessmentPdfDoc(data: SubmitAssessmentInput): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = MARGIN;

  doc.setFontSize(14);
  doc.text('Assessment Form – Submitted Copy', MARGIN, y);
  y += 10;

  doc.setFontSize(FONT_SIZE);
  doc.setFont('helvetica', 'bold');
  doc.text(`Association: ${data.associationName}`, MARGIN, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Region: ${data.regionName}`, MARGIN, y);
  y += 5;
  doc.text(`Contact: ${data.contactPerson} (${data.position})`, MARGIN, y);
  y += 5;
  doc.text(`Phone: ${data.phoneNumber}${data.email ? `  |  Email: ${data.email}` : ''}`, MARGIN, y);
  y += 10;

  const tableBody = data.churches.map((c) => [
    c.name,
    c.pastorName ?? '',
    c.contactNumber ?? '',
    [c.municipalityName, c.barangayName].filter(Boolean).join(', '),
    c.ga2023 ? 'Yes' : '',
    c.ga2024 ? 'Yes' : '',
    c.ga2025 ? 'Yes' : '',
    c.remarks ?? '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Church', 'Pastor', 'Contact #', 'Location', '2023 GA', '2024 GA', '2025 GA', 'Remarks']],
    body: tableBody,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 66, 66], fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 28 },
      2: { cellWidth: 22 },
      3: { cellWidth: 38 },
      4: { cellWidth: 12 },
      5: { cellWidth: 12 },
      6: { cellWidth: 12 },
      7: { cellWidth: 25 },
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY ?? y;
  doc.setFontSize(8);
  doc.text(`Submitted on ${new Date().toLocaleString()}`, MARGIN, finalY + 8);

  return doc;
}

function getPdfFilename(data: SubmitAssessmentInput): string {
  const safeName = data.associationName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').slice(0, 40);
  return `Assessment_${safeName}_${Date.now()}.pdf`;
}

/** Trigger download of the assessment PDF. May not work in in-app browsers (e.g. Messenger, Instagram). */
export function downloadAssessmentPdf(data: SubmitAssessmentInput): void {
  const doc = buildAssessmentPdfDoc(data);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const filename = getPdfFilename(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Open the assessment PDF in a new tab. Use when download fails (e.g. in Messenger or Instagram). */
export function openAssessmentPdfInNewTab(data: SubmitAssessmentInput): void {
  const doc = buildAssessmentPdfDoc(data);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
