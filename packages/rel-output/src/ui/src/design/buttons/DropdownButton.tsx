import { Placement } from '@floating-ui/react';
import classNames from 'classnames';
import { FC, ReactNode, SVGProps } from 'react';
import { RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';

import { Dropdown, DropdownProps, OptionComponentProps } from '../Dropdown';
import { Tooltip } from '../Tooltip';
import {
  Button,
  ButtonProps,
  buttonSharedClasses,
  buttonTypeClasses,
  sizeClasses,
} from './Button';

type DropdownButtonProps<T extends DropdownButtonOptionProps> = ButtonProps &
  Omit<
    DropdownProps<T>,
    'triggerElement' | 'testIdPrefix' | 'width' | 'children'
  > & {
    buttonTooltipText: string;
    buttonTooltipPlacement?: Placement;
    dropdownTooltipText: string;
    dropdownTooltipPlacement?: Placement;
    dropdownChildren?: ReactNode;
  };

export const DropdownButton = <T extends DropdownButtonOptionProps>({
  size = 'default',
  type = 'primary',
  children,
  className,
  htmlType = 'button',
  loading,

  OptionComponent = DropdownButtonOption,
  width = 'auto',
  options,
  onOpen,
  estimateSize,
  scrollHeight,
  isLoading,
  onSelect,
  selected,
  disabled,
  emptyElement,

  buttonTooltipText,
  buttonTooltipPlacement,
  dropdownTooltipText,
  dropdownTooltipPlacement,
  dropdownChildren,

  ...props
}: DropdownButtonProps<T>) => {
  const triggerElement = (
    <Tooltip text={dropdownTooltipText} placement={dropdownTooltipPlacement}>
      <div
        className={classNames(
          buttonSharedClasses.button,
          sizeClasses[size].button,
          buttonTypeClasses[type].button,
          'ml-0 rounded-l-none border-l-0 px-1.5 focus:ring-0 focus:ring-offset-0 h-full',
        )}
      >
        <RiArrowDownSLine className='w-4 h-4' />
      </div>
    </Tooltip>
  );

  return (
    <span className={classNames('flex', className)}>
      <Tooltip text={buttonTooltipText} placement={buttonTooltipPlacement}>
        <Button
          size={size}
          type={type}
          htmlType={htmlType}
          loading={loading}
          className='flex-1 justify-center mr-0 rounded-r-none border-r-0 focus:ring-0 focus:ring-offset-0'
          disabled={disabled}
          {...props}
        >
          {children}
        </Button>
      </Tooltip>

      <Dropdown
        triggerElement={triggerElement}
        OptionComponent={OptionComponent}
        disabled={disabled}
        testIdPrefix='dropdown-button'
        options={options}
        width={width}
        onOpen={onOpen}
        estimateSize={estimateSize}
        scrollHeight={scrollHeight}
        isLoading={isLoading}
        onSelect={onSelect}
        selected={selected}
        emptyElement={emptyElement}
      >
        {dropdownChildren}
      </Dropdown>
    </span>
  );
};

type DropdownButtonOptionProps = {
  label: string;
  value: string | number | boolean;
  icon?: FC<SVGProps<SVGSVGElement>>;
  disabled?: boolean;
  active?: boolean;
  tooltipText: string;
};

function DropdownButtonOption<T extends DropdownButtonOptionProps>({
  option,
  selected,
  active,
}: OptionComponentProps<T>) {
  const { label, disabled, icon, tooltipText } = option;

  const Icon = icon;

  const defaultProps = {
    'aria-label': label,
    'data-testid': `dropdown-button-option-${label}`,
    className: classNames('px-3 py-2 w-full block text-left', {
      'cursor-not-allowed': disabled,
      'hover:bg-red-orange-100': !disabled,
      'text-red-orange-900': selected,
      'text-gray-600': !selected,
      'bg-red-orange-100 text-gray-900': active,
    }),
  };

  return (
    <span {...defaultProps}>
      <Tooltip text={tooltipText} placement='right'>
        <div className='flex justify-between align-middle'>
          <div className='flex flex-1'>
            {Icon && (
              <Icon
                data-testid='icon'
                className='h-5 w-5 mr-3 bg-cover flex-none'
              />
            )}

            <span
              className={classNames('text-sm', {
                'text-gray-400': disabled,
              })}
            >
              {label}
            </span>
          </div>

          {selected && (
            <RiCheckLine
              data-testid='selected-icon'
              className='h-5 w-5 mx-2 text-red-orange-700 min-w-0'
              aria-hidden='true'
            />
          )}
        </div>
      </Tooltip>
    </span>
  );
}
