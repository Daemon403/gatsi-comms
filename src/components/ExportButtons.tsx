'use client';

import { Download, FileText } from 'lucide-react';

interface RevenueEntry {
  period: string;
  revenue: number;
  paid: number;
  count: number;
}

interface ServiceEntry {
  category: string;
  revenue: number;
  count: number;
}

interface Profitability {
  totalRevenue: number;
  totalCollected: number;
  totalExpenses: number;
  netProfit: number;
  orderCount: number;
  expenseCount: number;
}

interface ExportButtonsProps {
  revenueData: RevenueEntry[];
  serviceData: ServiceEntry[];
  profitability: Profitability | null;
  dateRange: { from: string; to: string };
}

function formatExportCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ExportButtons({
  revenueData,
  serviceData,
  profitability,
  dateRange,
}: ExportButtonsProps) {
  async function exportToExcel() {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    const revenueSheet = XLSX.utils.json_to_sheet(
      revenueData.map((d) => ({
        Period: d.period,
        Revenue: d.revenue,
        Paid: d.paid,
        Orders: d.count,
      }))
    );
    XLSX.utils.book_append_sheet(wb, revenueSheet, 'Revenue');

    const serviceSheet = XLSX.utils.json_to_sheet(
      serviceData.map((s) => ({
        Category: s.category,
        Revenue: s.revenue,
        Orders: s.count,
      }))
    );
    XLSX.utils.book_append_sheet(wb, serviceSheet, 'By Service');

    if (profitability) {
      const profitSheet = XLSX.utils.json_to_sheet([
        {
          Metric: 'Total Revenue',
          Value: profitability.totalRevenue,
        },
        {
          Metric: 'Total Collected',
          Value: profitability.totalCollected,
        },
        {
          Metric: 'Total Expenses',
          Value: profitability.totalExpenses,
        },
        {
          Metric: 'Net Profit',
          Value: profitability.netProfit,
        },
      ]);
      XLSX.utils.book_append_sheet(wb, profitSheet, 'Profitability');
    }

    const fileName = `GATSI_Report_${dateRange.from}_to_${dateRange.to}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  async function exportToPDF() {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('GATSI COMMS - Financial Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Period: ${dateRange.from} to ${dateRange.to}`, 14, 30);

    if (profitability) {
      doc.setFontSize(14);
      doc.text('Profitability Summary', 14, 44);

      autoTable(doc, {
        startY: 48,
        head: [['Metric', 'Amount']],
        body: [
          ['Total Revenue', formatExportCurrency(profitability.totalRevenue)],
          ['Total Collected', formatExportCurrency(profitability.totalCollected)],
          ['Total Expenses', formatExportCurrency(profitability.totalExpenses)],
          ['Net Profit', formatExportCurrency(profitability.netProfit)],
        ],
        theme: 'grid',
      });
    }

    const profitTableEnd = profitability ? 90 : 44;

    doc.setFontSize(14);
    doc.text('Revenue by Period', 14, profitTableEnd + 10);

    autoTable(doc, {
      startY: profitTableEnd + 14,
      head: [['Period', 'Revenue', 'Paid', 'Orders']],
      body: revenueData.map((d) => [
        d.period,
        formatExportCurrency(d.revenue),
        formatExportCurrency(d.paid),
        String(d.count),
      ]),
      theme: 'grid',
    });

    doc.addPage();

    doc.setFontSize(14);
    doc.text('Revenue by Service Category', 14, 22);

    autoTable(doc, {
      startY: 26,
      head: [['Category', 'Revenue', 'Orders']],
      body: serviceData.map((s) => [
        s.category,
        formatExportCurrency(s.revenue),
        String(s.count),
      ]),
      theme: 'grid',
    });

    const fileName = `GATSI_Report_${dateRange.from}_to_${dateRange.to}.pdf`;
    doc.save(fileName);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={exportToExcel}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
      >
        <Download size={16} className="text-brand-500" />
        Export Excel
      </button>
      <button
        type="button"
        onClick={exportToPDF}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
      >
        <FileText size={16} className="text-brand-500" />
        Export PDF
      </button>
    </div>
  );
}
