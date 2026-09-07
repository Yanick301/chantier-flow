import { Router, Response } from 'express';
import { getDb } from '../database/db';
import { AuthRequest, authMiddleware, roleMiddleware, logAudit } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    let chantiers;

    if (req.user!.role === 'comptable') {
      chantiers = await db.prepare(`
        SELECT c.*, u.nom || ' ' || u.prenom as responsable_nom,
          (SELECT COUNT(*) FROM caisses WHERE chantier_id = c.id) as nb_caisses,
          (SELECT COALESCE(SUM(solde), 0) FROM caisses WHERE chantier_id = c.id) as solde_total
        FROM chantiers c
        LEFT JOIN users u ON c.responsable_id = u.id
        WHERE c.statut = 'actif'
        ORDER BY c.date_creation DESC
      `).all();
    } else if (req.user!.role === 'controleur') {
      chantiers = await db.prepare(`
        SELECT c.*, u.nom || ' ' || u.prenom as responsable_nom,
          (SELECT COUNT(*) FROM caisses WHERE chantier_id = c.id) as nb_caisses,
          (SELECT COALESCE(SUM(solde), 0) FROM caisses WHERE chantier_id = c.id) as solde_total
        FROM chantiers c
        LEFT JOIN users u ON c.responsable_id = u.id
        WHERE c.id IN (SELECT chantier_id FROM chantiers_controleurs WHERE controleur_id = ?)
        ORDER BY c.date_creation DESC
      `).all(req.user!.id);
    } else {
      chantiers = await db.prepare(`
        SELECT c.*, u.nom || ' ' || u.prenom as responsable_nom,
          (SELECT COUNT(*) FROM caisses WHERE chantier_id = c.id) as nb_caisses,
          (SELECT COALESCE(SUM(solde), 0) FROM caisses WHERE chantier_id = c.id) as solde_total
        FROM chantiers c
        LEFT JOIN users u ON c.responsable_id = u.id
        ORDER BY c.date_creation DESC
      `).all();
    }

    res.json(chantiers);
  } catch (error) {
    console.error('Erreur get chantiers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const chantier = await db.prepare(`
      SELECT c.*, u.nom || ' ' || u.prenom as responsable_nom
      FROM chantiers c
      LEFT JOIN users u ON c.responsable_id = u.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!chantier) {
      res.status(404).json({ error: 'Chantier non trouvé' });
      return;
    }

    const caisses = await db.prepare('SELECT * FROM caisses WHERE chantier_id = ?').all(req.params.id);
    const controleurs = await db.prepare(`
      SELECT u.id, u.nom, u.prenom, u.email
      FROM users u
      INNER JOIN chantiers_controleurs cc ON u.id = cc.controleur_id
      WHERE cc.chantier_id = ?
    `).all(req.params.id);

    res.json({ ...(chantier as any), caisses, controleurs });
  } catch (error) {
    console.error('Erreur get chantier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', roleMiddleware('president', 'controleur'), async (req: AuthRequest, res: Response) => {
  try {
    const { nom, localisation, description, responsable_id, controleurs } = req.body;

    if (!nom || !localisation) {
      res.status(400).json({ error: 'Nom et localisation requis' });
      return;
    }

    const db = getDb();
    const result = await db.prepare(`
      INSERT INTO chantiers (nom, localisation, description, responsable_id)
      VALUES (?, ?, ?, ?)
    `).run(nom, localisation, description || '', responsable_id || null);

    const chantierId = result.lastInsertRowid as number;

    if (controleurs && Array.isArray(controleurs)) {
      for (const ctrlId of controleurs) {
        await db.prepare('INSERT OR IGNORE INTO chantiers_controleurs (chantier_id, controleur_id) VALUES (?, ?)').run(chantierId, ctrlId);
      }
    }

    await logAudit(req.user!.id, 'creation', 'chantier', chantierId,
      `Création chantier "${nom}"`, req.ip || '');

    res.status(201).json({ id: chantierId, nom, localisation, description, statut: 'actif' });
  } catch (error) {
    console.error('Erreur create chantier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', roleMiddleware('president', 'controleur'), async (req: AuthRequest, res: Response) => {
  try {
    const { nom, localisation, description, statut, responsable_id, controleurs } = req.body;
    const db = getDb();

    const existing = await db.prepare('SELECT * FROM chantiers WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Chantier non trouvé' });
      return;
    }

    await db.prepare(`
      UPDATE chantiers SET nom=?, localisation=?, description=?, statut=?, responsable_id=?,
        date_modification=datetime('now')
      WHERE id=?
    `).run(
      nom || existing.nom, localisation || existing.localisation,
      description ?? existing.description, statut || existing.statut,
      responsable_id ?? existing.responsable_id, req.params.id
    );

    if (controleurs && Array.isArray(controleurs)) {
      await db.prepare('DELETE FROM chantiers_controleurs WHERE chantier_id = ?').run(req.params.id);
      for (const ctrlId of controleurs) {
        await db.prepare('INSERT OR IGNORE INTO chantiers_controleurs (chantier_id, controleur_id) VALUES (?, ?)').run(req.params.id, ctrlId);
      }
    }

    await logAudit(req.user!.id, 'modification', 'chantier', parseInt(req.params.id),
      `Modification chantier`, req.ip || '');

    res.json({ message: 'Chantier mis à jour' });
  } catch (error) {
    console.error('Erreur update chantier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', roleMiddleware('president'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    await db.prepare('UPDATE chantiers SET statut = \'termine\', date_modification = datetime(\'now\') WHERE id = ?').run(req.params.id);

    await logAudit(req.user!.id, 'cloture', 'chantier', parseInt(req.params.id),
      `Clôture chantier`, req.ip || '');

    res.json({ message: 'Chantier clôturé' });
  } catch (error) {
    console.error('Erreur delete chantier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
