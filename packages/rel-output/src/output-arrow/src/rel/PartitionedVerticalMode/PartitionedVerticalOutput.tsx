import classNames from 'classnames';
import { ForwardedRef, forwardRef, UIEvent } from 'react';

import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';

import { MAIN_OUTPUT } from '../../constants';
import { getMimeType } from '../../outputUtils';
import { LogicalMode } from '../LogicalMode/LogicalMode';

type SplitOutputProps = {
  groupedRelations: Record<string, ArrowRelation[]>;
  onScroll?: (event: UIEvent) => void;
};

const PartitionedVerticalOutput = forwardRef(function SplitOutput(
  { groupedRelations, onScroll }: SplitOutputProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <div
      className='overflow-auto w-full my-2 px-2'
      data-testid='partitioned-vertical-mode-output'
      onScroll={onScroll}
      ref={ref}
    >
      {Object.entries(groupedRelations).map(
        ([groupName, relations]: [string, ArrowRelation[]]) => {
          return relations.length > 0 ? (
            <div key={groupName} className='mb-6'>
              <div
                className={classNames(
                  'w-full px-4 py-2 mb-2',
                  'text-sm font-medium text-left',
                  'text-indigo-900 bg-indigo-100 rounded-md',
                )}
              >
                <code
                  className={classNames(
                    'overflow-ellipsis overflow-hidden whitespace-nowrap',
                    groupName === MAIN_OUTPUT && 'font-bold',
                  )}
                >
                  {groupName}
                </code>
              </div>
              <LogicalMode
                relations={relations}
                mimeType={getMimeType(relations)}
              />
            </div>
          ) : null;
        },
      )}
    </div>
  );
});

export default PartitionedVerticalOutput;
