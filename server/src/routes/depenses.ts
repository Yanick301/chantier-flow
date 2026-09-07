import { Router, Response } from 'express';
import { getDb } from '../database/db';
import { AuthRequest, authMiddleware, roleMiddleware, logAudit } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/caisse/:caisseId', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const depenses = db.prepare(`
      SELECT d.*,
        u.nom || ' ' || u.prenom as enregistre_par_nom,
        (SELECT COUNT(*) FROM justificatifs WHERE depense_id = d.id) as nb_justificatifs
      FROM depenses d
      LEFT JOIN users u ON d.enregistre_par = u.id
      WHERE d.caisse_id = ?
      ORDER BY d.date_creation DESC
    `).all(req.params.caisseId);
    res.json(depenses);
  } catch (error) {
    console.error('Erreur get depenses:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/mes-depenses', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const depenses = db.prepare(`
      SELECT d.*, c.nom as caisse_nom, ch.nom as chantier_nom,
        (SELECT COUNT(*) FROM justificatifs WHERE depense_id = d.id) as nb_justificatifs
      FROM depenses d
      LEFT JOIN caisses c ON d.caisse_id = c.id
      LEFT JOIN chantiers ch ON c.chantier_id = ch.id
      WHERE d.enregistre_par = ?
      ORDER BY d.date_creation DESC
    `).all(req.user!.id);
    res.json(depenses);
  } catch (error) {
    console.error('Erreur get mes depenses:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/en-attente', roleMiddleware('president', 'controleur'), (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    let depenses;

    if (req.user!.role === 'controleur') {
      depenses = db.prepare(`
        SELECT d.*, u.nom || ' ' || u.prenom as enregistre_par_nom,
          c.nom as caisse_nom, ch.nom as chantier_nom,
          (SELECT COUNT(*) FROM justificatifs WHERE depense_id = d.id) as nb_justificatifs
        FROM depenses d
        LEFT JOIN users u ON d.enregistre_par = u.id
        LEFT JOIN caisses c ON d.caisse_id = c.id
        LEFT JOIN chantiers ch ON c.chantier_id = ch.id
        WHERE d.statut IN ('soumise', 'en_controle')
          AND c.chantier_id IN (SELECT chantier_id FROM chantiers_controleurs WHERE controleur_id = ?)
        ORDER BY d.date_creation ASC
      `).all(req.user!.id);
    } else {
      depenses = db.prepare(`
        SELECT d.*, u.nom || ' ' || u.prenom as enregistre_par_nom,
          c.nom as caisse_nom, ch.nom as chantier_nom,
          (SELECT COUNT(*) FROM justificatifs WHERE depense_id = d.id) as nb_justificatifs
        FROM depenses d
        LEFT JOIN users u ON d.enregistre_par = u.id
        LEFT JOIN caisses c ON d.caisse_id = c.id
        LEFT JOIN chantiers ch ON c.chantier_id = ch.id
        WHERE d.statut IN ('soumise', 'en_controle')
        ORDER BY d.date_creation ASC
      `).all();
    }

    res.json(depenses);
  } catch (error) {
    console.error('Erreur get depenses en attente:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const depense = db.prepare(`
      SELECT d.*, u.nom || ' ' || u.prenom as enregistre_par_nom,
        c.nom as caisse_nom, ch.nom as chantier_nom, ch.id as chantier_id,
        (SELECT COALESCE(SUM(montant), 0) FROM fonds WHERE caisse_id = d.caisse_id AND statut = 'valide') as fonds_disponibles,
        (SELECT COALESCE(SUM(montant), 0) FROM depenses WHERE caisse_id = d.caisse_id AND statut = 'validee') as depenses_validees
      FROM depenses d
      LEFT JOIN users u ON d.enregistre_par = u.id
      LEFT JOIN caisses c ON d.caisse_id = c.id
      LEFT JOIN chantiers ch ON c.chantier_id = ch.id
      WHERE d.id = ?
    `).get(req.params.id);

    if (!depense) {
      res.status(404).json({ error: 'Dépense non trouvée' });
      return;
    }

    const justificatifs = db.prepare('SELECT * FROM justificatifs WHERE depense_id = ?').all(req.params.id);
    const verifications = db.prepare(`
      SELECT v.*, u.nom || ' ' || u.prenom as verifie_par_nom
      FROM verifications v
      LEFT JOIN users u ON v.verifie_par = u.id
      WHERE v.depense_id = ?
      ORDER BY v.date_verification DESC
    `).all(req.params.id);

    res.json({ ...(depense as any), justificatifs, verifications });
  } catch (error) {
    console.error('Erreur get depense:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', roleMiddleware('comptable'), (req: AuthRequest, res: Response) => {
  try {
    const { caisse_id, fonds_id, montant, categorie, fournisseur, description, date_depense } = req.body;

    if (!caisse_id || !montant || !categorie || !fournisseur || !date_depense) {
      res.status(400).json({ error: 'Tous les champs obligatoires sont requis' });
      return;
    }

    if (montant <= 0) {
      res.status(400).json({ error: 'Le montant doit être positif' });
      return;
    }

    const db = getDb();

    const caisse = db.prepare('SELECT * FROM caisses WHERE id = ?').get(caisse_id) as any;
    if (!caisse) {
      res.status(404).json({ error: 'Caisse non trouvée' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO depenses (caisse_id, fonds_id, montant, categorie, fournisseur, description, date_depense, enregistre_par, statut)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'brouillon')
    `).run(caisse_id, fonds_id || null, montant, categorie, fournisseur, description || '', date_depense, req.user!.id);

    const depenseId = result.lastInsertRowid as number;

    logAudit(req.user!.id, 'creation', 'depense', depenseId,
      `Création dépense de ${montant} FCFA (${categorie}) - ${fournisseur}`, req.ip || '');

    res.status(201).json({ id: depenseId, montant, categorie, statut: 'brouillon' });
  } catch (error) {
    console.error('Erreur create depense:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/soumettre', roleMiddleware('comptable'), (req: AuthRequest, res: Response) => {
  try {
    const { commentaire } = req.body;
    const db = getDb();
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.id) as any;

    if (!depense) {
      res.status(404).json({ error: 'Dépense non trouvée' });
      return;
    }

    if (!['brouillon', 'correction'].includes(depense.statut)) {
      res.status(400).json({ error: 'Cette dépense ne peut plus être soumise' });
      return;
    }

    db.prepare('UPDATE depenses SET statut = \'soumise\', date_modification = datetime(\'now\') WHERE id = ?').run(req.params.id);

    db.prepare(`
      INSERT INTO verifications (depense_id, verifie_par, action, commentaire)
      VALUES (?, ?, 'soumise', ?)
    `).run(req.params.id, req.user!.id, commentaire || 'Dépense soumise par le comptable');

    logAudit(req.user!.id, 'soumission', 'depense', parseInt(req.params.id),
      `Soumission de la dépense`, req.ip || '');

    res.json({ message: 'Dépense soumise au contrôle' });
  } catch (error) {
    console.error('Erreur soumettre depense:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/controle', roleMiddleware('president', 'controleur'), (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.id) as any;

    if (!depense) {
      res.status(404).json({ error: 'Dépense non trouvée' });
      return;
    }

    if (depense.statut !== 'soumise') {
      res.status(400).json({ error: 'Cette dépense ne peut plus être contrôlée' });
      return;
    }

    db.prepare('UPDATE depenses SET statut = \'en_controle\', date_modification = datetime(\'now\') WHERE id = ?').run(req.params.id);

    db.prepare(`
      INSERT INTO verifications (depense_id, verifie_par, action, commentaire)
      VALUES (?, ?, 'en_controle', 'Dépense prise en contrôle')
    `).run(req.params.id, req.user!.id);

    logAudit(req.user!.id, 'prise_controle', 'depense', parseInt(req.params.id),
      `Prise en contrôle de la dépense`, req.ip || '');

    res.json({ message: 'Dépense en cours de contrôle' });
  } catch (error) {
    console.error('Erreur controle depense:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/valider', roleMiddleware('president', 'controleur'), (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.id) as any;

    if (!depense) {
      res.status(404).json({ error: 'Dépense non trouvée' });
      return;
    }

    if (!['soumise', 'en_controle'].includes(depense.statut)) {
      res.status(400).json({ error: 'Cette dépense ne peut plus être validée' });
      return;
    }

    const caisse = db.prepare('SELECT * FROM caisses WHERE id = ?').get(depense.caisse_id) as any;
    if (caisse && caisse.solde < depense.montant) {
      res.status(400).json({ error: 'Solde insuffisant dans la caisse pour valider cette dépense' });
      return;
    }

    db.prepare('UPDATE depenses SET statut = \'validee\', date_modification = datetime(\'now\') WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE caisses SET solde = solde - ?, date_modification = datetime(\'now\') WHERE id = ?').run(depense.montant, depense.caisse_id);

    db.prepare(`
      INSERT INTO verifications (depense_id, verifie_par, action, commentaire)
      VALUES (?, ?, 'validee', 'Dépense validée')
    `).run(req.params.id, req.user!.id);

    logAudit(req.user!.id, 'validation', 'depense', parseInt(req.params.id),
      `Validation dépense de ${depense.montant} FCFA`, req.ip || '');

    res.json({ message: 'Dépense validée' });
  } catch (error) {
    console.error('Erreur valider depense:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/rejeter', roleMiddleware('president', 'controleur'), (req: AuthRequest, res: Response) => {
  try {
    const { motif_rejet } = req.body;
    const db = getDb();
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.id) as any;

    if (!depense) {
      res.status(404).json({ error: 'Dépense non trouvée' });
      return;
    }

    if (!['soumise', 'en_controle'].includes(depense.statut)) {
      res.status(400).json({ error: 'Cette dépense ne peut plus être rejetée' });
      return;
    }

    db.prepare('UPDATE depenses SET statut = \'rejetee\', motif_rejet = ?, date_modification = datetime(\'now\') WHERE id = ?')
      .run(motif_rejet || '', req.params.id);

    db.prepare(`
      INSERT INTO verifications (depense_id, verifie_par, action, commentaire)
      VALUES (?, ?, 'rejetee', ?)
    `).run(req.params.id, req.user!.id, motif_rejet || 'Dépense rejetée');

    logAudit(req.user!.id, 'rejet', 'depense', parseInt(req.params.id),
      `Rejet dépense de ${depense.montant} FCFA - ${motif_rejet || 'Aucun motif'}`, req.ip || '');

    res.json({ message: 'Dépense rejetée' });
  } catch (error) {
    console.error('Erreur rejeter depense:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/correction', roleMiddleware('president', 'controleur'), (req: AuthRequest, res: Response) => {
  try {
    const { commentaire } = req.body;
    const db = getDb();
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.id) as any;

    if (!depense) {
      res.status(404).json({ error: 'Dépense non trouvée' });
      return;
    }

    db.prepare('UPDATE depenses SET statut = \'correction\', date_modification = datetime(\'now\') WHERE id = ?').run(req.params.id);

    db.prepare(`
      INSERT INTO verifications (depense_id, verifie_par, action, commentaire)
      VALUES (?, ?, 'correction', ?)
    `).run(req.params.id, req.user!.id, commentaire || 'Correction demandée');

    logAudit(req.user!.id, 'correction', 'depense', parseInt(req.params.id),
      `Demande de correction - ${commentaire || 'Aucun commentaire'}`, req.ip || '');

    res.json({ message: 'Correction demandée' });
  } catch (error) {
    console.error('Erreur correction depense:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id/modifier', roleMiddleware('comptable'), (req: AuthRequest, res: Response) => {
  try {
    const { montant, categorie, fournisseur, description, date_depense } = req.body;
    const db = getDb();
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.id) as any;

    if (!depense) {
      res.status(404).json({ error: 'Dépense non trouvée' });
      return;
    }

    if (depense.enregistre_par !== req.user!.id) {
      res.status(403).json({ error: 'Vous ne pouvez modifier que vos propres dépenses' });
      return;
    }

    if (!['correction', 'rejetee'].includes(depense.statut)) {
      res.status(400).json({ error: 'Cette dépense ne peut plus être modifiée' });
      return;
    }

    db.prepare(`
      UPDATE depenses SET montant=?, categorie=?, fournisseur=?, description=?, date_depense=?,
        statut='soumise', motif_rejet='', date_modification=datetime('now')
      WHERE id=?
    `).run(montant || depense.montant, categorie || depense.categorie,
      fournisseur || depense.fournisseur, description ?? depense.description,
      date_depense || depense.date_depense, req.params.id);

    db.prepare(`
      INSERT INTO verifications (depense_id, verifie_par, action, commentaire)
      VALUES (?, ?, 'soumise', 'Dépense corrigée et resoumise')
    `).run(req.params.id, req.user!.id);

    logAudit(req.user!.id, 'modification', 'depense', parseInt(req.params.id),
      `Modification et resoumission de la dépense`, req.ip || '');

    res.json({ message: 'Dépense modifiée et resoumise' });
  } catch (error) {
    console.error('Erreur modifier depense:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
