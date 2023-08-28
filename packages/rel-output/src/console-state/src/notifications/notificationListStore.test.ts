import { Notification, NotificationListStore } from './notificationListStore';

const createNotificationListStore = () => {
  return new NotificationListStore();
};

describe('NotificationList Store', () => {
  it('should add notification', () => {
    const notification: Notification = {
      id: 'test',
      type: 'info',
      title: 'test title',
      message: 'message',
      actions: [{ type: 'hide' }],
    };
    const store = createNotificationListStore();

    store.addNotification(notification);

    expect(store.notifications).toStrictEqual([notification]);
  });

  it('should remove notification', () => {
    const notification: Notification = {
      id: 'test',
      type: 'info',
      title: 'test title',
      message: 'message',
      actions: [{ type: 'hide' }],
    };
    const notificationList = [notification];

    const store = createNotificationListStore();

    store.notifications = notificationList;

    store.removeNotification(notification.id);

    expect(store.notifications).toStrictEqual([]);
  });
});
