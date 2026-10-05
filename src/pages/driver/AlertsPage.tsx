import { useState, useMemo } from 'react';
import { AlertCircle, AlertTriangle, Bell, CheckCircle2, Filter, ShieldAlert, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';

type Severity = 'CRITICAL' | 'WARNING' | 'INFO';
type Category = 'Vehicle' | 'Sensor' | 'Navigation' | 'Safety' | 'System';

interface Alert {
  id: string;
  severity: Severity;
  category: Category;
  title: string;
  message: string;
  timestamp: string;
  details?: Record<string, string>;
}

const mockAlerts: Alert[] = [
  {
    id: 'ALT-9281',
    severity: 'WARNING',
    category: 'Sensor',
    title: 'Front LiDAR calibration required',
    message: 'Sensor return variance exceeds nominal limits. Recalibration recommended before autonomous operation in heavy rain.',
    timestamp: '12 minutes ago',
    details: {
      'Vehicle': '#042',
      'Sensor ID': 'F-LIDAR-01',
      'Variance': '4.2%'
    }
  },
  {
    id: 'ALT-9280',
    severity: 'WARNING',
    category: 'Navigation',
    title: 'GPS accuracy degraded',
    message: 'Satellite lock reduced due to atmospheric conditions or urban canyon effect.',
    timestamp: '28 minutes ago',
    details: {
      'Accuracy': '±103m',
      'Satellites': '4 / 12'
    }
  },
  {
    id: 'ALT-9279',
    severity: 'WARNING',
    category: 'System',
    title: 'OTA update downloaded',
    message: 'NOVA OS v4.2.1 is ready for installation. Requires vehicle to be parked.',
    timestamp: '1 hour ago',
    details: {
      'Size': '1.4 GB',
      'Est. Time': '15 mins'
    }
  },
  {
    id: 'ALT-9278',
    severity: 'INFO',
    category: 'System',
    title: 'Autonomous system initialized',
    message: 'All core autonomous subsystems booted and passed pre-flight checks.',
    timestamp: 'Today 14:02'
  },
  {
    id: 'ALT-9277',
    severity: 'INFO',
    category: 'Vehicle',
    title: 'Charging complete',
    message: 'Battery reached 100% capacity.',
    timestamp: 'Today 06:00',
    details: {
      'Range added': '314 km',
      'Cost': '₹240'
    }
  },
  {
    id: 'ALT-9276',
    severity: 'INFO',
    category: 'Safety',
    title: 'Cabin pre-conditioning complete',
    message: 'Target temperature 22°C reached.',
    timestamp: 'Today 08:15'
  }
];

const CATEGORIES: Category[] = ['Vehicle', 'Sensor', 'Navigation', 'Safety', 'System'];

export const AlertsPage = () => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | Severity>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | Category>('ALL');
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const { addToast } = useToast();

  const handleAcknowledge = (id: string, title: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    addToast('success', `Alert acknowledged: ${title}`);
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (severityFilter !== 'ALL' && alert.severity !== severityFilter) return false;
      if (categoryFilter !== 'ALL' && alert.category !== categoryFilter) return false;
      return true;
    });
  }, [severityFilter, categoryFilter]);

  const counts = useMemo(() => {
    return {
      CRITICAL: alerts.filter(a => a.severity === 'CRITICAL').length,
      WARNING: alerts.filter(a => a.severity === 'WARNING').length,
      INFO: alerts.filter(a => a.severity === 'INFO').length,
    };
  }, [alerts]);

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case 'CRITICAL': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'INFO': return <CheckCircle2 className="w-5 h-5 text-accent" />; // Using check for info to match user example
    }
  };

  return (
    <div className="w-full h-full bg-[#080A0D] p-6 lg:p-8 text-primary overflow-y-auto hide-scrollbar flex flex-col">
      <div className="max-w-5xl mx-auto w-full flex flex-col h-full min-h-0">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-white uppercase flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-accent" />
              Vehicle Safety & Alert Center
            </h1>
            <p className="text-sm text-primary-muted mt-2 tracking-wide">NOVA Autonomous Fleet · Real-time Telemetry Events</p>
          </div>

          {/* Aggregate Counters */}
          <div className="flex gap-4">
            <div className="glass-panel px-6 py-3 rounded-xl border border-border flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] font-bold tracking-widest text-red-500 mb-1 uppercase">Critical</span>
              <span className="text-2xl font-light tracking-tight text-white">{counts.CRITICAL}</span>
            </div>
            <div className="glass-panel px-6 py-3 rounded-xl border border-border flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] font-bold tracking-widest text-amber-500 mb-1 uppercase">Warning</span>
              <span className="text-2xl font-light tracking-tight text-white">{counts.WARNING}</span>
            </div>
            <div className="glass-panel px-6 py-3 rounded-xl border border-border flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] font-bold tracking-widest text-accent mb-1 uppercase">Info</span>
              <span className="text-2xl font-light tracking-tight text-white">{counts.INFO}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel p-4 rounded-2xl border border-border flex flex-col gap-4 mb-6 flex-shrink-0">
          
          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary-muted mx-2" />
            <div className="flex bg-black/40 p-1 rounded-lg border border-border/50">
              {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-xs font-bold tracking-widest uppercase transition-colors",
                    severityFilter === sev 
                      ? "bg-surface-elevated text-white shadow-sm" 
                      : "text-primary-muted hover:text-primary"
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border/50 w-full" />

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2 px-2">
            <span className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mr-2">Category:</span>
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-colors",
                categoryFilter === 'ALL'
                  ? "bg-primary text-black border-primary"
                  : "bg-transparent text-primary-muted border-border hover:border-primary-muted"
              )}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border transition-colors",
                  categoryFilter === cat
                    ? "bg-primary text-black border-primary"
                    : "bg-transparent text-primary-muted border-border hover:border-primary-muted"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 min-h-0 pb-12">
          {filteredAlerts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <Bell className="w-12 h-12 mb-4 text-primary-muted" />
              <div className="text-sm font-medium text-primary-muted uppercase tracking-widest">No alerts matching filters</div>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div key={alert.id} className="glass-panel-elevated p-6 rounded-2xl border border-border group hover:border-border/80 transition-colors">
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(alert.severity)}
                    <Badge variant={alert.severity}>
                      {alert.category}
                    </Badge>
                    <span className="text-xs font-mono text-primary-muted opacity-50">{alert.id}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs font-medium text-primary-muted whitespace-nowrap">
                      {alert.timestamp}
                    </div>
                    <button 
                      onClick={() => handleAcknowledge(alert.id, alert.title)}
                      className="text-xs font-bold text-accent hover:text-[#33dbff] transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                    >
                      <Check className="w-4 h-4" /> ACKNOWLEDGE
                    </button>
                  </div>
                </div>

                {/* Alert Content */}
                <div className="ml-8">
                  <h3 className="text-xl font-medium text-white tracking-tight mb-2">{alert.title}</h3>
                  <p className="text-sm text-primary-muted leading-relaxed mb-4 max-w-3xl">
                    {alert.message}
                  </p>

                  {/* Details Grid */}
                  {alert.details && Object.keys(alert.details).length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/30">
                      {Object.entries(alert.details).map(([key, value]) => (
                        <div key={key} className="bg-black/30 px-3 py-1.5 rounded-lg border border-border/30 flex items-baseline gap-2">
                          <span className="text-[10px] font-bold tracking-wider text-primary-muted uppercase">{key}:</span>
                          <span className="text-sm font-mono text-primary/90">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
