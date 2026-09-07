import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../chantier_flow.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      mot_de_passe TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('president', 'controleur', 'comptable')),
      telephone TEXT DEFAULT '',
      actif INTEGER DEFAULT 1,
      date_creation TEXT DEFAULT (datetime('now')),
      date_modification TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chantiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      localisation TEXT NOT NULL,
      description TEXT DEFAULT '',
      statut TEXT DEFAULT 'actif' CHECK(statut IN ('actif', 'en_pause', 'termine')),
      responsable_id INTEGER,
      date_creation TEXT DEFAULT (datetime('now')),
      date_modification TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (responsable_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chantiers_controleurs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chantier_id INTEGER NOT NULL,
      controleur_id INTEGER NOT NULL,
      date_attribution TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (chantier_id) REFERENCES chantiers(id),
      FOREIGN KEY (controleur_id) REFERENCES users(id),
      UNIQUE(chantier_id, controleur_id)
    );

    CREATE TABLE IF NOT EXISTS caisses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chantier_id INTEGER NOT NULL,
      nom TEXT NOT NULL,
      solde REAL DEFAULT 0,
      date_creation TEXT DEFAULT (datetime('now')),
      date_modification TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (chantier_id) REFERENCES chantiers(id)
    );

    CREATE TABLE IF NOT EXISTS fonds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caisse_id INTEGER NOT NULL,
      montant REAL NOT NULL,
      motif TEXT NOT NULL,
      date_envoi TEXT NOT NULL,
      envoye_par INTEGER NOT NULL,
      beneficiaire_id INTEGER NOT NULL,
      comptable_id INTEGER NOT NULL,
      statut TEXT DEFAULT 'en_attente' CHECK(statut IN ('en_attente', 'valide', 'rejete')),
      commentaire TEXT DEFAULT '',
      date_creation TEXT DEFAULT (datetime('now')),
      date_modification TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (caisse_id) REFERENCES caisses(id),
      FOREIGN KEY (envoye_par) REFERENCES users(id),
      FOREIGN KEY (beneficiaire_id) REFERENCES users(id),
      FOREIGN KEY (comptable_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS depenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caisse_id INTEGER NOT NULL,
      fonds_id INTEGER,
      montant REAL NOT NULL,
      categorie TEXT NOT NULL,
      fournisseur TEXT NOT NULL,
      description TEXT DEFAULT '',
      date_depense TEXT NOT NULL,
      enregistre_par INTEGER NOT NULL,
      statut TEXT DEFAULT 'soumise' CHECK(statut IN ('brouillon', 'soumise', 'en_controle', 'validee', 'rejetee', 'correction')),
      motif_rejet TEXT DEFAULT '',
      date_creation TEXT DEFAULT (datetime('now')),
      date_modification TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (caisse_id) REFERENCES caisses(id),
      FOREIGN KEY (fonds_id) REFERENCES fonds(id),
      FOREIGN KEY (enregistre_par) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS justificatifs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      depense_id INTEGER NOT NULL,
      type_fichier TEXT NOT NULL CHECK(type_fichier IN ('image', 'pdf')),
      nom_fichier TEXT NOT NULL,
      nom_original TEXT NOT NULL,
      taille INTEGER DEFAULT 0,
      date_ajout TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (depense_id) REFERENCES depenses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      depense_id INTEGER NOT NULL,
      verifie_par INTEGER NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('soumise', 'en_controle', 'validee', 'rejetee', 'correction', 'controle', 'justificatif_valide', 'justificatif_rejete')),
      commentaire TEXT DEFAULT '',
      date_verification TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (depense_id) REFERENCES depenses(id),
      FOREIGN KEY (verifie_par) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      date_action TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_depenses_caisse ON depenses(caisse_id);
    CREATE INDEX IF NOT EXISTS idx_depenses_statut ON depenses(statut);
    CREATE INDEX IF NOT EXISTS idx_depenses_enregistre ON depenses(enregistre_par);
    CREATE INDEX IF NOT EXISTS idx_justificatifs_depense ON justificatifs(depense_id);
    CREATE INDEX IF NOT EXISTS idx_verifications_depense ON verifications(depense_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_fonds_caisse ON fonds(caisse_id);
    CREATE INDEX IF NOT EXISTS idx_caisses_chantier ON caisses(chantier_id);
  `);
}
