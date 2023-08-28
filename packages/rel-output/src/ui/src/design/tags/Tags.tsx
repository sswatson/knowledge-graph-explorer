import { isEmpty } from 'lodash-es';
import { useEffect, useRef, useState } from 'react';
import { RiMoreFill } from 'react-icons/ri';
import AutoSizer from 'react-virtualized-auto-sizer';

import { Dropdown } from '../Dropdown';
import Tag, { TagItem } from './Tag';

type TagsProps = {
  tagItems: TagItem[];
  onTagClick: (tag: TagItem) => void;
  selectedTag?: string;
};

type AutoSizedTagsProps = TagsProps & {
  width: number;
};

const TAGS_GAP = 8;
const HIDDEN_ITEMS_TAG_WIDTH = 80;

function AutoSizedTags({
  width,
  tagItems,
  onTagClick,
  selectedTag = '',
}: AutoSizedTagsProps) {
  const [shownItems, setShownItems] = useState<TagItem[]>(tagItems);
  const [hiddenItems, setHiddenItems] = useState<TagItem[]>([]);
  const [tagsCumulativeWidth, setTagsCumulativeWidth] = useState<
    number[] | undefined
  >(undefined);
  const tagsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    setShownItems(tagItems);
    setHiddenItems([]);
    setTagsCumulativeWidth(undefined);
  }, [tagItems]);

  useEffect(() => {
    if (!tagsCumulativeWidth) {
      calcTagsCumulativeWidth();
    }

    handleResize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, tagsCumulativeWidth]);

  const calcTagsCumulativeWidth = () => {
    setTagsCumulativeWidth(
      tagsRef.current
        .map(el => el?.getBoundingClientRect().width ?? 0)
        .reduce(
          (prev: number[], curr) => [
            ...prev,
            (prev[prev.length - 1] ?? 0) + curr + TAGS_GAP,
          ],
          [],
        ),
    );
  };

  const handleResize = () => {
    if (tagsCumulativeWidth) {
      const itemsToShow = tagsCumulativeWidth.findIndex(
        val => val + HIDDEN_ITEMS_TAG_WIDTH > width,
      );

      if (itemsToShow >= 0) {
        const itemsToRemove = tagsCumulativeWidth.length - itemsToShow;

        setShownItems(tagItems.slice(0, -itemsToRemove));
        setHiddenItems(tagItems.slice(-itemsToRemove));
      } else {
        setShownItems(tagItems);
        setHiddenItems([]);
      }
    }
  };

  const dropdownOptions = hiddenItems.map(item => ({
    label: item.id,
    value: item.id,
  }));

  const dropdownTrigger = (
    <Tag
      tagItem={{
        id: 'others',
        icon: <RiMoreFill className='h-5 w-5 inline' aria-hidden='true' />,
        className: 'rounded-2xl border-[1px]',
      }}
      current={hiddenItems.some(item => item.id === selectedTag)}
    />
  );

  const handleSelect = (id: string) => {
    const tag = tagItems.find(tag => tag.id === id);

    if (!isEmpty(tag)) {
      onTagClick(tag);
    }
  };

  return (
    <div className={'flex gap-2 w-fit'} data-testid='output-tags'>
      {shownItems.map((item, index) => (
        <Tag
          key={item.id}
          ref={el => (tagsRef.current[index] = el)}
          tagItem={item}
          onTagClick={() => onTagClick?.(item)}
          current={selectedTag === item.id}
        />
      ))}
      {hiddenItems.length > 0 && (
        <Dropdown
          testIdPrefix='hidden-tags'
          triggerElement={dropdownTrigger}
          options={dropdownOptions}
          selected={selectedTag}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}

export function Tags({ tagItems, onTagClick, selectedTag = '' }: TagsProps) {
  return (
    <AutoSizer disableHeight>
      {({ width }) => (
        <AutoSizedTags
          onTagClick={onTagClick}
          tagItems={tagItems}
          width={width}
          selectedTag={selectedTag}
        />
      )}
    </AutoSizer>
  );
}
