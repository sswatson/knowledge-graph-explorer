import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';
import { isEmpty } from 'lodash-es';
import {
  ComponentProps,
  CSSProperties,
  FC,
  MouseEvent,
  MutableRefObject,
  ReactNode,
  SVGProps,
  useEffect,
  useRef,
} from 'react';
import { RiCloseLine, RiEditLine } from 'react-icons/ri';
import { TfiClose } from 'react-icons/tfi';

import { Badge } from '../Badge';
import { ContextMenu, Menu, MenuItem } from '../ContextMenu';
import { Tooltip } from '../Tooltip';

export function SortableTab(props: TabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    node,
  } = useSortable({ id: props.id });

  const style: CSSProperties = {};

  if (transform) {
    style.transform = CSS.Transform.toString({
      ...transform,
      scaleY: 1,
      scaleX: 1,
    });
  }

  if (transition) {
    style.transition = transition;
  }

  if (isDragging) {
    style.opacity = 0;
  }

  const dnd = { attributes, listeners, setNodeRef, isDragging, style, node };

  return <Tab {...props} dnd={dnd} />;
}

type DndProps = {
  isDragging?: boolean;
  style?: CSSProperties;
  attributes?: ReturnType<typeof useSortable>['attributes'];
  listeners?: ReturnType<typeof useSortable>['listeners'];
  setNodeRef?: ReturnType<typeof useSortable>['setNodeRef'];
  node?: MutableRefObject<HTMLElement | null>;
};

type TabProps = {
  id: string;
  name?: string;
  current: boolean;
  index: number;
  isPending?: boolean;
  inProgress?: boolean;
  Icon?: FC<SVGProps<SVGSVGElement>>;
  onSelect: () => void;
  onClose?: () => void;
  onRename?: (n: string) => void;
  dnd?: DndProps;
  ddActionName?: string;
  badge?: number;
  tabType?: 'default' | 'warning' | 'danger';
  className?: string;
};

export const tabSharedClasses = {
  tab:
    'relative max-w-[12rem] min-w-[5rem] min-h-[2rem] h-full flex flex-shrink items-center px-3 select-nonefont-medium text-sm cursor-pointer border-r border-b outline-none border-gray-200',
  icon: 'flex-shrink-0 mr-2 h-5 w-5 opacity-70',
};

export const tabTypeStyles: {
  [type: string]: {
    selected: string;
    badgeColor: ComponentProps<typeof Badge>['color'];
    notSelected: string;
    onHover: string;
  };
} = {
  default: {
    selected: 'bg-white text-gray-700',
    notSelected: 'bg-gray-100 text-gray-500 focus:bg-gray-200',
    onHover: 'hover:text-gray-600 hover:bg-gray-200 ',
    badgeColor: 'gray',
  },
  warning: {
    selected: 'bg-white text-gray-700',
    notSelected: 'bg-gray-100 text-gray-500 focus:bg-gray-200',
    onHover: 'hover:text-gray-600 hover:bg-gray-200 ',
    badgeColor: 'yellow',
  },
  danger: {
    selected: 'bg-white text-gray-700',
    notSelected: 'bg-gray-100 text-gray-500 focus:bg-gray-200',
    onHover: 'hover:text-gray-600 hover:bg-gray-200 ',
    badgeColor: 'red',
  },
};

export function Tab({
  id,
  name,
  current,
  index,
  isPending,
  inProgress,
  Icon,
  onSelect,
  onClose,
  onRename,
  dnd,
  ddActionName,
  badge,
  tabType = 'default',
  className,
}: TabProps) {
  const tabRef = useRef<HTMLDivElement>(null);

  //scroll view to active tab
  useEffect(() => {
    if (current) {
      const tabEle = dnd ? dnd.node?.current : tabRef.current;

      tabEle && tabEle.scrollIntoView({ inline: 'nearest' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const isDragging = dnd?.isDragging;

  const tabClasses = classNames(
    tabSharedClasses.tab,
    {
      [tabTypeStyles[tabType].selected]: current,
      [tabTypeStyles[tabType].notSelected]: !current,
      [tabTypeStyles[tabType].onHover]: !current && !isDragging,
      shadow: !current && isDragging,
    },
    className,
  );

  const dndProps = dnd
    ? {
        ref: dnd.setNodeRef,
        ...dnd.attributes,
        ...dnd.listeners,
      }
    : {
        ref: tabRef,
      };

  const handleClose = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    onClose && onClose();
  };

  const handleMouseUp = (event: MouseEvent<HTMLElement>) => {
    if (event.button === 1) {
      handleClose(event);
    }
  };

  const menuItems: ReactNode[] = [];

  if (onRename) {
    menuItems.push(
      <MenuItem
        name='Rename'
        icon={RiEditLine}
        key='rename_tab'
        onClick={() => {
          if (!current) {
            onSelect();
          }

          onRename(name || '');
        }}
      />,
    );
  }

  if (onClose) {
    menuItems.push(
      <MenuItem
        name='Close'
        key='close_tab'
        icon={TfiClose}
        onClick={onClose}
      />,
    );
  }

  const menu = !isEmpty(menuItems) ? (
    <Menu label='Tab menu'>{menuItems}</Menu>
  ) : undefined;

  const content = (
    <div
      {...dndProps}
      style={dnd?.style}
      tabIndex={index}
      role='tab'
      className={classNames(tabClasses)}
      aria-selected={current}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
      onClick={() => onSelect()}
      onMouseUp={handleMouseUp}
      onDoubleClick={() => onRename && onRename(name || '')}
      data-dd-action-name={`${ddActionName ?? name} tab`}
    >
      <Tooltip text={name ? name : id} placement={'top'}>
        <div className='flex truncate w-full'>
          {current && (
            <>
              <div className='absolute h-[2px] top-0 left-0 right-0 bg-red-orange-700'></div>
              {/* overlaps 1px down */}
              <div className='absolute h-[1px] bottom-[-1px] left-0 right-0 bg-white'></div>
            </>
          )}
          {Icon && (
            <Icon
              fill='currentColor'
              className={tabSharedClasses.icon}
              aria-hidden='true'
            />
          )}

          <div className='flex-1 truncate'>{name ? name : id}</div>
          {badge != undefined && (
            <Badge
              color={tabTypeStyles[tabType].badgeColor}
              className='ml-2 px-[6px] py-[1px] flex items-center'
            >
              {`${badge}`}
            </Badge>
          )}
        </div>
      </Tooltip>

      <div
        className={classNames(
          onClose && 'w-4',
          'group flex-shrink-0 flex items-center justify-center',
        )}
      >
        {onClose && (
          <Tooltip text={`Close ${name}`} placement={'top'}>
            <button
              className={classNames(
                'ml-2 rounded-md hover:bg-gray-300',
                (isPending || inProgress) && 'hidden group-hover:block',
              )}
              type='button'
              data-testid='close tab'
              onClick={handleClose}
            >
              <RiCloseLine fill='currentColor' className='h-4 w-4' />
            </button>
          </Tooltip>
        )}
        {(isPending || inProgress) && (
          <div
            data-testid={`${id}-tab-${isPending ? 'pending' : 'progress'}`}
            className={classNames(
              'w-2 h-2 ml-2 rounded-full',
              onClose && 'group-hover:hidden',
              current ? 'bg-red-orange-700' : 'bg-gray-400',
              inProgress && 'animate-pulse',
            )}
          />
        )}
      </div>
    </div>
  );

  return menu ? <ContextMenu menu={menu}>{content}</ContextMenu> : content;
}
