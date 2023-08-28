import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { readFilesFromDataTransfer } from '@relationalai/utils';

import FileDropZone from './FileDropZone';

jest.mock('@relationalai/utils', () => ({
  ...jest.requireActual('@relationalai/utils'),
  readFilesFromDataTransfer: jest.fn(),
}));

describe('FileDropZone', () => {
  it('should render FileDropZone', () => {
    render(
      <div>
        <FileDropZone className='class-name-test' onFileDrop={jest.fn()}>
          <div>inner element</div>
        </FileDropZone>
      </div>,
    );

    expect(screen.getByText('inner element')).toBeInTheDocument();
    expect(screen.getByTestId('file-drop-zone')).toHaveClass('class-name-test');
  });

  it('should be highlighted when dragging files over page', async () => {
    render(
      <div>
        <FileDropZone
          onFileDrop={jest.fn()}
          draggingClassName='dragging-test'
          overlayClassName='overlay-test'
        >
          <div>inner</div>
        </FileDropZone>
        <div>test element</div>
      </div>,
    );

    const element = screen.getByText('test element');

    expect(element).toBeInTheDocument();

    expect(screen.getByTestId('file-drop-zone')).not.toHaveClass(
      'dragging-test',
    );

    expect(
      screen.queryByTestId('file-drop-zone-overlay'),
    ).not.toBeInTheDocument();

    fireEvent.dragEnter(element, {});

    expect(screen.getByTestId('file-drop-zone')).not.toHaveClass(
      'dragging-test',
    );

    fireEvent.dragEnter(element, { dataTransfer: { types: ['Foo', 'Files'] } });

    expect(screen.getByTestId('file-drop-zone')).toHaveClass('dragging-test');
    expect(screen.queryByTestId('file-drop-zone-overlay')).toHaveClass(
      'overlay-test',
    );

    fireEvent.dragOver(element, {});

    expect(screen.getByTestId('file-drop-zone')).toHaveClass('dragging-test');

    await waitFor(() => {
      expect(screen.getByTestId('file-drop-zone')).not.toHaveClass(
        'dragging-test',
      );
    });
  });

  it('should be highlighted when dragging files over file dropzone', () => {
    render(
      <div>
        <FileDropZone overClassName='over-test' onFileDrop={jest.fn()}>
          <div>inner</div>
        </FileDropZone>
        <div>test element</div>
      </div>,
    );

    const element = screen.getByText('test element');

    expect(element).toBeInTheDocument();

    expect(screen.getByTestId('file-drop-zone')).not.toHaveClass('over-test');

    fireEvent.dragEnter(element, { dataTransfer: { types: ['Foo', 'Files'] } });

    expect(screen.getByTestId('file-drop-zone')).not.toHaveClass('over-test');

    const overlay = screen.getByTestId('file-drop-zone-overlay');

    fireEvent.dragEnter(overlay, {
      dataTransfer: { types: ['Foo', 'Files'] },
    });

    expect(screen.getByTestId('file-drop-zone')).toHaveClass('over-test');

    fireEvent.dragLeave(overlay, {});

    expect(screen.getByTestId('file-drop-zone')).not.toHaveClass('over-test');
  });

  it('should be able to drop files ', async () => {
    const mockedReadFiles = [
      { name: 'mockfile1.tx' },
      { name: 'mockfile2.jpg' },
      { name: 'mockfile3.pdf' },
    ];

    jest
      .mocked(readFilesFromDataTransfer)
      .mockReturnValue(Promise.resolve(mockedReadFiles) as any);

    const mockOnFileDrop = jest.fn();

    render(
      <FileDropZone onFileDrop={mockOnFileDrop}>
        <div>inner</div>
      </FileDropZone>,
    );

    const files = [
      new File(['Mock File 1'], 'mockfile1.txt', { type: 'text/plain' }),
      new File(['Mock File 2'], 'mockfile2.jpg', { type: 'image/jpeg' }),
      new File(['Mock File 3'], 'mockfile3.pdf', { type: 'application/pdf' }),
    ];

    fireEvent.dragEnter(screen.getByText('inner'), {
      dataTransfer: { types: ['Foo', 'Files'] },
    });

    fireEvent.drop(screen.getByTestId('file-drop-zone-overlay'), {
      dataTransfer: { files },
    });

    await waitFor(() => {
      expect(mockOnFileDrop).toHaveBeenCalledWith(mockedReadFiles);
    });
  });
});
