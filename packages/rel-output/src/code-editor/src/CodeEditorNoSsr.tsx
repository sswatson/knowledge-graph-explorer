import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

const CodeEditor = dynamic(() => import('./CodeEditor'), {
  ssr: false,
});

export function CodeEditorNoSsr(props: ComponentProps<typeof CodeEditor>) {
  return <CodeEditor {...props} />;
}
