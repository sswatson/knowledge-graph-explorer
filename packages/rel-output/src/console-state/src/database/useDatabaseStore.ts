import { useEffect } from 'react';

import { useRootStore } from '../provider';
import useReload from '../utils/useReload';

export function useDatabaseListStore(accountId: string) {
  const rootStore = useRootStore();
  const databaseListStore = rootStore.getDatabaseListStore(accountId);

  useEffect(() => {
    databaseListStore.loadDatabases();
  }, [accountId, databaseListStore]);

  useReload(() => databaseListStore.loadDatabases(), [
    accountId,
    databaseListStore,
  ]);

  return databaseListStore;
}

export function useDatabaseStore(accountId: string, databaseId: string) {
  const rootStore = useRootStore();
  const databaseListStore = rootStore.getDatabaseListStore(accountId);
  const databaseStore = databaseListStore.getDatabaseStore(databaseId);

  useEffect(() => {
    databaseListStore.commitTempStores();
  }, [accountId, databaseId, databaseListStore]);

  return databaseStore;
}
