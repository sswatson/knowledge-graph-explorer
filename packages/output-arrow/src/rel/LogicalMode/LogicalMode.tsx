import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';

import { MimeElement } from '../MimeElement';
import { LogicalOutput } from './LogicalOutput';

type LogicalModeProps = {
  relations: ArrowRelation[];
  mimeType?: string;
  isNested?: boolean;
};

export function LogicalMode({
  relations,
  mimeType,
  isNested = false,
}: LogicalModeProps) {
  if (relations.length) {
    return mimeType ? (
      <MimeElement
        relations={relations}
        mimeType={mimeType}
        isNested={isNested}
      />
    ) : (
      <LogicalOutput relations={relations} isNested={isNested} />
    );
  }

  return null;
}
