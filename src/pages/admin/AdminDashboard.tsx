import { Users, Server, AlertCircle, RefreshCw, Cpu, Activity, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../../lib/utils';

const performanceData = Array.from({ length: 20 }).map((_, i) => ({
  time: i,
  cpu: 30 + Math.random() * 20,
  memory: 50 + Math.random() * 10,
}));

export const AdminDashboard = () => {
  return (
    <div className="w-full h-full bg-background p-8 overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">Fleet Overview</h1>
          <p className="text-primary-muted font-medium">System-wide control and monitoring</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-elevated px-4 py-2 rounded-xl border border-border">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-bold tracking-widest text-primary-muted">SYSTEM HEALTH 98.7%</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard title="Vehicles Online" value="42 / 47" icon={Server} trend="+2" />
        <StatCard title="Active Users" value="1,284" icon={Users} trend="+12%" />
        <StatCard title="Critical Alerts" value="3" icon={AlertCircle} alert />
        <StatCard title="Software Ver." value="v4.8.2" icon={RefreshCw} action="UPDATE AVAILABLE" />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 glass-panel-elevated rounded-2xl p-6 border border-border">
          <h3 className="text-sm font-bold tracking-widest text-primary-muted mb-6 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> SYSTEM PERFORMANCE
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D2FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00D2FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151920', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px' }}
                  itemStyle={{ color: '#F4F6F8' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#00D2FF" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel-elevated rounded-2xl p-6 border border-border flex flex-col">
          <h3 className="text-sm font-bold tracking-widest text-primary-muted mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4" /> RECENT ALERTS
          </h3>
          <div className="flex-1 flex flex-col gap-4">
            <AlertItem type="CRITICAL" time="12m ago" text="Vehicle #042 lost connection." />
            <AlertItem type="WARNING" time="1h ago" text="Software deployment delayed on Zone B." />
            <AlertItem type="INFO" time="2h ago" text="Vehicle #017 successfully updated." />
          </div>
        </div>
      </div>

      <div className="glass-panel-elevated rounded-2xl p-6 border border-border">
        <h3 className="text-sm font-bold tracking-widest text-primary-muted mb-6">USER MANAGEMENT</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-primary-muted border-b border-border">
              <th className="pb-3 font-medium">User</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <UserRow name="Dr. Alex Kumar" email="alex@nova.sys" role="Technician" status="Active" />
            <UserRow name="Sarah Jenkins" email="sarah@nova.sys" role="Administrator" status="Active" />
            <UserRow name="David Chen" email="david@nova.sys" role="Driver" status="Offline" />
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, alert, action }: any) => (
  <div className={cn("glass-panel-elevated rounded-2xl p-5 border", alert ? "border-red-500/50" : "border-border")}>
    <div className="flex justify-between items-start mb-4 text-primary-muted">
      <span className="text-[10px] font-bold uppercase tracking-wider">{title}</span>
      <Icon className={cn("w-5 h-5", alert ? "text-red-500" : "text-accent")} />
    </div>
    <div className="text-3xl font-light">{value}</div>
    {trend && <div className="text-xs mt-2 text-green-500">{trend} this week</div>}
    {action && <div className="text-xs mt-2 text-accent font-semibold flex items-center gap-1 cursor-pointer">{action} <ArrowUpRight className="w-3 h-3"/></div>}
  </div>
);

const AlertItem = ({ type, time, text }: any) => {
  const colors = {
    CRITICAL: 'text-red-500 bg-red-500/10 border-red-500/20',
    WARNING: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    INFO: 'text-accent bg-accent/10 border-accent/20',
  };
  
  return (
    <div className="flex gap-3 text-sm">
      <div className={cn("px-2 py-1 rounded text-[10px] font-bold tracking-wider h-fit border", colors[type as keyof typeof colors])}>
        {type}
      </div>
      <div>
        <p className="text-primary font-medium">{text}</p>
        <p className="text-xs text-primary-muted mt-1">{time}</p>
      </div>
    </div>
  );
};

const UserRow = ({ name, email, role, status }: any) => (
  <tr className="border-b border-border/50 hover:bg-surface/50 transition-colors">
    <td className="py-4">
      <div className="font-medium text-primary">{name}</div>
      <div className="text-xs text-primary-muted">{email}</div>
    </td>
    <td className="py-4"><span className="px-3 py-1 bg-surface rounded-full text-xs text-primary-muted border border-border">{role}</span></td>
    <td className="py-4">
      <div className="flex items-center gap-2">
        <div className={cn("w-1.5 h-1.5 rounded-full", status === 'Active' ? 'bg-green-500' : 'bg-primary-muted')} />
        <span className="text-xs text-primary-muted">{status}</span>
      </div>
    </td>
    <td className="py-4 text-right">
      <button className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors">Manage</button>
    </td>
  </tr>
);
