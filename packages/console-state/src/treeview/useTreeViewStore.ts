import {
  useVisibleDatabaseChange,
  useVisibleEngineChange,
} from '../editor/useEditorStore';
import { useRootStore } from '../provider';
import useReload from '../utils/useReload';

export function useTreeViewStore(accountId: string) {
  const rootStore = useRootStore();
  const treeViewStore = rootStore.getTreeViewStore(accountId);

  useReload(() => {
    treeViewStore.reloadData({
      models: true,
      baseRelations: true,
      databases: true,
    });
  }, [treeViewStore]);

  useVisibleEngineChange(
    accountId,
    engine => {
      treeViewStore.setEngine(engine);
      treeViewStore.reloadData({
        models: true,
        baseRelations: true,
        databases: false,
      });
    },
    [treeViewStore, accountId],
  );

  useVisibleDatabaseChange(
    accountId,
    db => {
      treeViewStore.setOpenDatabaseNodes(db);
    },
    [treeViewStore, accountId],
  );

  return treeViewStore;
}
