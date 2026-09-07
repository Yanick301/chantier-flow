import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Building2,
  Wallet,
  Receipt,
  Users,
  Shield,
  X,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { to: '/chantiers', icon: Building2, label: 'Chantiers' },
    { to: '/fonds', icon: Wallet, label: 'Fonds' },
    { to: '/depenses', icon: Receipt, label: 'Dépenses' },
    ...(user?.role === 'president' ? [
      { to: '/utilisateurs', icon: Users, label: 'Utilisateurs' },
      { to: '/audit', icon: Shield, label: 'Journal d\'audit' },
    ] : []),
  ];

  const roleLabels: Record<string, string> = {
    president: 'Président',
    controleur: 'Contrôleur',
    comptable: 'Comptable',
  };

  const roleBadgeColors: Record<string, string> = {
    president: 'bg-slate-800 text-white',
    controleur: 'bg-amber-100 text-amber-800',
    comptable: 'bg-emerald-100 text-emerald-800',
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="text-base font-bold text-slate-900 tracking-tight">CHANTIER</span>
              <span className="text-blue-600 font-bold text-base tracking-tight ml-1">FLOW</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-xs">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.prenom} {user?.nom}
              </p>
              <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 ${roleBadgeColors[user?.role || 'comptable']}`}>
                {roleLabels[user?.role || 'comptable']}
              </span>
            </div>
          </div>
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2.5 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg transition-all duration-150 text-xs font-medium min-h-[44px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col flex-shrink-0">
        {sidebarContent}
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative w-[85vw] max-w-72 bg-white shadow-2xl flex flex-col animate-slide-in z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
