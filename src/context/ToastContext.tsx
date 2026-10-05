import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'info' | 'warning' | 'critical';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          let Icon = Info;
          let colorClass = 'text-accent bg-accent/10 border-accent/30';
          
          if (toast.type === 'success') {
            Icon = CheckCircle2;
            colorClass = 'text-green-500 bg-green-500/10 border-green-500/30';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            colorClass = 'text-amber-500 bg-amber-500/10 border-amber-500/30';
          } else if (toast.type === 'critical') {
            Icon = AlertCircle;
            colorClass = 'text-red-500 bg-red-500/10 border-red-500/30';
          }

          return (
            <div 
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-right-8 fade-in duration-300",
                colorClass
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium pr-6">{toast.message}</p>
              <button 
                onClick={() => removeToast(toast.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-black/20 rounded-md transition-colors"
              >
                <X className="w-4 h-4 opacity-50 hover:opacity-100" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
