import { isIOS, isMacOs } from 'react-device-detect';

import {
  Decoration,
  DecorationSet,
  EditorView,
  Extension,
  PluginValue,
  relTerms,
  StateEffect,
  StateEffectType,
  StateField,
  syntaxTree,
  ViewPlugin,
} from '@relationalai/code-editor';

type UnderlineRange = {
  from: number;
  to: number;
};

class UnderlinePlugin implements PluginValue {
  lastMove: { x: number; y: number };
  private isApple: boolean;

  constructor(
    public view: EditorView,
    public underlineField: StateField<DecorationSet>,
    public setUnderline: StateEffectType<UnderlineRange | null>,
  ) {
    this.lastMove = { x: 0, y: 0 };
    this.isApple = isIOS || isMacOs;
    view.dom.addEventListener('mousemove', this.mousemove);
    view.dom.addEventListener('keyup', this.keyup);
    view.dom.addEventListener('keydown', this.keydown);
  }

  get active() {
    return this.view.state.field(this.underlineField);
  }

  addUnderline = (range: UnderlineRange) => {
    this.view.dispatch({ effects: this.setUnderline.of(range) });
  };

  removeUnderline = () => {
    if (this.active) {
      this.view.dispatch({ effects: this.setUnderline.of(null) });
    }
  };

  keyup = (event: KeyboardEvent) => {
    if (
      (event.key === 'Meta' && this.isApple) ||
      (event.key === 'Ctrl' && !this.isApple)
    ) {
      this.removeUnderline();
    }
  };

  keydown = (event: KeyboardEvent) => {
    if (
      (event.key === 'Meta' && this.isApple) ||
      (event.key === 'Ctrl' && !this.isApple)
    ) {
      const pos = this.view.posAtCoords(this.lastMove);

      if (pos) {
        const tree = syntaxTree(this.view.state);
        const node = tree.resolveInner(pos);
        const nodeTypeId = node.type.id;
        const parentTypeId = node.parent?.type.id;

        if (
          nodeTypeId === relTerms.BasicId &&
          parentTypeId !== relTerms.LhsId
        ) {
          this.addUnderline(node);
        }
      }
    }
  };

  mousemove = (event: MouseEvent) => {
    this.removeUnderline();

    this.lastMove = {
      x: event.clientX,
      y: event.clientY,
    };

    if ((event.metaKey && this.isApple) || (event.ctrlKey && !this.isApple)) {
      const pos = this.view.posAtCoords(event);
      const tree = syntaxTree(this.view.state);

      if (pos) {
        const node = tree.resolveInner(pos);
        const nodeTypeId = node.type.id;
        const parentTypeId = node.parent?.type.id;

        if (
          nodeTypeId === relTerms.BasicId &&
          parentTypeId !== relTerms.LhsId
        ) {
          this.addUnderline(node);
        }
      }
    }
  };

  destroy = () => {
    this.view.dom.removeEventListener('mousemove', this.mousemove);
    this.view.dom.removeEventListener('keyup', this.keyup);
    this.view.dom.removeEventListener('keydown', this.keydown);
  };
}

export const underlinePlugin = (): Extension => {
  const setUnderlineEffect = StateEffect.define<UnderlineRange | null>({
    map: (range, change) =>
      range
        ? {
            from: change.mapPos(range.from),
            to: change.mapPos(range.to),
          }
        : null,
  });
  const underlineMark = Decoration.mark({
    attributes: {
      style: 'text-decoration: underline 2px blue; cursor: pointer;',
    },
  });
  const underlineField = StateField.define<DecorationSet>({
    create() {
      return Decoration.none;
    },
    update(underlines, tr) {
      underlines = underlines.map(tr.changes);

      for (const e of tr.effects)
        if (e.is(setUnderlineEffect)) {
          underlines = underlines.update(
            e.value
              ? {
                  add: [underlineMark.range(e.value.from, e.value.to)],
                }
              : {
                  filter: () => false,
                },
          );
        }

      return underlines;
    },
    provide: f => EditorView.decorations.from(f),
  });

  return [
    underlineField,
    ViewPlugin.define(
      view => new UnderlinePlugin(view, underlineField, setUnderlineEffect),
    ),
  ];
};
