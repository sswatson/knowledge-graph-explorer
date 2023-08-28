import 'overlayscrollbars/overlayscrollbars.css';

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable';
import classNames from 'classnames';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { ComponentProps, FC, ReactNode, SVGProps, useState } from 'react';
import { RiAddLine, RiArrowDownSLine } from 'react-icons/ri';
import AutoSizer from 'react-virtualized-auto-sizer';

import { PopoverPanel } from '../PopoverPanel';
import { Tooltip } from '../Tooltip';
import { SortableTab, Tab } from './Tab';

export type TabItem = {
  id: string;
  name?: string;
  ddActionName?: string;
  icon?: FC<SVGProps<SVGSVGElement>>;
  isPending?: boolean;
  inProgress?: boolean;
  badge?: number;
  tabType?: ComponentProps<typeof Tab>['tabType'];
  className?: string;
  preventClose?: boolean;
  preventRename?: boolean;
};

type TabAddProps = {
  addButtonTitle?: string;
  onAdd?: () => void;
};

type TabsBaseProps = {
  tabItems: TabItem[];
  current?: string;
  onSelect: (item?: TabItem) => void;
  onRename?: (item: TabItem, newName: string) => void;
  supressAutoSelection?: boolean;
};

type CanCloseProps = {
  canClose?: true;
  canDrag?: boolean;
  onTabsChange: (items: TabItem[]) => void;
};

type CanDragProps = {
  canDrag?: true;
  canClose?: boolean;
  onTabsChange: (items: TabItem[]) => void;
};

type WithoutTabsChangeProps = {
  canClose: false;
  canDrag: false;
  onTabsChange?: (items: TabItem[]) => void;
};

type TabsProps =
  | (TabsBaseProps & WithoutTabsChangeProps & TabAddProps)
  | (TabsBaseProps & CanCloseProps & TabAddProps)
  | ((TabsBaseProps & CanDragProps) & TabAddProps);

export function Tabs({
  tabItems,
  current = '',
  canClose = true,
  canDrag = true,
  onSelect,
  onRename,
  onTabsChange,
  addButtonTitle,
  onAdd,
  supressAutoSelection,
}: TabsProps) {
  const currentTab: TabItem | undefined = tabItems.find(t => t.id === current);

  const handleClose = (item: TabItem) => {
    const index = tabItems.findIndex(t => t.id == item.id);
    const newTabs = tabItems.slice();

    newTabs.splice(index, 1);

    if (item.id === current && !supressAutoSelection) {
      onSelect(newTabs[index > 0 ? index - 1 : index]);
    }

    onTabsChange && onTabsChange(newTabs);
  };

  const sortableTab = (item: TabItem, index: number) => {
    return (
      <SortableTab
        key={item.id}
        {...item}
        current={item.id === current}
        index={index}
        Icon={item.icon}
        onSelect={() => onSelect(item)}
        onClose={
          canClose && !item?.preventClose ? () => handleClose(item) : undefined
        }
        onRename={
          onRename && !item.preventRename ? n => onRename(item, n) : undefined
        }
        tabType={item.tabType}
        dd-action-name={item.ddActionName}
      />
    );
  };

  const tabs = tabItems.map((item, index) => sortableTab(item, index));

  const addButton = (wrapperClassName: string | null = null) => {
    return onAdd ? (
      <div className={classNames('h-full flex-1', `${wrapperClassName}`)}>
        <Tooltip text={addButtonTitle ? addButtonTitle : ''} placement='top'>
          <button
            className='h-full flex items-center w-6 mx-3 text-gray-500 hover:text-orange-500'
            type='button'
            onClick={onAdd}
            data-testid={'add-tab'}
            data-dd-action-name={'Add new tab'}
          >
            <RiAddLine fill='currentColor' className='w-6 h-6' />
          </button>
        </Tooltip>
      </div>
    ) : null;
  };

  return (
    <div className='h-full sticky left-0 top-0'>
      <AutoSizer>
        {({ width, height }) => (
          <div style={{ width, height }}>
            {width > 250 || tabItems.length <= 1 ? (
              <div className='flex flex-row h-full justify-start items-center'>
                {canDrag ? (
                  <DraggableTabsPanel
                    tabItems={tabItems}
                    onTabsChange={onTabsChange}
                    onSelect={onSelect}
                    onClose={canClose ? handleClose : undefined}
                    current={current}
                  >
                    {tabs}
                  </DraggableTabsPanel>
                ) : (
                  <TabsPanel>{tabs}</TabsPanel>
                )}
                {addButton('border-b border-solid border-gray-200')}
              </div>
            ) : (
              <div className='flex h-full flex-row items-center pr-8'>
                <DropdownTabsPanel currentTab={currentTab}>
                  {tabs}
                </DropdownTabsPanel>

                {addButton()}
              </div>
            )}
          </div>
        )}
      </AutoSizer>
    </div>
  );
}

type TabsPanelProp = {
  children: ReactNode;
};

const TabsPanel = ({ children }: TabsPanelProp) => {
  const options: ComponentProps<
    typeof OverlayScrollbarsComponent
  >['options'] = {
    overflow: {
      x: 'scroll',
      y: 'hidden',
    },
    scrollbars: {
      theme: 'os-theme-dark',
      autoHide: 'leave',
      autoHideDelay: 150,
    },
  };

  return (
    <OverlayScrollbarsComponent options={options} className='h-full'>
      <nav
        className='tabs flex h-full'
        role='tabpanel'
        aria-label='Tabs'
        data-testid='static-tabpanel'
      >
        {children}
      </nav>
    </OverlayScrollbarsComponent>
  );
};

type DraggableTabsPanelProps = {
  tabItems: TabItem[];
  current?: string;
  onSelect: (item?: TabItem) => void;
  onClose?: (items: TabItem) => void;
  onTabsChange?: (items: TabItem[]) => void;
  children: ReactNode;
};

const DraggableTabsPanel = ({
  tabItems,
  current,
  onSelect,
  onClose,
  onTabsChange,
  children,
}: DraggableTabsPanelProps) => {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 10 } }),
  );
  const [draggingTab, setDraggingTab] = useState<TabItem>();

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingTab(tabItems.find(t => t.id === event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setDraggingTab(undefined);

    if (over && active.id !== over.id) {
      const oldIndex = tabItems.findIndex(t => t.id === active.id);
      const newIndex = tabItems.findIndex(t => t.id === over.id);

      const newTabItems = arrayMove(tabItems, oldIndex, newIndex);

      onTabsChange && onTabsChange(newTabItems);
    }
  };

  const options: ComponentProps<
    typeof OverlayScrollbarsComponent
  >['options'] = {
    overflow: {
      x: 'scroll',
      y: 'hidden',
    },
    scrollbars: {
      theme: 'os-theme-dark',
      autoHide: 'leave',
      autoHideDelay: 150,
    },
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToHorizontalAxis]}
    >
      <SortableContext
        items={tabItems.map(t => t.id)}
        strategy={horizontalListSortingStrategy}
      >
        <OverlayScrollbarsComponent options={options} className='h-full'>
          <nav
            className={classNames(
              'tabs',
              'flex h-full',
              draggingTab && 'bg-gray-200',
            )}
            role='tabpanel'
            data-testid='draggable-tabpanel'
            aria-label='Tabs'
          >
            {children}
            <DragOverlay>
              {draggingTab && (
                <Tab
                  {...draggingTab}
                  Icon={draggingTab.icon}
                  current={draggingTab.id === current}
                  index={-1}
                  onSelect={() => onSelect(draggingTab)}
                  onClose={
                    onClose && !draggingTab?.preventClose
                      ? () => onClose(draggingTab)
                      : undefined
                  }
                  tabType={draggingTab.tabType}
                  dnd={{ isDragging: true }}
                  ddActionName={draggingTab.ddActionName}
                />
              )}
            </DragOverlay>
          </nav>
        </OverlayScrollbarsComponent>
      </SortableContext>
    </DndContext>
  );
};

type DropdownTabsPanelProp = {
  children: ReactNode;
  currentTab?: TabItem;
};

const DropdownTabsPanel = ({ children, currentTab }: DropdownTabsPanelProp) => {
  return (
    <PopoverPanel
      panel={<> {children} </>}
      trigger={
        <>
          <span
            className='block truncate font-semibold pl-2'
            title={currentTab?.name ?? currentTab?.id}
          >
            {currentTab?.name ?? currentTab?.id}
          </span>
          <span className='px-2'>
            <RiArrowDownSLine
              className={classNames('h-5 w-5 text-gray-400')}
              aria-hidden='true'
            />
          </span>
        </>
      }
      unmount={false}
      triggerClassName='flex items-center px-3 max-w-full h-full focus:outline-none sm:text-sm'
    />
  );
};
