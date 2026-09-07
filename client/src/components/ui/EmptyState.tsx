import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4 sm:px-6 text-center">
      <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-slate-100">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs mb-5">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
