import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Chantier, Caisse, Depense } from '../types';
import { formatMontant, statutDepenseColors, statutDepenseLabels } from '../utils/helpers';
import { Building2, MapPin, Wallet, Receipt, ArrowLeft, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';

export default function ChantierDetail() {
  const { id } = useParams();
  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [caisses, setCaisses] = useState<Caisse[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCaisseModal, setShowCaisseModal] = useState(false);
  const [newCaisseName, setNewCaisseName] = useState('');

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [chantierData, caissesData] = await Promise.all([
        api.get(`/chantiers/${id}`),
        api.get(`/caisses/chantier/${id}`),
      ]);
      setChantier(chantierData);
      setCaisses(caissesData);
      if (caissesData.length > 0) {
        const allDepenses = [];
        for (const caisse of caissesData) {
          const depensesData = await api.get(`/depenses/caisse/${caisse.id}`);
          allDepenses.push(...depensesData);
        }
        setDepenses(allDepenses.sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime()));
      }
    } catch (error) {
      toast.error('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/caisses', { chantier_id: parseInt(id!), nom: newCaisseName });
      toast.success('Caisse créée');
      setShowCaisseModal(false);
      setNewCaisseName('');
      loadData();
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

  if (!chantier) return null;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6 sm:mb-8 animate-fade-in">
        <Link to="/chantiers" className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="min-w-0">
          <h1 className="page-title truncate">{chantier.nom}</h1>
          <p className="page-subtitle flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{chantier.localisation}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 animate-fade-in">
        <div className="stat-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] sm:text-sm text-slate-500">Caisses</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900">{caisses.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-sm text-slate-500">Solde</p>
              <p className="text-base sm:text-xl font-bold text-emerald-600 truncate">
                {formatMontant(caisses.reduce((sum, c) => sum + c.solde, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] sm:text-sm text-slate-500">Dépenses</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900">{depenses.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card !p-4 sm:!p-6 mb-6 sm:mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Caisses</h2>
          <button onClick={() => setShowCaisseModal(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle caisse</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {caisses.map((caisse) => (
            <div key={caisse.id} className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">{caisse.nom}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Solde</span>
                  <span className="font-bold text-emerald-600">{formatMontant(caisse.solde)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fonds reçus</span>
                  <span className="font-medium text-slate-700">{formatMontant(caisse.total_fonds || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Dépensé</span>
                  <span className="font-medium text-slate-700">{formatMontant(caisse.total_depenses || 0)}</span>
                </div>
              </div>
            </div>
          ))}
          {caisses.length === 0 && (
            <p className="text-slate-400 text-sm col-span-full text-center py-8">Aucune caisse créée pour ce chantier</p>
          )}
        </div>
      </div>

      <div className="card !p-4 sm:!p-6 animate-fade-in">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Dépenses récentes</h2>
        {depenses.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Aucune dépense enregistrée</p>
        ) : (
          <>
            <div className="sm:hidden space-y-3">
              {depenses.slice(0, 10).map((depense) => (
                <Link
                  key={depense.id}
                  to={`/depenses/${depense.id}`}
                  className="block bg-slate-50 rounded-xl p-3.5 border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{depense.categorie}</p>
                      <p className="text-xs text-slate-500">{depense.fournisseur}</p>
                    </div>
                    <span className={`badge ${statutDepenseColors[depense.statut] || 'badge-info'} flex-shrink-0 ml-2`}>
                      {statutDepenseLabels[depense.statut] || depense.statut}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{depense.date_depense}</span>
                    <span className="text-sm font-semibold text-slate-900">{formatMontant(depense.montant)}</span>
                  </div>
                </Link>
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
                    <th className="text-left px-4 py-3">Statut</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {depenses.slice(0, 10).map((depense) => (
                    <tr key={depense.id} className="table-row">
                      <td className="px-4 py-3 text-sm text-slate-600">{depense.date_depense}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{depense.categorie}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{depense.fournisseur}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatMontant(depense.montant)}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${statutDepenseColors[depense.statut] || 'badge-info'}`}>
                          {statutDepenseLabels[depense.statut] || depense.statut}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/depenses/${depense.id}`} className="text-slate-600 hover:text-slate-600 text-sm font-medium">
                          Voir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={showCaisseModal} onClose={() => setShowCaisseModal(false)} title="Nouvelle caisse" size="sm">
        <form onSubmit={handleCreateCaisse} className="space-y-4">
          <div>
            <label className="label">Nom de la caisse</label>
            <input type="text" value={newCaisseName} onChange={(e) => setNewCaisseName(e.target.value)} className="input-field" placeholder="Ex: Caisse Principale" required autoFocus />
          </div>
          <div className="flex gap-3 pb-2">
            <button type="button" onClick={() => setShowCaisseModal(false)} className="flex-1 btn-secondary">Annuler</button>
            <button type="submit" className="flex-1 btn-primary">Créer</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
