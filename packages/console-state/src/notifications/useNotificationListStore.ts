import { useRootStore } from '../provider';

export function useNotificationListStore() {
  const rootStore = useRootStore();
  const notificationListStore = rootStore.getNotificationListStore();

  return notificationListStore;
}
