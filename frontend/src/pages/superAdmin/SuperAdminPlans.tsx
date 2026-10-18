import React, { useEffect, useState } from 'react';
import { CreditCard, Check, Zap } from 'lucide-react';
import { SuperAdminLayout } from '../../components/layout/SuperAdminLayout';
import { api } from '../../services/api';

export const SuperAdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await api.getSuperAdminPlans();
        setPlans(res.plans || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Subscription Plans</h1>
          <p className="text-xs text-stone-500 mt-1">Platform pricing tiers and feature entitlements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => {
            let features: string[] = [];
            try {
              features = JSON.parse(p.features || '[]');
            } catch {}

            return (
              <div key={p.id} className="bg-white rounded-3xl border border-stone-200 p-6 shadow-soft flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block mb-1">
                    {p.billingInterval}
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">{p.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="font-serif text-3xl font-extrabold text-stone-900">₹{p.price}</span>
                    <span className="text-xs text-stone-400">/ month</span>
                  </div>

                  <div className="pt-3 border-t border-stone-100 space-y-2 text-xs text-stone-600 mb-6">
                    <p>• Max Tables: <strong>{p.maxTables}</strong></p>
                    <p>• Max Menu Items: <strong>{p.maxItems}</strong></p>
                    {features.map((f, i) => (
                      <p key={i} className="flex items-center gap-1.5 text-stone-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="capitalize">{f.replace(/_/g, ' ')}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 text-xs text-stone-400 flex justify-between items-center">
                  <span>{p._count?.subscriptions || 0} active subscribers</span>
                  <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SuperAdminLayout>
  );
};
