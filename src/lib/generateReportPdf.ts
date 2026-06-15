import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportData {
  userName: string;
  periodLabel: string; // contoh: "Juni 2026"
  income: number;
  expense: number;
  net: number;
  categoryBreakdown: Record<string, number>;
  topTransactions: { description: string; category_name: string; amount: number; date?: string }[];
  /** AI insights opsional — kalau ada, akan dirender di halaman 2 */
  aiInsights?: {
    worst_category_text?: string;
    good_news_text?: string;
    tips?: string[];
  };
}

const formatRupiah = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

/**
 * Generate PDF laporan keuangan dan return sebagai Uint8Array.
 * Server-side compatible (jsPDF jalan di Node).
 */
export function generateReportPdf(data: ReportData): Uint8Array {
  const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  let y = 0;

  // === HEADER GRADIENT BAR ===
  // Simulasikan gradient dengan multiple horizontal bands
  const bands = 30;
  const bandH = 65 / bands;
  for (let i = 0; i < bands; i++) {
    const t = i / bands;
    // Lerp dari primary-600 (#2563eb) ke secondary-600 (#7c3aed)
    const r = Math.round(0x25 + (0x7c - 0x25) * t);
    const g = Math.round(0x63 + (0x3a - 0x63) * t);
    const b = Math.round(0xeb + (0xed - 0xeb) * t);
    doc.setFillColor(r, g, b);
    doc.rect(0, i * bandH, pageW, bandH + 0.5, 'F');
  }

  // White brand "F" badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 15, 14, 14, 3, 3, 'F');
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('F', 19.5, 25);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('FinMate AI', 33, 22);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Laporan Keuangan', 33, 32);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode: ${data.periodLabel}`, 33, 39);
  doc.setFontSize(8);
  doc.text(`Untuk: ${data.userName}  ·  Dibuat: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 33, 45);

  y = 75;

  // === SUMMARY 3 CARDS ===
  const cardW = (pageW - 30 - 10) / 3; // 15 margin each side, 5 gap between
  const cardH = 28;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);

  const drawCard = (x: number, label: string, value: string, accent: [number, number, number]) => {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');
    // Accent bar di atas
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.roundedRect(x, y, cardW, 2, 1, 1, 'F');
    doc.rect(x, y + 1, cardW, 1, 'F');

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(label.toUpperCase(), x + 4, y + 9);

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 4, y + 20);
  };

  drawCard(15, 'Pemasukan', formatRupiah(data.income), [34, 197, 94]);
  drawCard(15 + cardW + 5, 'Pengeluaran', formatRupiah(data.expense), [239, 68, 68]);
  drawCard(15 + (cardW + 5) * 2, 'Sisa Bersih', formatRupiah(data.net), data.net >= 0 ? [37, 99, 235] : [239, 68, 68]);

  y += cardH + 12;

  // === DISTRIBUSI KATEGORI ===
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('DISTRIBUSI PENGELUARAN', 15, y);
  doc.setLineWidth(0.2);
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y + 2, pageW - 15, y + 2);
  y += 8;

  const sortedCats = Object.entries(data.categoryBreakdown).sort(([, a], [, b]) => b - a);

  if (sortedCats.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.text('Belum ada pengeluaran pada periode ini.', 15, y + 5);
    y += 15;
  } else {
    const colors: Record<string, [number, number, number]> = {
      Makanan: [249, 115, 22],
      Transportasi: [59, 130, 246],
      Hiburan: [168, 85, 247],
      Belanja: [236, 72, 153],
      Tagihan: [20, 184, 166],
      Kesehatan: [239, 68, 68],
      Pendidikan: [139, 92, 246],
      Lainnya: [107, 114, 128],
    };

    for (const [name, value] of sortedCats.slice(0, 8)) {
      const pct = data.expense > 0 ? (value / data.expense) * 100 : 0;
      const color = colors[name] || [148, 163, 184];

      // Color square
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(15, y, 3, 3, 0.5, 0.5, 'F');

      // Label
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.text(name, 20, y + 2.5);

      // Persentase + amount
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      const pctStr = `${pct.toFixed(0)}%`;
      doc.text(pctStr, pageW - 60, y + 2.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(formatRupiah(value), pageW - 15, y + 2.5, { align: 'right' });

      // Progress bar
      const barW = pageW - 30;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(15, y + 4, barW, 2, 1, 1, 'F');
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(15, y + 4, (barW * Math.max(2, pct)) / 100, 2, 1, 1, 'F');

      y += 11;
    }
  }

  y += 6;

  // === TOP 5 PENGELUARAN — TABLE ===
  if (data.topTransactions.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('5 PENGELUARAN TERBESAR', 15, y);
    doc.setLineWidth(0.2);
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y + 2, pageW - 15, y + 2);
    y += 4;

    autoTable(doc, {
      startY: y + 2,
      head: [['#', 'Deskripsi', 'Kategori', 'Jumlah']],
      body: data.topTransactions.slice(0, 5).map((t, i) => [
        String(i + 1),
        t.description || '—',
        t.category_name || '—',
        formatRupiah(t.amount),
      ]),
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [100, 116, 139],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 35 },
        3: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [239, 68, 68] },
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const colors: [number, number, number][] = [[239, 68, 68], [249, 115, 22], [245, 158, 11], [148, 163, 184], [148, 163, 184]];
          const c = colors[data.row.index] || [148, 163, 184];
          doc.setFillColor(c[0], c[1], c[2]);
          doc.setTextColor(255, 255, 255);
        }
      },
    });
  }

  // === AI INSIGHTS (halaman 2 kalau ada) ===
  if (data.aiInsights && (data.aiInsights.worst_category_text || data.aiInsights.good_news_text || (data.aiInsights.tips && data.aiInsights.tips.length > 0))) {
    doc.addPage();
    // Mini gradient header halaman 2
    const bandsP2 = 20;
    const bandH2 = 25 / bandsP2;
    for (let i = 0; i < bandsP2; i++) {
      const t = i / bandsP2;
      const r = Math.round(0x25 + (0x7c - 0x25) * t);
      const g = Math.round(0x63 + (0x3a - 0x63) * t);
      const b = Math.round(0xeb + (0xed - 0xeb) * t);
      doc.setFillColor(r, g, b);
      doc.rect(0, i * bandH2, pageW, bandH2 + 0.5, 'F');
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Analisis FinMate AI', 15, 17);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${data.periodLabel}`, 15, 22);

    let y2 = 38;

    // Card: Kategori Paling Boros
    if (data.aiInsights.worst_category_text) {
      // Card background
      doc.setFillColor(255, 247, 237); // orange-50
      doc.setDrawColor(254, 215, 170); // orange-200
      doc.roundedRect(15, y2, pageW - 30, 28, 3, 3, 'FD');
      // Accent stripe
      doc.setFillColor(249, 115, 22); // orange-500
      doc.roundedRect(15, y2, 1.5, 28, 0.5, 0.5, 'F');
      // Label
      doc.setFontSize(9);
      doc.setTextColor(154, 52, 18); // orange-900
      doc.setFont('helvetica', 'bold');
      doc.text('KATEGORI PALING BOROS', 20, y2 + 7);
      // Body text
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      const wrapped = doc.splitTextToSize(data.aiInsights.worst_category_text, pageW - 40);
      doc.text(wrapped, 20, y2 + 14);
      y2 += 34;
    }

    // Card: Kabar Baik
    if (data.aiInsights.good_news_text) {
      doc.setFillColor(240, 253, 244); // green-50
      doc.setDrawColor(187, 247, 208); // green-200
      doc.roundedRect(15, y2, pageW - 30, 28, 3, 3, 'FD');
      doc.setFillColor(34, 197, 94); // green-500
      doc.roundedRect(15, y2, 1.5, 28, 0.5, 0.5, 'F');
      doc.setFontSize(9);
      doc.setTextColor(20, 83, 45); // green-900
      doc.setFont('helvetica', 'bold');
      doc.text('KABAR BAIK', 20, y2 + 7);
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      const wrapped = doc.splitTextToSize(data.aiInsights.good_news_text, pageW - 40);
      doc.text(wrapped, 20, y2 + 14);
      y2 += 34;
    }

    // Tips list
    if (data.aiInsights.tips && data.aiInsights.tips.length > 0) {
      y2 += 4;
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('TIPS HEMAT KHUSUS UNTUK ANDA', 15, y2);
      doc.setLineWidth(0.2);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, y2 + 2, pageW - 15, y2 + 2);
      y2 += 10;

      data.aiInsights.tips.forEach((tip, i) => {
        // Bullet number badge
        doc.setFillColor(37, 99, 235);
        doc.circle(18, y2 - 1, 2.5, 'F');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(String(i + 1), 18, y2 + 0.5, { align: 'center' });

        // Tip text
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'normal');
        const wrappedTip = doc.splitTextToSize(tip, pageW - 35);
        doc.text(wrappedTip, 23, y2);
        y2 += (wrappedTip.length * 4.5) + 4;
      });
    }
  }

  // === FOOTER tiap halaman ===
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageH = doc.internal.pageSize.height;
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text('Laporan ini dibuat otomatis oleh FinMate AI', 15, pageH - 10);
    doc.text(`Hal. ${p}/${pageCount}  ·  finmate-ai-brown.vercel.app`, pageW - 15, pageH - 10, { align: 'right' });
  }

  return new Uint8Array(doc.output('arraybuffer'));
}
