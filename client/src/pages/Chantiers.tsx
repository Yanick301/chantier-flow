import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Chantier } from '../types';
import { formatMontant, statutChantierColors, statutChantierLabels } from '../utils/helpers';
import { Building2, MapPin, Plus, Eye, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { ConstructionIllustration } from '../components/ui/Illustrations';

export default function Chantiers() {
  const { user } = useAuth();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ nom: '', localisation: '', description: '', responsable_id: '' });

  useEffect(() => {
    loadChantiers();
    if (user?.role === 'president') loadUsers();
  }, []);

  const loadChantiers = async () => {
    try {
      const data = await api.get('/chantiers');
      setChantiers(data);
    } catch (error) {
      toast.error('Erreur chargement chantiers');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (error) {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/chantiers', {
        ...form,
        responsable_id: form.responsable_id ? parseInt(form.responsable_id) : undefined,
      });
      toast.success('Chantier créé');
      setShowModal(false);
      setForm({ nom: '', localisation: '', description: '', responsable_id: '' });
      loadChantiers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Chantiers</h1>
          <p className="text-sm text-slate-500 mt-1">{chantiers.length} chantier(s) au total</p>
        </div>
        {(user?.role === 'president' || user?.role === 'controleur') && (
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau chantier</span>
            <span className="sm:hidden">Nouveau</span>
          </button>
        )}
      </div>

      {chantiers.length === 0 ? (
        <EmptyState
          illustration={<ConstructionIllustration />}
          title="Aucun chantier enregistré"
          description="Créez votre premier chantier pour commencer à suivre les finances."
          action={
            (user?.role === 'president' || user?.role === 'controleur') ? (
              <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-colors">
                <Plus className="w-4 h-4" />
                Créer un chantier
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {chantiers.map((chantier) => (
            <div key={chantier.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-[18px] h-[18px] text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate text-sm">{chantier.nom}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{chantier.localisation}</span>
                    </p>
                  </div>
                </div>
                <span className={`badge ${statutChantierColors[chantier.statut]} flex-shrink-0 ml-2`}>
                  {statutChantierLabels[chantier.statut]}
                </span>
              </div>

              {chantier.description && (
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{chantier.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-[11px] text-slate-500 font-medium">Caisses</p>
                  <p className="text-base font-bold text-slate-900">{chantier.nb_caisses || 0}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-[11px] text-slate-500 font-medium">Solde total</p>
                  <p className="text-sm font-bold text-emerald-600 truncate">{formatMontant(chantier.solde_total || 0)}</p>
                </div>
              </div>

              <Link
                to={`/chantiers/${chantier.id}`}
                className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm border border-slate-200"
              >
                Voir les détails
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouveau chantier" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nom du chantier</label>
            <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="input-field" placeholder="Ex: CHANTIER OUIDAH" required />
          </div>
          <div>
            <label className="label">Localisation</label>
            <input type="text" value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} className="input-field" placeholder="Ex: Ouidah, Bénin" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} placeholder="Description du chantier..." />
          </div>
          {user?.role === 'president' && (
            <div>
              <label className="label">Responsable</label>
              <select value={form.responsable_id} onChange={(e) => setForm({ ...form, responsable_id: e.target.value })} className="input-field">
                <option value="">Sélectionner...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2 pb-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-xl transition-colors text-sm">Annuler</button>
            <button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm">Créer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
