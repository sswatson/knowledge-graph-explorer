import classNames from 'classnames';
import { ForwardedRef, forwardRef, KeyboardEvent, MouseEvent } from 'react';

export type TagItem = {
  id: string;
  name?: string;
  icon?: JSX.Element;
  className?: string;
};

type TagProps = {
  tagItem: TagItem;
  onTagClick?: (event?: MouseEvent | KeyboardEvent) => void;
  current?: boolean;
};

const Tag = forwardRef(function Tag(
  { tagItem, onTagClick, current = false }: TagProps,
  ref: ForwardedRef<HTMLButtonElement & HTMLDivElement>,
) {
  const tagClasses = classNames(
    'px-2 min-h-[2rem] min-w-[5rem] max-w-[10rem]',
    'duration-200 cursor-pointer rounded-2xl',
    current && 'bg-red-orange-100 border-red-orange-700 text-red-orange-900',
    !current &&
      'border-transparent hover:bg-gray-200 hover:text-gray-600 text-gray-500',
    tagItem.className,
  );

  return (
    <div
      role='treeitem'
      tabIndex={0}
      className={classNames(
        tagClasses,
        'inline-flex items-center justify-center',
      )}
      ref={ref}
      onClick={onTagClick}
      onKeyDown={e => e.key === 'Enter' && onTagClick?.(e)}
    >
      <span className='whitespace-nowrap overflow-hidden overflow-ellipsis text-sm'>
        {tagItem.icon}
        {tagItem.name}
      </span>
    </div>
  );
});

export default Tag;
