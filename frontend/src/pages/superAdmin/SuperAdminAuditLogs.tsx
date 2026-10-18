import React, { useEffect, useState } from 'react';
import { History, Shield, Clock } from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { api } from '../../services/api';

export const SuperAdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.getSuperAdminAuditLogs();
        setLogs(res.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Security Audit Trail</h1>
          <p className="text-xs text-stone-500 mt-1">Immutable security log of platform events, logins, and settings updates</p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden divide-y divide-stone-100">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-stone-900 block font-mono">{log.action}</strong>
                  <span className="text-stone-500">
                    By: {log.user?.email || 'System'} {log.restaurant && `• Cafe: ${log.restaurant.name}`}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-stone-400 block">{new Date(log.createdAt).toLocaleString()}</span>
                {log.ipAddress && <span className="font-mono text-[10px] text-stone-400">IP: {log.ipAddress}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
};
