import { useEffect } from 'react';

import { useRootStore } from '../provider';

export function useIdProviderListStore(accountId: string) {
  const rootStore = useRootStore();
  const idProviderListStore = rootStore.getIdProviderListStore(accountId);

  useEffect(() => {
    idProviderListStore.loadIdProviderList();
  }, [accountId, idProviderListStore]);

  return idProviderListStore;
}
