import { Combobox } from '@headlessui/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import classNames from 'classnames';
import { ReactNode, useRef } from 'react';

import { Button } from '../buttons/Button';
import { Spinner } from '../Spinner';
import { MultiSelectOption as Option } from './MultiSelect';
import { MultiSelectOption } from './MultiSelectOption';

type MultiSelectOptionsProps<T extends Option> = {
  testIdPrefix?: string;
  children?: ReactNode;
  emptyElement?: ReactNode;
  options: T[];
  scrollHeight: number;
  isLoading?: boolean;
  onSelect?: (options: T[]) => void;
};

export function MultiSelectOptions<T extends Option>({
  testIdPrefix,
  options,
  scrollHeight,
  isLoading,
  children,
  onSelect,
}: MultiSelectOptionsProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const count = options.length;
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  const listElement =
    count > 0 ? (
      <div
        style={{
          height: virtualizer.getTotalSize(),
        }}
        data-testid={`${testIdPrefix}-list`}
      >
        <div
          style={{
            transform: `translateY(${items[0].start}px)`,
          }}
          className='rounded-none rounded-b-md'
        >
          {items.map(item => {
            const { index, key } = item;

            return (
              <Combobox.Option
                key={key}
                data-index={index}
                ref={virtualizer.measureElement}
                value={options[index]}
                disabled={options[index]?.disabled}
              >
                {({ active, selected }) => (
                  <MultiSelectOption
                    active={active}
                    selected={selected}
                    option={options[index]}
                  />
                )}
              </Combobox.Option>
            );
          })}
        </div>
      </div>
    ) : (
      <div className='flex flex-col justify-center items-center align-middle h-full mx-10 p-4'>
        <p className='text-gray-400'>No options found</p>
      </div>
    );

  return (
    <Combobox.Options
      static
      className={classNames(
        'rounded-md overflow-hidden shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none',
      )}
      data-testid={`${testIdPrefix}-options`}
    >
      {children}
      <div
        ref={parentRef}
        style={{
          maxHeight: scrollHeight,
          overflowY: 'auto',
        }}
        data-testid={`${testIdPrefix}-scroll-element`}
      >
        {isLoading ? (
          <div className='flex items-center justify-center py-3'>
            <Spinner />
          </div>
        ) : (
          listElement
        )}
      </div>
      <div className='w-full flex items-center rounded-[0] border-t h-12 '>
        <Button
          type='secondary'
          className='text-red-orange-900 font-medium border-none hover:bg-transparent shadow-none'
          onClick={() => {
            onSelect && onSelect([]);
          }}
        >
          Uncheck all
        </Button>
      </div>
    </Combobox.Options>
  );
}
