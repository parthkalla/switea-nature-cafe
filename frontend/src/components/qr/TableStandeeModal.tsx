import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, X, Sparkles, Smartphone, Utensils, Wifi, CheckCircle2 } from 'lucide-react';
import { Table } from '../../types';

interface TableStandeeModalProps {
  table: Table | null;
  allTables?: Table[];
  isBatch?: boolean;
  onClose: () => void;
  cafeName?: string;
  cafeLogo?: string;
  cafeTagline?: string;
}

export const TableStandeeModal: React.FC<TableStandeeModalProps> = ({
  table,
  allTables = [],
  isBatch = false,
  onClose,
  cafeName = 'The RoastFuze Coffee Bar',
  cafeLogo = '/images/roastfuze_logo.png',
  cafeTagline = 'Musical Balcony Cafe • Jaipur',
}) => {
  const printTables = isBatch ? allTables : (table ? [table] : []);

  const handlePrint = () => {
    window.print();
  };

  const getTargetUrl = (tbl: Table) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://roastfuze.asrockstudios.in';
    const token = tbl.qrCode?.token || `tbl-${tbl.tableNumber}`;
    return `${origin}/menu?table=${token}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      {/* Top Floating Control Bar - Hidden during printing */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3 no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm shadow-xl transition-all hover:scale-105 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>{isBatch ? `Print All (${printTables.length}) Cards` : 'Print Table Standee'}</span>
        </button>

        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white shadow-xl transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Standee Printable Preview Container */}
      <div
        id="printable-standee-container"
        className="my-auto py-8 flex flex-col items-center gap-8 w-full max-w-4xl"
      >
        {printTables.map((tbl, index) => {
          const targetUrl = getTargetUrl(tbl);
          return (
            <div
              key={tbl.id || index}
              className="standee-card relative w-[360px] sm:w-[380px] bg-[#120d08] text-cream-100 rounded-[32px] p-6 shadow-2xl border-4 border-amber-600/60 overflow-hidden flex flex-col items-center justify-between text-center select-none"
              style={{
                aspectRatio: '4 / 6',
                minHeight: '540px',
                pageBreakAfter: 'always',
                pageBreakInside: 'avoid',
              }}
            >
              {/* Luxury Geometric Border Background Decoration */}
              <div className="absolute inset-2 rounded-[26px] border border-amber-500/30 pointer-events-none" />
              <div className="absolute inset-3.5 rounded-[22px] border border-amber-500/15 pointer-events-none" />

              {/* Corner Gold Flourishes */}
              <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-amber-400" />
              <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-amber-400" />
              <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-amber-400" />
              <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-amber-400" />

              {/* Card Header */}
              <div className="relative z-10 w-full pt-1">
                {/* Brand Logo & Name */}
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="bg-white/95 px-3 py-1.5 rounded-xl shadow-md border border-amber-500/40 inline-flex items-center justify-center">
                    {cafeLogo ? (
                      <img
                        src={cafeLogo}
                        alt={cafeName}
                        className="h-8 max-w-[140px] object-contain"
                      />
                    ) : (
                      <span className="font-serif font-black text-stone-900 text-sm tracking-wider uppercase">
                        {cafeName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-amber-400">
                    {cafeTagline}
                  </span>
                </div>

                {/* Table Number Gold Ribbon Badge */}
                <div className="mt-3 inline-flex flex-col items-center">
                  <div className="bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-stone-950 px-5 py-1 rounded-full shadow-lg border border-amber-200">
                    <span className="font-serif font-black text-sm tracking-widest uppercase">
                      TABLE {tbl.tableNumber}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-300 font-medium tracking-wide mt-1">
                    {tbl.name} • {tbl.section}
                  </span>
                </div>
              </div>

              {/* QR Code Center Plaque */}
              <div className="relative z-10 my-2 bg-gradient-to-b from-amber-50 to-amber-100/90 p-4 rounded-3xl shadow-xl border-2 border-amber-400/80 flex flex-col items-center">
                <div className="bg-white p-2.5 rounded-2xl shadow-inner border border-stone-200">
                  <QRCodeSVG
                    value={targetUrl}
                    size={170}
                    level="H"
                    fgColor="#1a0f05"
                    bgColor="#FFFFFF"
                    includeMargin={false}
                  />
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-stone-900 font-serif font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>Scan with Phone Camera</span>
                </div>
              </div>

              {/* 3 Step Instruction Guide */}
              <div className="relative z-10 w-full px-2">
                <div className="grid grid-cols-3 gap-1.5 text-[9px] text-stone-300 bg-stone-900/80 p-2 rounded-xl border border-stone-800">
                  <div className="flex flex-col items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-white">1. Open Camera</span>
                    <span className="text-[8px] text-stone-400 text-center leading-tight">No app required</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 border-x border-stone-800 px-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-white">2. Scan QR</span>
                    <span className="text-[8px] text-stone-400 text-center leading-tight">View live menu</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Utensils className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-white">3. Order Food</span>
                    <span className="text-[8px] text-stone-400 text-center leading-tight">Served to table</span>
                  </div>
                </div>

                {/* Wi-Fi & Counter info footer */}
                <div className="mt-2 flex items-center justify-between text-[9px] text-stone-400 px-1">
                  <span className="flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-amber-400" />
                    <span>Free Guest Wi-Fi</span>
                  </span>
                  <span className="text-stone-400 truncate max-w-[170px]">
                    Pay Online or At Counter
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Embedded Print Media Stylesheet */}
      <style>{`
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide all application elements */
          body * {
            visibility: hidden;
          }
          /* Show only the standee container and its children */
          #printable-standee-container,
          #printable-standee-container * {
            visibility: visible;
          }
          #printable-standee-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .standee-card {
            width: 3.8in !important;
            height: 5.8in !important;
            margin: 0 auto !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            break-after: page !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
