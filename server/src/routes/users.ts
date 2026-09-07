import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database/db';
import { AuthRequest, authMiddleware, roleMiddleware, logAudit } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware('president'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const users = await db.prepare(`
      SELECT id, nom, prenom, email, role, telephone, actif, date_creation
      FROM users ORDER BY date_creation DESC
    `).all();
    res.json(users);
  } catch (error) {
    console.error('Erreur get users:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const user = await db.prepare(`
      SELECT id, nom, prenom, email, role, telephone, actif, date_creation
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error('Erreur get user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/', roleMiddleware('president'), async (req: AuthRequest, res: Response) => {
  try {
    const { nom, prenom, email, mot_de_passe, role, telephone } = req.body;

    if (!nom || !prenom || !email || !mot_de_passe || !role) {
      res.status(400).json({ error: 'Tous les champs obligatoires sont requis' });
      return;
    }

    const db = getDb();
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(400).json({ error: 'Cet email est déjà utilisé' });
      return;
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const result = await db.prepare(`
      INSERT INTO users (nom, prenom, email, mot_de_passe, role, telephone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nom, prenom, email, hashedPassword, role, telephone || '');

    await logAudit(req.user!.id, 'creation', 'user', result.lastInsertRowid as number,
      `Création utilisateur ${prenom} ${nom} (${role})`, req.ip || '');

    res.status(201).json({
      id: result.lastInsertRowid,
      nom, prenom, email, role, telephone: telephone || '', actif: 1
    });
  } catch (error) {
    console.error('Erreur create user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', roleMiddleware('president'), async (req: AuthRequest, res: Response) => {
  try {
    const { nom, prenom, email, role, telephone, actif, mot_de_passe } = req.body;
    const db = getDb();

    const existing = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    if (email && email !== existing.email) {
      const emailExists = await db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.params.id);
      if (emailExists) {
        res.status(400).json({ error: 'Cet email est déjà utilisé' });
        return;
      }
    }

    let query = `UPDATE users SET nom=?, prenom=?, email=?, role=?, telephone=?, actif=?, date_modification=datetime('now')`;
    const params: any[] = [nom || existing.nom, prenom || existing.prenom, email || existing.email,
      role || existing.role, telephone ?? existing.telephone, actif ?? existing.actif];

    if (mot_de_passe) {
      query += `, mot_de_passe=?`;
      params.push(await bcrypt.hash(mot_de_passe, 10));
    }

    query += ` WHERE id=?`;
    params.push(req.params.id);

    await db.prepare(query).run(...params);

    await logAudit(req.user!.id, 'modification', 'user', parseInt(req.params.id),
      `Modification utilisateur`, req.ip || '');

    res.json({ message: 'Utilisateur mis à jour' });
  } catch (error) {
    console.error('Erreur update user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', roleMiddleware('president'), async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    await db.prepare('UPDATE users SET actif = 0, date_modification = datetime(\'now\') WHERE id = ?').run(req.params.id);

    await logAudit(req.user!.id, 'desactivation', 'user', parseInt(req.params.id),
      `Désactivation utilisateur`, req.ip || '');

    res.json({ message: 'Utilisateur désactivé' });
  } catch (error) {
    console.error('Erreur delete user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
