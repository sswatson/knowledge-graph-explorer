import { Switch } from '@headlessui/react';
import classNames from 'classnames';
import { ReactNode } from 'react';

type SwitchProps = {
  value: boolean;
  label?: ReactNode | string;
  onChange: (v: boolean) => void;
};

export function PureSwitch({ value, label, onChange }: SwitchProps) {
  return (
    <Switch.Group as='div' className='flex items-center'>
      {label && (
        <Switch.Label as='span' className='mr-2'>
          <span className='text-xxs'>{label}</span>
        </Switch.Label>
      )}
      <Switch
        checked={value}
        onChange={onChange}
        className={classNames(
          value ? 'bg-gray-600' : 'bg-gray-200',
          'relative inline-flex flex-shrink-0 h-6 w-12 border-2 border-transparent',
          'rounded-full cursor-pointer transition-colors ease-in-out duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500',
        )}
      >
        <span
          className={classNames(
            'absolute top-[.5em] font-bold text-xxs',
            value ? 'left-1 text-gray-200' : 'right-0.5 text-gray-400',
          )}
        >
          {value ? 'ON' : 'OFF'}
        </span>
        <span
          aria-hidden='true'
          className={classNames(
            value ? 'translate-x-6' : 'translate-x-0',
            'pointer-events-none inline-block h-5 w-5 rounded-full',
            'bg-white shadow transform ring-0 transition ease-in-out duration-200',
          )}
        />
      </Switch>
    </Switch.Group>
  );
}
