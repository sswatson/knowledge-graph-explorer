import { useVirtualizer } from '@tanstack/react-virtual';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Dropdown,
  DropdownOptionProps,
  OptionComponentProps,
} from './Dropdown';

jest.mock('@tanstack/react-virtual');

const waitForFloating = () => act(async () => {});

const options = [
  { label: 'item1', value: 'item1' },
  { label: 'item2', value: 'item2' },
  { label: 'item3', value: 'item3' },
  { label: 'item4', value: 'item4' },
  { label: 'item5', value: 'item5' },
];
const useVirtualizerMock = jest.mocked(useVirtualizer);

describe('Dropdown', () => {
  it('should display dropdown', async () => {
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

    render(
      <Dropdown
        scrollHeight={100}
        options={options}
        estimateSize={() => 20}
        isLoading={false}
        testIdPrefix='dropdown'
        onSelect={jest.fn()}
      />,
    );

    await waitForFloating();

    expect(screen.getByTestId('dropdown-trigger-button')).toBeInTheDocument();
  });

  it('should call getVirtualItems and getTotalSize from virtualizer', async () => {
    const mockOnGetVirtualItems = jest.fn().mockReturnValue([
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
    ]);
    const mockOnGetTotalSize = jest.fn();

    useVirtualizerMock.mockReturnValue({
      getVirtualItems: mockOnGetVirtualItems,
      getTotalSize: mockOnGetTotalSize,
    } as any);

    render(
      <Dropdown
        scrollHeight={100}
        options={options}
        estimateSize={() => 20}
        isLoading={false}
        testIdPrefix='dropdown'
        onSelect={jest.fn()}
      />,
    );

    await act(() =>
      fireEvent.click(screen.getByTestId('dropdown-trigger-button')),
    );

    await waitFor(() => {
      expect(mockOnGetVirtualItems).toHaveBeenCalledTimes(3);
      expect(mockOnGetTotalSize).toHaveBeenCalledTimes(3);
    });
  });

  it('should open and close dropdown by clicking trigger element', async () => {
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

    render(
      <Dropdown
        scrollHeight={100}
        options={options}
        estimateSize={() => 20}
        isLoading={false}
        testIdPrefix='dropdown'
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByTestId('dropdown-trigger-button')).toBeInTheDocument();
    expect(screen.queryByTestId('dropdown-options')).not.toBeInTheDocument();

    await act(() => {
      fireEvent.click(screen.getByTestId('dropdown-trigger-button'));
    });

    expect(screen.queryByTestId('dropdown-options')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('dropdown-trigger-button'));
    await waitFor(() =>
      expect(screen.queryByTestId('dropdown-options')).not.toBeInTheDocument(),
    );
  });

  it('should close dropdown and fire onSelect by clicking on item', async () => {
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

    const onSelect = jest.fn();

    render(
      <Dropdown
        scrollHeight={100}
        options={options}
        estimateSize={() => 20}
        isLoading={false}
        testIdPrefix='dropdown'
        onSelect={onSelect}
      />,
    );

    await act(() => {
      fireEvent.click(screen.getByTestId('dropdown-trigger-button'));
    });

    const item1 = screen.getByLabelText('item1');

    expect(item1).toBeInTheDocument();

    fireEvent.click(item1);
    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('dropdown-options')).not.toBeInTheDocument();
  });

  it('should display dropdown, where one item is disabled', async () => {
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
      ]),
      getTotalSize: jest.fn(),
    } as any);

    const mockOptions = [
      { label: 'item1', value: 'item1' },
      { label: 'item2', value: 'item2', disabled: true },
    ];
    const user = userEvent.setup();

    render(
      <Dropdown
        scrollHeight={100}
        options={mockOptions}
        estimateSize={() => 20}
        isLoading={false}
        testIdPrefix='dropdown'
        onSelect={jest.fn()}
      />,
    );

    await act(
      async () =>
        await user.click(screen.getByTestId('dropdown-trigger-button')),
    );

    const item1 = screen.getByRole('option', { name: 'item1' });
    const item2 = screen.getByRole('option', { name: 'item2' });

    expect(screen.getByTestId('dropdown-trigger-button')).toBeInTheDocument();
    expect(item1).toBeInTheDocument();
    expect(item2).toBeInTheDocument();

    expect(item1).not.toHaveAttribute('aria-disabled', 'true');
    expect(item2).toHaveAttribute('aria-disabled', 'true');
  });

  it('should display disabled dropdown and corresponding style', async () => {
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
      ]),
      getTotalSize: jest.fn(),
    } as any);

    render(
      <Dropdown
        scrollHeight={100}
        options={options}
        disabled={true}
        estimateSize={() => 20}
        isLoading={false}
        testIdPrefix='dropdown'
        onSelect={jest.fn()}
      />,
    );

    await waitForFloating();

    const btn = screen.getByTestId('dropdown-trigger-button');
    const trigger = screen.getByTestId('dropdown-trigger-div');

    fireEvent.mouseEnter(btn);

    expect(trigger).toHaveClass('bg-gray-200 cursor-not-allowed opacity-70');
    expect(btn).toBeDisabled();
  });

  it('should display spinner when it is loading', async () => {
    useVirtualizerMock.mockReturnValue({
      getVirtualItems: jest.fn().mockReturnValue([]),
      getTotalSize: jest.fn(),
    } as any);

    const mockOptions: DropdownOptionProps[] = [];
    const user = userEvent.setup();

    render(
      <Dropdown
        scrollHeight={100}
        options={mockOptions}
        estimateSize={() => 20}
        isLoading={true}
        testIdPrefix='dropdown'
        onSelect={jest.fn()}
      />,
    );

    await act(
      async () =>
        await user.click(screen.getByTestId('dropdown-trigger-button')),
    );

    expect(screen.queryByTestId('spinner')).toBeInTheDocument();
  });

  it('should render empty element if options are empty', async () => {
    const mockOnGetTotalSize = jest.fn();

    useVirtualizerMock.mockReturnValue({
      getVirtualItems: jest.fn().mockReturnValue([]),
      getTotalSize: mockOnGetTotalSize,
    } as any);

    const mockOptions: DropdownOptionProps[] = [];
    const user = userEvent.setup();

    render(
      <Dropdown
        scrollHeight={100}
        options={mockOptions}
        estimateSize={() => 20}
        isLoading={false}
        testIdPrefix='dropdown'
        onSelect={jest.fn()}
      />,
    );

    await act(
      async () =>
        await user.click(screen.getByTestId('dropdown-trigger-button')),
    );
    expect(screen.getByText('No options found')).toBeInTheDocument();
    expect(mockOnGetTotalSize).not.toHaveBeenCalled();
  });

  it('should render custom empty element if options are empty', async () => {
    const mockOnGetTotalSize = jest.fn();

    useVirtualizerMock.mockReturnValue({
      getVirtualItems: jest.fn().mockReturnValue([]),
      getTotalSize: mockOnGetTotalSize,
    } as any);

    const emptyElement = <span>Empty Element</span>;
    const mockOptions: DropdownOptionProps[] = [];
    const user = userEvent.setup();

    render(
      <Dropdown
        scrollHeight={100}
        options={mockOptions}
        estimateSize={() => 20}
        isLoading={false}
        testIdPrefix='dropdown'
        emptyElement={emptyElement}
        onSelect={jest.fn()}
      />,
    );

    await act(
      async () =>
        await user.click(screen.getByTestId('dropdown-trigger-button')),
    );
    expect(screen.queryByTestId('dropdown-list')).not.toBeInTheDocument();
    expect(screen.getByText('Empty Element')).toBeInTheDocument();
    expect(mockOnGetTotalSize).not.toHaveBeenCalled();
  });

  it('should render custom trigger element if one is provided', async () => {
    const mockOnGetTotalSize = jest.fn();

    useVirtualizerMock.mockReturnValue({
      getVirtualItems: jest.fn().mockReturnValue([]),
      getTotalSize: mockOnGetTotalSize,
    } as any);

    const triggerBtn = <span>Dropdown Trigger</span>;
    const mockOptions: DropdownOptionProps[] = [];

    render(
      <Dropdown
        scrollHeight={100}
        options={mockOptions}
        estimateSize={() => 20}
        isLoading={false}
        testIdPrefix='dropdown'
        triggerElement={triggerBtn}
        onSelect={jest.fn()}
      />,
    );

    await waitForFloating();

    expect(
      screen.queryByTestId('dropdown-trigger-div'),
    ).not.toBeInTheDocument();

    expect(screen.getByText('Dropdown Trigger')).toBeInTheDocument();
  });

  it('should render children if one is provided', async () => {
    const mockOnGetTotalSize = jest.fn();

    useVirtualizerMock.mockReturnValue({
      getVirtualItems: jest.fn().mockReturnValue([]),
      getTotalSize: mockOnGetTotalSize,
    } as any);

    const children = <span>children</span>;
    const mockOptions: DropdownOptionProps[] = [];

    render(
      <Dropdown
        scrollHeight={100}
        options={mockOptions}
        estimateSize={() => 20}
        isLoading={false}
        testIdPrefix='dropdown'
        onSelect={jest.fn()}
      >
        {children}
      </Dropdown>,
    );

    await act(() => {
      fireEvent.click(screen.getByTestId('dropdown-trigger-button'));
    });

    expect(screen.getByText('children')).toBeInTheDocument();
  });

  it('should render custom option component', async () => {
    const mockOptions = [
      { label: 'item1', value: 'item1', subText: 'subText1' },
      { label: 'item2', value: 'item2', subText: 'subText2' },
    ];
    const mockOnGetVirtualItems = jest.fn().mockReturnValue([
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
    ]);
    const mockOnGetTotalSize = jest.fn();

    useVirtualizerMock.mockReturnValue({
      getVirtualItems: mockOnGetVirtualItems,
      getTotalSize: mockOnGetTotalSize,
    } as any);

    type Option = {
      label: string;
      value: string;
      subText: string;
    };

    const customOptionComponent = ({
      option,
    }: OptionComponentProps<Option>) => {
      const { value, subText } = option;

      return (
        <div>
          <span>{value}</span>
          <span>{subText}</span>
        </div>
      );
    };

    render(
      <Dropdown<Option>
        scrollHeight={100}
        options={mockOptions}
        estimateSize={() => 20}
        isLoading={false}
        testIdPrefix='dropdown'
        OptionComponent={customOptionComponent}
        onSelect={jest.fn()}
      />,
    );

    await act(() => {
      fireEvent.click(screen.getByTestId('dropdown-trigger-button'));
    });

    expect(screen.getByText('item1')).toBeInTheDocument();
    expect(screen.getByText('subText1')).toBeInTheDocument();
    expect(screen.getByText('item2')).toBeInTheDocument();
    expect(screen.getByText('subText2')).toBeInTheDocument();
  });

  it('should search when user starts typing', async () => {
    const user = userEvent.setup();
    const mockOptions = [
      { label: 'item1', value: 'item1', subText: 'subText1' },
      { label: 'item2', value: 'item2', subText: 'subText2' },
    ];
    const mockOnGetVirtualItems = jest
      .fn()
      .mockReturnValueOnce([
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
      ])
      .mockReturnValue([
        {
          end: 20,
          index: 0,
          key: 0,
          lane: 0,
          size: 20,
          start: 0,
        },
      ]);
    const mockOnGetTotalSize = jest.fn();

    useVirtualizerMock.mockReturnValue({
      getVirtualItems: mockOnGetVirtualItems,
      getTotalSize: mockOnGetTotalSize,
    } as any);

    type Option = {
      label: string;
      value: string;
      subText: string;
    };

    await act(() => {
      render(
        <Dropdown<Option>
          scrollHeight={100}
          displayValue='item1'
          options={mockOptions}
          estimateSize={() => 20}
          isLoading={false}
          testIdPrefix='dropdown'
          onSelect={jest.fn()}
          selected='item1'
          search
        />,
      );
    });

    const inputElement = screen.getByRole('combobox');

    expect(inputElement).toBeInTheDocument();

    await act(async () => await user.clear(inputElement));
    await act(async () => await user.type(inputElement, 'item2'));

    expect(screen.getByText('item2')).toBeInTheDocument();
    expect(screen.queryByText('item1')).not.toBeInTheDocument();
  });

  it('should display placeholder text when displayValue is not provided', async () => {
    const mockOptions = [
      { label: 'item1', value: 'item1', subText: 'subText1' },
      { label: 'item2', value: 'item2', subText: 'subText2' },
    ];
    const mockOnGetVirtualItems = jest
      .fn()
      .mockReturnValueOnce([
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
      ])
      .mockReturnValue([
        {
          end: 20,
          index: 0,
          key: 0,
          lane: 0,
          size: 20,
          start: 0,
        },
      ]);

    const mockOnGetTotalSize = jest.fn();

    useVirtualizerMock.mockReturnValue({
      getVirtualItems: mockOnGetVirtualItems,
      getTotalSize: mockOnGetTotalSize,
    } as any);

    type Option = {
      label: string;
      value: string;
      subText: string;
    };

    await act(() => {
      render(
        <Dropdown<Option>
          displayValue=''
          placeholderText='placeholder text'
          scrollHeight={100}
          options={mockOptions}
          estimateSize={() => 20}
          isLoading={false}
          testIdPrefix='dropdown'
          onSelect={jest.fn()}
          selected='item1'
          search
        />,
      );
    });

    const inputElement = screen.getByRole('combobox');

    expect(inputElement).toBeInTheDocument();
    expect(screen.getByPlaceholderText('placeholder text')).toBeInTheDocument();
  });

  it('should use custom search function', async () => {
    const user = userEvent.setup();
    const mockOptions = [
      { label: 'item1', value: 'item1', subText: 'subText1' },
      { label: 'item2', value: 'item2', subText: 'subText2' },
    ];
    const mockOnGetVirtualItems = jest
      .fn()
      .mockReturnValueOnce([
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
      ])
      .mockReturnValue([
        {
          end: 20,
          index: 0,
          key: 0,
          lane: 0,
          size: 20,
          start: 0,
        },
      ]);
    const mockOnGetTotalSize = jest.fn();

    useVirtualizerMock.mockReturnValue({
      getVirtualItems: mockOnGetVirtualItems,
      getTotalSize: mockOnGetTotalSize,
    } as any);

    type Option = {
      label: string;
      value: string;
      subText: string;
    };

    const mockSearch = jest.fn();

    await act(() => {
      render(
        <Dropdown<Option>
          displayValue=''
          placeholderText='placeholder text'
          scrollHeight={100}
          options={mockOptions}
          estimateSize={() => 20}
          isLoading={false}
          testIdPrefix='dropdown'
          onSelect={jest.fn()}
          selected='item1'
          search={mockSearch}
        />,
      );
    });

    const inputElement = screen.getByRole('combobox');

    expect(inputElement).toBeInTheDocument();

    await act(async () => await user.clear(inputElement));
    await act(async () => await user.type(inputElement, 'item2'));

    expect(mockSearch).toHaveBeenLastCalledWith('item2', {
      label: 'item2',
      value: 'item2',
      subText: 'subText2',
    });
  });
});
