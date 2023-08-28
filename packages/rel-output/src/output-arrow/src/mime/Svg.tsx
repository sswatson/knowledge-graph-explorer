import { sanitize } from 'dompurify';

import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';

import { collectValues } from '../outputUtils';

type SvgProps = {
  relations: ArrowRelation[];
};

export default function Svg({ relations }: SvgProps) {
  const value = collectValues('/:image/:svg/', relations).join('\n').trim();

  const displayValue = value.startsWith('<svg')
    ? sanitize(value)
    : sanitize(`<svg xmlns='http://www.w3.org/2000/svg'>${value}</svg>`);

  return (
    <div
      data-testid='svg-mime'
      role='img'
      className='prose max-w-none overflow-visible'
      dangerouslySetInnerHTML={{
        __html: displayValue,
      }}
    />
  );
}
