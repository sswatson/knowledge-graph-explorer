import classNames from 'classnames';
import { ReactNode, useState } from 'react';
import { IoInformation, IoInformationCircle, IoWarning } from 'react-icons/io5';
import { RiArrowDownSLine, RiErrorWarningFill } from 'react-icons/ri';

const ALERT_TYPES = {
  message: {
    textColor: 'text-gray-500',
    backgroundColor: 'bg-gray-50',
    icon: <IoInformation className='w-5 h-5' />,
  },
  info: {
    textColor: 'text-sky-600',
    backgroundColor: 'bg-sky-50',
    icon: <IoInformationCircle className='w-5 h-5' />,
  },
  error: {
    textColor: 'text-red-500',
    backgroundColor: 'bg-red-50',
    icon: <RiErrorWarningFill className='w-5 h-5 text-red-400' />,
  },
  warning: {
    textColor: 'text-yellow-600',
    backgroundColor: 'bg-orange-50',
    icon: <IoWarning className='w-5 h-5' />,
  },
};

type CollapsibleAlertProps = {
  header: ReactNode;
  children: ReactNode;
  type?: keyof typeof ALERT_TYPES;
};

export function CollapsibleAlert({
  header,
  children,
  type = 'error',
}: CollapsibleAlertProps) {
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const toggleCollapsed = () => setCollapsed(!collapsed);

  return (
    <div
      role='button'
      onClick={toggleCollapsed}
      onKeyDown={e => e.key === 'Enter' && toggleCollapsed()}
      tabIndex={0}
      className={classNames(
        ALERT_TYPES[type].backgroundColor,
        ALERT_TYPES[type].textColor,
      )}
    >
      <div className={'flex w-full text-left text-sm'}>
        <div
          data-testid={'alert-collapse-btn'}
          className='w-12 flex-none self-stretch flex flex-col items-center py-2 justify-between'
        >
          {ALERT_TYPES[type].icon}
          <RiArrowDownSLine
            className={classNames(
              'w-5 h-5 duration-500 transition-all',
              !collapsed && 'origin-center rotate-180',
            )}
          ></RiArrowDownSLine>
        </div>
        <div className='p-2 grow inline-block'>{header}</div>
      </div>
      <div
        data-testid='alert-children'
        className={classNames(
          'duration-500 transition-all overflow-y-hidden px-4 text-sm',
          collapsed && 'max-h-0',
          !collapsed && 'max-h-screen',
        )}
      >
        {children}
      </div>
    </div>
  );
}
