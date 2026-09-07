export const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

export const statutChantierColors: Record<string, string> = {
  actif: 'badge-success',
  en_pause: 'badge-warning',
  termine: 'badge-info',
};

export const statutChantierLabels: Record<string, string> = {
  actif: 'Actif',
  en_pause: 'En pause',
  termine: 'Terminé',
};

export const statutFondsColors: Record<string, string> = {
  en_attente: 'badge-warning',
  valide: 'badge-success',
  rejete: 'badge-danger',
};

export const statutFondsLabels: Record<string, string> = {
  en_attente: 'En attente',
  valide: 'Validé',
  rejete: 'Rejeté',
};

export const statutDepenseColors: Record<string, string> = {
  brouillon: 'badge-neutral',
  soumise: 'badge-warning',
  en_controle: 'badge-info',
  validee: 'badge-success',
  rejetee: 'badge-danger',
  correction: 'badge-warning',
};

export const statutDepenseLabels: Record<string, string> = {
  brouillon: 'Brouillon',
  soumise: 'Soumise',
  en_controle: 'En contrôle',
  validee: 'Validée',
  rejetee: 'Rejetée',
  correction: 'À corriger',
};

export const roleLabels: Record<string, string> = {
  president: 'Président',
  controleur: 'Contrôleur',
  comptable: 'Comptable',
};

export const roleBadgeColors: Record<string, string> = {
  president: 'badge-brand',
  controleur: 'badge-warning',
  comptable: 'badge-success',
};
