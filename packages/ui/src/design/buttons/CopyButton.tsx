import { Placement } from '@floating-ui/react';
import classNames from 'classnames';
import { MouseEvent, useEffect, useState } from 'react';
import { RiCheckboxMultipleBlankLine } from 'react-icons/ri';

import { copyToClipboard } from '@relationalai/utils';

import { Tooltip } from '../Tooltip';

export const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-7 w-7',
};

type CopyButtonProps = {
  onCopy: () => string;
  tooltipText?: string;
  placement?: Placement;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children?: JSX.Element;
};

export function CopyButton({
  onCopy,
  className,
  size = 'md',
  placement = 'top',
  tooltipText = 'Copy',
  children,
  ...props
}: CopyButtonProps) {
  const [_tooltipText, setTooltipText] = useState(tooltipText);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    if (!tooltipVisible) {
      setTooltipText(tooltipText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tooltipVisible]);

  const handleCopy = async (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    const value = onCopy();

    await copyToClipboard(value);

    setTooltipText('Copied!');
  };

  return (
    <div className='flex items-center'>
      <Tooltip
        text={_tooltipText}
        placement={placement}
        onVisibleChange={setTooltipVisible}
      >
        <button
          type='button'
          data-testid='copy-button'
          className={classNames(
            'text-gray-500 hover:text-orange-500 z-10 cursor-pointer',
            className,
          )}
          onClick={handleCopy}
          {...props}
        >
          <RiCheckboxMultipleBlankLine className={iconSizes[size]} />
          {children}
        </button>
      </Tooltip>
    </div>
  );
}
