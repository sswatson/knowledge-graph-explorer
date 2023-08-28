import classNames from 'classnames';
import { SVGProps } from 'react';

const sizeMap = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
};

type SpinnerProps = SVGProps<SVGSVGElement> & {
  className?: string;
  size?: keyof typeof sizeMap;
};

export function Spinner({
  size = 'md',
  className = '',
  ...props
}: SpinnerProps) {
  return (
    <svg
      className={classNames(
        sizeMap[size],
        'animate-spin text-red-orange-900',
        className,
      )}
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      data-testid='spinner'
      {...props}
    >
      <circle
        className='opacity-25'
        cx='12'
        cy='12'
        r='10'
        stroke='currentColor'
        strokeWidth='4'
      ></circle>
      <path
        className='opacity-75'
        fill='currentColor'
        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
      ></path>
    </svg>
  );
}
