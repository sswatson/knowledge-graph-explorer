import { sortBy } from 'lodash-es';

import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';
import { Disclosure } from '@relationalai/ui';

import { PhysicalKeys } from '../PhysicalMode/PhysicalKeys';
import { RawRelation } from './RawRelation';

type RawModeProps = {
  relations: ArrowRelation[];
};

export function RawMode({ relations }: RawModeProps) {
  const sortedOutput = sortBy(relations, r => r.relationId);

  const renderRelation = (relation: ArrowRelation, index: number) => {
    return (
      <Disclosure
        key={relation.relationId}
        defaultOpen={index === 0}
        title={
          <code className='overflow-ellipsis overflow-hidden whitespace-nowrap'>
            <PhysicalKeys relationId={relation.relationId} />
          </code>
        }
      >
        <RawRelation relation={relation} />
      </Disclosure>
    );
  };

  return (
    <div data-testid='raw-mode' className='flex flex-col gap-2 p-2'>
      {sortedOutput.map(renderRelation)}
    </div>
  );
}
