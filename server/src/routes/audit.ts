import { Router, Response } from 'express';
import { getDb } from '../database/db';
import { AuthRequest, authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('president'));

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const { page = '1', limit = '50', entity_type, user_id } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = `
      SELECT a.*, u.nom || ' ' || u.prenom as user_nom
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (entity_type) {
      conditions.push('a.entity_type = ?');
      params.push(entity_type);
    }
    if (user_id) {
      conditions.push('a.user_id = ?');
      params.push(user_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY a.date_action DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), offset);

    const logs = await db.prepare(query).all(...params);
    const total = ((await db.prepare('SELECT COUNT(*) as count FROM audit_log').get()) as any).count;

    res.json({ logs, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    console.error('Erreur get audit logs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/entity/:type/:id', async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const logs = await db.prepare(`
      SELECT a.*, u.nom || ' ' || u.prenom as user_nom
      FROM audit_log a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.entity_type = ? AND a.entity_id = ?
      ORDER BY a.date_action DESC
    `).all(req.params.type, req.params.id);

    res.json(logs);
  } catch (error) {
    console.error('Erreur get audit entity:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
