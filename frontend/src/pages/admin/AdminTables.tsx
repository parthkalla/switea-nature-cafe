import React, { useEffect, useState } from 'react';
import { Plus, Printer, RefreshCw, Layers, QrCode, Search, Check, AlertCircle } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { QRCodeCard } from '../../components/qr/QRCodeCard';
import { api } from '../../services/api';
import { Table } from '../../types';

export const AdminTables: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form inputs
  const [tableNumber, setTableNumber] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [section, setSection] = useState('Garden Area');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      const res = await api.getAdminTables();
      setTables(res.tables || []);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) return;

    try {
      setSubmitting(true);
      await api.createTable({
        tableNumber: tableNumber.trim(),
        name: name.trim() || tableNumber.trim(),
        capacity: Number(capacity),
        section: section.trim(),
      });
      setShowAddModal(false);
      setTableNumber('');
      setName('');
      fetchTables();
      setMessage('Table and QR Code generated successfully.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to create table.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerate = async (tableId: string) => {
    if (!window.confirm('Regenerating this QR code will revoke the old token. Proceed?')) return;
    try {
      await api.regenerateTableQR(tableId);
      fetchTables();
      setMessage('New QR token generated and old token revoked.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert('Failed to regenerate QR token.');
    }
  };

  const handleDelete = async (tableId: string) => {
    if (!window.confirm('Archive this table?')) return;
    try {
      await api.deleteTable(tableId);
      fetchTables();
    } catch (err: any) {
      alert('Failed to archive table.');
    }
  };

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Table & QR Code System</h1>
            <p className="text-xs text-stone-500 mt-1">
              Every table has a unique, unguessable security token for dine-in ordering
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintAll}
              className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4 text-stone-500" />
              <span>Print All QR Cards</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-nature-900 hover:bg-nature-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 text-nature-300" />
              <span>Add New Table</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}

        {/* Tables Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-400">Loading table QR codes...</div>
        ) : tables.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 p-8">
            <QrCode className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-stone-800">No tables created yet</h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">Click "Add New Table" to generate your first QR code.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tables.map((table) => (
              <QRCodeCard
                key={table.id}
                table={table}
                onRegenerate={handleRegenerate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Add Table Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="font-serif font-bold text-xl text-stone-900">Add Restaurant Table</h2>
              <p className="text-xs text-stone-500">
                A unique QR token and digital menu URL will be generated automatically.
              </p>

              <form onSubmit={handleCreateTable} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Table Identifier / Number
                  </label>
                  <input
                    type="text"
                    required
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. Table 06"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Garden Cabana 06"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Capacity (Seats)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Section / Zone
                    </label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800 bg-white"
                    >
                      <option value="Garden Area">Garden Area</option>
                      <option value="Cabana Gazebo">Cabana Gazebo</option>
                      <option value="Indoor Lounge">Indoor Lounge</option>
                      <option value="Rooftop Deck">Rooftop Deck</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-nature-900 hover:bg-nature-950 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow"
                  >
                    {submitting ? 'Generating...' : 'Create Table & QR'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
