import classNames from 'classnames';

type PanelHeaderProps = {
  title?: string;
  children?: JSX.Element | JSX.Element[];
  actions?: JSX.Element | JSX.Element[];
  className?: string;
};

export function PanelHeader({
  title,
  children,
  actions,
  className,
  ...props
}: PanelHeaderProps) {
  const leftSide = children || (
    <h1 className='h-full flex items-center text-sm uppercase font-bold text-gray-400 truncate px-6'>
      {title}
    </h1>
  );

  return (
    <div
      className={classNames(
        'flex justify-between items-center bg-gray-100',
        className,
      )}
      {...props}
    >
      <div className='flex-auto h-12 z-10'>{leftSide}</div>
      {actions && (
        <div className='flex-initial flex flex-col justify-center px-2'>
          {actions}
        </div>
      )}
    </div>
  );
}
