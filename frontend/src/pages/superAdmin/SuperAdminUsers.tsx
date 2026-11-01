import React, { useEffect, useState } from 'react';
import { Users, ShieldCheck, Mail, Key, Check, AlertCircle, X, Search, Phone, Eye, EyeOff } from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { api } from '../../services/api';

export const SuperAdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Password reset modal state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getSuperAdminUsers();
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenResetModal = (user: any) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPassword(false);
    setStatusMessage(null);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    try {
      setSubmittingPassword(true);
      setStatusMessage(null);
      await api.resetUserPassword(selectedUser.id, newPassword);
      setStatusMessage({ type: 'success', text: `Password for ${selectedUser.email} updated successfully!` });
      setTimeout(() => {
        setSelectedUser(null);
        setNewPassword('');
        setStatusMessage(null);
      }, 1800);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to reset password.' });
    } finally {
      setSubmittingPassword(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OWNER':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'KITCHEN':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">Platform Users & Access</h1>
            <p className="text-xs text-stone-500 mt-1">
              Manage accounts, assign roles, and securely reset admin & staff passwords
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-soft overflow-hidden divide-y divide-stone-100">
          {loading ? (
            <div className="p-12 text-center text-xs text-stone-400">Loading users directory...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500">No users found matching your search.</div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/70 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {u.name ? u.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <strong className="text-sm text-stone-900 block truncate">{u.name || 'Unnamed User'}</strong>
                    <div className="text-xs text-stone-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </span>
                      {u.phone && (
                        <span className="flex items-center gap-1 text-stone-500">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{u.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getRoleBadge(u.role)}`}>
                    {u.role}
                  </span>
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    {u.status}
                  </span>

                  <button
                    onClick={() => handleOpenResetModal(u)}
                    className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-indigo-50 hover:text-indigo-700 text-stone-700 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors border border-stone-200"
                    title="Change or reset password for this user"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Reset Password</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Password Reset Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => !submittingPassword && setSelectedUser(null)}
            />

            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 z-10 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">Change Admin Password</h3>
                    <p className="text-[11px] text-stone-500 truncate max-w-[240px]">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  disabled={submittingPassword}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Prevent aggressive browser password managers from pre-filling with email */}
                <input type="text" style={{ display: 'none' }} tabIndex={-1} readOnly />
                <input type="password" style={{ display: 'none' }} tabIndex={-1} readOnly />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">
                      New Password for {selectedUser.name || selectedUser.email}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
                        let pwd = '';
                        for (let i = 0; i < 12; i++) {
                          pwd += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setNewPassword(pwd);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold"
                    >
                      Generate Strong Password
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      name="new_admin_credential_key"
                      autoComplete="new-password"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      placeholder="Enter at least 6 characters..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">
                    The user will be able to immediately log into their portal with this new password.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    disabled={submittingPassword}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPassword}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingPassword ? (
                      <span>Saving Password...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Apply Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
};
