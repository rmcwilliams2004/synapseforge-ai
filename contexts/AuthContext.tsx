import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Mocking the user state for the Forge Environment
  const [user, setUser] = useState<User | null>({
    id: 'richard-ultra',
    name: 'Richard McWilliams',
    role: 'admin',
    forgeCredits: 1000, // Starting balance for the Operator
  } as User);

  const updateProfile = (updates: Partial<User>) => {
    if (user) setUser({ ...user, ...updates });
  };

  return (
    <AuthContext.Provider value={{ user, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
