import { LDFlagSet } from 'launchdarkly-js-sdk-common';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Client } from '@relationalai/rai-sdk-javascript/web';

import { RootStore } from './rootStore';

type RootStoreProviderProps = {
  children: ReactNode;
  accountId?: string;
  client: Client;
  getToken: () => Promise<string>;
  userId?: string;
  flags: LDFlagSet;
};

const RootStoreContext = createContext<RootStore>(new RootStore());
const { Provider } = RootStoreContext;

export function RootStoreProvider({
  children,
  accountId = '',
  client,
  getToken,
  userId = '',
  flags,
}: RootStoreProviderProps) {
  const [rootStore] = useState(new RootStore());
  const context = useMemo(() => {
    return {
      accountId,
      client,
      getToken,
      userId,
      flags,
    };
  }, [accountId, client, getToken, userId, flags]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Just for debugging purposes
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.raiRootStore = rootStore;
    }
  }, [rootStore]);

  // Using sync call here because we need to create AccountStore
  // before we access it via hooks in the inner components
  rootStore.setContext(context);

  return <Provider value={rootStore}>{children}</Provider>;
}

export function useRootStore() {
  const rootStore = useContext(RootStoreContext);

  return rootStore;
}
