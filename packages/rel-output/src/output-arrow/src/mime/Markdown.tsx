import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';
import { Markdown as PureMarkdown } from '@relationalai/ui';

import { collectValues } from '../outputUtils';

type MarkdownProps = {
  relations: ArrowRelation[];
};

export default function Markdown({ relations }: MarkdownProps) {
  const values = collectValues<string>('/:text/:markdown/', relations);

  return (
    <div data-testid='markdown-mime' className='p-2'>
      <PureMarkdown value={values.join('\n')} />
    </div>
  );
}
