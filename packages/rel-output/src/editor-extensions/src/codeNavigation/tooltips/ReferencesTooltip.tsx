import classNames from 'classnames';
import { BsFileEarmarkCode } from 'react-icons/bs';
import { RxTable } from 'react-icons/rx';

import { RelationIcon } from '@relationalai/ui';

import { RelationReference } from '../../types';

type ReferencesTooltipProps = {
  refs: RelationReference[];
  onRefClick?: (ref: RelationReference) => void;
  selectedIndex: number;
};

function ReferenceIcon({ relRef }: { relRef: RelationReference }) {
  const size = 'w-4 h-4';

  switch (relRef.type) {
    case 'model':
      return <RelationIcon className={size} />;
    case 'worksheet':
      return <BsFileEarmarkCode className={size} />;
    case 'baseRelation':
      return <RxTable className={size} />;
  }

  return null;
}

export function ReferencesTooltip({
  refs,
  onRefClick,
  selectedIndex,
}: ReferencesTooltipProps) {
  return (
    <ul className='flex flex-col font-mono w-64 max-h-64 overflow-auto list-none'>
      {refs.map((ref, index) => (
        <li
          className={classNames(
            'flex items-center gap-3 cursor-pointer px-2 py-1 overflow-auto leading-5',
            'text-ellipsis whitespace-nowrap hover:bg-red-orange-100',
            'first:rounded-t-md last:rounded-b-md',
            {
              'bg-red-orange-100': selectedIndex === index,
            },
          )}
          role='option'
          onKeyDown={event =>
            event.key === 'Enter' ? onRefClick?.(ref) : undefined
          }
          onClick={() => onRefClick?.(ref)}
          key={getRefKey(ref)}
          aria-selected={selectedIndex === index ? 'true' : undefined}
        >
          <ReferenceIcon relRef={ref} />
          {`${ref.name}`}
        </li>
      ))}
    </ul>
  );
}

const getRefKey = (ref: RelationReference) => {
  switch (ref.type) {
    case 'baseRelation':
      return `${ref.type}-${ref.name}`;
    case 'model':
    case 'worksheet':
      return `${ref.type}-${ref.name}-${ref.from}:${ref.to}`;
    default:
      return ``;
  }
};
