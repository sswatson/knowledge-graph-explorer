import { useEffect } from 'react';

import { useRootStore } from '../provider';

export function usePermissionListStore(accountId: string) {
  const rootStore = useRootStore();
  const permissionListStore = rootStore.getPermissionListStore(accountId);

  useEffect(() => {
    permissionListStore.loadPermissionList();
  }, [accountId, permissionListStore]);

  return permissionListStore;
}
