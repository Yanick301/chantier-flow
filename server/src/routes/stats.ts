import { Router, Response } from 'express';
import { getDb } from '../database/db';
import { AuthRequest, authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const role = req.user!.role;

    let stats: any = {};

    if (role === 'president') {
      stats = {
        total_chantiers: (db.prepare('SELECT COUNT(*) as count FROM chantiers').get() as any).count,
        chantiers_actifs: (db.prepare('SELECT COUNT(*) as count FROM chantiers WHERE statut = \'actif\'').get() as any).count,
        total_caisses: (db.prepare('SELECT COUNT(*) as count FROM caisses').get() as any).count,
        solde_total: (db.prepare('SELECT COALESCE(SUM(solde), 0) as total FROM caisses').get() as any).total,
        total_fonds_envoyes: (db.prepare('SELECT COALESCE(SUM(montant), 0) as total FROM fonds WHERE statut = \'valide\'').get() as any).total,
        fonds_en_attente: (db.prepare('SELECT COALESCE(SUM(montant), 0) as total FROM fonds WHERE statut = \'en_attente\'').get() as any).total,
        total_depenses: (db.prepare('SELECT COALESCE(SUM(montant), 0) as total FROM depenses WHERE statut = \'validee\'').get() as any).total,
        depenses_en_attente: (db.prepare('SELECT COUNT(*) as count FROM depenses WHERE statut IN (\'soumise\', \'en_controle\')').get() as any).count,
        depenses_rejetees: (db.prepare('SELECT COUNT(*) as count FROM depenses WHERE statut = \'rejetee\'').get() as any).count,
        total_utilisateurs: (db.prepare('SELECT COUNT(*) as count FROM users WHERE actif = 1').get() as any).count,
        depenses_par_categorie: db.prepare(`
          SELECT categorie, COUNT(*) as count, SUM(montant) as total
          FROM depenses WHERE statut = 'validee'
          GROUP BY categorie ORDER BY total DESC
        `).all(),
        evolution_mensuelle: db.prepare(`
          SELECT strftime('%Y-%m', date_depense) as mois,
            SUM(CASE WHEN statut = 'validee' THEN montant ELSE 0 END) as depenses,
            COUNT(CASE WHEN statut IN ('soumise', 'en_controle') THEN 1 END) as en_attente
          FROM depenses
          WHERE date_depense >= date('now', '-12 months')
          GROUP BY mois ORDER BY mois
        `).all()
      };
    } else if (role === 'controleur') {
      stats = {
        mes_chantiers: (db.prepare('SELECT COUNT(*) as count FROM chantiers_controleurs WHERE controleur_id = ?').get(req.user!.id) as any).count,
        fonds_a_valider: (db.prepare(`
          SELECT COUNT(*) as count FROM fonds f
          INNER JOIN caisses c ON f.caisse_id = c.id
          INNER JOIN chantiers_controleurs cc ON c.chantier_id = cc.chantier_id
          WHERE f.statut = 'en_attente' AND cc.controleur_id = ?
        `).get(req.user!.id) as any).count,
        depenses_a_controler: (db.prepare(`
          SELECT COUNT(*) as count FROM depenses d
          INNER JOIN caisses c ON d.caisse_id = c.id
          INNER JOIN chantiers_controleurs cc ON c.chantier_id = cc.chantier_id
          WHERE d.statut IN ('soumise', 'en_controle') AND cc.controleur_id = ?
        `).get(req.user!.id) as any).count,
        total_depenses_controlees: (db.prepare(`
          SELECT COUNT(*) as count FROM depenses d
          INNER JOIN caisses c ON d.caisse_id = c.id
          INNER JOIN chantiers_controleurs cc ON c.chantier_id = cc.chantier_id
          WHERE d.statut IN ('validee', 'rejetee') AND cc.controleur_id = ?
        `).get(req.user!.id) as any).count
      };
    } else {
      stats = {
        mes_depenses: (db.prepare('SELECT COUNT(*) as count FROM depenses WHERE enregistre_par = ?').get(req.user!.id) as any).count,
        depenses_en_attente: (db.prepare('SELECT COUNT(*) as count FROM depenses WHERE enregistre_par = ? AND statut IN (\'soumise\', \'en_controle\')').get(req.user!.id) as any).count,
        depenses_validees: (db.prepare('SELECT COUNT(*) as count FROM depenses WHERE enregistre_par = ? AND statut = \'validee\'').get(req.user!.id) as any).count,
        depenses_rejetees: (db.prepare('SELECT COUNT(*) as count FROM depenses WHERE enregistre_par = ? AND statut = \'rejetee\'').get(req.user!.id) as any).count,
        total_montant_depenses: (db.prepare('SELECT COALESCE(SUM(montant), 0) as total FROM depenses WHERE enregistre_par = ? AND statut = \'validee\'').get(req.user!.id) as any).total
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Erreur get stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/chantier/:chantierId', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const stats = {
      caisses: (db.prepare('SELECT COUNT(*) as count FROM caisses WHERE chantier_id = ?').get(req.params.chantierId) as any).count,
      solde_total: (db.prepare('SELECT COALESCE(SUM(solde), 0) as total FROM caisses WHERE chantier_id = ?').get(req.params.chantierId) as any).total,
      fonds_recus: (db.prepare(`
        SELECT COALESCE(SUM(f.montant), 0) as total FROM fonds f
        INNER JOIN caisses c ON f.caisse_id = c.id
        WHERE c.chantier_id = ? AND f.statut = 'valide'
      `).get(req.params.chantierId) as any).total,
      fonds_en_attente: (db.prepare(`
        SELECT COALESCE(SUM(f.montant), 0) as total FROM fonds f
        INNER JOIN caisses c ON f.caisse_id = c.id
        WHERE c.chantier_id = ? AND f.statut = 'en_attente'
      `).get(req.params.chantierId) as any).total,
      depenses_totales: (db.prepare(`
        SELECT COALESCE(SUM(d.montant), 0) as total FROM depenses d
        INNER JOIN caisses c ON d.caisse_id = c.id
        WHERE c.chantier_id = ? AND d.statut = 'validee'
      `).get(req.params.chantierId) as any).total,
      depenses_en_attente: (db.prepare(`
        SELECT COUNT(*) as count FROM depenses d
        INNER JOIN caisses c ON d.caisse_id = c.id
        WHERE c.chantier_id = ? AND d.statut IN ('soumise', 'en_controle')
      `).get(req.params.chantierId) as any).count,
      depenses_par_categorie: db.prepare(`
        SELECT d.categorie, COUNT(*) as count, SUM(d.montant) as total
        FROM depenses d
        INNER JOIN caisses c ON d.caisse_id = c.id
        WHERE c.chantier_id = ? AND d.statut = 'validee'
        GROUP BY d.categorie ORDER BY total DESC
      `).all(req.params.chantierId)
    };

    res.json(stats);
  } catch (error) {
    console.error('Erreur get stats chantier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/notifications', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const role = req.user!.role;
    let count = 0;

    if (role === 'president') {
      const fonds = db.prepare('SELECT COUNT(*) as count FROM fonds WHERE statut = \'en_attente\'').get() as any;
      const depenses = db.prepare('SELECT COUNT(*) as count FROM depenses WHERE statut IN (\'soumise\', \'en_controle\')').get() as any;
      count = fonds.count + depenses.count;
    } else if (role === 'controleur') {
      const fonds = db.prepare(`
        SELECT COUNT(*) as count FROM fonds f
        INNER JOIN caisses c ON f.caisse_id = c.id
        INNER JOIN chantiers_controleurs cc ON c.chantier_id = cc.chantier_id
        WHERE f.statut = 'en_attente' AND cc.controleur_id = ?
      `).get(req.user!.id) as any;
      const depenses = db.prepare(`
        SELECT COUNT(*) as count FROM depenses d
        INNER JOIN caisses c ON d.caisse_id = c.id
        INNER JOIN chantiers_controleurs cc ON c.chantier_id = cc.chantier_id
        WHERE d.statut IN ('soumise', 'en_controle') AND cc.controleur_id = ?
      `).get(req.user!.id) as any;
      count = fonds.count + depenses.count;
    } else {
      const depenses = db.prepare(`
        SELECT COUNT(*) as count FROM depenses WHERE enregistre_par = ? AND statut IN ('rejetee', 'correction')
      `).get(req.user!.id) as any;
      count = depenses.count;
    }

    res.json({ count });
  } catch (error) {
    console.error('Erreur get notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
