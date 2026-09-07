import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { LogOut, Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { count: notifCount } = useNotifications(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 sticky top-0 z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2.5 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-sm font-semibold text-slate-800">Tableau de bord</h2>
          <p className="text-[11px] text-slate-400">Système de Contrôle Financier</p>
        </div>
        <h2 className="text-sm font-semibold text-slate-800 sm:hidden">Chantier Flow</h2>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <button
          onClick={() => {
            if (user?.role === 'president' || user?.role === 'controleur') {
              navigate('/fonds');
            } else {
              navigate('/depenses');
            }
          }}
          className="relative p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Bell className="w-5 h-5" />
          {notifCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
              {notifCount > 99 ? '99+' : notifCount}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-150 min-w-[44px] min-h-[44px] justify-center"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
