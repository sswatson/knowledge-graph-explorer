import { snippet } from '@relationalai/code-editor';

import { RelDefinition } from '../types';
import { CompletionsMap, RelCompletion } from './types';

function isUpperCase(c: string) {
  return c === c.toUpperCase() && c !== c.toLowerCase();
}

function isLowerCase(c: string) {
  return c === c.toLowerCase() && c !== c.toUpperCase();
}

function isAlpha(c: string) {
  return c.toUpperCase() !== c.toLowerCase();
}

function hasWordStartAt(s: string, index: number) {
  if (index === 0 || index >= s.length) {
    return false;
  }

  return (
    (isUpperCase(s.charAt(index)) && isLowerCase(s.charAt(index - 1))) ||
    (isAlpha(s.charAt(index)) && !isAlpha(s.charAt(index - 1)))
  );
}

/**
 * This function matches a pattern (query) with a completion label to be
 * filtered based on the result. It's based on the method used by most of the
 * editors, which finds if the pattern can describe substrings of the given
 * completion label as each substring is the start of a word in the completion
 * label. Note that the matching of the first character in the pattern is
 * case-sensitive. Example: "ArM" matches ["ArgMax", "ArgMin", "Arg_max"] but
 * not ["Argmax", "Argmin", "arg_max"]
 *
 * @param pattern Is the text that user is typing
 * @param completionStr Is the completion label
 */
export function patternMatch(pattern: string, completionStr: string) {
  let i = 0;
  let isWordStartMatched = true;

  for (let j = 0; j < completionStr.length; ++j) {
    const c = completionStr.charAt(j);
    const p = pattern.charAt(i);

    if (!isWordStartMatched) {
      // Find the next word start with matching characters
      if (
        hasWordStartAt(completionStr, j) &&
        ((i > 0 && c.toLowerCase() === p.toLowerCase()) || c === p)
      ) {
        ++i;
        isWordStartMatched = true;
      } else if (c === p && !isAlpha(c)) {
        ++i;
      }
    } else if (c === p) {
      // Perform normal string search since the word start is matched
      ++i;
    } else {
      // Flip the flag to search for the next word start
      isWordStartMatched = false;
    }
  }

  return i === pattern.length;
}

function defToCompletion(
  map: CompletionsMap,
  def: RelDefinition,
  moduleName?: string,
) {
  if (def.type === 'operandRelation' || def.type === 'constraint') {
    return;
  }

  const label = moduleName ? `${moduleName}:${def.name}` : def.name;
  const detail = def.reference ? `(${def.reference.name})` : '';

  const prevCompletion = map.get(label);
  const type =
    prevCompletion && prevCompletion.type !== def.type ? 'relation' : def.type;

  const completion: RelCompletion = prevCompletion
    ? {
        ...prevCompletion,
        type,
        detail: prevCompletion.detail === detail ? detail : '',
      }
    : {
        label,
        detail,
        type,
        apply:
          def.type === 'constructor' ? snippet(`${label}[\${}]`) : undefined,
      };

  map.set(label, completion);

  if (def.type === 'module' && def.children.length > 0) {
    def.children.forEach(child => {
      defToCompletion(
        map,
        child,
        moduleName ? `${moduleName}:${def.name}` : def.name,
      );
    });
  }
}

export function defsToCompletions(
  definitions: RelDefinition[],
  filterTypes?: RelDefinition['type'][],
): CompletionsMap {
  const map = new Map();

  definitions.forEach(def => {
    if (!filterTypes || filterTypes.includes(def.type)) {
      defToCompletion(map, def);
    }
  });

  return map;
}
