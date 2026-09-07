import { Router, Response } from 'express';
import { getDb } from '../database/db';
import { AuthRequest, authMiddleware, roleMiddleware, logAudit } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/caisse/:caisseId', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const fonds = await db.prepare(`
      SELECT f.*,
        u1.nom || ' ' || u1.prenom as envoye_par_nom,
        u2.nom || ' ' || u2.prenom as beneficiaire_nom,
        u3.nom || ' ' || u3.prenom as comptable_nom
      FROM fonds f
      LEFT JOIN users u1 ON f.envoye_par = u1.id
      LEFT JOIN users u2 ON f.beneficiaire_id = u2.id
      LEFT JOIN users u3 ON f.comptable_id = u3.id
      WHERE f.caisse_id = ?
      ORDER BY f.date_envoi DESC
    `).all(req.params.caisseId);
    res.json(fonds);
  } catch (error) {
    console.error('Erreur get fonds:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const fond = await db.prepare(`
      SELECT f.*,
        u1.nom || ' ' || u1.prenom as envoye_par_nom,
        u2.nom || ' ' || u2.prenom as beneficiaire_nom,
        u3.nom || ' ' || u3.prenom as comptable_nom
      FROM fonds f
      LEFT JOIN users u1 ON f.envoye_par = u1.id
      LEFT JOIN users u2 ON f.beneficiaire_id = u2.id
      LEFT JOIN users u3 ON f.comptable_id = u3.id
      WHERE f.id = ?
    `).get(req.params.id);

    if (!fond) {
      res.status(404).json({ error: 'Fonds non trouvé' });
      return;
    }
    res.json(fond);
  } catch (error) {
    console.error('Erreur get fond:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', roleMiddleware('president', 'controleur'), async (req: AuthRequest, res: Response) => {
  try {
    const { caisse_id, montant, motif, date_envoi, beneficiaire_id, comptable_id } = req.body;

    if (!caisse_id || !montant || !motif || !date_envoi || !beneficiaire_id || !comptable_id) {
      res.status(400).json({ error: 'Tous les champs sont requis' });
      return;
    }

    if (montant <= 0) {
      res.status(400).json({ error: 'Le montant doit être positif' });
      return;
    }

    const db = getDb();

    const caisse = await db.prepare('SELECT * FROM caisses WHERE id = ?').get(caisse_id) as any;
    if (!caisse) {
      res.status(404).json({ error: 'Caisse non trouvée' });
      return;
    }

    const result = await db.prepare(`
      INSERT INTO fonds (caisse_id, montant, motif, date_envoi, envoye_par, beneficiaire_id, comptable_id, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'en_attente')
    `).run(caisse_id, montant, motif, date_envoi, req.user!.id, beneficiaire_id, comptable_id);

    await logAudit(req.user!.id, 'envoi_fonds', 'fonds', result.lastInsertRowid as number,
      `Envoi de ${montant} FCFA à la caisse #${caisse_id} - ${motif}`, req.ip || '');

    res.status(201).json({ id: result.lastInsertRowid, montant, motif, statut: 'en_attente' });
  } catch (error) {
    console.error('Erreur create fonds:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/valider', roleMiddleware('president', 'controleur'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const fond = await db.prepare('SELECT * FROM fonds WHERE id = ?').get(req.params.id) as any;

    if (!fond) {
      res.status(404).json({ error: 'Fonds non trouvé' });
      return;
    }

    if (fond.statut !== 'en_attente') {
      res.status(400).json({ error: 'Ce fonds ne peut plus être validé' });
      return;
    }

    await db.prepare('UPDATE fonds SET statut = \'valide\', date_modification = datetime(\'now\') WHERE id = ?').run(req.params.id);
    await db.prepare('UPDATE caisses SET solde = solde + ?, date_modification = datetime(\'now\') WHERE id = ?').run(fond.montant, fond.caisse_id);

    await logAudit(req.user!.id, 'validation_fonds', 'fonds', parseInt(req.params.id),
      `Validation fonds de ${fond.montant} FCFA`, req.ip || '');

    res.json({ message: 'Fonds validé' });
  } catch (error) {
    console.error('Erreur valider fonds:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/rejeter', roleMiddleware('president', 'controleur'), async (req: AuthRequest, res: Response) => {
  try {
    const { commentaire } = req.body;
    const db = getDb();
    const fond = await db.prepare('SELECT * FROM fonds WHERE id = ?').get(req.params.id) as any;

    if (!fond) {
      res.status(404).json({ error: 'Fonds non trouvé' });
      return;
    }

    if (fond.statut !== 'en_attente') {
      res.status(400).json({ error: 'Ce fonds ne peut plus être rejeté' });
      return;
    }

    await db.prepare('UPDATE fonds SET statut = \'rejete\', commentaire = ?, date_modification = datetime(\'now\') WHERE id = ?')
      .run(commentaire || '', req.params.id);

    await logAudit(req.user!.id, 'rejet_fonds', 'fonds', parseInt(req.params.id),
      `Rejet fonds de ${fond.montant} FCFA - ${commentaire || 'Aucun commentaire'}`, req.ip || '');

    res.json({ message: 'Fonds rejeté' });
  } catch (error) {
    console.error('Erreur rejeter fonds:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
