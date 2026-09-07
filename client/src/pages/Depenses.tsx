import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api, uploadFiles } from '../utils/api';
import { Depense, Chantier, Caisse } from '../types';
import { formatMontant, statutDepenseColors, statutDepenseLabels } from '../utils/helpers';
import { Receipt, Plus, Eye, Clock, CheckCircle, XCircle, AlertTriangle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import InputDialog from '../components/ui/InputDialog';
import EmptyState from '../components/ui/EmptyState';
import { NoDataIllustration } from '../components/ui/Illustrations';

export default function Depenses() {
  const { user } = useAuth();
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [caisses, setCaisses] = useState<Caisse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedChantier, setSelectedChantier] = useState('');
  const [filter, setFilter] = useState('all');
  const [fichiers, setFichiers] = useState<FileList | null>(null);
  const [confirmValider, setConfirmValider] = useState<number | null>(null);
  const [rejeterId, setRejeterId] = useState<number | null>(null);
  const [correctionId, setCorrectionId] = useState<number | null>(null);
  const [form, setForm] = useState({
    caisse_id: '', montant: '', categorie: '', fournisseur: '', description: '',
    date_depense: new Date().toISOString().split('T')[0],
  });

  const categories = [
    'Matériaux de construction', 'Main d\'oeuvre', 'Équipement', 'Transport',
    'Alimentation du chantier', 'Carburant', 'Fournitures de bureau', 'Autres',
  ];

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const chantiersData = await api.get('/chantiers');
      setChantiers(chantiersData);
      if (user?.role === 'comptable') {
        const depensesData = await api.get('/depenses/mes-depenses');
        setDepenses(depensesData);
      } else {
        const depensesData = await api.get('/depenses/en-attente');
        setDepenses(depensesData);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.post('/depenses', {
        ...form,
        montant: parseFloat(form.montant),
        caisse_id: parseInt(form.caisse_id),
      });
      if (fichiers && fichiers.length > 0) {
        const formData = new FormData();
        for (let i = 0; i < fichiers.length; i++) {
          formData.append('fichiers', fichiers[i]);
        }
        await uploadFiles(`/justificatifs/depense/${result.id}`, formData);
      }
      toast.success('Dépense créée');
      setShowModal(false);
      setForm({ caisse_id: '', montant: '', categorie: '', fournisseur: '', description: '', date_depense: new Date().toISOString().split('T')[0] });
      setSelectedChantier('');
      setCaisses([]);
      setFichiers(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSoumettre = async (id: number) => {
    try {
      await api.put(`/depenses/${id}/soumettre`, { commentaire: 'Dépense soumise' });
      toast.success('Dépense soumise');
      loadData();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleControle = async (id: number) => {
    try {
      await api.put(`/depenses/${id}/controle`, {});
      toast.success('Dépense prise en contrôle');
      loadData();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleValider = async () => {
    if (!confirmValider) return;
    try {
      await api.put(`/depenses/${confirmValider}/valider`, {});
      toast.success('Dépense validée');
      setConfirmValider(null);
      loadData();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleRejeter = async (motif: string) => {
    if (!rejeterId) return;
    try {
      await api.put(`/depenses/${rejeterId}/rejeter`, { motif_rejet: motif });
      toast.success('Dépense rejetée');
      setRejeterId(null);
      loadData();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleCorrection = async (commentaire: string) => {
    if (!correctionId) return;
    try {
      await api.put(`/depenses/${correctionId}/correction`, { commentaire });
      toast.success('Correction demandée');
      setCorrectionId(null);
      loadData();
    } catch (error: any) { toast.error(error.message); }
  };

  const filteredDepenses = depenses.filter(d => filter === 'all' || d.statut === filter);

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
          <h1 className="page-title">Dépenses</h1>
          <p className="page-subtitle">{user?.role === 'comptable' ? 'Mes dépenses' : 'Dépenses en attente de contrôle'}</p>
        </div>
        {user?.role === 'comptable' && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle dépense</span>
            <span className="sm:hidden">Nouvelle</span>
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 mb-4 sm:mb-6 animate-fade-in">
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'brouillon', label: 'Brouillons' },
          { key: 'soumise', label: 'Soumises' },
          { key: 'en_controle', label: 'En contrôle' },
          { key: 'validee', label: 'Validées' },
          { key: 'rejetee', label: 'Rejetées' },
          { key: 'correction', label: 'À corriger' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
              filter === f.key
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/25'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card !p-0 overflow-hidden animate-fade-in">
        {filteredDepenses.length === 0 ? (
          <EmptyState
            illustration={<NoDataIllustration />}
            title="Aucune dépense trouvée"
            description={filter === 'all' ? 'Les dépenses enregistrées apparaîtront ici.' : 'Aucune dépense ne correspond à ce filtre.'}
          />
        ) : (
          <>
            <div className="sm:hidden divide-y divide-slate-100">
              {filteredDepenses.map((depense) => (
                <div key={depense.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{depense.categorie}</p>
                      <p className="text-xs text-slate-500">{depense.fournisseur}</p>
                    </div>
                    <span className={`badge ${statutDepenseColors[depense.statut] || 'badge-info'} flex-shrink-0 ml-2`}>
                      {statutDepenseLabels[depense.statut] || depense.statut}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">{depense.date_depense} · {depense.enregistre_par_nom}</span>
                    <span className="text-base font-bold text-slate-900">{formatMontant(depense.montant)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/depenses/${depense.id}`} className="btn-secondary btn-sm flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Détails
                    </Link>
                    {(depense.statut === 'brouillon' || depense.statut === 'correction') && user?.role === 'comptable' && (
                      <button onClick={() => handleSoumettre(depense.id)} className="btn-primary btn-sm flex items-center gap-1">
                        <Send className="w-3.5 h-3.5" /> Soumettre
                      </button>
                    )}
                    {depense.statut === 'soumise' && (user?.role === 'president' || user?.role === 'controleur') && (
                      <>
                        <button onClick={() => handleControle(depense.id)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Prendre en contrôle">
                          <Clock className="w-4 h-4" />
                        </button>
                        <button onClick={() => setConfirmValider(depense.id)} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Valider">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => setRejeterId(depense.id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Rejeter">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {depense.statut === 'en_controle' && (user?.role === 'president' || user?.role === 'controleur') && (
                      <>
                        <button onClick={() => setConfirmValider(depense.id)} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Valider">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => setRejeterId(depense.id)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Rejeter">
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => setCorrectionId(depense.id)} className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Demander correction">
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Catégorie</th>
                    <th className="text-left px-4 py-3">Fournisseur</th>
                    <th className="text-left px-4 py-3">Montant</th>
                    <th className="text-left px-4 py-3">Enregistré par</th>
                    <th className="text-left px-4 py-3">Justificatifs</th>
                    <th className="text-left px-4 py-3">Statut</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepenses.map((depense) => (
                    <tr key={depense.id} className="table-row">
                      <td className="px-4 py-3 text-sm text-slate-600">{depense.date_depense}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{depense.categorie}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{depense.fournisseur}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatMontant(depense.montant)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{depense.enregistre_par_nom}</td>
                      <td className="px-4 py-3">
                        <span className="badge badge-info">{depense.nb_justificatifs || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${statutDepenseColors[depense.statut] || 'badge-info'}`}>
                          {statutDepenseLabels[depense.statut] || depense.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link to={`/depenses/${depense.id}`} className="text-slate-600 hover:text-slate-600">
                            <Eye className="w-4 h-4" />
                          </Link>
                          {(depense.statut === 'brouillon' || depense.statut === 'correction') && user?.role === 'comptable' && (
                            <button onClick={() => handleSoumettre(depense.id)} className="text-slate-600 hover:text-slate-700" title="Soumettre">
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {depense.statut === 'soumise' && (user?.role === 'president' || user?.role === 'controleur') && (
                            <>
                              <button onClick={() => handleControle(depense.id)} className="text-blue-600 hover:text-blue-700" title="Prendre en contrôle">
                                <Clock className="w-4 h-4" />
                              </button>
                              <button onClick={() => setConfirmValider(depense.id)} className="text-emerald-600 hover:text-emerald-700" title="Valider">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => setRejeterId(depense.id)} className="text-red-600 hover:text-red-700" title="Rejeter">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {depense.statut === 'en_controle' && (user?.role === 'president' || user?.role === 'controleur') && (
                            <>
                              <button onClick={() => setConfirmValider(depense.id)} className="text-emerald-600 hover:text-emerald-700" title="Valider">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => setRejeterId(depense.id)} className="text-red-600 hover:text-red-700" title="Rejeter">
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => setCorrectionId(depense.id)} className="text-amber-600 hover:text-amber-700" title="Demander correction">
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nouvelle dépense" size="md">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Montant (FCFA)</label>
              <input type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} className="input-field" min="1" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" value={form.date_depense} onChange={(e) => setForm({ ...form, date_depense: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} className="input-field" required>
              <option value="">Sélectionner...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Fournisseur</label>
            <input type="text" value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} className="input-field" placeholder="Nom du fournisseur" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} placeholder="Description de la dépense..." />
          </div>
          <div>
            <label className="label">Justificatifs (optionnel)</label>
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={(e) => setFichiers(e.target.files)} className="input-field text-sm" />
            <p className="text-xs text-slate-400 mt-1">PDF, images (max 10 Mo par fichier). Ajoutez vos preuves avant de soumettre.</p>
          </div>
          <div className="flex gap-3 pt-2 pb-2">
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">Annuler</button>
            <button type="submit" className="flex-1 btn-primary">Créer la dépense</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmValider !== null}
        onClose={() => setConfirmValider(null)}
        onConfirm={handleValider}
        title="Valider la dépense"
        message="Le montant sera déduit de la caisse. Confirmer la validation ?"
        confirmLabel="Valider"
        variant="success"
      />

      <InputDialog
        isOpen={rejeterId !== null}
        onClose={() => setRejeterId(null)}
        onConfirm={handleRejeter}
        title="Rejeter la dépense"
        message="Veuillez indiquer le motif du rejet :"
        placeholder="Motif du rejet..."
        confirmLabel="Rejeter"
        variant="danger"
      />

      <InputDialog
        isOpen={correctionId !== null}
        onClose={() => setCorrectionId(null)}
        onConfirm={handleCorrection}
        title="Demander une correction"
        message="Décrivez la correction à apporter :"
        placeholder="Description de la correction..."
        confirmLabel="Envoyer"
        variant="warning"
      />
    </div>
  );
}
