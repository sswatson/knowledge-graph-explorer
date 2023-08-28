import { useEffect } from 'react';

import { useRootStore } from '../provider';

export function useRoleListStore(accountId: string) {
  const rootStore = useRootStore();
  const roleListStore = rootStore.getRoleListStore(accountId);

  useEffect(() => {
    roleListStore.loadRoles();
  }, [accountId, roleListStore]);

  return roleListStore;
}
