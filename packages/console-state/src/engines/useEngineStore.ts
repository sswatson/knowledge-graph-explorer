import { useRootStore } from '../provider';
import useReload from '../utils/useReload';

export function useEngineStore(accountId: string) {
  const rootStore = useRootStore();
  const engineStore = rootStore.getEngineStore(accountId);

  useReload(() => engineStore.loadEngines());

  return engineStore;
}
