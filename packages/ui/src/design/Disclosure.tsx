import { Disclosure as HeadlessuiDisclosure } from '@headlessui/react';
import classNames from 'classnames';
import { ReactNode } from 'react';
import { RiArrowUpSLine } from 'react-icons/ri';

export const disclosureTypeClasses = {
  primary: {
    button: 'text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-4',
    icon: 'text-indigo-500',
  },
  white: {
    button: 'text-gray-700 bg-white hover:bg-gray-50 px-2',
    icon: 'text-gray-700',
  },
};

type DisclosureProps = {
  title: ReactNode;
  children: ReactNode;
  type?: 'primary' | 'white';
  defaultOpen?: boolean;
};

export function Disclosure({
  title,
  type = 'primary',
  children,
  defaultOpen = true,
}: DisclosureProps) {
  return (
    <HeadlessuiDisclosure defaultOpen={defaultOpen} as='div'>
      {({ open }) => (
        <>
          <HeadlessuiDisclosure.Button
            className={classNames(
              'flex w-full py-2',
              'text-sm font-medium text-left',
              'rounded-md focus-visible:ring-opacity-75 focus-visible:ring-indigo-500',
              'focus:outline-none focus-visible:ring',
              'dark:text-indigo-200 dark:hover:bg-indigo-700',
              disclosureTypeClasses[type].button,
            )}
          >
            <RiArrowUpSLine
              className={classNames(
                'w-5 h-5 mr-2',
                disclosureTypeClasses[type].icon,
                open ? 'transform rotate-180' : 'transform rotate-90',
              )}
            />
            {title}
          </HeadlessuiDisclosure.Button>
          <HeadlessuiDisclosure.Panel className='px-1 py-2'>
            {children}
          </HeadlessuiDisclosure.Panel>
        </>
      )}
    </HeadlessuiDisclosure>
  );
}
