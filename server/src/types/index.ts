export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  role: 'president' | 'controleur' | 'comptable';
  telephone: string;
  actif: number;
  date_creation: string;
  date_modification: string;
}

export interface Chantier {
  id: number;
  nom: string;
  localisation: string;
  description: string;
  statut: 'actif' | 'en_pause' | 'termine';
  responsable_id: number;
  date_creation: string;
  date_modification: string;
}

export interface ChantierControleur {
  id: number;
  chantier_id: number;
  controleur_id: number;
  date_attribution: string;
}

export interface Caisse {
  id: number;
  chantier_id: number;
  nom: string;
  solde: number;
  date_creation: string;
  date_modification: string;
}

export interface Fonds {
  id: number;
  caisse_id: number;
  montant: number;
  motif: string;
  date_envoi: string;
  envoye_par: number;
  beneficiaire_id: number;
  comptable_id: number;
  statut: 'en_attente' | 'valide' | 'rejete';
  commentaire: string;
  date_creation: string;
  date_modification: string;
}

export interface Depense {
  id: number;
  caisse_id: number;
  fonds_id: number;
  montant: number;
  categorie: string;
  fournisseur: string;
  description: string;
  date_depense: string;
  enregistre_par: number;
  statut: 'brouillon' | 'soumise' | 'en_controle' | 'validee' | 'rejetee' | 'correction';
  motif_rejet: string;
  date_creation: string;
  date_modification: string;
}

export interface Justificatif {
  id: number;
  depense_id: number;
  type_fichier: 'image' | 'pdf';
  nom_fichier: string;
  nom_original: string;
  taille: number;
  date_ajout: string;
}

export interface Verification {
  id: number;
  depense_id: number;
  verifie_par: number;
  action: 'soumise' | 'en_controle' | 'validee' | 'rejetee' | 'correction' | 'controle' | 'justificatif_valide' | 'justificatif_rejete';
  commentaire: string;
  date_verification: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  ip_address: string;
  date_action: string;
}

export interface AuthRequest extends Express.Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}
