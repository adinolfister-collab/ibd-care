import React from 'react';
import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MonthlyReportView from '@/components/reports/MonthlyReportView';
import { monthlyReportData } from '@/lib/screenshotSampleData';

// Frame del report mensile: usa il componente reale MonthlyReportView con
// dati di esempio statici, così lo screenshot riflette l'output PDF reale.
export default function ReportFrame() {
  return (
    <div className="h-full overflow-y-auto px-3 pb-4">
      <div className="flex justify-end mb-2">
        <Button variant="outline" className="rounded-xl h-8 px-3 text-xs"><FileDown className="w-3.5 h-3.5 mr-1" />Esporta PDF</Button>
      </div>
      <MonthlyReportView data={monthlyReportData} />
    </div>
  );
}