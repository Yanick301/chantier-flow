import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/db';
import { AuthRequest, authMiddleware, roleMiddleware, logAudit } from '../middleware/auth';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté'));
    }
  }
});

const router = Router();

router.use(authMiddleware);

router.get('/depense/:depenseId', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const justificatifs = db.prepare('SELECT * FROM justificatifs WHERE depense_id = ?').all(req.params.depenseId);
    res.json(justificatifs);
  } catch (error) {
    console.error('Erreur get justificatifs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/depense/:depenseId', upload.array('fichiers', 10), (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(req.params.depenseId) as any;

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

    const stmt = db.prepare(`
      INSERT INTO justificatifs (depense_id, type_fichier, nom_fichier, nom_original, taille)
      VALUES (?, ?, ?, ?, ?)
    `);

    const justificatifs = [];
    for (const file of files) {
      const typeFichier = file.mimetype === 'application/pdf' ? 'pdf' : 'image';
      const result = stmt.run(req.params.depenseId, typeFichier, file.filename, file.originalname, file.size);
      justificatifs.push({ id: result.lastInsertRowid, type_fichier: typeFichier, nom_original: file.originalname });
    }

    logAudit(req.user!.id, 'ajout_justificatif', 'depense', parseInt(req.params.depenseId),
      `Ajout de ${files.length} justificatif(s)`, req.ip || '');

    res.status(201).json(justificatifs);
  } catch (error) {
    console.error('Erreur upload justificatifs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id/fichier', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const justificatif = db.prepare('SELECT * FROM justificatifs WHERE id = ?').get(req.params.id) as any;

    if (!justificatif) {
      res.status(404).json({ error: 'Justificatif non trouvé' });
      return;
    }

    const filePath = path.join(__dirname, '../../uploads', justificatif.nom_fichier);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Erreur get fichier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const justificatif = db.prepare('SELECT * FROM justificatifs WHERE id = ?').get(req.params.id) as any;

    if (!justificatif) {
      res.status(404).json({ error: 'Justificatif non trouvé' });
      return;
    }

    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(justificatif.depense_id) as any;
    if (depense.enregistre_par !== req.user!.id && req.user!.role !== 'president') {
      res.status(403).json({ error: 'Accès refusé' });
      return;
    }

    const filePath = path.join(__dirname, '../../uploads', justificatif.nom_fichier);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM justificatifs WHERE id = ?').run(req.params.id);

    logAudit(req.user!.id, 'suppression_justificatif', 'justificatif', parseInt(req.params.id),
      `Suppression justificatif ${justificatif.nom_original}`, req.ip || '');

    res.json({ message: 'Justificatif supprimé' });
  } catch (error) {
    console.error('Erreur delete justificatif:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
