import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';
import { Combobox, Transition } from '@headlessui/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import classNames from 'classnames';
import {
  ChangeEvent,
  ComponentType,
  createContext,
  ReactNode,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';

import { DropdownInput } from './DropdownInput';
import { Spinner } from './Spinner';

type DropdownContextValue = {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  testIdPrefix?: string;
  displayValue?: string;
  placeholderText?: string;
  disabled?: boolean;
};

export const DropdownContext = createContext<DropdownContextValue>({
  onChange: () => {},
  testIdPrefix: 'dropdown',
});

export type OptionComponentProps<T extends DropdownOptionProps> = {
  option: T;
  selected?: boolean;
  active?: boolean;
};

export type DropdownOptionProps = {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
};

export type DropdownProps<T extends DropdownOptionProps> = {
  // switch triggerElement and children
  children?: ReactNode;
  triggerElement?: ReactNode;
  emptyElement?: ReactNode;
  OptionComponent?: ComponentType<OptionComponentProps<T>>;
  testIdPrefix?: string;
  width?: 'match' | 'auto';
  disabled?: boolean;
  options: T[];
  estimateSize?: (option: T, width: number) => number;
  // scroll height of the popper
  scrollHeight?: number;
  isLoading?: boolean;
  onSelect?: (value: T['value'], option: T) => void;
  selected?: T['value'];
  onOpen?: Function;
  name?: string;
  displayValue?: string;
  search?: boolean | ((searchValue: string, option: T) => boolean);
  placeholderText?: string;
};

export function Dropdown<T extends DropdownOptionProps>({
  children,
  triggerElement,
  emptyElement,
  OptionComponent = DropdownOption,
  testIdPrefix,
  width = 'match',
  disabled = false,
  options,
  scrollHeight = 400,
  estimateSize,
  isLoading = false,
  onSelect,
  selected,
  onOpen,
  name,
  search = false,
  displayValue,
  placeholderText,
}: DropdownProps<T>) {
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
            width === 'match' &&
              Object.assign(elements.floating.style, {
                width: `${rects.reference.width}px`,
              });

            listWidthRef.current = elements.floating.offsetWidth;
          });
        },
      }),
    ],
  });

  const filteredOptions = useMemo(() => {
    const lowerCaseSearch = searchValue.toString().toLowerCase();

    if (!search) {
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

  const currentWidthRef = listWidthRef.current;
  const estimate =
    estimateSize && currentWidthRef
      ? (index: number) => estimateSize(options[index], currentWidthRef)
      : () => 36;

  const selectedOption = filteredOptions.find(o => o.value === selected);

  let trigger: ReactNode;

  const triggerClassName = classNames(
    'text-left focus:outline-none h-full w-full',
    disabled && 'bg-gray-200 cursor-not-allowed opacity-70',
    !disabled && 'hover:bg-gray-50 bg-white',
    'border-2 px-2 py-1 border-gray-100 rounded-md',
    'flex flex-row justify-end',
  );

  if (search && !triggerElement) {
    trigger = (
      <div
        data-testid={`${testIdPrefix}-trigger-div`}
        className={triggerClassName}
      >
        <DropdownInput />
        <RiArrowDownSLine className='h-5 w-5' />
      </div>
    );
  } else if (triggerElement) {
    trigger = triggerElement;
  } else {
    trigger = (
      <div
        data-testid={`${testIdPrefix}-trigger-div`}
        className={triggerClassName}
      >
        <div className='flex-1 truncate'>{selectedOption?.label}</div>
        <RiArrowDownSLine className='h-5 w-5' />
      </div>
    );
  }

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchValue(event.target.value);
  };

  const contextValue = {
    onChange,
    testIdPrefix,
    placeholderText,
    displayValue,
    disabled,
  };

  return (
    <DropdownContext.Provider value={contextValue}>
      <Combobox
        as='div'
        value={selectedOption || null}
        onChange={option =>
          onSelect && option && onSelect(option.value, option)
        }
        disabled={disabled}
        className='text-left'
        nullable
        name={name}
      >
        {({ open }) => (
          <>
            <div ref={refs.setReference}>
              <Combobox.Button
                className='block group focus:outline-none focus-visible:outline-none w-full'
                data-testid={`${testIdPrefix}-trigger-button`}
              >
                {trigger}
                {/* it's necessary to keep accessibility and make keyboard navigation work */}

                {!search && (
                  <div className='w-0 h-0 overflow-hidden'>
                    <Combobox.Input className='caret-transparent' />
                  </div>
                )}
              </Combobox.Button>
            </div>

            {open &&
              createPortal(
                <div
                  ref={refs.setFloating}
                  className='z-50'
                  style={floatingStyles}
                >
                  <Transition
                    show={true}
                    appear
                    enter='transition ease-out duration-100'
                    enterFrom='transform opacity-0 scale-95'
                    enterTo='transform opacity-100 scale-100'
                    leave='transition ease-in duration-75'
                    leaveFrom='transform opacity-100 scale-100'
                    leaveTo='transform opacity-0 scale-95'
                    afterEnter={() => {
                      onOpen && onOpen();
                    }}
                    afterLeave={() => {
                      setSearchValue('');
                    }}
                  >
                    <DropdownOptions
                      testIdPrefix={testIdPrefix}
                      options={filteredOptions}
                      estimateSize={estimate}
                      scrollHeight={scrollHeight}
                      isLoading={isLoading}
                      emptyElement={emptyElement}
                      OptionComponent={OptionComponent}
                    >
                      {children}
                    </DropdownOptions>
                  </Transition>
                </div>,
                document.body,
              )}
          </>
        )}
      </Combobox>
    </DropdownContext.Provider>
  );
}

function DropdownOption({
  option,
  active,
  selected,
}: OptionComponentProps<DropdownOptionProps>) {
  const { label, disabled } = option;

  const defaultProps = {
    'aria-label': label,
    'data-testid': `dropdown-item-${label}`,
    'aria-checked': selected,
    className: classNames(
      'px-3 py-2 w-full flex text-left cursor-default',
      { 'cursor-not-allowed': disabled },
      { 'hover:bg-red-orange-100': !disabled },
      { 'text-red-orange-900 font-semibold': selected },
      { 'text-gray-600': !selected },
      { 'bg-red-orange-100 text-gray-900': active },
    ),
  };

  return (
    <span {...defaultProps}>
      <span
        className={classNames('text-sm flex-1 break-all', {
          'text-gray-400': disabled,
        })}
      >
        {label}
      </span>

      <span className='flex-none w-5'>
        {selected && (
          <RiCheckLine
            className='h-5 w-5 mr-2 text-red-orange-700'
            aria-hidden='true'
          />
        )}
      </span>
    </span>
  );
}

type DropdownOptionsProps<T extends DropdownOptionProps> = {
  testIdPrefix?: string;
  children?: ReactNode;
  emptyElement?: ReactNode;
  estimateSize: (i: number) => number;
  options: T[];
  scrollHeight: number;
  isLoading?: boolean;
  OptionComponent: ComponentType<OptionComponentProps<T>>;
};

function DropdownOptions<T extends DropdownOptionProps>({
  testIdPrefix,
  options,
  children,
  estimateSize,
  scrollHeight,
  isLoading,
  emptyElement,
  OptionComponent,
}: DropdownOptionsProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const count = options.length;
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize,
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
          className='rounded-none rounded-b-md divide-y divide-gray-200'
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
                  <OptionComponent
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
      emptyElement || (
        <div className='flex flex-col justify-center items-center align-middle h-full mx-10 p-4'>
          <p className='text-gray-400'>No options found</p>
        </div>
      )
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
    </Combobox.Options>
  );
}
