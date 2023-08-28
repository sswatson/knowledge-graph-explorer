import { useVirtualizer } from '@tanstack/react-virtual';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { MultiSelect } from './MultiSelect';

jest.mock('@tanstack/react-virtual');

const waitForFloating = () => act(async () => {});

const useVirtualizerMock = jest.mocked(useVirtualizer);

const options: { label: string; value: string }[] = Array.from({
  length: 6,
}).map((value, index) => ({
  label: `option-${index + 1}`,
  value: `option-${index + 1}`,
}));

describe('MultiSelect', () => {
  beforeEach(() => {
    useVirtualizerMock.mockReturnValue({
      getVirtualItems: jest.fn().mockReturnValue([
        {
          end: 20,
          index: 0,
          key: 0,
          lane: 0,
          size: 20,
          start: 0,
        },
        {
          end: 40,
          index: 1,
          key: 1,
          lane: 0,
          size: 20,
          start: 20,
        },
        {
          end: 60,
          index: 2,
          key: 2,
          lane: 0,
          size: 20,
          start: 40,
        },
        {
          end: 80,
          index: 3,
          key: 3,
          lane: 0,
          size: 20,
          start: 60,
        },
        {
          end: 100,
          index: 4,
          key: 4,
          lane: 0,
          size: 20,
          start: 80,
        },
      ]),
      getTotalSize: jest.fn(),
    } as any);
  });
  it('should render correctly', async () => {
    render(<MultiSelect testIdPrefix={'multiSelect'} options={[]} />);
    await waitForFloating();
    expect(
      screen.getByTestId('multiSelect-trigger-button'),
    ).toBeInTheDocument();
  });

  it('should render the options correctly', async () => {
    render(
      <MultiSelect
        testIdPrefix={'multiSelect'}
        options={options}
        selectedOptions={[options[0], options[3]]}
      />,
    );
    await waitForFloating();
    expect(
      screen.getByTestId('multiSelect-trigger-button'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('multiSelect-options')).not.toBeInTheDocument();

    await act(() => {
      fireEvent.click(screen.getByTestId('multiSelect-trigger-button'));
    });

    // check if the options are rendered
    expect(screen.queryByTestId('multiSelect-options')).toBeInTheDocument();
    expect(screen.getByTestId('multiselect-item-option-1')).toBeInTheDocument();
    expect(screen.getByTestId('multiselect-item-option-2')).toBeInTheDocument();
    expect(screen.getByTestId('multiselect-item-option-3')).toBeInTheDocument();
    expect(screen.getByTestId('multiselect-item-option-4')).toBeInTheDocument();
    expect(screen.getByTestId('multiselect-item-option-5')).toBeInTheDocument();
    // virtualizer hide the doesn't render this item
    expect(
      screen.queryByTestId('multiselect-item-option-6'),
    ).not.toBeInTheDocument();

    // check if the selected options are checked
    expect(screen.getByTestId('multiselect-item-option-1')).toBeChecked();
    expect(screen.getByTestId('multiselect-item-option-4')).toBeChecked();

    // check if not selected options are not checked
    expect(screen.getByTestId('multiselect-item-option-2')).not.toBeChecked();
    expect(screen.getByTestId('multiselect-item-option-3')).not.toBeChecked();
    expect(screen.getByTestId('multiselect-item-option-5')).not.toBeChecked();
  });

  it('should render the options correctly with search', async () => {
    useVirtualizerMock.mockReturnValue({
      getVirtualItems: jest.fn().mockReturnValue([
        {
          end: 20,
          index: 0,
          key: 0,
          lane: 0,
          size: 20,
          start: 0,
        },
      ]),
      getTotalSize: jest.fn(),
    } as any);

    render(<MultiSelect options={options} testIdPrefix={'multiSelect'} />);
    await waitForFloating();

    await act(() => {
      fireEvent.click(screen.getByTestId('multiSelect-trigger-button'));
    });

    fireEvent.change(screen.getByTestId('multiSelect-search-input'), {
      target: { value: 'option-3' },
    });

    expect(screen.getByTestId('multiselect-item-option-3')).toBeInTheDocument();
    expect(
      screen.queryByTestId('multiselect-item-option-1'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('multiselect-item-option-2'),
    ).not.toBeInTheDocument();
  });

  it('should select and unselect the options correctly', async () => {
    const onSelectMock = jest.fn();

    render(
      <MultiSelect
        options={options}
        testIdPrefix={'multiSelect'}
        onSelect={onSelectMock}
        selectedOptions={[options[0], options[3]]}
      />,
    );
    await waitForFloating();
    await act(() => {
      fireEvent.click(screen.getByTestId('multiSelect-trigger-button'));
    });

    // remove option
    fireEvent.click(screen.getByTestId('multiselect-item-option-1'));
    expect(onSelectMock).toHaveBeenCalledWith([options[3]]);

    // select option
    fireEvent.click(screen.getByTestId('multiselect-item-option-3'));
    expect(onSelectMock).toHaveBeenCalledWith([
      options[0],
      options[3],
      options[2],
    ]);

    // uncheck all options
    fireEvent.click(screen.getByText('Uncheck all'));
    expect(onSelectMock).toHaveBeenCalledWith([]);
  });
});
