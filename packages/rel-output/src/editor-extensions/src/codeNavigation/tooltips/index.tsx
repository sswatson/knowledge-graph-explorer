import { createRoot } from 'react-dom/client';

import {
  showTooltip,
  StateEffect,
  StateField,
  Tooltip,
  TooltipView,
  ViewUpdate,
} from '@relationalai/code-editor';

import { RelationReference } from '../../types';
import { MessageTooltip } from './MessageTooltip';
import { ReferencesTooltip } from './ReferencesTooltip';

type ReferencesTooltipField = Tooltip & {
  onRefSelect?: (ref: RelationReference) => void;
  refs: RelationReference[];
  selectedIndex: number;
};

export const notFoundTooltipEffect = StateEffect.define<
  | {
      pos: number;
      isShown: true;
    }
  | { isShown: false }
>();

export const referencesTooltipEffect = StateEffect.define<
  | {
      pos: number;
      refs: RelationReference[];
      onRefClick?: (ref: RelationReference) => void;
      isShown: true;
    }
  | {
      isShown: false;
    }
>();

export const setSelectedReference = StateEffect.define<number>();

function createNotFoundTooltip(pos: number): Tooltip {
  return {
    pos,
    above: true,
    strictSide: true,
    arrow: true,
    create: (): TooltipView => {
      const dom = document.createElement('div');
      const tooltipRoot = createRoot(dom);

      return {
        dom,
        mount: () => {
          tooltipRoot.render(<MessageTooltip text='Definition not found' />);
        },
        destroy: () => {
          tooltipRoot.unmount();
        },
      };
    },
  };
}

function createReferencesTooltip(
  pos: number,
  refs: RelationReference[],
  onRefClick?: (ref: RelationReference) => void,
): ReferencesTooltipField {
  return {
    pos,
    above: true,
    strictSide: true,
    arrow: false,
    selectedIndex: 0,
    refs,
    onRefSelect: onRefClick,
    create: (): TooltipView => {
      const dom = document.createElement('div');

      dom.style.padding = '0';
      dom.style.borderRadius = '5px';
      const tooltipRoot = createRoot(dom);

      return {
        dom,
        mount: () => {
          tooltipRoot.render(
            <ReferencesTooltip
              refs={refs}
              selectedIndex={0}
              onRefClick={onRefClick}
            />,
          );
        },

        update: (update: ViewUpdate) => {
          for (const tr of update.transactions) {
            for (const e of tr.effects) {
              if (e.is(setSelectedReference)) {
                tooltipRoot.render(
                  <ReferencesTooltip
                    refs={refs}
                    selectedIndex={e.value}
                    onRefClick={onRefClick}
                  />,
                );
              }
            }
          }
        },

        destroy: () => {
          tooltipRoot.unmount();
        },
      };
    },
  };
}

export const notFoundTooltipField = StateField.define<Tooltip | null>({
  create: () => null,
  update: (value, tr) => {
    for (const e of tr.effects)
      if (e.is(notFoundTooltipEffect)) {
        value = e.value.isShown ? createNotFoundTooltip(e.value.pos) : null;
      }

    return value;
  },
  provide: f => showTooltip.compute([f], state => state.field(f)),
});

export const referencesTooltipField = StateField.define<ReferencesTooltipField | null>(
  {
    create: () => null,
    update: (value, tr) => {
      for (const e of tr.effects)
        if (e.is(referencesTooltipEffect)) {
          value = e.value.isShown
            ? createReferencesTooltip(
                e.value.pos,
                e.value.refs,
                e.value.onRefClick,
              )
            : null;
        } else if (e.is(setSelectedReference) && value) {
          value.selectedIndex = Math.max(
            0,
            Math.min(value.refs.length - 1, e.value),
          );
        }

      return value;
    },
    provide: f => showTooltip.compute([f], state => state.field(f)),
  },
);
