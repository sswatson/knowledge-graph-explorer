import classNames from 'classnames';

const ColorMap = {
  red: 'bg-red-100 text-red-900',
  blue: 'bg-blue-100 text-blue-900',
  gray: 'bg-gray-100 text-gray-500',
  green: 'bg-green-100 text-green-900',
  indigo: 'bg-indigo-100 text-indigo-900',
  orange: 'bg-orange-100 text-orange-600',
  yellow: 'bg-yellow-100 text-yellow-700',
};

type colorType = keyof typeof ColorMap;

type BadgeProps = {
  color?: colorType;
  className?: string;
  children: string | JSX.Element;
};

export function Badge({
  color = 'gray',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      data-testid='badge'
      className={classNames(
        `inline-block text-xs px-2 font-medium ${ColorMap[color]} rounded-md py-1`,
        className,
      )}
    >
      {children}
    </span>
  );
}
