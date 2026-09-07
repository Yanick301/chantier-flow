import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import Modal from './Modal';

interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  required?: boolean;
  loading?: boolean;
}

export default function InputDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = '',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  required = true,
  loading = false,
}: InputDialogProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (isOpen) setValue('');
  }, [isOpen]);

  const btnClasses = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col py-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-slate-50">
            <MessageSquare className="text-slate-500" size={20} />
          </div>
          <p className="text-slate-600 text-sm">{message}</p>
        </div>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition-all duration-200 bg-white resize-none text-sm"
          autoFocus
        />
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              if (required && !value.trim()) return;
              onConfirm(value);
            }}
            disabled={loading || (required && !value.trim())}
            className={`flex-1 px-4 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] ${btnClasses[variant]}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Traitement...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
