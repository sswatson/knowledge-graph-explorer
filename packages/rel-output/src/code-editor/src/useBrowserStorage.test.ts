import { sessionStorage } from '@shopify/jest-dom-mocks';
import { waitFor } from '@testing-library/react';

import useBrowserStorage, { BrowserStorageType } from './useBrowserStorage';

const key = 'key';
const initialItem = {};

describe('useBrowserStorage', () => {
  afterEach(() => {
    sessionStorage.restore();
  });

  it('should set session storage value', async () => {
    const { setItem } = useBrowserStorage({
      key,
      initialItem,
      type: BrowserStorageType.SESSION,
    });

    setItem('foo');

    // one with initial {} and another with the 'foo'
    expect(sessionStorage.setItem).toHaveBeenCalledTimes(2);
    expect(sessionStorage.setItem).lastCalledWith(key, '"foo"');

    expect(sessionStorage.getItem(key)).toEqual('"foo"');
  });

  it('should reset session key on isQuotaExceededError', async () => {
    const { getItem, setItem } = useBrowserStorage({
      key,
      initialItem,
      type: BrowserStorageType.SESSION,
    });

    expect(getItem()).toEqual(initialItem);

    sessionStorage.setItem = jest.fn((_, __) => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    setItem({ item: 'super long text!' });

    await waitFor(() => {
      expect(sessionStorage.setItem).toBeCalledTimes(1);
      expect(sessionStorage.removeItem).toBeCalledTimes(1);
      expect(getItem()).toEqual(null);
    });
  });

  it('should NOT reset session key on error (different than QuotaExceededError) and should write to console.error', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { getItem, setItem } = useBrowserStorage({
      key,
      initialItem,
      type: BrowserStorageType.SESSION,
    });

    expect(getItem()).toEqual({});

    sessionStorage.setItem = jest.fn((_, __) => {
      throw new Error('Error');
    });

    setItem({ item: 'should throw error!' });

    await waitFor(() => {
      expect(sessionStorage.setItem).toBeCalledTimes(1);
      expect(sessionStorage.removeItem).toBeCalledTimes(0);
      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(getItem()).toEqual(initialItem);
    });

    consoleError.mockReset();
  });
});
