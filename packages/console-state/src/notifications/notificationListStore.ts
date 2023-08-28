import { makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';

export type HideAction = {
  type: 'hide';
};

export type CopyAction = {
  type: 'copy';
  payload: string;
};

export type NotificationAction = HideAction | CopyAction;

export type Notification = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  permanent?: boolean;
  actions?: NotificationAction[];
  duration?: number;
};

export type AddPayload = Omit<Notification, 'id'> & { id?: string };

export class NotificationListStore {
  notifications: Notification[] = [];
  constructor() {
    makeAutoObservable<NotificationListStore>(this);
  }

  addNotification(item: AddPayload) {
    const notification: Notification = {
      id: uuidv4(),
      ...item,
    };

    this.notifications.push(notification);
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }
}
