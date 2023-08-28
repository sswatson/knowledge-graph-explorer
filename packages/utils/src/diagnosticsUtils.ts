import { Diagnostic } from './relationUtils';

export function filterDuplicateDiagnostics(
  diagnostics: Diagnostic[],
  duplicatesAllowed = 5,
) {
  const memo: Record<string, number> = {};

  return diagnostics.filter(d => {
    const key = JSON.stringify(d);

    memo[key] = (memo[key] ?? 0) + 1;

    return memo[key] <= duplicatesAllowed;
  });
}
