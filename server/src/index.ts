import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDb, getDb } from './database/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import chantierRoutes from './routes/chantiers';
import caisseRoutes from './routes/caisses';
import fondsRoutes from './routes/fonds';
import depenseRoutes from './routes/depenses';
import justificatifRoutes from './routes/justificatifs';
import statsRoutes from './routes/stats';
import auditRoutes from './routes/audit';
import bcrypt from 'bcryptjs';

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chantiers', chantierRoutes);
app.use('/api/caisses', caisseRoutes);
app.use('/api/fonds', fondsRoutes);
app.use('/api/depenses', depenseRoutes);
app.use('/api/justificatifs', justificatifRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/audit', auditRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Chantier Flow API - Client non construit. Lancez: cd client && npm run build' });
  });
}

async function ensureAdminUser() {
  const db = getDb();
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  
  if (userCount.count === 0) {
    console.log('Création de l\'administrateur initial...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    db.prepare(`
      INSERT INTO users (nom, prenom, email, mot_de_passe, role, telephone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Administrateur', 'Système', 'admin@chantierflow.com', hashedPassword, 'president', '');
    console.log('Administrateur créé: admin@chantierflow.com / admin123');
    console.log('Créez les autres comptes via l\'interface.');
  }
}

initDb();
ensureAdminUser().then(() => {
  app.listen(PORT, () => {
    console.log(`CHANTIER FLOW API démarrée sur le port ${PORT}`);
  });
}).catch(err => {
  console.error('Erreur initialisation:', err);
  process.exit(1);
});
