import {
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';

import { MAIN_OUTPUT } from '../../constants';
import PartitionedVerticalOutput from './PartitionedVerticalOutput';
import SideMenu, { SideMenuItem } from './SideMenu';

type SplitModeProps = {
  groupedRelations: Record<string, ArrowRelation[]>;
};

export function PartitionedVerticalMode({ groupedRelations }: SplitModeProps) {
  const sideMenuItems: SideMenuItem[] = useMemo(
    () =>
      Object.keys(groupedRelations)
        .filter(group => groupedRelations[group].length > 0)
        .map(group => ({
          id: group,
          name: group,
          className: group === MAIN_OUTPUT ? 'font-bold' : '',
        })),
    [groupedRelations],
  );

  const [selectedItemId, setSelectedItemId] = useState(
    sideMenuItems.length ? sideMenuItems[0].id : undefined,
  );
  const outputContainerRef = useRef<HTMLDivElement | null>(null);
  const sideMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedItemId(sideMenuItems.length ? sideMenuItems[0].id : undefined);
  }, [sideMenuItems]);

  const handleScroll = useCallback(
    (e: UIEvent) => {
      const container = e.target as HTMLDivElement;
      const {
        bottom: containerBottom,
        top: containerTop,
      } = container.getBoundingClientRect();
      const containerMiddle = (containerTop + containerBottom) / 2;

      const index = Array.from(container.children).findIndex(element => {
        const {
          bottom: elementBottom,
          top: elementTop,
        } = element.getBoundingClientRect();

        return (
          (elementTop >= containerTop && elementTop <= containerMiddle) ||
          elementBottom > containerMiddle
        );
      });

      if (index >= 0) {
        setSelectedItemId(sideMenuItems[index].id);
        sideMenuRef.current &&
          sideMenuRef.current.children[index].scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
          });
      }
    },
    [sideMenuItems],
  );

  const handleMenuItemClick = (item: SideMenuItem, index: number) => {
    outputContainerRef.current &&
      outputContainerRef.current.children[index].scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });
    setSelectedItemId(item.id);
  };

  return sideMenuItems.length > 0 ? (
    <div className='flex w-full h-full' data-testid='partitioned-vertical-mode'>
      <PartitionedVerticalOutput
        groupedRelations={groupedRelations}
        ref={outputContainerRef}
        onScroll={handleScroll}
      />
      <SideMenu
        items={sideMenuItems}
        selectedItemId={selectedItemId}
        onMenuItemClick={handleMenuItemClick}
        testIdPrefix='partitioned-vertical-mode-'
        ref={sideMenuRef}
      />
    </div>
  ) : null;
}
