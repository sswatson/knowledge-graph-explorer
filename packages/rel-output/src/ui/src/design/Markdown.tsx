import 'katex/dist/katex.css';

import { sanitize } from 'dompurify';
import Katex from 'katex';
import { marked } from 'marked';
import extendedLatex from 'marked-extended-latex';

import { ErrorAlert } from './ErrorAlert';

type MarkdownProps = {
  value: string;
};

const options = {
  render: (formula: string, displayMode: boolean) => {
    return Katex.renderToString(formula, { displayMode, output: 'html' });
  },
};

marked.use(extendedLatex(options));

export function Markdown({ value }: MarkdownProps) {
  let error: Error | undefined = undefined;
  let html = '';

  try {
    html = sanitize(marked(value || ''));
  } catch (error_: any) {
    if (error_.name === 'ParseError') {
      error = error_;
    } else {
      throw error_;
    }
  }

  if (error) {
    const errorMsg = error.message.replace(
      'Please report this to https://github.com/markedjs/marked.',
      '',
    );

    return <ErrorAlert error={errorMsg} />;
  }

  return (
    <div
      className='prose max-w-none overflow-visible mb-2'
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
