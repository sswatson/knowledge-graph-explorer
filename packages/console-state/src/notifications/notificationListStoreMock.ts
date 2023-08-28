import { NotificationListStore } from './notificationListStore';

type NotificationListStoreMock = Pick<
  NotificationListStore,
  keyof NotificationListStore
>;

export function createNotificationListStoreMock(
  mockValues: Partial<NotificationListStoreMock> = {},
) {
  const mock: NotificationListStoreMock = {
    notifications: [],
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    ...mockValues,
  };

  return mock as NotificationListStore;
}
