import { convertDisplayMode, DisplayMode } from './DisplayMode';

describe('DisplayMode', () => {
  it('should convert strings to display mode', () => {
    expect(convertDisplayMode('PHYSICAL')).toEqual(DisplayMode.PHYSICAL);
    expect(convertDisplayMode(undefined)).toEqual(DisplayMode.LOGICAL);
    expect(convertDisplayMode('')).toEqual(DisplayMode.LOGICAL);
    expect(convertDisplayMode('foo')).toEqual(DisplayMode.LOGICAL);
  });
});
