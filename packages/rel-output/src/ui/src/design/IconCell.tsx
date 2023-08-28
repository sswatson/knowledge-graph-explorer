import classNames from 'classnames';
import { MouseEventHandler } from 'react';
import { IconType } from 'react-icons';

type IconCellProps = {
  onClick: Function;
  Icon: IconType;
  iconSize?: 'default' | 'sm' | 'md';
  color?: string;
  dataTestId?: string;
};

export const iconCellSizeClasses = {
  default: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
};

export const IconCell = ({
  Icon,
  iconSize = 'default',
  color = 'text-gray-400',
  onClick,
  dataTestId,
}: IconCellProps) => {
  const handleClick: MouseEventHandler<HTMLButtonElement> = e => {
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      type='button'
      className={classNames(
        'text-xs flex items-center w-full h-full justify-center hover:text-red-orange-900',
        color && color,
      )}
      data-testid={dataTestId}
      onClickCapture={handleClick}
    >
      <Icon
        className={classNames(
          iconSize
            ? iconCellSizeClasses[iconSize]
            : iconCellSizeClasses.default,
        )}
      />
    </button>
  );
};
