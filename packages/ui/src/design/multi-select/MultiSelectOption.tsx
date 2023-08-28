import classNames from 'classnames';

import input from '../../form/Input';
import { MultiSelectOption as Option } from './MultiSelect';

type MultiSelectOptionProps<T extends Option> = {
  option: T;
  selected?: boolean;
  active?: boolean;
};

export function MultiSelectOption({
  option,
  active,
  selected,
}: MultiSelectOptionProps<Option>) {
  const { label, disabled } = option;

  const defaultProps = {
    role: 'option',
    'aria-label': label,
    'data-testid': `multiselect-item-${label}`,
    'aria-checked': selected,
    className: classNames(
      'px-3 py-2 w-full flex text-left cursor-default flex gap-3 items-center text-gray-600',
      { 'cursor-not-allowed': disabled },
      { 'hover:bg-red-orange-100': !disabled },
      { 'bg-red-orange-100 text-gray-900': active },
    ),
  };

  return (
    <div {...defaultProps}>
      <input
        type='checkbox'
        className={classNames(
          'h-5 w-5 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:ring-0 text-red-orange-900 border-gray-300',
        )}
        checked={selected}
        disabled={disabled}
        onChange={() => {}}
      />
      <span
        className={classNames('text-sm text-bold flex-1 truncate', {
          'text-gray-400': disabled,
        })}
      >
        {label}
      </span>
    </div>
  );
}
