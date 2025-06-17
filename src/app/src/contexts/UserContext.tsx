import React, { type ReactNode } from 'react';
import { useUserStore } from '@app/stores/userStore';
import { UserContext } from './UserContextDef';

export function UserProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUserStore();

  return (
    <UserContext.Provider
      value={{
        email: user?.email || null,
        setEmail: () => {}, // This is now handled by Supabase auth
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
