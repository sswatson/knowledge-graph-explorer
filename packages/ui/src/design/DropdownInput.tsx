import { Combobox } from '@headlessui/react';
import { useContext } from 'react';

import { DropdownContext } from './Dropdown';

export type DropdownInputProps = {
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function DropdownInput({
  className,
  onFocus,
  onBlur,
}: DropdownInputProps) {
  const { onChange, testIdPrefix, placeholderText, displayValue } = useContext(
    DropdownContext,
  );

  return (
    <Combobox.Input
      autoComplete='off'
      spellCheck='false'
      data-testid={`${testIdPrefix}-input`}
      name={`${testIdPrefix}-input`}
      className={
        className ||
        'p-0 border-none rounded-md w-full focus:outline-none focus:ring-0 bg-transparent flex-1 truncate'
      }
      displayValue={() => displayValue || ''}
      onChange={onChange}
      placeholder={placeholderText}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}
