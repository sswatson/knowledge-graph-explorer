import { ReactNode } from 'react';

import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';
import { Alert, ErrorAlert, withErrorBoundary } from '@relationalai/ui';

import { DisplayMode } from './DisplayMode';
import {
  checkThreshold,
  getMimeType,
  groupRelations,
  RELATION_SIZE_THRESHOLD,
} from './outputUtils';
import { LogicalMode } from './rel/LogicalMode/LogicalMode';
import { LogicalOutput } from './rel/LogicalMode/LogicalOutput';
import { PartitionedHorizontalMode } from './rel/PartitionedHorizontalMode/PartitionedHorizontalMode';
import { PartitionedVerticalMode } from './rel/PartitionedVerticalMode/PartitionedVerticalMode';
import { PhysicalMode } from './rel/PhysicalMode/PhysicalMode';
import { RawMode } from './rel/RawMode/RawMode';

type OutputProps = {
  relations: ArrowRelation[];
  collapsibleRel?: boolean;
  mode?: DisplayMode;
};

export const Output = withErrorBoundary(function Output({
  relations,
  mode = DisplayMode.LOGICAL,
  collapsibleRel = false,
}: OutputProps) {
  if (!relations.length) {
    return <LogicalOutput relations={relations} />;
  }

  const mimeType = getMimeType(relations);
  const thresholdErrors = checkThreshold(relations);

  if (mimeType && mode === DisplayMode.LOGICAL) {
    if (thresholdErrors.length) {
      return (
        <>
          {thresholdErrors.map(err => (
            <ErrorAlert key={err} error={err} />
          ))}
        </>
      );
    }

    return (
      <LogicalMode
        relations={relations}
        mimeType={mimeType}
        isNested={collapsibleRel}
      />
    );
  }

  let element: ReactNode;

  if (thresholdErrors.length) {
    relations = relations.map(r => {
      if (r.table.numRows > RELATION_SIZE_THRESHOLD) {
        return {
          ...r,
          table: r.table.slice(0, RELATION_SIZE_THRESHOLD),
        };
      }

      return r;
    });
  }

  if (mode === DisplayMode.LOGICAL) {
    element = <LogicalMode isNested={collapsibleRel} relations={relations} />;
  }

  if (mode === DisplayMode.PHYSICAL) {
    element = <PhysicalMode relations={relations} />;
  }

  if (mode === DisplayMode.RAW) {
    element = <RawMode relations={relations} />;
  }

  if (mode === DisplayMode.PARTITIONED_HORIZONTAL) {
    element = (
      <PartitionedHorizontalMode
        collapsible={collapsibleRel}
        groupedRelations={groupRelations(relations)}
      />
    );
  }

  if (mode === DisplayMode.PARTITIONED_VERTICAL) {
    element = (
      <PartitionedVerticalMode groupedRelations={groupRelations(relations)} />
    );
  }

  return (
    <div className='flex flex-col h-full'>
      <div>
        {!!thresholdErrors.length && (
          <Alert type='info'>
            {`All results limited to the first ${RELATION_SIZE_THRESHOLD} tuples.`}
          </Alert>
        )}
      </div>
      <div className='flex-1 relative overflow-auto w-full'>{element}</div>
    </div>
  );
});
