import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Fonds as FondsType, Chantier, Caisse, User } from '../types';
import { formatMontant, statutFondsColors, statutFondsLabels } from '../utils/helpers';
import { Wallet, Plus, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import InputDialog from '../components/ui/InputDialog';
import EmptyState from '../components/ui/EmptyState';

export default function Fonds() {
  const { user } = useAuth();
  const [fonds, setFonds] = useState<FondsType[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [caisses, setCaisses] = useState<Caisse[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedChantier, setSelectedChantier] = useState('');
  const [confirmValider, setConfirmValider] = useState<number | null>(null);
  const [rejeterId, setRejeterId] = useState<number | null>(null);
  const [form, setForm] = useState({
    caisse_id: '', montant: '', motif: '',
    date_envoi: new Date().toISOString().split('T')[0],
    beneficiaire_id: '', comptable_id: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [chantiersData, usersData] = await Promise.all([
        api.get('/chantiers'),
        user?.role === 'president' ? api.get('/users') : Promise.resolve([]),
      ]);
      setChantiers(chantiersData);
      setUsers(usersData);
    } catch (error) {
      toast.error('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  };

  const loadCaisses = async (chantierId: string) => {
    if (!chantierId) { setCaisses([]); return; }
    try {
      const data = await api.get(`/caisses/chantier/${chantierId}`);
      setCaisses(data);
    } catch (error) {}
  };

  const handleChantierChange = async (chantierId: string) => {
    setSelectedChantier(chantierId);
    setForm({ ...form, caisse_id: '' });
    await loadCaisses(chantierId);
  };

  const loadAllFonds = async () => {
    try {
      const allFonds: FondsType[] = [];
      for (const chantier of chantiers) {
        const caissesData = await api.get(`/caisses/chantier/${chantier.id}`);
        for (const caisse of caissesData) {
          const fondsData = await api.get(`/fonds/caisse/${caisse.id}`);
          allFonds.push(...fondsData.map((f: any) => ({ ...f, caisse_nom: caisse.nom, chantier_nom: chantier.nom })));
        }
      }
      setFonds(allFonds.sort((a, b) => new Date(b.date_envoi).getTime() - new Date(a.date_envoi).getTime()));
    } catch (error) {}
  };

  useEffect(() => { if (chantiers.length > 0) loadAllFonds(); }, [chantiers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fonds', {
        ...form,
        montant: parseFloat(form.montant),
        caisse_id: parseInt(form.caisse_id),
        beneficiaire_id: parseInt(form.beneficiaire_id),
        comptable_id: parseInt(form.comptable_id),
      });
      toast.success('Fonds envoyés');
      setShowModal(false);
      setForm({ caisse_id: '', montant: '', motif: '', date_envoi: new Date().toISOString().split('T')[0], beneficiaire_id: '', comptable_id: '' });
      setSelectedChantier('');
      setCaisses([]);
      loadAllFonds();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleValider = async () => {
    if (!confirmValider) return;
    try {
      await api.put(`/fonds/${confirmValider}/valider`, {});
      toast.success('Fonds validés');
      setConfirmValider(null);
      loadAllFonds();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRejeter = async (commentaire: string) => {
    if (!rejeterId) return;
    try {
      await api.put(`/fonds/${rejeterId}/rejeter`, { commentaire });
      toast.success('Fonds rejetés');
      setRejeterId(null);
      loadAllFonds();
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
          <h1 className="page-title">Fonds</h1>
          <p className="page-subtitle">Gestion des fonds envoyés aux chantiers</p>
        </div>
        {(user?.role === 'president' || user?.role === 'controleur') && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Envoyer des fonds</span>
            <span className="sm:hidden">Envoyer</span>
          </button>
        )}
      </div>

      <div className="card !p-0 overflow-hidden animate-fade-in">
        {fonds.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-9 h-9 text-slate-300" />}
            title="Aucun fonds enregistré"
            description="Les fonds envoyés aux chantiers apparaîtront ici."
            action={
              (user?.role === 'president' || user?.role === 'controleur') ? (
                <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-colors">
                  <Plus className="w-4 h-4" />
                  Envoyer des fonds
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="sm:hidden divide-y divide-slate-100">
              {fonds.map((fond) => (
                <div key={fond.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{(fond as any).chantier_nom}</p>
                      <p className="text-xs text-slate-500">{(fond as any).caisse_nom}</p>
                    </div>
                    <span className={`badge ${statutFondsColors[fond.statut]} flex-shrink-0 ml-2`}>
                      {statutFondsLabels[fond.statut]}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 mb-1">{formatMontant(fond.montant)}</p>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{fond.motif}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{fond.date_envoi}</span>
                    {fond.statut === 'en_attente' && (user?.role === 'president' || user?.role === 'controleur') && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setConfirmValider(fond.id)} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => setRejeterId(fond.id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-4 py-3">Date envoi</th>
                    <th className="text-left px-4 py-3">Chantier</th>
                    <th className="text-left px-4 py-3">Caisse</th>
                    <th className="text-left px-4 py-3">Montant</th>
                    <th className="text-left px-4 py-3">Motif</th>
                    <th className="text-left px-4 py-3">Envoyé par</th>
                    <th className="text-left px-4 py-3">Statut</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fonds.map((fond) => (
                    <tr key={fond.id} className="table-row">
                      <td className="px-4 py-3 text-sm text-slate-600">{fond.date_envoi}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{(fond as any).chantier_nom}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{(fond as any).caisse_nom}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatMontant(fond.montant)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate">{fond.motif}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{fond.envoye_par_nom}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${statutFondsColors[fond.statut]}`}>{statutFondsLabels[fond.statut]}</span>
                      </td>
                      <td className="px-4 py-3">
                        {fond.statut === 'en_attente' && (user?.role === 'president' || user?.role === 'controleur') && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setConfirmValider(fond.id)} className="text-emerald-600 hover:text-emerald-700" title="Valider">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => setRejeterId(fond.id)} className="text-red-600 hover:text-red-700" title="Rejeter">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Envoyer des fonds" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Chantier</label>
            <select value={selectedChantier} onChange={(e) => handleChantierChange(e.target.value)} className="input-field" required>
              <option value="">Sélectionner un chantier...</option>
              {chantiers.filter(c => c.statut === 'actif').map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          {caisses.length > 0 && (
            <div>
              <label className="label">Caisse</label>
              <select value={form.caisse_id} onChange={(e) => setForm({ ...form, caisse_id: e.target.value })} className="input-field" required>
                <option value="">Sélectionner une caisse...</option>
                {caisses.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom} (Solde: {formatMontant(c.solde)})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Montant (FCFA)</label>
            <input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} className="input-field" placeholder="Ex: 500000" min="1" required />
          </div>
          <div>
            <label className="label">Date d'envoi</label>
            <input type="date" value={form.date_envoi} onChange={(e) => setForm({ ...form, date_envoi: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="label">Motif</label>
            <textarea value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} className="input-field" rows={3} placeholder="Motif de l'envoi de fonds..." required />
          </div>
          <div>
            <label className="label">Bénéficiaire (Comptable)</label>
            <select value={form.comptable_id} onChange={(e) => setForm({ ...form, comptable_id: e.target.value, beneficiaire_id: e.target.value })} className="input-field" required>
              <option value="">Sélectionner un comptable...</option>
              {users.filter(u => u.role === 'comptable' && u.actif === 1).map((u) => (
                <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2 pb-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Annuler</button>
            <button type="submit" className="flex-1 btn-primary">Envoyer</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmValider !== null}
        onClose={() => setConfirmValider(null)}
        onConfirm={handleValider}
        title="Valider les fonds"
        message="Le montant sera ajouté à la caisse. Confirmer la validation ?"
        confirmLabel="Valider"
        variant="success"
      />

      <InputDialog
        isOpen={rejeterId !== null}
        onClose={() => setRejeterId(null)}
        onConfirm={handleRejeter}
        title="Rejeter les fonds"
        message="Veuillez indiquer le motif du rejet :"
        placeholder="Motif du rejet..."
        confirmLabel="Rejeter"
        variant="danger"
      />
    </div>
  );
}
