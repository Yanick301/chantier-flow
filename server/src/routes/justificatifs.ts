import { Router, Response } from 'express';
import { getDb } from '../database/db';
import { AuthRequest, authMiddleware, roleMiddleware, logAudit } from '../middleware/auth';
import { upload, deleteCloudinaryFile } from '../config/cloudinary';

const router = Router();

router.use(authMiddleware);

router.get('/depense/:depenseId', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const justificatifs = await db.prepare('SELECT * FROM justificatifs WHERE depense_id = ?').all(req.params.depenseId);
    res.json(justificatifs);
  } catch (error) {
    console.error('Erreur get justificatifs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/depense/:depenseId', upload.array('fichiers', 10), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const depense = await db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.depenseId) as any;

    if (!depense) {
      res.status(404).json({ error: 'Dépense non trouvée' });
      return;
    }

    if (depense.enregistre_par !== req.user!.id && !['president', 'controleur'].includes(req.user!.role)) {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'Aucun fichier fourni' });
      return;
    }

    const justificatifs = [];
    for (const file of files) {
      const typeFichier = file.mimetype === 'application/pdf' ? 'pdf' : 'image';
      const filename = file.filename || file.path;
      const result = await db.prepare(`
        INSERT INTO justificatifs (depense_id, type_fichier, nom_fichier, nom_original, taille)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.params.depenseId, typeFichier, filename, file.originalname, file.size);
      justificatifs.push({ id: result.lastInsertRowid, type_fichier: typeFichier, nom_original: file.originalname, nom_fichier: filename });
    }

    await logAudit(req.user!.id, 'ajout_justificatif', 'depense', parseInt(req.params.depenseId),
      `Ajout de ${files.length} justificatif(s)`, req.ip || '');

    res.status(201).json(justificatifs);
  } catch (error) {
    console.error('Erreur upload justificatifs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id/fichier', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const justificatif = await db.prepare('SELECT * FROM justificatifs WHERE id = ?').get(req.params.id) as any;

    if (!justificatif) {
      res.status(404).json({ error: 'Justificatif non trouvé' });
      return;
    }

    res.redirect(justificatif.nom_fichier);
  } catch (error) {
    console.error('Erreur get fichier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const justificatif = await db.prepare('SELECT * FROM justificatifs WHERE id = ?').get(req.params.id) as any;

    if (!justificatif) {
      res.status(404).json({ error: 'Justificatif non trouvé' });
      return;
    }

    const depense = await db.prepare('SELECT * FROM depenses WHERE id = ?').get(justificatif.depense_id) as any;
    if (depense.enregistre_par !== req.user!.id && req.user!.role !== 'president') {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    await deleteCloudinaryFile(justificatif.nom_fichier);

    await db.prepare('DELETE FROM justificatifs WHERE id = ?').run(req.params.id);

    await logAudit(req.user!.id, 'suppression_justificatif', 'justificatif', parseInt(req.params.id),
      `Suppression justificatif ${justificatif.nom_original}`, req.ip || '');

    res.json({ message: 'Justificatif supprimé' });
  } catch (error) {
    console.error('Erreur delete justificatif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
