import { sanitize } from 'dompurify';

import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';

import { collectValues } from '../outputUtils';

type HtmlProps = {
  relations: ArrowRelation[];
};

export default function Html({ relations }: HtmlProps) {
  const values = collectValues<string>('/:text/:html/', relations);

  return (
    <div
      data-testid='html-mime'
      className='prose max-w-none overflow-visible'
      dangerouslySetInnerHTML={{
        __html: sanitize(values.join('\n')),
      }}
    />
  );
}
