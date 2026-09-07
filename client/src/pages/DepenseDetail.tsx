import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api, uploadFiles } from '../utils/api';
import { Depense, Justificatif } from '../types';
import { formatMontant, statutDepenseColors, statutDepenseLabels } from '../utils/helpers';
import {
  ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle, Send,
  Upload, Download, Trash2, FileText, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import InputDialog from '../components/ui/InputDialog';

export default function DepenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [depense, setDepense] = useState<Depense | null>(null);
  const [justificatifs, setJustificatifs] = useState<Justificatif[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileList, setUploadFileList] = useState<FileList | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmValider, setConfirmValider] = useState(false);
  const [confirmSupprimer, setConfirmSupprimer] = useState<number | null>(null);
  const [rejeterOpen, setRejeterOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [depenseData, justificatifsData] = await Promise.all([
        api.get(`/depenses/${id}`),
        api.get(`/justificatifs/depense/${id}`),
      ]);
      setDepense(depenseData);
      setJustificatifs(justificatifsData);
    } catch (error) {
      toast.error('Erreur chargement données');
    } finally {
      setLoading(false);
    }
  };

  const handleSoumettre = async () => {
    setSending(true);
    try {
      await api.put(`/depenses/${id}/soumettre`, { commentaire: comment || 'Dépense soumise' });
      toast.success('Dépense soumise au contrôle');
      setComment('');
      loadData();
    } catch (error: any) { toast.error(error.message); }
    finally { setSending(false); }
  };

  const handleControle = async () => {
    try {
      await api.put(`/depenses/${id}/controle`, { commentaire: 'Prise en contrôle' });
      toast.success('Dépense prise en contrôle');
      loadData();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleValider = async () => {
    try {
      await api.put(`/depenses/${id}/valider`, { commentaire: 'Dépense validée' });
      toast.success('Dépense validée');
      setConfirmValider(false);
      loadData();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleRejeter = async (motif: string) => {
    try {
      await api.put(`/depenses/${id}/rejeter`, { motif_rejet: motif });
      toast.success('Dépense rejetée');
      setRejeterOpen(false);
      loadData();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleCorrection = async (commentaire: string) => {
    try {
      await api.put(`/depenses/${id}/correction`, { commentaire });
      toast.success('Demande de correction envoyée');
      setCorrectionOpen(false);
      loadData();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileList || uploadFileList.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < uploadFileList.length; i++) {
      formData.append('fichiers', uploadFileList[i]);
    }
    try {
      await uploadFiles(`/justificatifs/depense/${id}`, formData);
      toast.success(`${uploadFileList.length} justificatif(s) ajouté(s)`);
      setShowUploadModal(false);
      setUploadFileList(null);
      loadData();
    } catch (error: any) { toast.error(error.message); }
    finally { setUploading(false); }
  };

  const handleDeleteJustificatif = async () => {
    if (!confirmSupprimer) return;
    try {
      await api.delete(`/justificatifs/${confirmSupprimer}`);
      toast.success('Justificatif supprimé');
      setConfirmSupprimer(null);
      loadData();
    } catch (error: any) { toast.error(error.message); }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!depense) return null;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6 sm:mb-8 animate-fade-in">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="min-w-0">
          <h1 className="page-title truncate">{depense.categorie}</h1>
          <p className="page-subtitle">{depense.fournisseur} · {depense.date_depense}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8 animate-fade-in">
        <div className="stat-card">
          <p className="text-[11px] sm:text-sm text-slate-500 mb-1">Montant</p>
          <p className="text-lg sm:text-2xl font-bold text-slate-900 truncate">{formatMontant(depense.montant)}</p>
        </div>
        <div className="stat-card">
          <p className="text-[11px] sm:text-sm text-slate-500 mb-1">Statut</p>
          <span className={`badge ${statutDepenseColors[depense.statut] || 'bg-slate-100 text-slate-700'}`}>
            {statutDepenseLabels[depense.statut] || depense.statut}
          </span>
        </div>
        <div className="stat-card">
          <p className="text-[11px] sm:text-sm text-slate-500 mb-1">Enregistré par</p>
          <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">{depense.enregistre_par_nom}</p>
        </div>
        <div className="stat-card">
          <p className="text-[11px] sm:text-sm text-slate-500 mb-1">Justificatifs</p>
          <p className="text-lg sm:text-2xl font-bold text-slate-900">{justificatifs.length}</p>
        </div>
      </div>

      {depense.description && (
        <div className="card mb-6 sm:mb-8 animate-fade-in">
          <h2 className="text-base font-semibold text-slate-900 mb-2">Description</h2>
          <p className="text-sm text-slate-600">{depense.description}</p>
        </div>
      )}

      {depense.motif_rejet && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 sm:mb-8 animate-fade-in">
          <h2 className="text-base font-semibold text-red-800 mb-2">Motif du rejet</h2>
          <p className="text-sm text-red-700">{depense.motif_rejet}</p>
        </div>
      )}

      <div className="card mb-6 sm:mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Justificatifs</h2>
          {(depense.statut === 'brouillon' || depense.statut === 'correction') && user?.role === 'comptable' && (
            <button onClick={() => setShowUploadModal(true)} className="btn-primary btn-sm">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter</span>
            </button>
          )}
        </div>
        {justificatifs.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm">Aucun justificatif</p>
          </div>
        ) : (
          <div className="space-y-3">
            {justificatifs.map((j) => (
              <div key={j.id} className="bg-slate-50 rounded-xl overflow-hidden">
                {j.type_fichier === 'image' ? (
                  <div>
                    <img
                      src={j.nom_fichier}
                      alt={j.nom_original}
                      className="w-full max-h-64 object-contain bg-slate-100 cursor-pointer"
                      onClick={() => setPreviewUrl(j.nom_fichier)}
                      loading="lazy"
                    />
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{j.nom_original}</p>
                        <p className="text-xs text-slate-500">{(j.taille / 1024).toFixed(1)} Ko</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button
                          onClick={() => setPreviewUrl(j.nom_fichier)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Aperçu plein écran"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={j.nom_fichier}
                          download={j.nom_original}
                          className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {(depense.statut === 'brouillon' || depense.statut === 'correction') && user?.role === 'comptable' && (
                          <button
                            onClick={() => setConfirmSupprimer(j.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{j.nom_original}</p>
                        <p className="text-xs text-slate-500">PDF · {(j.taille / 1024).toFixed(1)} Ko</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <a
                        href={j.nom_fichier}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Ouvrir"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <a
                        href={j.nom_fichier}
                        download={j.nom_original}
                        className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {(depense.statut === 'brouillon' || depense.statut === 'correction') && user?.role === 'comptable' && (
                        <button
                          onClick={() => setConfirmSupprimer(j.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card animate-fade-in">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {(depense.statut === 'brouillon' || depense.statut === 'correction') && user?.role === 'comptable' && (
            <>
              <div className="w-full">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input-field mb-3"
                  rows={2}
                  placeholder="Commentaire (optionnel)"
                />
              </div>
              <button onClick={handleSoumettre} disabled={sending} className="btn-primary">
                <Send className="w-4 h-4" />
                {sending ? 'Envoi...' : 'Soumettre au contrôle'}
              </button>
            </>
          )}
          {depense.statut === 'soumise' && (user?.role === 'president' || user?.role === 'controleur') && (
            <>
              <button onClick={handleControle} className="btn-secondary">
                <Clock className="w-4 h-4" />
                Prendre en contrôle
              </button>
              <button onClick={() => setConfirmValider(true)} className="btn-success">
                <CheckCircle className="w-4 h-4" />
                Valider
              </button>
              <button onClick={() => setRejeterOpen(true)} className="btn-danger">
                <XCircle className="w-4 h-4" />
                Rejeter
              </button>
            </>
          )}
          {depense.statut === 'en_controle' && (user?.role === 'president' || user?.role === 'controleur') && (
            <>
              <button onClick={() => setConfirmValider(true)} className="btn-success">
                <CheckCircle className="w-4 h-4" />
                Valider
              </button>
              <button onClick={() => setRejeterOpen(true)} className="btn-danger">
                <XCircle className="w-4 h-4" />
                Rejeter
              </button>
              <button onClick={() => setCorrectionOpen(true)} className="btn-warning">
                <AlertTriangle className="w-4 h-4" />
                Demander correction
              </button>
            </>
          )}
        </div>
      </div>

      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Ajouter des justificatifs" size="sm">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="label">Fichiers</label>
            <input
              type="file"
              multiple
              onChange={(e) => setUploadFileList(e.target.files)}
              className="input-field text-sm"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
              required
            />
            <p className="text-xs text-slate-400 mt-1">PDF, images (max 10 Mo par fichier)</p>
          </div>
          <div className="flex gap-3 pb-2">
            <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 btn-secondary">Annuler</button>
            <button type="submit" disabled={uploading || !uploadFileList} className="flex-1 btn-primary">
              {uploading ? 'Envoi...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmValider}
        onClose={() => setConfirmValider(false)}
        onConfirm={handleValider}
        title="Valider la dépense"
        message="Le montant sera déduit de la caisse. Confirmer la validation ?"
        confirmLabel="Valider"
        variant="success"
      />

      <InputDialog
        isOpen={rejeterOpen}
        onClose={() => setRejeterOpen(false)}
        onConfirm={handleRejeter}
        title="Rejeter la dépense"
        message="Veuillez indiquer le motif du rejet :"
        placeholder="Motif du rejet..."
        confirmLabel="Rejeter"
        variant="danger"
      />

      <InputDialog
        isOpen={correctionOpen}
        onClose={() => setCorrectionOpen(false)}
        onConfirm={handleCorrection}
        title="Demander une correction"
        message="Décrivez la correction à apporter :"
        placeholder="Description de la correction..."
        confirmLabel="Envoyer"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={confirmSupprimer !== null}
        onClose={() => setConfirmSupprimer(null)}
        onConfirm={handleDeleteJustificatif}
        title="Supprimer le justificatif"
        message="Ce justificatif sera définitivement supprimé. Confirmer ?"
        confirmLabel="Supprimer"
        variant="danger"
      />

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh] p-2" onClick={(e) => e.stopPropagation()}>
            <img src={previewUrl} alt="Aperçu" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-2 -right-2 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
