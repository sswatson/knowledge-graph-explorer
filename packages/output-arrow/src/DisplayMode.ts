export enum DisplayMode {
  LOGICAL = 'LOGICAL',
  PHYSICAL = 'PHYSICAL',
  RAW = 'RAW',
  PARTITIONED_HORIZONTAL = 'PARTITIONED_HORIZONTAL',
  PARTITIONED_VERTICAL = 'PARTITIONED_VERTICAL',
}

export function convertDisplayMode(mode?: string) {
  if (Object.keys(DisplayMode).includes(mode || '')) {
    return mode as DisplayMode;
  }

  return DisplayMode.LOGICAL;
}
