import React, { useEffect, useState } from 'react';
import { Users, ShieldCheck, Mail, Building2 } from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { api } from '../../services/api';

export const SuperAdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await api.getSuperAdminUsers();
        setUsers(res.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Platform Users</h1>
          <p className="text-xs text-stone-500 mt-1">Directory of all staff, owners, and system administrators</p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden divide-y divide-stone-100">
          {users.map((u) => (
            <div key={u.id} className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {u.name ? u.name[0] : 'U'}
                </div>
                <div>
                  <strong className="text-sm text-stone-900 block">{u.name}</strong>
                  <span className="text-xs text-stone-500 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{u.email}</span>
                    {u.phone && <span>• {u.phone}</span>}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs bg-stone-100 text-stone-700 font-mono font-bold px-3 py-1 rounded-full">
                  {u.role}
                </span>
                <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                  {u.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
};
