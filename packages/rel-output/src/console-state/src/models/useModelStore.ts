import { useEffect } from 'react';

import { useDatabaseStore } from '../database/useDatabaseStore';
import {
  useVisibleEngineChange,
  useVisibleEngineStateChange,
} from '../editor/useEditorStore';
import { EngineState } from '../engines/engineStore';
import useReload from '../utils/useReload';

export function useModelListStore(accountId: string, databaseId: string) {
  const databaseStore = useDatabaseStore(accountId, databaseId);
  const modelListStore = databaseStore.getModelListStore();

  useReload(() => {
    modelListStore.listModels();
  }, [modelListStore]);

  useEffect(() => {
    modelListStore.listModels();
  }, [modelListStore, databaseId]);

  useVisibleEngineChange(
    accountId,
    engine => {
      modelListStore.setEngine(engine);
      modelListStore.listModels();
    },
    [modelListStore],
  );

  useVisibleEngineStateChange(accountId, newState => {
    if (newState === EngineState.PROVISIONED) {
      modelListStore?.listModels();
    }
  });

  return modelListStore;
}

export function useModelStore(
  accountId: string,
  databaseId: string,
  modelName: string,
) {
  const databaseStore = useDatabaseStore(accountId, databaseId);
  const modelListStore = databaseStore.getModelListStore();
  const modelStore = modelListStore.getModelStore(modelName);

  useEffect(() => {
    modelListStore.commitTempStores();
  }, [modelListStore, modelStore]);

  // TODO figure out conditions for reloadings

  useReload(() => {
    if (databaseId && modelStore) {
      modelStore.loadModel();
    }
  }, [modelStore]);

  useEffect(() => {
    if (databaseId && modelStore) {
      modelStore.loadModel();
    }
  }, [modelStore, databaseId]);

  useVisibleEngineChange(accountId, () => modelStore?.loadModel(), [
    modelStore,
  ]);

  return modelStore;
}
