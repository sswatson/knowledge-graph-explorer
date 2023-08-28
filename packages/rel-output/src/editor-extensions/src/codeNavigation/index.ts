import { isIOS, isMacOs } from 'react-device-detect';

import {
  CustomExtension,
  EditorView,
  PluginValue,
  relTerms,
  syntaxTree,
  ViewPlugin,
} from '@relationalai/code-editor';

import { RelationReference, RelDefinition } from '../types';
import {
  notFoundTooltipEffect,
  notFoundTooltipField,
  referencesTooltipEffect,
  referencesTooltipField,
} from './tooltips';
import { underlinePlugin } from './underlinePlugin';

class CodeNavigationPlugin implements PluginValue {
  private isApple: boolean;
  private referencesMap: Map<string, RelationReference[]> = new Map();
  constructor(
    public view: EditorView,
    private definitions: RelDefinition[],
    public onIdClick: (ref: RelationReference) => void,
  ) {
    view.dom.addEventListener('click', this.click);
    this.isApple = isIOS || isMacOs;
    // TODO implement defsToRefs
    // this.referencesMap = defsToRefs(definitions);
  }

  hideTooltips = () => {
    this.view.dispatch({
      effects: [
        notFoundTooltipEffect.of({
          isShown: false,
        }),
        referencesTooltipEffect.of({
          isShown: false,
        }),
      ],
    });
  };

  showNotFoundTooltip = (pos: number) => {
    this.view.dispatch({
      effects: notFoundTooltipEffect.of({
        pos,
        isShown: true,
      }),
    });
  };

  showReferencesTooltip = (pos: number, refs: RelationReference[]) => {
    this.view.dispatch({
      effects: referencesTooltipEffect.of({
        pos,
        refs,
        onRefClick: this.onIdClick,
        isShown: true,
      }),
    });
  };

  click = (event: MouseEvent) => {
    this.hideTooltips();

    if (
      ((event.metaKey && this.isApple) || (event.ctrlKey && !this.isApple)) &&
      this.view.state.selection.ranges.length > 0
    ) {
      const editorSelection = this.view.state.selection.ranges[0];

      if (editorSelection.from === editorSelection.to) {
        const tree = syntaxTree(this.view.state);
        const node = tree.resolveInner(editorSelection.from);

        if (node.type.id === relTerms.BasicId) {
          const nodeContent = this.view.state.sliceDoc(node.from, node.to);
          const references = this.referencesMap.get(nodeContent) ?? [];

          if (!references || references.length === 0) {
            this.showNotFoundTooltip(editorSelection.from);
          } else if (references.length === 1) {
            this.onIdClick(references[0]);
            this.hideTooltips();
          } else {
            this.showReferencesTooltip(editorSelection.from, references);
          }
        }
      }
    }
  };

  destroy = () => {
    this.view.dom.removeEventListener('click', this.click);
  };
}

export const codeNavigationPlugin = (
  definitions: RelDefinition[],
  onRefClick?: (ref: RelationReference) => void,
): CustomExtension => ({
  extension: onRefClick
    ? [
        underlinePlugin(),
        notFoundTooltipField,
        referencesTooltipField,
        ViewPlugin.define(
          view => new CodeNavigationPlugin(view, definitions, onRefClick),
        ),
      ]
    : [],
});
