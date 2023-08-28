import { reaction } from 'mobx';
import { DependencyList, useEffect } from 'react';

import { useEngineStore } from '../engines/useEngineStore';
import { useRootStore } from '../provider';

export function useEditorStore(accountId: string) {
  const rootStore = useRootStore();
  const editorStore = rootStore.getEditorStore(accountId);

  useEffect(() => {
    editorStore.loadTabs();
  }, [editorStore]);

  return editorStore;
}

// we can't just get away with adding store.property into useEffect dependency
// in the hooks below
// it won't work because there's no observer around the hook
// reaction below plays the role of the observer HOC here

export function useVisibleEngineChange(
  accountId: string,
  callback: (engine: string) => void,
  dependencies: DependencyList,
) {
  const editorStore = useEditorStore(accountId);

  useEffect(() => {
    return reaction(
      () => editorStore.visibleEngine,
      visibleEngine => callback(visibleEngine),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, editorStore]);

  useEffect(() => {
    if (editorStore.visibleEngine) {
      callback(editorStore.visibleEngine);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

export function useVisibleEngineStateChange(
  accountId: string,
  callback: (newState: string) => void,
) {
  const engineStore = useEngineStore(accountId);
  const editorStore = useEditorStore(accountId);

  useEffect(
    () =>
      reaction(
        () =>
          engineStore.engines.find(e => e.name === editorStore.visibleEngine),
        (newEngine, prevEngine) => {
          if (
            newEngine &&
            prevEngine &&
            newEngine.name === prevEngine.name &&
            newEngine.state !== prevEngine.state
          ) {
            callback(newEngine.state);
          }
        },
      ),
    [callback, engineStore, editorStore],
  );
}

export function useVisibleDatabaseChange(
  accountId: string,
  callback: (engine: string) => void,
  dependencies: DependencyList,
) {
  const editorStore = useEditorStore(accountId);

  useEffect(() => {
    return reaction(
      () => editorStore.visibleDatabase,
      visibleDatabase => callback(visibleDatabase),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, editorStore]);

  useEffect(() => {
    if (editorStore.visibleDatabase) {
      callback(editorStore.visibleDatabase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
