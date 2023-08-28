import { useEffect } from 'react';

import {
  useVisibleEngineChange,
  useVisibleEngineStateChange,
} from '../editor/useEditorStore';
import { EngineState } from '../engines/engineStore';
import useReload from '../utils/useReload';
import { useDatabaseStore } from './useDatabaseStore';

export function useBaseRelationListStore(
  accountId: string,
  databaseId: string,
) {
  const databaseStore = useDatabaseStore(accountId, databaseId);
  const baseRelationListStore = databaseStore.getBaseRelationListStore();

  useReload(() => {
    baseRelationListStore.loadBaseRelations();
  }, [baseRelationListStore]);

  useEffect(() => {
    baseRelationListStore.loadBaseRelations();
  }, [databaseId, baseRelationListStore]);

  useVisibleEngineChange(
    accountId,
    engine => {
      baseRelationListStore.setEngine(engine);
      baseRelationListStore.loadBaseRelations();
    },
    [baseRelationListStore],
  );

  useVisibleEngineStateChange(accountId, newState => {
    if (newState === EngineState.PROVISIONED) {
      baseRelationListStore?.loadBaseRelations();
    }
  });

  return baseRelationListStore;
}

export function useBaseRelationStore(
  accountId: string,
  databaseId: string,
  name: string,
) {
  const databaseStore = useDatabaseStore(accountId, databaseId);
  const baseRelationListStore = databaseStore.getBaseRelationListStore();
  const baseRelationStore = baseRelationListStore.getBaseRelationStore(name);

  useEffect(() => {
    baseRelationListStore.commitTempStores();
  }, [baseRelationListStore, baseRelationStore]);

  useVisibleEngineChange(
    accountId,
    engine => {
      baseRelationStore.setEngine(engine);
      baseRelationStore.load();
    },
    [baseRelationStore],
  );

  return baseRelationStore;
}
