import { cn } from '../../lib/utils';
import type { ReactNode } from 'react';

type BadgeVariant = 
  | 'HEALTHY' | 'NOMINAL' | 'ACTIVE' | 'SUCCESS' // Green
  | 'WARNING' | 'DEGRADED'                     // Amber
  | 'CRITICAL' | 'FAILED'                      // Red
  | 'OFFLINE' | 'MAINTENANCE'                  // Gray/Muted
  | 'UPDATING' | 'INFO';                       // Cyan/Accent

interface BadgeProps {
  variant: BadgeVariant | string;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge = ({ variant, children, className, dot }: BadgeProps) => {
  const getStyles = () => {
    const v = variant.toUpperCase();
    if (['HEALTHY', 'NOMINAL', 'ACTIVE', 'SUCCESS'].includes(v)) {
      return 'text-green-500 bg-green-500/10 border-green-500/30';
    }
    if (['WARNING', 'DEGRADED'].includes(v)) {
      return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    }
    if (['CRITICAL', 'FAILED'].includes(v)) {
      return 'text-red-500 bg-red-500/10 border-red-500/30';
    }
    if (['UPDATING', 'INFO'].includes(v)) {
      return 'text-accent bg-accent/10 border-accent/30';
    }
    // Default (OFFLINE, MAINTENANCE, etc)
    return 'text-primary-muted bg-surface border-border';
  };

  const getDotColor = () => {
    const v = variant.toUpperCase();
    if (['HEALTHY', 'NOMINAL', 'ACTIVE', 'SUCCESS'].includes(v)) return 'bg-green-500';
    if (['WARNING', 'DEGRADED'].includes(v)) return 'bg-amber-500';
    if (['CRITICAL', 'FAILED'].includes(v)) return 'bg-red-500';
    if (['UPDATING', 'INFO'].includes(v)) return 'bg-accent';
    return 'bg-primary-muted';
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border", getStyles(), className)}>
      {dot && <div className={cn("w-1.5 h-1.5 rounded-full", getDotColor())} />}
      {children}
    </span>
  );
};
