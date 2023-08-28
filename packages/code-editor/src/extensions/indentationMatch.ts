import { indentService } from '@codemirror/language';

/*
 *  Matches the indentation of the previous row
 *  based on: https://discuss.codemirror.net/t/indentation-and-folding-without-a-language/3582/3
 */
export const indentationMatch = indentService.of((context, pos) => {
  const previousLine = context.lineAt(pos, -1);
  const previousLineIndentation = previousLine?.text?.match(/^(\s)*/);

  if (previousLineIndentation?.length) {
    return previousLineIndentation[0].length;
  } else {
    return 0;
  }
});
