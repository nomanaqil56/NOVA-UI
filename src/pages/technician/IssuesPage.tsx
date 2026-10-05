import { useState } from 'react';
import { AlertCircle, AlertTriangle, Clock, MapPin, MessageSquare, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';

type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

interface Issue {
  id: string;
  title: string;
  severity: Severity;
  vehicle: string;
  time: string;
  status: 'OPEN' | 'IN PROGRESS' | 'RESOLVED';
  description: string;
  assignee?: string;
}

const mockIssues: Issue[] = [
  {
    id: 'ISS-0428',
    title: 'Front LiDAR calibration',
    severity: 'HIGH',
    vehicle: 'Vehicle #042',
    time: '12m ago',
    status: 'OPEN',
    description: 'Variance detected in front-center LiDAR unit exceeding 5% threshold. Needs immediate manual recalibration.'
  },
  {
    id: 'ISS-0427',
    title: 'Camera synchronization',
    severity: 'MEDIUM',
    vehicle: 'Vehicle #018',
    time: '1h ago',
    status: 'IN PROGRESS',
    assignee: 'Alex Kumar',
    description: 'Frame drops observed on left-side wide angle camera. Could impact intersection handling.'
  },
  {
    id: 'ISS-0426',
    title: 'Battery thermal variance',
    severity: 'LOW',
    vehicle: 'Vehicle #031',
    time: '3h ago',
    status: 'OPEN',
    description: 'Cell block 4 showing 2°C higher operating temp than fleet average under load.'
  }
];

export const IssuesPage = () => {
  const [issues, setIssues] = useState<Issue[]>(mockIssues);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(mockIssues[0]);
  const [showResolveModal, setShowResolveModal] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleAssign = (issueId: string) => {
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, assignee: 'Current User', status: 'IN PROGRESS' } : i));
    if (selectedIssue?.id === issueId) {
      setSelectedIssue(prev => prev ? { ...prev, assignee: 'Current User', status: 'IN PROGRESS' } : null);
    }
    addToast('info', 'Issue assigned to you.');
  };

  const confirmResolve = () => {
    if (!showResolveModal) return;
    setIssues(prev => prev.map(i => i.id === showResolveModal ? { ...i, status: 'RESOLVED' } : i));
    if (selectedIssue?.id === showResolveModal) {
      setSelectedIssue(prev => prev ? { ...prev, status: 'RESOLVED' } : null);
    }
    addToast('success', 'Issue marked as resolved.');
    setShowResolveModal(null);
  };

  const getSeverityColor = (sev: Severity) => {
    if (sev === 'HIGH') return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (sev === 'MEDIUM') return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    return 'text-primary-muted bg-surface border-border';
  };

  return (
    <div className="w-full h-full bg-[#080A0D] p-6 lg:p-8 text-primary overflow-y-auto hide-scrollbar flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full min-h-0">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-white uppercase flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-accent" />
              Ticket Management
            </h1>
            <p className="text-sm text-primary-muted mt-2 tracking-wide">NOVA Technician Terminal · Active Fleet Issues</p>
          </div>
          <button className="bg-accent text-black px-6 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-[#33dbff] transition-colors shadow-[0_0_15px_rgba(0,210,255,0.2)]">
            Create Ticket
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* Left Column: Issues List */}
          <div className="lg:col-span-5 h-full flex flex-col">
            <div className="glass-panel rounded-2xl border border-border flex flex-col h-full overflow-hidden">
              <div className="p-5 border-b border-border/50 bg-black/40 flex-shrink-0 flex justify-between items-center">
                <h3 className="text-xs font-bold tracking-widest text-primary-muted uppercase">Active Issues</h3>
                <Badge variant="UPDATING">{issues.filter(i => i.status !== 'RESOLVED').length} OPEN</Badge>
              </div>
              <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-2">
                {issues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all duration-200 group flex flex-col gap-3",
                      selectedIssue?.id === issue.id 
                        ? "bg-accent/10 border-accent/30 shadow-[0_0_15px_rgba(0,210,255,0.05)]" 
                        : "bg-surface border-transparent hover:bg-surface-elevated hover:border-border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={issue.severity === 'HIGH' ? 'CRITICAL' : issue.severity === 'MEDIUM' ? 'WARNING' : 'INFO'}>
                        {issue.severity}
                      </Badge>
                      <span className="text-xs font-mono text-primary-muted opacity-50">{issue.time}</span>
                    </div>
                    
                    <div>
                      <div className={cn("text-base font-medium mb-1", selectedIssue?.id === issue.id ? "text-white" : "text-primary")}>
                        {issue.title}
                      </div>
                      <div className="text-xs font-medium text-primary-muted flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {issue.vehicle}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Issue Details */}
          <div className="lg:col-span-7 h-full flex flex-col gap-6 min-h-0 overflow-y-auto hide-scrollbar">
            {selectedIssue ? (
              <>
                <div className="glass-panel-elevated p-8 rounded-2xl border border-border">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center", getSeverityColor(selectedIssue.severity))}>
                        {selectedIssue.severity === 'HIGH' ? <AlertCircle className="w-6 h-6" /> : selectedIssue.severity === 'MEDIUM' ? <AlertTriangle className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-mono text-primary-muted">{selectedIssue.id}</span>
                          <span className="text-xs font-bold tracking-widest text-primary-muted uppercase flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {selectedIssue.time}</span>
                        </div>
                        <h2 className="text-2xl font-light tracking-tight text-white">{selectedIssue.title}</h2>
                      </div>
                    </div>
                    <Badge variant={selectedIssue.status === 'RESOLVED' ? 'SUCCESS' : selectedIssue.status === 'IN PROGRESS' ? 'UPDATING' : 'WARNING'} dot>
                      {selectedIssue.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/30 p-4 rounded-xl border border-border/50">
                      <div className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-1">Affected Entity</div>
                      <div className="text-white font-medium">{selectedIssue.vehicle}</div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-xl border border-border/50">
                      <div className="text-[10px] font-bold tracking-widest text-primary-muted uppercase mb-1">Assignee</div>
                      <div className="text-white font-medium">{selectedIssue.assignee || 'Unassigned'}</div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h4 className="text-xs font-bold tracking-widest text-primary-muted uppercase mb-3">Description</h4>
                    <p className="text-sm text-primary leading-relaxed bg-surface/50 p-4 rounded-xl border border-border/30">
                      {selectedIssue.description}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleAssign(selectedIssue.id)}
                      disabled={selectedIssue.status === 'RESOLVED' || selectedIssue.assignee === 'Current User'}
                      className="flex-1 bg-accent/10 border border-accent/30 text-accent py-3 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Assign to Me
                    </button>
                    <button 
                      onClick={() => setShowResolveModal(selectedIssue.id)}
                      disabled={selectedIssue.status === 'RESOLVED'}
                      className="flex-1 bg-green-500/10 border border-green-500/30 text-green-500 py-3 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>

                {/* Activity Feed Placeholder */}
                <div className="glass-panel p-6 rounded-2xl border border-border flex-1">
                  <h4 className="text-xs font-bold tracking-widest text-primary-muted uppercase mb-6 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Activity Log
                  </h4>
                  <div className="text-sm text-primary-muted italic text-center py-8">
                    No activity recorded for this ticket yet.
                  </div>
                </div>
              </>
            ) : (
               <div className="flex-1 glass-panel-elevated rounded-2xl border border-border flex flex-col items-center justify-center p-8 text-center opacity-50">
                <ShieldAlert className="w-16 h-16 mb-4 text-primary-muted" />
                <div className="text-sm font-medium text-primary-muted uppercase tracking-widest">Select an issue to view details</div>
              </div>
            )}
          </div>

        </div>
      </div>

      <Modal 
        isOpen={!!showResolveModal}
        onClose={() => setShowResolveModal(null)}
        title="Resolve Ticket"
        actions={
          <>
            <button 
              onClick={() => setShowResolveModal(null)}
              className="px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase text-primary-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmResolve}
              className="px-6 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors shadow-lg bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500/20"
            >
              Mark Resolved
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to mark this issue as resolved? 
          The ticket will be closed and removed from the active queue.
        </p>
      </Modal>
    </div>
  );
};
