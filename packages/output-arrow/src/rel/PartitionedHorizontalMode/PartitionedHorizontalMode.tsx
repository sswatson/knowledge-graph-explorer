import { useEffect, useMemo, useState } from 'react';

import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';
import { TagItem, Tags } from '@relationalai/ui';

import { MAIN_OUTPUT } from '../../constants';
import { getMimeType } from '../../outputUtils';
import { LogicalMode } from '../LogicalMode/LogicalMode';

type PartitionedHorizontalModeProps = {
  groupedRelations: Record<string, ArrowRelation[]>;
  collapsible?: boolean;
};

export function PartitionedHorizontalMode({
  groupedRelations,
  collapsible = false,
}: PartitionedHorizontalModeProps) {
  const groups = useMemo(
    () =>
      Object.keys(groupedRelations).filter(
        group => groupedRelations[group].length > 0,
      ),
    [groupedRelations],
  );
  const [selectedTagId, setSelectedTagId] = useState(
    groups.length ? groups[0] : undefined,
  );

  const tagItems: TagItem[] = useMemo(
    () =>
      groups.map(group => ({
        id: group,
        name: group,
        className:
          group === MAIN_OUTPUT
            ? 'font-bold border-2 bg-gray-100'
            : 'font-medium border-[1px] bg-gray-50',
      })),
    [groups],
  );

  const handleTagSelection = (tag?: TagItem) => {
    tag && setSelectedTagId(tag.id);
  };

  useEffect(() => {
    setSelectedTagId(groups.length ? groups[0] : undefined);
  }, [groups]);

  return tagItems.length > 0 ? (
    <div
      className='flex flex-col h-full'
      data-testid='partitioned-horizontal-mode'
    >
      <div className={'overflow-auto p-2 border-b'}>
        <Tags
          tagItems={tagItems}
          onTagClick={handleTagSelection}
          selectedTag={selectedTagId}
        />
      </div>
      <div className='overflow-auto flex-1 relative'>
        {selectedTagId && groupedRelations[selectedTagId] && (
          <LogicalMode
            isNested={collapsible}
            relations={groupedRelations[selectedTagId]}
            mimeType={getMimeType(groupedRelations[selectedTagId])}
          />
        )}
      </div>
    </div>
  ) : null;
}
