import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Role = 'DRIVER' | 'ADMIN' | 'TECHNICIAN';

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>(() => {
    try {
      const stored = localStorage.getItem('nova_role');
      if (stored === 'DRIVER' || stored === 'ADMIN' || stored === 'TECHNICIAN') {
        return stored;
      }
    } catch(e) {}
    return 'DRIVER';
  });

  useEffect(() => {
    localStorage.setItem('nova_role', role);
  }, [role]);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
