import { useEffect } from 'react';

import { useRootStore } from '../provider';
import useReload from '../utils/useReload';

export function useClientListStore(accountId: string) {
  const rootStore = useRootStore();
  const clientListStore = rootStore.getClientListStore(accountId);

  useReload(() => clientListStore.loadClients(), [clientListStore]);

  useEffect(() => {
    clientListStore.loadClients();
  }, [accountId, clientListStore]);

  return clientListStore;
}

export function useClientStore(accountId: string, clientId: string) {
  const rootStore = useRootStore();
  const clientListStore = rootStore.getClientListStore(accountId);
  const clientStore =
    clientId !== 'new' ? clientListStore.getClientStore(clientId) : undefined;

  useReload(() => clientStore?.loadClient(), [clientStore]);

  useEffect(() => {
    clientStore?.loadClient(), [clientStore];
  }, [clientStore]);

  return clientStore;
}
