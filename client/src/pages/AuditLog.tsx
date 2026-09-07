import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { AuditLog as AuditLogType } from '../types';
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => { loadLogs(); }, [page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/audit?page=${page}&limit=${limit}`);
      setLogs(data.logs || data);
      setTotal(data.total || 0);
    } catch (error) {
      toast.error('Erreur chargement audit');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-6 sm:mb-8 animate-fade-in">
        <h1 className="page-title">Journal d'audit</h1>
        <p className="page-subtitle">Historique complet des actions du système</p>
      </div>

      <div className="card !p-0 overflow-hidden animate-fade-in">
        {logs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Aucune action enregistrée</p>
          </div>
        ) : (
          <>
            <div className="sm:hidden divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {log.user_nom} — {log.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}
                      </p>
                      {log.details && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{log.details}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">
                        {new Date(log.date_action).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Utilisateur</th>
                    <th className="text-left px-4 py-3">Action</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">ID</th>
                    <th className="text-left px-4 py-3">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="table-row">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(log.date_action).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{log.user_nom}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{log.action}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{log.entity_type}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{log.entity_id || '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-[250px] truncate">{log.details || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Page {page} sur {totalPages} ({total} entrées)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
