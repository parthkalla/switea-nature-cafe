import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, RefreshCw, Printer, Trash2, Users, Layers } from 'lucide-react';
import { Table } from '../../types';

interface QRCodeCardProps {
  table: Table;
  onRegenerate: (tableId: string) => void;
  onDelete: (tableId: string) => void;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ table, onRegenerate, onDelete }) => {
  const qrRef = useRef<SVGSVGElement>(null);
  const targetUrl = table.qrUrl || `https://switeanaturecafe.com/menu/switea/table/${table.qrCode?.token || ''}`;

  const downloadSVG = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${table.tableNumber.replace(/\s+/g, '-')}-QR.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPNG = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, 50, 50, 500, 500);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${table.tableNumber.replace(/\s+/g, '-')}-QR.png`;
        link.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-soft p-5 flex flex-col justify-between hover:shadow-card transition-all">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-xs font-bold text-nature-700 uppercase tracking-wider block">
              {table.section}
            </span>
            <h3 className="font-serif text-lg font-bold text-stone-900">{table.tableNumber}</h3>
            <p className="text-xs text-stone-500">{table.name}</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-stone-600 bg-cream-200 px-2.5 py-1 rounded-full font-medium">
            <Users className="w-3.5 h-3.5 text-stone-500" />
            <span>Seats {table.capacity}</span>
          </span>
        </div>

        {/* QR Code Graphic Frame */}
        <div className="bg-cream-100 rounded-2xl p-4 flex flex-col items-center justify-center border border-cream-300/60 my-2 print-container">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-stone-200">
            <QRCodeSVG
              ref={qrRef}
              value={targetUrl}
              size={150}
              level="H"
              fgColor="#1A3C2B"
              bgColor="#FFFFFF"
              includeMargin={false}
            />
          </div>
          <div className="mt-3 text-center">
            <p className="font-serif text-xs font-bold text-nature-950 uppercase tracking-wide">
              Switea Nature Cafe
            </p>
            <p className="text-[11px] font-semibold text-stone-600">Scan to Order • {table.tableNumber}</p>
          </div>
        </div>

        {/* Scan Analytics */}
        <div className="flex items-center justify-between text-xs text-stone-500 mt-2 px-1">
          <span>Scans: <strong className="text-stone-800">{table.qrCode?.scanCount || 0}</strong></span>
          <span className="text-[11px]">Token: <code className="bg-stone-100 px-1 py-0.5 rounded text-[10px]">{table.qrCode?.token.slice(0, 10)}...</code></span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between gap-1.5 no-print">
        <button
          onClick={downloadPNG}
          title="Download PNG image"
          className="p-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-nature-900 text-xs font-medium flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>PNG</span>
        </button>

        <button
          onClick={downloadSVG}
          title="Download SVG vector file"
          className="p-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-nature-900 text-xs font-medium flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>SVG</span>
        </button>

        <button
          onClick={handlePrint}
          title="Print Table Tent Label"
          className="p-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-nature-900 text-xs font-medium flex items-center gap-1"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>

        <button
          onClick={() => onRegenerate(table.id)}
          title="Regenerate/Revoke QR Token"
          className="p-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-amber-50 hover:text-amber-800 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onDelete(table.id)}
          title="Archive Table"
          className="p-2 rounded-xl border border-stone-200 text-stone-400 hover:bg-red-50 hover:text-red-700 text-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
