import { Tooltip } from './Tooltip';

export type StatBarItem = {
  value: number;
  label: string;
  color?: string;
};

type StatBarProps = {
  items: StatBarItem[];
  format?: (value: number) => string;
  showTotal?: boolean;
};

// https://colorbrewer2.org/#type=qualitative&scheme=Set3&n=12
export const DEFAULT_COLORS = [
  '#a6cee3',
  '#fdbf6f',
  '#b2df8a',
  '#1f78b4',
  '#fb9a99',
  '#33a02c',
  '#e31a1c',
  '#cab2d6',
  '#ff7f00',
  '#6a3d9a',
  '#ffff99',
  '#b15928',
];

export function StatBar({ items, format, showTotal }: StatBarProps) {
  items = items.map(item => ({ ...item, value: item.value }));
  const total = items.reduce((s, item) => s + item.value, 0);

  const getColor = (n: number) => {
    return DEFAULT_COLORS[n % DEFAULT_COLORS.length];
  };

  const renderItem = (item: StatBarItem, index: number) => {
    const tooltipText = `${item.label}: ${
      format ? format(item.value) : item.value
    }`;

    return (
      <Tooltip key={item.label} text={tooltipText} placement='top' delay={0}>
        <div
          title={tooltipText}
          className='h-full'
          style={{
            width: `${(item.value / total) * 100}%`,
            // this screws up the proportions a litte
            // but othewise is could be so small that you can't see it
            // for example if you have items like 1 and 10000000
            minWidth: '10px',
            background: item.color || getColor(index),
          }}
        ></div>
      </Tooltip>
    );
  };

  return (
    <div className='flex items-center gap-1'>
      <div className='h-4 flex-1 flex rounded-sm overflow-hidden'>
        {items.map((item, index) => renderItem(item, index))}
      </div>
      {showTotal && <div>{format ? format(total) : total}</div>}
    </div>
  );
}
