import { useEffect } from 'react';

import { useRootStore } from '../provider';
import useReload from '../utils/useReload';

export function useUserListStore(accountId: string) {
  const rootStore = useRootStore();
  const userListStore = rootStore.getUserListStore(accountId);

  useReload(() => userListStore.loadUsers(), [userListStore]);

  useEffect(() => {
    userListStore.loadUsers();
  }, [accountId, userListStore]);

  return userListStore;
}

export function useUserStore(accountId: string, userId: string) {
  const rootStore = useRootStore();
  const userListStore = rootStore.getUserListStore(accountId);
  const userStore =
    userId !== 'new' ? userListStore.getUserStore(userId) : undefined;

  useReload(() => userStore?.loadUser(), [userStore]);

  useEffect(() => {
    userStore?.loadUser();
  }, [userStore]);

  return userStore;
}
