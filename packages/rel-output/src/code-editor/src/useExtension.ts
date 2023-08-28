import { Compartment, Extension, StateEffect } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useEffect, useMemo } from 'react';

import { safeDispatch } from './utils';

export function useExtension(
  view: EditorView | null,
  extensionCreator: () => Extension,
  deps: any[],
) {
  const compartment = useMemo(() => new Compartment(), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const extension = useMemo(extensionCreator, deps);

  useEffect(() => {
    if (view) {
      if (!compartment.get(view.state)) {
        safeDispatch(view, {
          effects: StateEffect.appendConfig.of(compartment.of(extension)),
        });
      } else {
        safeDispatch(view, { effects: compartment.reconfigure(extension) });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, extension]);
}
