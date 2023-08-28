import { copyToClipboard, downloadString } from './browserUtils';

describe('browserUtils', () => {
  it('should download', () => {
    const mockOnCreateObject = jest.fn();
    const mockOnRevokeObject = jest.fn();

    Object.assign(global, {
      URL: {
        createObjectURL: mockOnCreateObject,
        revokeObjectURL: mockOnRevokeObject,
      },
    });

    downloadString('text', 'txt', 'foo');

    expect(mockOnCreateObject).toHaveBeenCalledWith(
      expect.objectContaining({
        size: 4,
        type: 'txt',
      }),
    );
  });

  it('should copy to clipboard', () => {
    const mockOnWriteText = jest.fn();

    Object.assign(navigator, {
      clipboard: {
        writeText: mockOnWriteText,
      },
    });

    copyToClipboard('foo');

    expect(mockOnWriteText).toHaveBeenCalledWith('foo');
  });
});
