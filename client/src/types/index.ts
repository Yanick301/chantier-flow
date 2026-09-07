export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'president' | 'controleur' | 'comptable';
  telephone: string;
  actif: number;
  date_creation: string;
}

export interface Chantier {
  id: number;
  nom: string;
  localisation: string;
  description: string;
  statut: 'actif' | 'en_pause' | 'termine';
  responsable_id: number;
  responsable_nom?: string;
  nb_caisses?: number;
  solde_total?: number;
  date_creation: string;
  caisses?: Caisse[];
  controleurs?: User[];
}

export interface Caisse {
  id: number;
  chantier_id: number;
  nom: string;
  solde: number;
  total_fonds?: number;
  total_depenses?: number;
  date_creation: string;
}

export interface Fonds {
  id: number;
  caisse_id: number;
  montant: number;
  motif: string;
  date_envoi: string;
  envoye_par: number;
  envoye_par_nom?: string;
  beneficiaire_id: number;
  beneficiaire_nom?: string;
  comptable_id: number;
  comptable_nom?: string;
  statut: 'en_attente' | 'valide' | 'rejete';
  commentaire: string;
  date_creation: string;
}

export interface Depense {
  id: number;
  caisse_id: number;
  fonds_id?: number;
  montant: number;
  categorie: string;
  fournisseur: string;
  description: string;
  date_depense: string;
  enregistre_par: number;
  enregistre_par_nom?: string;
  statut: 'brouillon' | 'soumise' | 'en_controle' | 'validee' | 'rejetee' | 'correction';
  motif_rejet: string;
  nb_justificatifs?: number;
  caisse_nom?: string;
  chantier_nom?: string;
  chantier_id?: number;
  fonds_disponibles?: number;
  depenses_validees?: number;
  date_creation: string;
  date_modification: string;
  justificatifs?: Justificatif[];
  verifications?: Verification[];
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
  verifie_par_nom?: string;
  action: string;
  commentaire: string;
  date_verification: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_nom?: string;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  ip_address: string;
  date_action: string;
}

export interface DashboardStats {
  total_chantiers?: number;
  chantiers_actifs?: number;
  total_caisses?: number;
  solde_total?: number;
  total_fonds_envoyes?: number;
  fonds_en_attente?: number;
  total_depenses?: number;
  depenses_en_attente?: number;
  depenses_rejetees?: number;
  total_utilisateurs?: number;
  depenses_par_categorie?: { categorie: string; count: number; total: number }[];
  evolution_mensuelle?: { mois: string; depenses: number; en_attente: number }[];
  mes_chantiers?: number;
  fonds_a_valider?: number;
  depenses_a_controler?: number;
  total_depenses_controlees?: number;
  mes_depenses?: number;
  depenses_validees?: number;
  total_montant_depenses?: number;
}
