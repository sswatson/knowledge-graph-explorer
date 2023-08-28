import { sortBy } from 'lodash-es';

import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';
import { Disclosure } from '@relationalai/ui';

import { PhysicalKeys } from './PhysicalKeys';
import { PhysicalRelation } from './PhysicalRelation';

type PhysicalModeProps = {
  relations: ArrowRelation[];
};

export function PhysicalMode({ relations }: PhysicalModeProps) {
  const sortedOutput = sortBy(relations, r => r.relationId);

  const renderRelation = (relation: ArrowRelation, index: number) => (
    <Disclosure
      key={relation.relationId}
      defaultOpen={index === 0}
      title={
        <code className='overflow-ellipsis overflow-hidden whitespace-nowrap'>
          <PhysicalKeys relationId={relation.relationId} />
        </code>
      }
    >
      <PhysicalRelation relation={relation} />
    </Disclosure>
  );

  return (
    <div data-testid='physical-mode' className='flex flex-col gap-2 p-2'>
      {sortedOutput.map(renderRelation)}
    </div>
  );
}
