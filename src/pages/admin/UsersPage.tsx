import { useState } from 'react';
import { Ban, Edit2, Key, MoreVertical, Search, UserCheck, UserPlus, Users, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../lib/utils';

interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Technician' | 'Driver';
  status: 'ACTIVE' | 'OFFLINE' | 'SUSPENDED';
  lastSeen: string;
  email: string;
}

const mockUsers: User[] = [
  { id: 'USR-001', name: 'Alex Kumar', role: 'Technician', status: 'ACTIVE', lastSeen: 'Just now', email: 'alex.k@nova.fleet' },
  { id: 'USR-002', name: 'Sarah Jenkins', role: 'Admin', status: 'ACTIVE', lastSeen: 'Just now', email: 's.jenkins@nova.fleet' },
  { id: 'USR-003', name: 'David Chen', role: 'Driver', status: 'OFFLINE', lastSeen: '2 hours ago', email: 'd.chen@nova.fleet' },
  { id: 'USR-004', name: 'Maria Garcia', role: 'Driver', status: 'ACTIVE', lastSeen: '15 mins ago', email: 'm.garcia@nova.fleet' },
  { id: 'USR-005', name: 'James Wilson', role: 'Technician', status: 'SUSPENDED', lastSeen: '3 days ago', email: 'j.wilson@nova.fleet' },
  { id: 'USR-006', name: 'Priya Patel', role: 'Driver', status: 'OFFLINE', lastSeen: '1 day ago', email: 'p.patel@nova.fleet' },
];

export const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: 'SUSPEND' | 'RESET' | null; user: User | null }>({ isOpen: false, type: null, user: null });

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    setIsAddingUser(true);
    setTimeout(() => {
      const newUser: User = {
        id: `USR-00${users.length + 1}`,
        name: 'New Operator',
        role: 'Driver',
        status: 'ACTIVE',
        lastSeen: 'Just now',
        email: `operator${users.length + 1}@nova.fleet`
      };
      setUsers([newUser, ...users]);
      setIsAddingUser(false);
      addToast('success', 'New user added successfully.');
    }, 1500);
  };

  const handleAction = (action: string, user: User) => {
    setActiveMenuId(null);
    if (action === 'SUSPEND' || action === 'RESET') {
      setModalState({ isOpen: true, type: action as 'SUSPEND' | 'RESET', user });
    } else if (action === 'EDIT') {
      addToast('info', `Opening role editor for ${user.name}...`);
    } else if (action === 'VIEW') {
      addToast('info', `Viewing profile for ${user.name}...`);
    }
  };

  const confirmAction = () => {
    if (!modalState.user || !modalState.type) return;
    
    if (modalState.type === 'SUSPEND') {
      setUsers(users.map(u => u.id === modalState.user!.id ? { ...u, status: 'SUSPENDED' as const } : u));
      addToast('critical', `User ${modalState.user.name} suspended.`);
    } else if (modalState.type === 'RESET') {
      addToast('success', `Password reset link sent to ${modalState.user.email}.`);
    }
    setModalState({ isOpen: false, type: null, user: null });
  };

  const activeCount = users.filter(u => u.status === 'ACTIVE').length;
  const pendingCount = users.filter(u => u.status === 'OFFLINE').length; // using offline as proxy for pending for mock
  const adminCount = users.filter(u => u.role === 'Admin').length;

  return (
    <div className="w-full h-full bg-[#080A0D] p-6 lg:p-8 text-primary overflow-y-auto hide-scrollbar flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-light tracking-widest text-white uppercase flex items-center gap-3">
              <Users className="w-8 h-8 text-accent" />
              Fleet Personnel
            </h1>
            <p className="text-sm text-primary-muted mt-2 tracking-wide">NOVA Fleet Operations · User Management</p>
          </div>

          <div className="flex gap-4">
            <div className="glass-panel px-6 py-3 rounded-xl border border-border flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] font-bold tracking-widest text-primary-muted mb-1 uppercase">Active</span>
              <span className="text-2xl font-light tracking-tight text-white">{activeCount}</span>
            </div>
            <div className="glass-panel px-6 py-3 rounded-xl border border-border flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] font-bold tracking-widest text-amber-500 mb-1 uppercase">Pending</span>
              <span className="text-2xl font-light tracking-tight text-white">{pendingCount}</span>
            </div>
            <div className="glass-panel px-6 py-3 rounded-xl border border-border flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] font-bold tracking-widest text-accent mb-1 uppercase">Admins</span>
              <span className="text-2xl font-light tracking-tight text-white">{adminCount}</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="glass-panel p-4 rounded-2xl border border-border flex justify-between items-center mb-6">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-muted" />
            <input 
              type="text" 
              placeholder="SEARCH USERS..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-border/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-primary-muted/50 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <button 
            onClick={handleAddUser}
            disabled={isAddingUser}
            className="bg-accent text-black px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase flex items-center gap-2 hover:bg-[#33dbff] transition-colors shadow-[0_0_15px_rgba(0,210,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Add User
          </button>
        </div>

        {/* Users Table */}
        <div className="glass-panel-elevated rounded-2xl border border-border flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-black/40">
            <div className="col-span-4 text-[10px] font-bold tracking-widest text-primary-muted uppercase">User</div>
            <div className="col-span-3 text-[10px] font-bold tracking-widest text-primary-muted uppercase">Role</div>
            <div className="col-span-2 text-[10px] font-bold tracking-widest text-primary-muted uppercase">Status</div>
            <div className="col-span-2 text-[10px] font-bold tracking-widest text-primary-muted uppercase">Last Seen</div>
            <div className="col-span-1 text-right text-[10px] font-bold tracking-widest text-primary-muted uppercase">Actions</div>
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {filteredUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-12 gap-4 p-4 border-b border-border/30 items-center hover:bg-surface/50 transition-colors relative">
                
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-accent font-bold text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{user.name}</div>
                    <div className="text-xs text-primary-muted font-mono">{user.email}</div>
                  </div>
                </div>

                <div className="col-span-3">
                  <Badge variant={user.role === 'Admin' ? 'UPDATING' : user.role === 'Technician' ? 'WARNING' : 'OFFLINE'}>
                    {user.role}
                  </Badge>
                </div>

                <div className="col-span-2">
                  <Badge variant={user.status} dot>
                    {user.status}
                  </Badge>
                </div>

                <div className="col-span-2 text-xs text-primary-muted">
                  {user.lastSeen}
                </div>

                <div className="col-span-1 flex justify-end">
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === user.id ? null : user.id)}
                    className="p-1.5 text-primary-muted hover:text-white rounded hover:bg-surface-elevated transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {activeMenuId === user.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                      <div className="absolute right-8 top-8 w-48 bg-[#0a0d11] border border-border rounded-xl shadow-2xl z-20 py-2 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => handleAction('VIEW', user)} className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-primary hover:bg-surface hover:text-white transition-colors text-left w-full"><UserCheck className="w-4 h-4" /> VIEW PROFILE</button>
                        <button onClick={() => handleAction('EDIT', user)} className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-primary hover:bg-surface hover:text-white transition-colors text-left w-full"><Edit2 className="w-4 h-4" /> EDIT ROLE</button>
                        <div className="h-px bg-border/50 my-1 w-full" />
                        <button onClick={() => handleAction('RESET', user)} className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-primary hover:bg-surface hover:text-white transition-colors text-left w-full"><Key className="w-4 h-4" /> RESET ACCESS</button>
                        {user.status !== 'SUSPENDED' && (
                          <button onClick={() => handleAction('SUSPEND', user)} className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors text-left w-full"><Ban className="w-4 h-4" /> SUSPEND USER</button>
                        )}
                      </div>
                    </>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

      <Modal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, type: null, user: null })}
        title={modalState.type === 'SUSPEND' ? 'Confirm Suspension' : 'Reset Access'}
        destructive={modalState.type === 'SUSPEND'}
        actions={
          <>
            <button 
              onClick={() => setModalState({ isOpen: false, type: null, user: null })}
              className="px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase text-primary-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmAction}
              className={cn(
                "px-6 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-colors shadow-lg",
                modalState.type === 'SUSPEND' 
                  ? "bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20"
                  : "bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20"
              )}
            >
              {modalState.type === 'SUSPEND' ? 'Suspend User' : 'Send Reset Link'}
            </button>
          </>
        }
      >
        {modalState.type === 'SUSPEND' ? (
          <p>
            Are you sure you want to suspend <span className="text-white font-bold">{modalState.user?.name}</span>? 
            They will immediately lose access to all NOVA fleet control systems and active sessions will be terminated.
          </p>
        ) : (
          <p>
            Are you sure you want to reset access for <span className="text-white font-bold">{modalState.user?.name}</span>? 
            A password reset link will be sent to <span className="text-white font-mono">{modalState.user?.email}</span>.
          </p>
        )}
      </Modal>
    </div>
  );
};
