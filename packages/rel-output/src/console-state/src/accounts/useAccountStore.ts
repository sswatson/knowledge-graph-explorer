import { useEffect } from 'react';

import { useRootStore } from '../provider';
import useReload from '../utils/useReload';

export function useAccountListStore(accountId: string) {
  const rootStore = useRootStore();
  const accountListStore = rootStore.getAccountListStore(accountId);

  useEffect(() => {
    accountListStore.loadAccountList();
  }, [accountId, accountListStore]);

  return accountListStore;
}

export function useAccountDetailsStore(
  accountId: string,
  accountDetailsId: string,
  accountName: string,
) {
  const rootStore = useRootStore();
  const accountListStore = rootStore.getAccountListStore(accountId);

  const accountDetailsStore =
    accountDetailsId !== 'new'
      ? accountListStore.getAccountDetailsStore(accountDetailsId, accountName)
      : undefined;

  // do we need useReload?
  useReload(() => accountDetailsStore?.loadAccountDetails(), [
    accountDetailsStore,
  ]);

  useEffect(() => {
    accountDetailsStore?.loadAccountDetails();
  }, [accountDetailsStore]);

  return accountDetailsStore;
}
