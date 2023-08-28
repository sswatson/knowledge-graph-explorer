import { LDFlagSet } from 'launchdarkly-js-sdk-common';

import { Client } from '@relationalai/rai-sdk-javascript/web';

export type StoreContext = {
  client: Client;
  getToken: () => Promise<string>;
  userId: string;
  accountId: string;
  flags: LDFlagSet;
};
