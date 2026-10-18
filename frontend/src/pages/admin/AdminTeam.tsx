import React, { useEffect, useState } from 'react';
import { Plus, Users, Shield, Mail, Phone } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../services/api';

export const AdminTeam: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('STAFF');
  const [password, setPassword] = useState('Password123!');
  const [submitting, setSubmitting] = useState(false);

  const fetchTeam = async () => {
    try {
      const res = await api.getTeamMembers();
      setMembers(res.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    try {
      setSubmitting(true);
      await api.createTeamMember({ name, email, phone, role, password });
      setShowAdd(false);
      setName('');
      setEmail('');
      setPhone('');
      fetchTeam();
    } catch (err: any) {
      alert(err.message || 'Failed to add staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-stone-900">Staff & Team Management</h1>
            <p className="text-xs text-stone-500 mt-1">Manage kitchen staff, managers, and floor servers</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-nature-900 hover:bg-nature-950 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow"
          >
            <Plus className="w-4 h-4 text-nature-300" />
            <span>Add Team Member</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 shadow-soft overflow-hidden divide-y divide-stone-100">
          {members.map((m) => (
            <div key={m.id} className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-nature-100 text-nature-900 flex items-center justify-center font-bold text-sm">
                  {m.user?.name ? m.user.name[0] : 'S'}
                </div>
                <div>
                  <strong className="text-sm text-stone-900 block">{m.user?.name}</strong>
                  <span className="text-xs text-stone-500 flex items-center gap-3">
                    <span>{m.user?.email}</span>
                    {m.user?.phone && <span>• {m.user?.phone}</span>}
                  </span>
                </div>
              </div>

              <span className="text-xs bg-stone-100 text-stone-800 font-bold px-3 py-1 rounded-full">
                {m.role}
              </span>
            </div>
          ))}
        </div>

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h2 className="font-serif font-bold text-xl text-stone-900">Add Staff Account</h2>
              <form onSubmit={handleCreate} className="space-y-4 pt-1">
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Staff Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikas Verma"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vikas@switea.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-nature-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm bg-white"
                    >
                      <option value="STAFF">Floor Staff</option>
                      <option value="KITCHEN">Kitchen Staff</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold text-stone-600 block mb-1">
                      Default Password
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                    />
                  </div>
                </div>
                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-nature-900 text-white px-5 py-2 rounded-xl text-xs font-bold shadow"
                  >
                    {submitting ? 'Creating...' : 'Create Account'}
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
