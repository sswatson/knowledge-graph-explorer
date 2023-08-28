import { diagnosticCount } from '@codemirror/lint';
import { SelectionRange } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { sessionStorage } from '@shopify/jest-dom-mocks';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { get } from 'lodash-es';

import CodeEditor from './CodeEditor';
import { setupKeyBindings } from './keybindings';
import { CustomKeyBinding, EditorDiagnostic } from './types';

describe('CodeEditor', () => {
  it('should display value', () => {
    const value = 'def f = 123';

    render(<CodeEditor value={value} />);

    expect(screen.getByRole('textbox')).toHaveTextContent(value);
  });

  it('should call onInit with the expected props', () => {
    const mockOnInit = jest.fn();

    render(<CodeEditor onInit={mockOnInit} />);

    expect(mockOnInit).toHaveBeenCalledWith(expect.any(EditorView));
  });

  it('rel language extension should be installed', () => {
    let eV: any = undefined;

    render(<CodeEditor onInit={(view: EditorView) => (eV = view)} />);

    const hasRel = eV?.state?.config?.staticValues?.some(
      (x: any) => !!x?.parser?.topRules['Rel'],
    );

    expect(hasRel).toBeTruthy();
  });

  it('should call onChange & onUpdate', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    const mockOnUpdate = jest.fn();

    render(<CodeEditor onUpdate={mockOnUpdate} onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');

    expect(mockOnUpdate).toHaveBeenCalled();

    await act(async () => await user.type(input, 'foo'));

    await waitFor(async () => {
      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnUpdate).toHaveBeenCalled();
      expect(screen.getByText('foo')).toBeInTheDocument();
    });
  });

  it('should call onSelectionChange', async () => {
    const user = userEvent.setup();
    const mockOnSelectionChange = jest.fn();

    render(
      <CodeEditor value='foobar' onSelectionChange={mockOnSelectionChange} />,
    );

    const input = screen.getByRole('textbox');

    input.focus();

    await act(
      async () => await user.keyboard('{Shift>}{Right}{Right}{/Shift}'),
    );

    expect(mockOnSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ anchor: 0, head: 1 }),
      expect.anything(),
    );
    expect(mockOnSelectionChange).toHaveBeenCalledWith(
      expect.objectContaining({ anchor: 0, head: 2 }),
      expect.anything(),
    );
  });

  it('should respect readonly prop', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    render(<CodeEditor value='foo' onChange={mockOnChange} readOnly />);

    await act(
      async () => await user.type(screen.getByRole('textbox'), 'test123'),
    );

    await waitFor(() => {
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(screen.getByText('foo')).toBeInTheDocument();
    });
  });

  it('should call onBlur', async () => {
    const user = userEvent.setup();
    const mockOnBlur = jest.fn();

    render(
      <div role='group'>
        <CodeEditor value={'foo'} onBlur={mockOnBlur} />
      </div>,
    );

    const input = screen.getByRole('textbox');

    await act(async () => {
      await user.type(input, 'boo');
      await user.click(input);
      await user.click(screen.getByRole('group'));
    });

    await waitFor(async () => {
      expect(mockOnBlur).toHaveBeenCalledTimes(1);
    });
  });

  it('tab key press should indent 4 spaces', async () => {
    const user = userEvent.setup();

    render(<CodeEditor value={'foo'} />);

    const input = screen.getByRole('textbox');

    await act(async () => await user.type(input, '{Tab}'));

    await waitFor(() => expect(input.textContent).toEqual('    foo'));
  });

  it('should match previous row indentation', async () => {
    const user = userEvent.setup();

    render(<CodeEditor value='foo' />);

    const input = screen.getByRole('textbox');

    await act(async () => {
      await user.click(input);
      await user.keyboard('{Control>}{ArrowLeft}{/Control}{Tab}{Enter}');
    });

    await waitFor(() => {
      expect(get(input, 'cmView.view.state.doc.lines')).toEqual(2);
      expect(get(input, 'cmView.view.state.doc.text.1')).toEqual('    foo');
    });
  });

  it('should work as controlled component', () => {
    const { rerender } = render(<CodeEditor value={'foo'} />);

    const input = screen.getByRole('textbox');

    expect(input).toHaveTextContent('foo');

    const selectionRange = SelectionRange.fromJSON({ anchor: 0, head: 3 });

    rerender(<CodeEditor value={'foo111'} selection={selectionRange} />);

    expect(input).toHaveTextContent('foo111');

    expect(
      get(input, 'cmView.view.viewState.state.selection.main'),
    ).toMatchObject({ from: 0, to: 3 });
  });

  it('should follow selection constraints', () => {
    const { rerender } = render(
      <CodeEditor
        value={'foo'}
        selection={SelectionRange.fromJSON({ anchor: 0, head: 3 })}
      />,
    );

    const input = screen.getByRole('textbox');

    const getSelection = () =>
      get(input, 'cmView.view.viewState.state.selection.main');

    expect(input).toHaveTextContent('foo');
    expect(getSelection()).toMatchObject({ from: 0, to: 3 });

    rerender(
      <CodeEditor
        value={'foo'}
        selection={SelectionRange.fromJSON({ anchor: 100, head: 3 })}
      />,
    );

    // Selection range should not change since the selection param was invalid
    expect(getSelection()).toMatchObject({ from: 0, to: 3 });

    rerender(
      <CodeEditor
        value={'foo'}
        selection={SelectionRange.fromJSON({ anchor: 2, head: 3 })}
      />,
    );

    // Valid controlled component selection range change
    expect(getSelection()).toMatchObject({ from: 2, to: 3 });

    rerender(
      <CodeEditor
        value={'foo'}
        selection={{ anchor: 1, head: 30 } as SelectionRange}
      />,
    );

    // Selection range was not an instance of SelectionRange so old selection remains
    expect(getSelection()).toMatchObject({ from: 2, to: 3 });

    rerender(
      <CodeEditor
        value={'foo'}
        selection={SelectionRange.fromJSON({ anchor: 1, head: 30 })}
      />,
    );

    // Selection range should not change since the selection param was invalid
    expect(getSelection()).toMatchObject({ from: 2, to: 3 });
  });

  it('should work with passed in diagnostics', () => {
    let eV: any = null;
    const diagnostics: EditorDiagnostic[] = [
      {
        from: 13,
        to: 14,
        message: 'parse error',
        severity: 'error',
      },
    ];

    const { rerender } = render(
      <CodeEditor value='def Q3 = "Q3",' onInit={view => (eV = view)} />,
    );

    rerender(<CodeEditor value='def Q3 = "Q3",' diagnostics={diagnostics} />);
    expect(diagnosticCount(eV.state)).toEqual(1);
  });

  it('should remove diagnostics with invalid ranges', () => {
    let eV: any = null;
    const value = 'line1';
    const diagnostics: EditorDiagnostic[] = [
      {
        from: 1,
        to: 2,
        message: 'parse error',
        severity: 'error',
      },
      {
        from: 1,
        to: 6,
        message: 'parse error',
        severity: 'error',
      },
      {
        from: 3,
        to: 1,
        message: 'parse error',
        severity: 'error',
      },
    ];

    const { rerender } = render(
      <CodeEditor value={value} onInit={view => (eV = view)} />,
    );

    rerender(<CodeEditor value={value} diagnostics={diagnostics} />);
    expect(diagnosticCount(eV.state)).toEqual(1);
  });

  it('should restore history using stateKey prop', async () => {
    const user = userEvent.setup();

    // Start with a preset sessionStorage from which to reconstruct the history
    sessionStorage.setItem(
      'codeEditorState',
      JSON.stringify({
        q1: {
          doc: 'aaa',
          history: {
            done: [
              {
                changes: [[1, 'foo'], [2]],
                startSelection: {
                  ranges: [
                    {
                      anchor: 0,
                      head: 3,
                    },
                  ],
                  main: 0,
                },
                selectionsAfter: [],
              },
            ],
            undone: [],
          },
          selection: {
            main: 0,
            ranges: [
              {
                anchor: 0,
                head: 3,
              },
            ],
          },
        },
        q2: {
          doc: 'aaa',
          history: {
            done: [
              {
                changes: [[1, 'baz'], [2]],
                startSelection: {
                  ranges: [
                    {
                      anchor: 0,
                      head: 3,
                    },
                  ],
                  main: 0,
                },
                selectionsAfter: [],
              },
            ],
            undone: [],
          },
          selection: {
            main: 0,
            ranges: [
              {
                anchor: 0,
                head: 3,
              },
            ],
          },
        },
      }),
    );

    // Use key q1 for history storage
    const { rerender } = render(<CodeEditor value='aaa' stateKey='q1' />);

    // Undo to get back to 'foo'
    await act(async () => {
      screen.getByRole('textbox').focus();
      await user.keyboard('{Control>}z{/Control}');
    });

    expect(screen.getByRole('textbox')).toHaveTextContent('foo');

    // Use key q2 for history storage
    rerender(<CodeEditor value='aaa' stateKey='q2' />);

    // Undo to get back to 'baz'
    await act(async () => {
      screen.getByRole('textbox').focus();
      await user.keyboard('{Control>}z{/Control}');
    });

    expect(screen.getByRole('textbox')).toHaveTextContent('baz');
  });

  it('should save state using stateKey prop', async () => {
    const user = userEvent.setup();

    render(<CodeEditor value='' stateKey='q1' />);

    await act(async () => {
      await user.type(screen.getByRole('textbox'), 'foo');
    });

    await waitFor(() => {
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'codeEditorState',
        expect.stringContaining('"doc":"foo"'),
      );
    });
  });

  it('should load custom key bindings', async () => {
    const user = userEvent.setup();
    const runMock = jest.fn();
    const logKeyStrokeMock = jest.fn();
    const customKeyBindings: CustomKeyBinding[] = [
      {
        key: 'Ctrl-s',
        run: runMock,
        description: 'description',
      },
    ];

    let editorView: EditorView | unknown = undefined;

    render(
      <CodeEditor
        customKeyBindings={customKeyBindings}
        logKeyStroke={logKeyStrokeMock}
        onInit={view => {
          editorView = view;
        }}
      />,
    );

    expect(
      JSON.stringify((editorView as EditorView)?.state.facet(keymap)),
    ).toStrictEqual(
      JSON.stringify([setupKeyBindings(customKeyBindings, logKeyStrokeMock)]),
    );

    const input = screen.getByRole('textbox');

    await act(async () => {
      await user.click(input);
      await user.keyboard('{Control>}s{/Control}');
    });

    expect(runMock).toHaveBeenCalledWith(editorView);
    expect(logKeyStrokeMock).toHaveBeenCalledWith('Ctrl+s', 'description');
  });

  it('should not log false custom keybinding', async () => {
    const user = userEvent.setup();
    const runMock = jest.fn().mockReturnValue(false);
    const logKeyStrokeMock = jest.fn();
    const customKeyBindings: CustomKeyBinding[] = [
      {
        key: 'Ctrl-s',
        run: runMock,
        description: 'description',
      },
    ];

    let editorView: EditorView | unknown = undefined;

    render(
      <CodeEditor
        customKeyBindings={customKeyBindings}
        logKeyStroke={logKeyStrokeMock}
        onInit={view => {
          editorView = view;
        }}
      />,
    );

    const input = screen.getByRole('textbox');

    await act(async () => {
      await user.click(input);
      await user.keyboard('{Control>}s{/Control}');
    });

    expect(runMock).toHaveBeenCalledWith(editorView);
    expect(logKeyStrokeMock).not.toHaveBeenCalled();
  });

  it('should use range highlight gutter', () => {
    const range = SelectionRange.fromJSON({
      head: 1,
      anchor: 14,
    });
    const value = 'def\noutput = 1\ndef';
    const { container, rerender } = render(
      <CodeEditor value={value} gutterHighlightRange={range} />,
    );

    expect(
      container.querySelectorAll(
        '.cm-gutterElement:not([style*="visibility: hidden"]) > div',
      ),
    ).toHaveLength(2);

    const newRange = SelectionRange.fromJSON({
      head: 15,
      anchor: 16,
    });

    rerender(<CodeEditor value={value} gutterHighlightRange={newRange} />);

    expect(
      container.querySelectorAll(
        '.cm-gutterElement:not([style*="visibility: hidden"]) > div',
      ),
    ).toHaveLength(1);
  });

  it('should handle wrong gutter highlight range', () => {
    const range = SelectionRange.fromJSON({
      head: 20,
      anchor: 30,
    });
    const value = 'def output = 1';
    const { container } = render(
      <CodeEditor value={value} gutterHighlightRange={range} />,
    );

    const gutterElements = container.querySelectorAll(
      '.cm-gutterElement:not([style*="visibility: hidden"]) > div',
    );

    expect(gutterElements).toHaveLength(0);
  });
});
