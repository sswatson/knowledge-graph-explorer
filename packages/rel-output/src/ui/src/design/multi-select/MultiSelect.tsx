import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';
import { Combobox, Transition } from '@headlessui/react';
import { ByComparator } from '@headlessui/react/dist/types';
import classNames from 'classnames';
import {
  ChangeEvent,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { HiSearch, HiSelector } from 'react-icons/hi';

import { Badge } from '../Badge';
import { MultiSelectOptions } from './MultiSelectOptions';

export type MultiSelectOption = {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
};

export type MultiSelectProps<T extends MultiSelectOption> = {
  // switch triggerElement and children
  testIdPrefix?: string;
  options: T[];
  // scroll height of the popper
  scrollHeight?: number;
  isLoading?: boolean;
  onSelect?: (options: T[]) => void;
  selectedOptions?: T[];
  name?: string;
  search?: (searchValue: string, option: T) => boolean;
  placeholderText?: string;
  triggerElement?: ReactNode;
  width?: 'auto' | 'match';
};

export function MultiSelect<T extends MultiSelectOption>({
  testIdPrefix,
  options,
  scrollHeight = 400,
  isLoading = false,
  onSelect,
  selectedOptions,
  name,
  search,
  placeholderText,
  triggerElement,
  width = 'auto',
}: MultiSelectProps<T>) {
  const listWidthRef = useRef<number | undefined>();
  const [searchValue, setSearchValue] = useState<string>('');

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(0),
      flip(),
      shift(),
      size({
        apply({ rects, elements }) {
          // Executing like this to avoid ResizeObserver loop limit exceeded error
          // TODO remove after floating-ui fixes this bug and package is updated
          // https://github.com/floating-ui/floating-ui/issues/1740#issuecomment-1540639488
          requestAnimationFrame(() => {
            Object.assign(
              elements.floating.style,
              width === 'auto'
                ? { maxWidth: 300, minWidth: `${rects.reference.width}px` }
                : { width: `${rects.reference.width}px` },
            );

            listWidthRef.current = elements.floating.offsetWidth;
          });
        },
      }),
    ],
  });

  const filteredOptions = useMemo(() => {
    const lowerCaseSearch = searchValue.toString().toLowerCase();

    if (!searchValue) {
      return options;
    } else if (typeof search === 'function') {
      return options.filter(o => search(searchValue, o));
    } else {
      return options.filter(o =>
        o.label.toLowerCase().includes(lowerCaseSearch),
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, options]);

  const triggerClassName = classNames(
    'flex flex-row justify-end text-sm items-center',
    'bg-white border rounded-md shadow-sm px-3 py-1 sm:text-sm text-left border-gray-300',
    'group-focus:ring-1 group-focus:ring-red-orange-500 group-focus:border-red-orange-500',
  );

  const trigger = triggerElement ?? (
    <div
      data-testid={`${testIdPrefix}-trigger-div`}
      className={triggerClassName}
    >
      <div className='flex-1 items-center flex gap-3 truncate'>
        {(!selectedOptions || selectedOptions.length == 0) && (
          <div className='text-gray-400 py-1'>{placeholderText}</div>
        )}
        {selectedOptions && selectedOptions.length > 0 && (
          <div className={'py-1'}>{selectedOptions[0].label}</div>
        )}
        {selectedOptions && selectedOptions.length > 1 && (
          <Badge color='orange'>{`+${selectedOptions.length - 1}`}</Badge>
        )}
      </div>
      <HiSelector className='h-5 w-5 text-gray-400 ml-3' aria-hidden='true' />
    </div>
  );

  const onSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const compareOptions: ByComparator<T> = useCallback(
    (optionA: T, optionB: T) => {
      return optionA.value === optionB.value;
    },
    [],
  );

  return (
    <Combobox
      multiple
      as='div'
      value={selectedOptions}
      onChange={options => onSelect && options && onSelect(options)}
      className='text-left'
      name={name}
      // doing `by={compareOptions}` causes typing error
      by={(a, b) => compareOptions(a, b)}
    >
      {({ open }) => (
        <>
          <Combobox.Button
            className='block group focus:outline-none focus-visible:outline-none'
            ref={refs.setReference}
            data-testid={`${testIdPrefix}-trigger-button`}
          >
            {trigger}
          </Combobox.Button>

          {createPortal(
            <div ref={refs.setFloating} className='z-50' style={floatingStyles}>
              <Transition
                show={open}
                appear
                enter='transition ease-out duration-100'
                enterFrom='transform opacity-0 scale-95'
                enterTo='transform opacity-100 scale-100'
                leave='transition ease-in duration-75'
                leaveFrom='transform opacity-100 scale-100'
                leaveTo='transform opacity-0 scale-95'
                afterLeave={() => {
                  setSearchValue('');
                }}
              >
                <MultiSelectOptions
                  testIdPrefix={testIdPrefix}
                  options={filteredOptions}
                  scrollHeight={scrollHeight}
                  isLoading={isLoading}
                  onSelect={onSelect}
                >
                  <div className='flex pl-3 items-center border-b'>
                    <HiSearch className='h-5 w-5 text-gray-500'></HiSearch>
                    <Combobox.Input
                      className='w-full flex-1 p-3 h-12 text-sm
                           border-none focus:outline-none focus:ring-0'
                      placeholder='Search...'
                      onChange={onSearchChange}
                      data-testid={`${testIdPrefix}-search-input`}
                    ></Combobox.Input>
                  </div>
                </MultiSelectOptions>
              </Transition>
            </div>,
            document.body,
          )}
        </>
      )}
    </Combobox>
  );
}
