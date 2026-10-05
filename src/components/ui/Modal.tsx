import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  destructive?: boolean;
}

export const Modal = ({ isOpen, onClose, title, children, actions, destructive }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#080A0D]/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className={cn(
        "relative w-full max-w-md bg-[#0a0d11] rounded-2xl border shadow-2xl flex flex-col animate-in zoom-in-95 fade-in duration-200",
        destructive ? "border-red-500/30 shadow-[0_0_40px_rgba(255,59,48,0.1)]" : "border-border shadow-[0_0_40px_rgba(0,210,255,0.05)]"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h3 className={cn("text-lg font-light tracking-widest uppercase", destructive ? "text-red-500" : "text-white")}>
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-primary-muted hover:text-white rounded-md hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-sm text-primary leading-relaxed">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex justify-end gap-3 p-5 border-t border-border/50 bg-black/40 rounded-b-2xl">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
