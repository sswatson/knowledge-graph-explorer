import { RequestProps } from '../utils/makeRequest';
import { IdProviderListStore } from './idProviderListStore';

const createIdProviderListStore = (
  requestMock?: <T>(props: RequestProps) => Promise<{ data: T }>,
) => {
  const request =
    requestMock ??
    jest.fn().mockResolvedValue({
      data: {
        id_providers: [
          {
            name: 'provider-1',
            description: 'description-1',
          },
          {
            name: 'provider-2',
            description: 'description-2',
          },
          {
            name: 'provider-3',
            description: 'description-3',
          },
        ],
      },
    });

  return new IdProviderListStore(request);
};

describe('IdProviderList Store', () => {
  it('should load id provider list', async () => {
    const mockIdProviders = [
      {
        name: 'provider-1',
        description: 'description-1',
      },
      {
        name: 'provider-2',
        description: 'description-2',
      },
      {
        name: 'provider-3',
        description: 'description-3',
      },
    ];

    const store = createIdProviderListStore();

    const promise = store.loadIdProviderList();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toBe(true);
    expect(store.isLoaded).toBe(false);
    expect(store.idProviders.length).toEqual(0);

    await promise;

    expect(store.isLoaded).toBe(true);
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeUndefined();
    expect(store.idProviders).toStrictEqual(mockIdProviders);
  });

  it('should handle error when loading id provider list', async () => {
    const error = new Error('id provider list error');

    const store = createIdProviderListStore(jest.fn().mockRejectedValue(error));

    const promise = store.loadIdProviderList();

    expect(store.error).toBeUndefined();
    expect(store.isLoading).toBe(true);
    expect(store.isLoaded).toBe(false);
    expect(store.idProviders.length).toEqual(0);

    await promise;

    expect(store.isLoaded).toBe(false);
    expect(store.isLoading).toBe(false);
    expect(store.error).toStrictEqual(error);
    expect(store.idProviders.length).toBe(0);
  });
});
