import { useEffect } from 'react';

import { useRootStore } from '../provider';
import useReload from '../utils/useReload';

export function useTransactionListStore(accountId: string) {
  const rootStore = useRootStore();
  const transactionListStore = rootStore.getTransactionListStore(accountId);

  useReload(() => transactionListStore.loadTransactions(), [
    transactionListStore,
  ]);

  return transactionListStore;
}

export function useTransactionStore(accountId: string, txnId: string) {
  const rootStore = useRootStore();
  const transactionStore = rootStore.getTransactionStore(accountId, txnId);

  useEffect(() => {
    transactionStore.load();
  }, [transactionStore]);

  return transactionStore;
}
