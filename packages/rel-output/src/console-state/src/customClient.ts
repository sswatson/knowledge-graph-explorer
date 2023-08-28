import { Client } from '@relationalai/rai-sdk-javascript/web';

// TODO expose types in the SDK
type CtorParams = ConstructorParameters<typeof Client>;

export class CustomClient extends Client {
  constructor(config: CtorParams[0], region?: CtorParams[1]) {
    super(config, region);
  }

  // if we need to override something
  // we can do it here
}
