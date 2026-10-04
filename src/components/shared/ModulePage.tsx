import { Activity, AlertTriangle, Battery, ShieldCheck, Zap, Database, Cpu, Wifi } from 'lucide-react';

interface ModulePageProps {
  title: string;
}

export const ModulePage = ({ title }: ModulePageProps) => {
  const getCards = () => {
    switch (title.toLowerCase()) {
      case 'vehicle':
        return [
          { label: 'Powertrain Status', value: 'NOMINAL', icon: Battery, color: 'text-green-500' },
          { label: 'Battery Degradation', value: '2.1%', icon: Zap, color: 'text-primary' },
          { label: 'Tire Pressure (Avg)', value: '34 PSI', icon: Activity, color: 'text-primary' },
          { label: 'Active Faults', value: '0', icon: ShieldCheck, color: 'text-green-500' }
        ];
      case 'trips':
        return [
          { label: 'Total Distance', value: '14,204 km', icon: Activity, color: 'text-primary' },
          { label: 'Avg Efficiency', value: '14.2 kWh/100km', icon: Zap, color: 'text-green-500' },
          { label: 'Autonomous Miles', value: '12,040 km', icon: Cpu, color: 'text-accent' },
          { label: 'Recent Interventions', value: '2', icon: AlertTriangle, color: 'text-amber-500' }
        ];
      case 'alerts':
      case 'issues':
        return [
          { label: 'Critical Alerts', value: '0', icon: ShieldCheck, color: 'text-green-500' },
          { label: 'Warnings', value: '3', icon: AlertTriangle, color: 'text-amber-500' },
          { label: 'Sensors Offline', value: '0', icon: Database, color: 'text-primary' },
          { label: 'Network Stability', value: '99.9%', icon: Wifi, color: 'text-accent' }
        ];
      case 'system':
      case 'software':
      case 'diagnostics':
      case 'tests':
      case 'maintenance':
        return [
          { label: 'System Load', value: '42%', icon: Cpu, color: 'text-primary' },
          { label: 'Memory Usage', value: '14.2 GB', icon: Database, color: 'text-primary' },
          { label: 'Last OTA Update', value: '2d ago', icon: Activity, color: 'text-accent' },
          { label: 'Compute Nodes', value: '4/4 ONLINE', icon: ShieldCheck, color: 'text-green-500' }
        ];
      case 'users':
        return [
          { label: 'Active Drivers', value: '42', icon: Activity, color: 'text-primary' },
          { label: 'Pending Approvals', value: '3', icon: AlertTriangle, color: 'text-amber-500' },
          { label: 'System Admins', value: '4', icon: ShieldCheck, color: 'text-accent' },
          { label: 'Authentication', value: 'SECURE', icon: Database, color: 'text-green-500' }
        ];
      default:
        return [
          { label: 'Module Status', value: 'ONLINE', icon: Activity, color: 'text-green-500' },
          { label: 'Data Sync', value: 'ACTIVE', icon: Wifi, color: 'text-accent' }
        ];
    }
  };

  const cards = getCards();

  return (
    <div className="w-full h-full bg-[#080A0D] p-8 text-primary overflow-y-auto hide-scrollbar">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-light tracking-widest mb-8 text-white uppercase">{title}</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="glass-panel-elevated p-6 rounded-2xl border border-border flex flex-col justify-between h-32 hover:border-accent/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="text-xs font-bold tracking-widest text-primary-muted uppercase">{card.label}</div>
                  <Icon className={"w-5 h-5 " + card.color} />
                </div>
                <div className="text-2xl font-semibold mt-4 tracking-tight">{card.value}</div>
              </div>
            );
          })}
        </div>

        <div className="glass-panel rounded-2xl border border-border p-6 h-96 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,210,255,0.05)_0%,transparent_70%)] pointer-events-none" />
          <Activity className="w-16 h-16 text-primary-muted/20 mb-4 animate-pulse" />
          <div className="text-lg font-light tracking-widest text-primary-muted uppercase mb-2">Detailed view unavailable</div>
          <p className="text-xs text-primary-muted/50 text-center max-w-sm">
            The telemetry visualization for {title.toLowerCase()} is currently operating in headless mode. 
            Detailed charts and real-time logs will be available in the next core software update.
          </p>
        </div>
      </div>
    </div>
  );
};
