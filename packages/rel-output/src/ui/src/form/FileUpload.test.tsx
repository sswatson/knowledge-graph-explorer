import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';

import {
  readFile,
  readFilesFromDataTransfer,
  TextFile,
} from '@relationalai/utils';

import FileUpload from './FileUpload';

jest.mock('@relationalai/utils', () => ({
  ...jest.requireActual('@relationalai/utils'),
  readFile: jest.fn(),
  readFilesFromDataTransfer: jest.fn(),
}));

describe('FileUpload', () => {
  const name = 'foo';

  beforeEach(() => {
    jest
      .mocked(readFile)
      .mockImplementation(jest.requireActual('@relationalai/utils').readFile);
  });

  function TestComponent({ defaultValue }: { defaultValue?: TextFile }) {
    const methods = useForm({
      mode: 'onChange',
      defaultValues: {
        foo: defaultValue,
      },
    });

    const file = methods.watch(name);

    return (
      <FormProvider {...methods}>
        {file && (
          <div>
            <div>file name is {file.name}</div>
            <div>size is {file.size}</div>
            <div>content is {file.content}</div>
          </div>
        )}
        <FileUpload
          name={name}
          regOptions={{
            validate: {
              validateFileSize: file => {
                return file?.size > 10 ? 'error' : undefined;
              },
            },
          }}
        />
      </FormProvider>
    );
  }

  it('should throw an error if no form context found', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<FileUpload name='foo' />);
    }).toThrow();
    error.mockReset();
  });

  it('should be able to select file', async () => {
    render(<TestComponent />);

    const files = [new File(['test'], 'test.txt', { type: 'text/plain' })];

    fireEvent.change(screen.getByTestId('file-upload-foo'), {
      target: { files },
    });

    await waitFor(async () =>
      expect(
        await screen.findByText('file name is test.txt'),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText('size is 4')).toBeInTheDocument();
    expect(screen.queryByText('content is test')).toBeInTheDocument();
  });

  it('should be able to drop file', async () => {
    jest.mocked(readFile).mockReturnValue(
      Promise.resolve({
        name: 'test.txt',
        size: 4,
        content: 'test',
      }),
    );

    jest
      .mocked(readFilesFromDataTransfer)
      .mockReturnValue(Promise.resolve([{ name: 'test.txt' }]) as any);

    render(<TestComponent />);

    const files = new File(['test'], 'test.txt', { type: 'text/plain' });

    fireEvent.dragEnter(screen.getByText('or drag and drop'), {
      dataTransfer: { types: ['Foo', 'Files'] },
    });

    fireEvent.drop(screen.getByTestId('file-drop-zone-overlay'), {
      dataTransfer: { files },
    });

    await waitFor(() =>
      expect(screen.queryByText('file name is test.txt')).toBeInTheDocument(),
    );
    expect(screen.queryByText('size is 4')).toBeInTheDocument();
    expect(screen.queryByText('content is test')).toBeInTheDocument();
  });

  it('should be able to clear selected file', async () => {
    const user = userEvent.setup();

    render(
      <TestComponent defaultValue={{ name: 't.txt', size: 1, content: '1' }} />,
    );

    expect(screen.queryByText('file name is t.txt')).toBeInTheDocument();
    expect(screen.queryByText('size is 1')).toBeInTheDocument();
    expect(screen.queryByText('content is 1')).toBeInTheDocument();

    user.click(screen.getByRole('button'));

    await waitFor(async () => {
      await expect(
        screen.queryByText('file name is t.txt'),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByText('size is 1')).not.toBeInTheDocument();
    expect(screen.queryByText('content is 1')).not.toBeInTheDocument();
  });

  it('should prettify filesize', () => {
    render(
      <TestComponent
        defaultValue={{ name: 't.txt', size: 123456789, content: '1' }}
      />,
    );

    expect(screen.getByText('(117.7MB)')).toBeInTheDocument();
  });

  it('should display error icon', async () => {
    await act(() => {
      render(<TestComponent />);
    });

    expect(
      screen.queryByTestId('file-upload-error-icon-foo'),
    ).not.toBeInTheDocument();

    const files = [
      new File(['1234567891011'], 'test.txt', { type: 'text/plain' }),
    ];

    await act(() => {
      fireEvent.change(screen.getByTestId('file-upload-foo'), {
        target: { files },
      });
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId('file-upload-error-icon-foo'),
      ).toBeInTheDocument();
    });
  });

  it('should catch read file error', async () => {
    jest.mocked(readFile).mockRejectedValue(new Error('file error'));
    render(<TestComponent />);
    const files = [new File(['1234567891011'], 'foo', { type: 'text/plain' })];

    fireEvent.change(screen.getByTestId('file-upload-foo'), {
      target: { files },
    });

    await waitFor(() => {
      expect(
        screen.queryByTestId('file-upload-error-icon-foo'),
      ).toBeInTheDocument();
    });
  });
});
