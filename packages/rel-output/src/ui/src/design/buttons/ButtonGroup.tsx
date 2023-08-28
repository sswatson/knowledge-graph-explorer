import classNames from 'classnames';
import { startCase } from 'lodash-es';
import { useState } from 'react';

import { Button } from './Button';

type ButtonGroupProps = {
  selected?: string;
  onSelect?: (val: string) => void;
  options: { value: string; label: string }[];
};

export function ButtonGroup({
  options,
  selected,
  onSelect,
  ...props
}: ButtonGroupProps) {
  const [selectedOption, setSelectedOption] = useState<string | undefined>(
    selected,
  );

  return (
    <span className='isolate inline-flex shadow-sm' {...props}>
      {options.map((option, index) => (
        <Button
          key={index}
          type={selectedOption === option.value ? 'primary' : 'secondary'}
          aria-checked={selectedOption === option.value}
          className={classNames(
            '-ml-px',
            !index
              ? 'rounded-l-md rounded-r-none' // Left most
              : index === options.length - 1
              ? 'rounded-r-md rounded-l-none' // Right most
              : 'rounded-l-none rounded-r-none', // In the middle
          )}
          onClick={() => {
            if (option.value !== selectedOption) {
              onSelect && onSelect(option.value);
              setSelectedOption(option.value);
            }
          }}
        >
          {startCase(option.label)}
        </Button>
      ))}
    </span>
  );
}
