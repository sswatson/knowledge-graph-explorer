export enum BrowserStorageType {
  LOCAL = 'local',
  SESSION = 'session',
}

type UseBrowserStorageOptions<T> = {
  type: BrowserStorageType;
  key: string;
  initialItem: T;
};

function isQuotaExceededError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    // everything except Firefox
    (err.name === 'QuotaExceededError' ||
      // Firefox
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

export default function useBrowserStorage<T>({
  type,
  key,
  initialItem,
}: UseBrowserStorageOptions<T>) {
  const provider =
    type === BrowserStorageType.LOCAL ? localStorage : sessionStorage;

  const getItem = function () {
    const itemStr = provider.getItem(key);
    let item: T | null = null;

    try {
      item = itemStr && JSON.parse(itemStr);
      // eslint-disable-next-line no-empty
    } catch {}

    return item;
  };

  const setItem = function (item: T) {
    try {
      provider.setItem(key, JSON.stringify(item));
    } catch (error) {
      if (isQuotaExceededError(error)) {
        provider.removeItem(key); // reset
      } else {
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  };

  let item = getItem();

  if (!item) {
    provider.setItem(key, JSON.stringify(initialItem));

    item = initialItem;
  }

  return {
    getItem,
    setItem,
    item,
  };
}
