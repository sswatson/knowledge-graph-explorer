import { capitalize, startCase } from 'lodash-es';
import React from 'react';
import { RiArrowDownSLine } from 'react-icons/ri';

import { Dropdown, Tooltip } from '@relationalai/ui';

import { DisplayMode } from './DisplayMode';

export type DisplayModeOption = {
  label: string;
  value: DisplayMode;
};

const defaultOptions: DisplayModeOption[] = [
  {
    label: 'Logical',
    value: DisplayMode.LOGICAL,
  },
  {
    label: 'Physical',
    value: DisplayMode.PHYSICAL,
  },
  {
    label: 'Raw',
    value: DisplayMode.RAW,
  },
  {
    label: 'Partitioned (Horizontal)',
    value: DisplayMode.PARTITIONED_HORIZONTAL,
  },
  {
    label: 'Partitioned (Vertical)',
    value: DisplayMode.PARTITIONED_VERTICAL,
  },
];

type DisplayModeSelectProps = {
  mode: DisplayMode;
  options?: DisplayModeOption[];
  onModeChange: (mode: DisplayMode) => void;
};

export function DisplayModeSelect({
  mode,
  onModeChange,
  options = defaultOptions,
}: DisplayModeSelectProps) {
  const triggerElement = (
    <Tooltip text='Display mode'>
      <div
        data-testid='display-mode-select-trigger'
        className='flex gap-2 text-gray-900 items-center justify-end text-[0.9rem] transition-opacity duration-500 ease-in-out opacity-60 hover:opacity-100'
      >
        <div className='truncate'>{capitalize(startCase(mode))}</div>
        <RiArrowDownSLine className='h-5 w-5' />
      </div>
    </Tooltip>
  );

  return (
    <Dropdown<DisplayModeOption>
      testIdPrefix='display-mode'
      triggerElement={triggerElement}
      options={options}
      selected={mode}
      onSelect={value => onModeChange(value)}
      width='auto'
    />
  );
}
