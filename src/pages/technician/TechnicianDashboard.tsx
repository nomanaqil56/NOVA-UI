import { useState } from 'react';
import { Terminal, ShieldAlert, CheckSquare, Wrench } from 'lucide-react';
import { cn } from '../../lib/utils';

export const TechnicianDashboard = () => {
  const [consoleOutput, setConsoleOutput] = useState([
    { text: 'SYSTEM: ONLINE', type: 'info' },
    { text: 'Waiting for commands...', type: 'muted' }
  ]);
  const [cmd, setCmd] = useState('');

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && cmd.trim()) {
      setConsoleOutput(prev => [...prev, { text: `> ${cmd}`, type: 'cmd' }]);
      
      const response = executeMockCommand(cmd);
      setTimeout(() => {
        setConsoleOutput(prev => [...prev, ...response]);
      }, 400);
      
      setCmd('');
    }
  };

  const executeMockCommand = (command: string) => {
    const c = command.toLowerCase().trim();
    if (c === 'system.status') return [{ text: 'SYSTEM: ONLINE, ALL SUBMODULES NOMINAL', type: 'success' }];
    if (c === 'sensors.check') return [{ text: '12/12 SENSOR MODULES ONLINE', type: 'success' }];
    if (c === 'lidar.scan') return [{ text: 'FRONT_LIDAR: NORMAL, RANGE: 150M', type: 'success' }];
    if (c === 'camera.verify') return [{ text: '8/8 CAMERAS ONLINE, CALIBRATION OK', type: 'success' }];
    if (c === 'clear') {
      setConsoleOutput([]);
      return [];
    }
    return [{ text: `Command not recognized: ${c}`, type: 'error' }];
  };

  return (
    <div className="w-full h-full bg-background p-8 overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">Diagnostic Center</h1>
          <p className="text-primary-muted font-medium">Engineering workstation and troubleshooting</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Diagnostic Terminal */}
        <div className="col-span-2 glass-panel-elevated rounded-2xl p-6 border border-border flex flex-col h-96">
          <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-4">
            <h3 className="text-sm font-bold tracking-widest text-primary-muted flex items-center gap-2">
              <Terminal className="w-4 h-4 text-accent" /> DIAGNOSTIC CONSOLE
            </h3>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-amber-500/50" />
              <div className="w-2 h-2 rounded-full bg-green-500/50" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto font-mono text-sm flex flex-col gap-1 mb-4">
            {consoleOutput.map((line, i) => (
              <div key={i} className={cn(
                "tracking-tight",
                line.type === 'cmd' && 'text-primary font-bold',
                line.type === 'info' && 'text-accent',
                line.type === 'muted' && 'text-primary-muted',
                line.type === 'success' && 'text-green-500',
                line.type === 'error' && 'text-red-500',
              )}>
                {line.text}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono text-sm border-t border-border/50 pt-4">
            <span className="text-accent">{'>'}</span>
            <input 
              type="text" 
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              onKeyDown={handleCommand}
              className="flex-1 bg-transparent outline-none text-primary placeholder:text-primary-muted/30"
              placeholder="Enter diagnostic command (e.g., system.status)..."
            />
          </div>
        </div>

        {/* Issue Tracker */}
        <div className="glass-panel-elevated rounded-2xl p-6 border border-border flex flex-col h-96">
          <h3 className="text-sm font-bold tracking-widest text-primary-muted mb-6 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-accent" /> ACTIVE ISSUES
          </h3>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
            <IssueItem title="Front LiDAR calibration" vehicle="Vehicle #042" severity="HIGH" time="12m ago" />
            <IssueItem title="Camera module sync error" vehicle="Vehicle #018" severity="MEDIUM" time="1h ago" />
            <IssueItem title="Battery thermal variance" vehicle="Vehicle #031" severity="LOW" time="3h ago" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass-panel-elevated rounded-2xl p-6 border border-border">
          <h3 className="text-sm font-bold tracking-widest text-primary-muted mb-6 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-accent" /> SYSTEM TESTING
          </h3>
          <div className="flex flex-col gap-4">
            <TestItem name="Full Vehicle Diagnostic" status="READY" />
            <TestItem name="Sensor Integrity Check" status="RUNNING" progress={82} />
            <TestItem name="Brake System Test" status="PASSED" />
          </div>
        </div>

        <div className="glass-panel-elevated rounded-2xl p-6 border border-border">
          <h3 className="text-sm font-bold tracking-widest text-primary-muted mb-6 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-accent" /> MAINTENANCE HISTORY
          </h3>
          <div className="relative border-l border-border ml-2 pl-4 py-2 flex flex-col gap-6 text-sm">
            <TimelineItem date="02 OCT 2026" time="14:32" desc="LiDAR calibration performed" tech="Alex Kumar" result="SUCCESS" />
            <TimelineItem date="01 OCT 2026" time="09:18" desc="Camera diagnostic executed" result="2 anomalies detected" warning />
          </div>
        </div>
      </div>

    </div>
  );
};

const IssueItem = ({ title, vehicle, severity, time }: any) => {
  const colors = {
    HIGH: 'text-red-500 border-red-500/30',
    MEDIUM: 'text-amber-500 border-amber-500/30',
    LOW: 'text-primary-muted border-border',
  };
  return (
    <div className="p-4 rounded-xl border border-border bg-surface hover:bg-surface-elevated transition-colors cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <span className="font-medium">{title}</span>
        <span className={cn("text-[10px] px-2 py-0.5 rounded border font-bold", colors[severity as keyof typeof colors])}>{severity}</span>
      </div>
      <div className="flex justify-between text-xs text-primary-muted">
        <span>{vehicle}</span>
        <span>{time}</span>
      </div>
    </div>
  );
};

const TestItem = ({ name, status, progress }: any) => {
  return (
    <div className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="font-medium text-sm">{name}</span>
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded font-bold tracking-wider",
          status === 'READY' && 'bg-surface-elevated text-primary-muted border border-border',
          status === 'RUNNING' && 'bg-accent/10 text-accent border border-accent/30 animate-pulse',
          status === 'PASSED' && 'bg-green-500/10 text-green-500 border border-green-500/30'
        )}>{status}</span>
      </div>
      {status === 'RUNNING' && progress && (
        <div className="w-full h-1 bg-surface-elevated rounded-full overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};

const TimelineItem = ({ date, time, desc, tech, result, warning }: any) => (
  <div className="relative">
    <div className={cn("absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-background", warning ? "bg-amber-500" : "bg-accent")} />
    <div className="flex gap-4">
      <div className="w-24 flex flex-col flex-shrink-0">
        <span className="text-xs font-bold text-primary-muted">{date}</span>
        <span className="text-xs text-primary-muted/70">{time}</span>
      </div>
      <div>
        <p className="font-medium text-primary text-sm mb-1">{desc}</p>
        {tech && <p className="text-xs text-primary-muted">Technician: {tech}</p>}
        <p className={cn("text-xs mt-1 font-semibold", warning ? "text-amber-500" : "text-green-500")}>Result: {result}</p>
      </div>
    </div>
  </div>
);
