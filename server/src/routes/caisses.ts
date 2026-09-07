import { Router, Response } from 'express';
import { getDb } from '../database/db';
import { AuthRequest, authMiddleware, roleMiddleware, logAudit } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/chantier/:chantierId', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const caisses = db.prepare(`
      SELECT c.*,
        (SELECT COALESCE(SUM(montant), 0) FROM fonds WHERE caisse_id = c.id AND statut = 'valide') as total_fonds,
        (SELECT COALESCE(SUM(montant), 0) FROM depenses WHERE caisse_id = c.id AND statut = 'validee') as total_depenses
      FROM caisses c WHERE c.chantier_id = ?
    `).all(req.params.chantierId);
    res.json(caisses);
  } catch (error) {
    console.error('Erreur get caisses:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const caisse = db.prepare(`
      SELECT c.*,
        (SELECT COALESCE(SUM(montant), 0) FROM fonds WHERE caisse_id = c.id AND statut = 'valide') as total_fonds,
        (SELECT COALESCE(SUM(montant), 0) FROM depenses WHERE caisse_id = c.id AND statut = 'validee') as total_depenses
      FROM caisses c WHERE c.id = ?
    `).get(req.params.id);

    if (!caisse) {
      res.status(404).json({ error: 'Caisse non trouvée' });
      return;
    }
    res.json(caisse);
  } catch (error) {
    console.error('Erreur get caisse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', roleMiddleware('president', 'controleur'), (req: AuthRequest, res: Response) => {
  try {
    const { chantier_id, nom } = req.body;

    if (!chantier_id || !nom) {
      res.status(400).json({ error: 'Chantier et nom requis' });
      return;
    }

    const db = getDb();
    const result = db.prepare('INSERT INTO caisses (chantier_id, nom) VALUES (?, ?)').run(chantier_id, nom);

    logAudit(req.user!.id, 'creation', 'caisse', result.lastInsertRowid as number,
      `Création caisse "${nom}" pour le chantier #${chantier_id}`, req.ip || '');

    res.status(201).json({ id: result.lastInsertRowid, chantier_id, nom, solde: 0 });
  } catch (error) {
    console.error('Erreur create caisse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', roleMiddleware('president', 'controleur'), (req: AuthRequest, res: Response) => {
  try {
    const { nom } = req.body;
    const db = getDb();

    db.prepare('UPDATE caisses SET nom=?, date_modification=datetime(\'now\') WHERE id=?').run(nom, req.params.id);

    logAudit(req.user!.id, 'modification', 'caisse', parseInt(req.params.id),
      `Modification caisse`, req.ip || '');

    res.json({ message: 'Caisse mise à jour' });
  } catch (error) {
    console.error('Erreur update caisse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
