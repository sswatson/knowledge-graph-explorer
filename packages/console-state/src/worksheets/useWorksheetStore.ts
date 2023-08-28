import { useEffect } from 'react';

import { useRootStore } from '../provider';
import useReload from '../utils/useReload';

export function useWorksheetListStore(accountId: string) {
  const rootStore = useRootStore();
  const worksheetListStore = rootStore.getWorksheetListStore(accountId);

  useReload(() => worksheetListStore.loadWorksheets());

  return worksheetListStore;
}

export function useWorksheetStore(accountId: string, worksheetId: string) {
  const rootStore = useRootStore();
  const worksheetListStore = rootStore.getWorksheetListStore(accountId);
  const worksheetStore = worksheetListStore.getWorksheetStore(worksheetId);

  useReload(() => {
    if (worksheetId) {
      worksheetStore.loadWorksheet();
    }
  });

  useEffect(() => {
    if (worksheetId) {
      worksheetStore.loadWorksheet();
    }
  }, [worksheetId, worksheetStore]);

  useEffect(() => {
    worksheetListStore.commitTempStores();
  }, [worksheetListStore, worksheetStore]);

  return worksheetStore;
}
