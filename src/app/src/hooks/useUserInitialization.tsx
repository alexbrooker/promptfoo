import { useEffect } from 'react';
import { useUserStore } from '@app/stores/userStore';

export function useUserInitialization() {
  const { fetchUser } = useUserStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
}