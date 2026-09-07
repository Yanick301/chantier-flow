import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { DashboardStats } from '../types';
import { formatMontant } from '../utils/helpers';
import {
  Building2,
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Users,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const CHART_COLORS = ['#0f172a', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function StatCard({ icon: Icon, label, value, color, iconBg }: {
  icon: any; label: string; value: string | number; color?: string; iconBg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
          <p className={`text-xl sm:text-2xl font-bold mt-1.5 truncate ${color || 'text-slate-900'}`}>{value}</p>
        </div>
        <div className={`w-10 h-10 sm:w-11 sm:h-11 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.get('/stats/dashboard');
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Receipt className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-slate-800 font-medium mb-1">Erreur de chargement</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button onClick={loadStats} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const roleLabelsMap: Record<string, string> = {
    president: 'Président', controleur: 'Contrôleur', comptable: 'Comptable',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-slate-500 mt-1">Vue d'ensemble — {roleLabelsMap[user?.role || 'comptable']}</p>
      </div>

      {user?.role === 'president' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={Building2} label="Chantiers actifs" value={stats.chantiers_actifs || 0} iconBg="bg-blue-50 text-blue-600" />
            <StatCard icon={Wallet} label="Solde total" value={formatMontant(stats.solde_total || 0)} color="text-emerald-600" iconBg="bg-emerald-50 text-emerald-600" />
            <StatCard icon={Clock} label="Fonds en attente" value={formatMontant(stats.fonds_en_attente || 0)} color="text-amber-600" iconBg="bg-amber-50 text-amber-600" />
            <StatCard icon={Receipt} label="Dépenses en attente" value={stats.depenses_en_attente || 0} color="text-red-600" iconBg="bg-red-50 text-red-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Évolution mensuelle</h3>
              <div className="h-[200px] sm:h-[280px] overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.evolution_mensuelle || []} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={55} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value: number) => formatMontant(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    />
                    <Bar dataKey="depenses" fill="#0f172a" radius={[4, 4, 0, 0]} name="Dépenses" />
                    <Bar dataKey="en_attente" fill="#f59e0b" radius={[4, 4, 0, 0]} name="En attente" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Dépenses par catégorie</h3>
              <div className="h-[200px] sm:h-[280px] overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.depenses_par_categorie || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="total"
                      nameKey="categorie"
                    >
                      {(stats.depenses_par_categorie || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatMontant(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {(stats.depenses_par_categorie || []).length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {(stats.depenses_par_categorie || []).map((cat, i) => (
                    <div key={cat.categorie} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-slate-600">{cat.categorie}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard icon={TrendingUp} label="Total fonds reçus" value={formatMontant(stats.total_fonds_envoyes || 0)} iconBg="bg-emerald-50 text-emerald-600" />
            <StatCard icon={TrendingDown} label="Total dépenses validées" value={formatMontant(stats.total_depenses || 0)} iconBg="bg-red-50 text-red-600" />
            <StatCard icon={Users} label="Utilisateurs actifs" value={stats.total_utilisateurs || 0} iconBg="bg-blue-50 text-blue-600" />
          </div>
        </div>
      )}

      {user?.role === 'controleur' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={Building2} label="Mes chantiers" value={stats.mes_chantiers || 0} iconBg="bg-blue-50 text-blue-600" />
          <StatCard icon={Wallet} label="Fonds à valider" value={stats.fonds_a_valider || 0} color="text-amber-600" iconBg="bg-amber-50 text-amber-600" />
          <StatCard icon={Receipt} label="À contrôler" value={stats.depenses_a_controler || 0} color="text-red-600" iconBg="bg-red-50 text-red-600" />
          <StatCard icon={CheckCircle} label="Contrôlées" value={stats.total_depenses_controlees || 0} color="text-emerald-600" iconBg="bg-emerald-50 text-emerald-600" />
        </div>
      )}

      {user?.role === 'comptable' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={Receipt} label="Mes dépenses" value={stats.mes_depenses || 0} iconBg="bg-blue-50 text-blue-600" />
          <StatCard icon={Clock} label="En attente" value={stats.depenses_en_attente || 0} color="text-amber-600" iconBg="bg-amber-50 text-amber-600" />
          <StatCard icon={CheckCircle} label="Validées" value={stats.depenses_validees || 0} color="text-emerald-600" iconBg="bg-emerald-50 text-emerald-600" />
          <StatCard icon={TrendingUp} label="Total validé" value={formatMontant(stats.total_montant_depenses || 0)} iconBg="bg-slate-50 text-slate-600" />
        </div>
      )}
    </div>
  );
}
