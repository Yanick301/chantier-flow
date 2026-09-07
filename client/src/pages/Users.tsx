import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User } from '../types';
import { roleLabels, roleBadgeColors } from '../utils/helpers';
import { UserPlus, Shield, KeyRound, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import InputDialog from '../components/ui/InputDialog';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toggleUser, setToggleUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    email: '', mot_de_passe: '', nom: '', prenom: '', telephone: '',
    role: 'comptable' as 'president' | 'controleur' | 'comptable',
  });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (error) {
      toast.error('Erreur chargement utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.mot_de_passe || !form.nom || !form.prenom) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      await api.post('/users', {
        email: form.email,
        mot_de_passe: form.mot_de_passe,
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        role: form.role,
      });
      toast.success('Utilisateur créé');
      setShowModal(false);
      setForm({ email: '', mot_de_passe: '', nom: '', prenom: '', telephone: '', role: 'comptable' });
      loadUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggle = async () => {
    if (!toggleUser) return;
    try {
      await api.put(`/users/${toggleUser.id}`, { actif: toggleUser.actif ? 0 : 1 });
      toast.success(toggleUser.actif ? 'Utilisateur désactivé' : 'Utilisateur activé');
      setToggleUser(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!resetPasswordUser) return;
    try {
      await api.put(`/users/${resetPasswordUser.id}`, { mot_de_passe: newPassword });
      toast.success('Mot de passe réinitialisé');
      setResetPasswordUser(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8 animate-fade-in">
        <div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="page-subtitle">Gestion des accès au système</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Nouvel utilisateur
        </button>
      </div>

      <div className="card !p-0 overflow-hidden animate-fade-in">
        <div className="sm:hidden divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-600 font-bold text-sm">{u.prenom[0]}{u.nom[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.prenom} {u.nom}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <span className={`badge ${roleBadgeColors[u.role]}`}>{roleLabels[u.role]}</span>
                  <span className={`badge ${u.actif ? 'badge-success' : 'badge-danger'}`}>
                    {u.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-500">{u.telephone || '—'}</p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setToggleUser(u)} className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${u.actif ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                    {u.actif ? 'Désactiver' : 'Activer'}
                  </button>
                  <button onClick={() => setResetPasswordUser(u)} className="text-xs px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors flex items-center gap-1 min-h-[44px]">
                    <KeyRound className="w-3 h-3" /> MDP
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Nom</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Téléphone</th>
                <th className="text-left px-4 py-3">Rôle</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="table-row">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-600 font-bold text-xs">{u.prenom[0]}{u.nom[0]}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-900">{u.prenom} {u.nom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{u.telephone || '—'}</td>
                  <td className="px-4 py-3"><span className={`badge ${roleBadgeColors[u.role]}`}>{roleLabels[u.role]}</span></td>
                  <td className="px-4 py-3">
                    <span className={`badge ${u.actif ? 'badge-success' : 'badge-danger'}`}>
                      {u.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setToggleUser(u)} className={`text-sm px-3 py-1 rounded-lg font-medium transition-colors ${u.actif ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                        {u.actif ? 'Désactiver' : 'Activer'}
                      </button>
                      <button onClick={() => setResetPasswordUser(u)} className="text-sm px-3 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" /> Reset MDP
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvel utilisateur" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prénom</label>
              <input type="text" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className="input-field" required autoFocus />
            </div>
            <div>
              <label className="label">Nom</label>
              <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="label">Mot de passe</label>
              <input type="password" value={form.mot_de_passe} onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })} className="input-field" required minLength={6} />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="label">Rôle</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })} className="input-field">
              <option value="comptable">Comptable</option>
              <option value="controleur">Contrôleur</option>
              <option value="president">Président</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2 pb-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Annuler</button>
            <button type="submit" className="flex-1 btn-primary">Créer</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={toggleUser !== null}
        onClose={() => setToggleUser(null)}
        onConfirm={handleToggle}
        title={toggleUser?.actif ? 'Désactiver l\'utilisateur' : 'Activer l\'utilisateur'}
        message={toggleUser?.actif
          ? `Désactiver ${toggleUser?.prenom} ${toggleUser?.nom} ? Il ne pourra plus se connecter.`
          : `Activer ${toggleUser?.prenom} ${toggleUser?.nom} ? Il pourra à nouveau se connecter.`
        }
        confirmLabel={toggleUser?.actif ? 'Désactiver' : 'Activer'}
        variant={toggleUser?.actif ? 'danger' : 'success'}
      />

      <InputDialog
        isOpen={resetPasswordUser !== null}
        onClose={() => setResetPasswordUser(null)}
        onConfirm={handleResetPassword}
        title="Réinitialiser le mot de passe"
        message={`Nouveau mot de passe pour ${resetPasswordUser?.prenom} ${resetPasswordUser?.nom} :`}
        placeholder="Nouveau mot de passe..."
        confirmLabel="Réinitialiser"
        variant="info"
        required={true}
      />
    </div>
  );
}
