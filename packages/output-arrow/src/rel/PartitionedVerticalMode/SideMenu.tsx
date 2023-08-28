import classNames from 'classnames';
import { ForwardedRef, forwardRef } from 'react';

export type SideMenuItem = {
  id: string;
  name: string;
  className?: string;
};

type SideMenuProps = {
  items: SideMenuItem[];
  onMenuItemClick?: (item: SideMenuItem, index: number) => void;
  selectedItemId?: string;
  testIdPrefix?: string;
};

const SideMenu = forwardRef(function SideMenu(
  { items, selectedItemId, onMenuItemClick, testIdPrefix }: SideMenuProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <div
      data-testid={`${testIdPrefix ?? ''}side-menu`}
      className='overflow-auto my-2 px-2 min-w-[10rem]'
      ref={ref}
    >
      {items.map((item, index) => (
        <div
          role='treeitem'
          tabIndex={index}
          key={item.id}
          className={classNames(
            'p-2 min-w-[8rem] max-w-sm overflow-hidden overflow-ellipsis border-r-4 duration-200',
            'hover:bg-blue-50 cursor-pointer rounded-tl-md rounded-bl-md text-sm',
            selectedItemId === item.id &&
              'border-r-red-orange-900 text-red-orange-900 bg-red-orange-100',
            selectedItemId !== item.id && 'border-r-gray-200 text-gray-600',
            item.className,
          )}
          onKeyDown={e => e.key === 'Enter' && onMenuItemClick?.(item, index)}
          onClick={() => onMenuItemClick?.(item, index)}
        >
          {item.name}
        </div>
      ))}
    </div>
  );
});

export default SideMenu;
