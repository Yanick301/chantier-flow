import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database/db';
import { generateToken } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      res.status(400).json({ error: 'Email et mot de passe requis' });
      return;
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND actif = 1').get(email) as any;

    if (!user) {
      res.status(401).json({ error: 'Identifiants incorrects' });
      return;
    }

    const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

    if (!validPassword) {
      res.status(401).json({ error: 'Identifiants incorrects' });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        telephone: user.telephone
      }
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { nom, prenom, email, mot_de_passe, role, telephone } = req.body;

    if (!nom || !prenom || !email || !mot_de_passe || !role) {
      res.status(400).json({ error: 'Tous les champs obligatoires sont requis' });
      return;
    }

    const db = getDb();
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    if (existingUser) {
      res.status(400).json({ error: 'Cet email est déjà utilisé' });
      return;
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    const result = db.prepare(`
      INSERT INTO users (nom, prenom, email, mot_de_passe, role, telephone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(nom, prenom, email, hashedPassword, role, telephone || '');

    const token = generateToken({ id: result.lastInsertRowid as number, email, role });

    res.status(201).json({
      token,
      user: {
        id: result.lastInsertRowid,
        nom,
        prenom,
        email,
        role,
        telephone: telephone || ''
      }
    });
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
