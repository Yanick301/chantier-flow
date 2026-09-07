export function ConstructionIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="100" r="80" fill="#f1f5f9" />
      <rect x="70" y="90" width="100" height="70" rx="4" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="80" y="100" width="25" height="20" rx="2" fill="#cbd5e1" />
      <rect x="115" y="100" width="25" height="20" rx="2" fill="#cbd5e1" />
      <rect x="80" y="128" width="25" height="20" rx="2" fill="#cbd5e1" />
      <rect x="115" y="128" width="25" height="20" rx="2" fill="#94a3b8" />
      <path d="M60 90 L120 55 L180 90" fill="#64748b" stroke="#475569" strokeWidth="1.5" />
      <rect x="105" y="128" width="20" height="32" rx="2" fill="#475569" />
      <circle cx="118" cy="144" r="1.5" fill="#e2e8f0" />
      <rect x="85" y="104" width="15" height="12" rx="1" fill="#93c5fd" opacity="0.7" />
      <rect x="120" y="104" width="15" height="12" rx="1" fill="#93c5fd" opacity="0.7" />
      <rect x="85" y="132" width="15" height="12" rx="1" fill="#93c5fd" opacity="0.7" />
      <rect x="120" y="132" width="15" height="12" rx="1" fill="#93c5fd" opacity="0.7" />
      <line x1="40" y1="165" x2="200" y2="165" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="160" y="50" width="8" height="50" rx="2" fill="#f59e0b" />
      <rect x="155" y="50" width="18" height="6" rx="2" fill="#f59e0b" />
      <rect x="162" y="60" width="4" height="35" rx="1" fill="#d97706" />
      <circle cx="55" cy="70" r="15" fill="#f1f5f9" />
      <circle cx="55" cy="65" r="6" fill="#cbd5e1" />
      <path d="M45 78 C45 72 65 72 65 78 L65 82 C65 84 45 84 45 82 Z" fill="#cbd5e1" />
    </svg>
  );
}

export function EmptyBoxIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="65" fill="#f8fafc" />
      <rect x="50" y="55" width="100" height="70" rx="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="50" y="55" width="100" height="25" rx="6" fill="#cbd5e1" />
      <line x1="100" y1="80" x2="100" y2="125" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="50" y1="80" x2="150" y2="80" stroke="#e2e8f0" strokeWidth="1" />
      <path d="M85 95 L100 85 L115 95" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="100" y1="85" x2="100" y2="110" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="150" cy="50" r="10" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
      <text x="150" y="54" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">?</text>
    </svg>
  );
}

export function NoDataIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="65" fill="#f8fafc" />
      <rect x="45" y="35" width="110" height="90" rx="8" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="60" y="50" width="50" height="6" rx="3" fill="#cbd5e1" />
      <rect x="60" y="64" width="80" height="4" rx="2" fill="#f1f5f9" />
      <rect x="60" y="74" width="70" height="4" rx="2" fill="#f1f5f9" />
      <rect x="60" y="84" width="85" height="4" rx="2" fill="#f1f5f9" />
      <rect x="60" y="94" width="60" height="4" rx="2" fill="#f1f5f9" />
      <rect x="60" y="104" width="75" height="4" rx="2" fill="#f1f5f9" />
      <circle cx="140" cy="55" r="18" fill="#f1f5f9" />
      <path d="M133 55 L147 55" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <path d="M140 48 L140 62" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function CreatingIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="65" fill="#f0fdf4" />
      <circle cx="100" cy="80" r="25" fill="#dcfce7" stroke="#86efac" strokeWidth="2" strokeDasharray="8 4">
        <animateTransform attributeName="transform" type="rotate" values="0 100 80;360 100 80" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="80" r="12" fill="#22c55e" opacity="0.8">
        <animate attributeName="r" values="10;14;10" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <rect x="95" y="68" width="10" height="24" rx="5" fill="white" />
      <rect x="88" y="77" width="24" height="6" rx="3" fill="white" />
      <rect x="60" y="120" width="80" height="8" rx="4" fill="#dcfce7" />
      <rect x="60" y="120" width="40" height="8" rx="4" fill="#22c55e">
        <animate attributeName="width" values="20;80;20" dur="2s" repeatCount="indefinite" />
      </rect>
      <text x="100" y="145" textAnchor="middle" fill="#16a34a" fontSize="10" fontWeight="500" fontFamily="Inter, sans-serif">Création en cours...</text>
    </svg>
  );
}

export function SuccessIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="65" fill="#f0fdf4" />
      <circle cx="100" cy="80" r="35" fill="#dcfce7" stroke="#86efac" strokeWidth="2" />
      <path d="M85 80 L95 90 L118 67" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="100" cy="80" r="35" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="220" strokeDashoffset="220">
        <animate attributeName="strokeDashoffset" values="220;0" dur="0.6s" fill="freeze" />
      </circle>
      <circle cx="55" cy="45" r="4" fill="#bbf7d0" />
      <circle cx="145" cy="45" r="3" fill="#bbf7d0" />
      <circle cx="50" cy="115" r="3" fill="#bbf7d0" />
      <circle cx="150" cy="115" r="4" fill="#bbf7d0" />
      <text x="100" y="135" textAnchor="middle" fill="#16a34a" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">Succès !</text>
    </svg>
  );
}

export function ErrorIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="65" fill="#fef2f2" />
      <circle cx="100" cy="80" r="35" fill="#fee2e2" stroke="#fca5a5" strokeWidth="2" />
      <path d="M88 68 L112 92" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <path d="M112 68 L88 92" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <circle cx="55" cy="50" r="3" fill="#fecaca" />
      <circle cx="145" cy="50" r="4" fill="#fecaca" />
      <circle cx="50" cy="110" r="4" fill="#fecaca" />
      <circle cx="150" cy="110" r="3" fill="#fecaca" />
      <text x="100" y="135" textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">Erreur</text>
    </svg>
  );
}

export function LoadingIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="65" fill="#f8fafc" />
      <circle cx="100" cy="80" r="30" fill="none" stroke="#e2e8f0" strokeWidth="4" />
      <circle cx="100" cy="80" r="30" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="60 120" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" values="0 100 80;360 100 80" dur="1s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="80" r="15" fill="#dbeafe" />
      <path d="M93 80 L100 73 L107 80 L100 87 Z" fill="#3b82f6">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
      </path>
      <rect x="70" y="120" width="60" height="6" rx="3" fill="#e2e8f0" />
      <rect x="70" y="120" width="30" height="6" rx="3" fill="#3b82f6">
        <animate attributeName="width" values="10;60;10" dur="2s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

export function LoginPersonIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="85" fill="#f1f5f9" />
      <circle cx="100" cy="70" r="25" fill="#e2e8f0" />
      <circle cx="100" cy="62" r="10" fill="#cbd5e1" />
      <path d="M82 80 C82 72 118 72 118 80 L118 85 C118 88 82 88 82 85 Z" fill="#cbd5e1" />
      <rect x="70" y="95" width="60" height="55" rx="8" fill="#e2e8f0" />
      <rect x="80" y="105" width="40" height="6" rx="3" fill="#cbd5e1" />
      <rect x="80" y="118" width="30" height="4" rx="2" fill="#e2e8f0" />
      <rect x="80" y="128" width="35" height="4" rx="2" fill="#e2e8f0" />
      <rect x="80" y="138" width="25" height="4" rx="2" fill="#e2e8f0" />
      <circle cx="140" cy="130" r="15" fill="#dbeafe" />
      <rect x="133" y="127" width="14" height="8" rx="2" fill="#3b82f6" />
      <rect x="136" y="124" width="8" height="4" rx="1" fill="#3b82f6" />
      <path d="M137 130 L140 133 L147 126" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PersonDocumentIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 180" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="90" r="55" fill="#f1f5f9" />
      <circle cx="80" cy="65" r="18" fill="#e2e8f0" />
      <circle cx="80" cy="59" r="8" fill="#cbd5e1" />
      <path d="M67 75 C67 69 93 69 93 75 L93 78 C93 81 67 81 67 78 Z" fill="#cbd5e1" />
      <rect x="58" y="88" width="44" height="40" rx="6" fill="#e2e8f0" />
      <rect x="65" y="96" width="30" height="4" rx="2" fill="#cbd5e1" />
      <rect x="65" y="104" width="22" height="3" rx="1.5" fill="#e2e8f0" />
      <rect x="65" y="112" width="26" height="3" rx="1.5" fill="#e2e8f0" />
      <rect x="65" y="120" width="18" height="3" rx="1.5" fill="#e2e8f0" />
      <rect x="120" y="40" width="60" height="80" rx="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="130" y="52" width="40" height="5" rx="2" fill="#cbd5e1" />
      <rect x="130" y="62" width="35" height="3" rx="1.5" fill="#f1f5f9" />
      <rect x="130" y="70" width="40" height="3" rx="1.5" fill="#f1f5f9" />
      <rect x="130" y="78" width="30" height="3" rx="1.5" fill="#f1f5f9" />
      <rect x="130" y="86" width="38" height="3" rx="1.5" fill="#f1f5f9" />
      <rect x="130" y="94" width="25" height="3" rx="1.5" fill="#f1f5f9" />
      <rect x="130" y="105" width="20" height="6" rx="3" fill="#3b82f6" opacity="0.8" />
      <path d="M138 105 L140 108 L146 102" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function MoneyIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="65" fill="#fefce8" />
      <rect x="55" y="45" width="90" height="55" rx="8" fill="#fef9c3" stroke="#fde047" strokeWidth="1.5" />
      <rect x="55" y="45" width="90" height="20" rx="8" fill="#fde047" />
      <circle cx="100" cy="80" r="18" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
      <text x="100" y="86" textAnchor="middle" fill="white" fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif">F</text>
      <rect x="68" y="110" width="64" height="8" rx="4" fill="#fef9c3" />
      <rect x="68" y="110" width="32" height="8" rx="4" fill="#fbbf24">
        <animate attributeName="width" values="10;64;10" dur="2.5s" repeatCount="indefinite" />
      </rect>
      <circle cx="50" cy="55" r="5" fill="#fef9c3" />
      <circle cx="150" cy="55" r="4" fill="#fef9c3" />
      <circle cx="45" cy="100" r="3" fill="#fef9c3" />
      <circle cx="155" cy="100" r="5" fill="#fef9c3" />
      <text x="100" y="140" textAnchor="middle" fill="#a16207" fontSize="10" fontWeight="500" fontFamily="Inter, sans-serif">FCFA</text>
    </svg>
  );
}

export function WorkflowIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 140" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="70" r="25" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.5" />
      <rect x="32" y="64" width="16" height="12" rx="3" fill="#3b82f6" />
      <rect x="35" y="61" width="10" height="4" rx="2" fill="#3b82f6" />
      <text x="40" y="108" textAnchor="middle" fill="#1d4ed8" fontSize="8" fontWeight="500" fontFamily="Inter, sans-serif">Créer</text>

      <line x1="65" y1="70" x2="90" y2="70" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M86 66 L92 70 L86 74" fill="#cbd5e1" />

      <circle cx="110" cy="70" r="25" fill="#fef3c7" stroke="#fcd34d" strokeWidth="1.5" />
      <rect x="100" y="60" width="20" height="20" rx="4" fill="#f59e0b" />
      <rect x="104" y="64" width="12" height="3" rx="1" fill="white" />
      <rect x="104" y="70" width="8" height="3" rx="1" fill="white" opacity="0.6" />
      <text x="110" y="108" textAnchor="middle" fill="#b45309" fontSize="8" fontWeight="500" fontFamily="Inter, sans-serif">Soumettre</text>

      <line x1="135" y1="70" x2="160" y2="70" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M156 66 L162 70 L156 74" fill="#cbd5e1" />

      <circle cx="180" cy="70" r="25" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5" />
      <path d="M172 70 L178 76 L190 64" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="180" y="108" textAnchor="middle" fill="#15803d" fontSize="8" fontWeight="500" fontFamily="Inter, sans-serif">Valider</text>

      <line x1="205" y1="70" x2="225" y2="70" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M221 66 L227 70 L221 74" fill="#cbd5e1" />

      <circle cx="242" cy="70" r="18" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />
      <path d="M235 70 L240 75 L250 65" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="242" y="100" textAnchor="middle" fill="#15803d" fontSize="8" fontWeight="500" fontFamily="Inter, sans-serif">Terminé</text>
    </svg>
  );
}

export function AccessDeniedIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="80" r="65" fill="#fef2f2" />
      <rect x="70" y="50" width="60" height="65" rx="8" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="70" y="50" width="60" height="22" rx="8" fill="#cbd5e1" />
      <circle cx="100" cy="82" r="12" fill="#fecaca" stroke="#fca5a5" strokeWidth="1.5" />
      <rect x="96" y="78" width="8" height="12" rx="2" fill="#ef4444" />
      <rect x="94" y="74" width="12" height="4" rx="2" fill="#ef4444" />
      <line x1="85" y1="105" x2="115" y2="105" stroke="#cbd5e1" strokeWidth="1.5" />
      <circle cx="50" cy="60" r="4" fill="#fecaca" />
      <circle cx="150" cy="60" r="3" fill="#fecaca" />
      <circle cx="45" cy="100" r="3" fill="#fecaca" />
      <circle cx="155" cy="100" r="4" fill="#fecaca" />
      <text x="100" y="138" textAnchor="middle" fill="#dc2626" fontSize="10" fontWeight="500" fontFamily="Inter, sans-serif">Accès refusé</text>
    </svg>
  );
}
