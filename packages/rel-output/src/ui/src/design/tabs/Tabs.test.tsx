import { dimension } from '@shopify/jest-dom-mocks';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tabs } from './Tabs';

const waitForFloating = () => act(async () => {});

const mockTabComponent = jest.fn();

jest.mock('./Tab', () => {
  const original = jest.requireActual('./Tab');

  return {
    ...original,
    SortableTab: (props: any) => {
      mockTabComponent(props);

      return original.Tab(props);
    },
  };
});

const tabItems = [{ id: 'Foo' }, { id: 'Bar' }, { id: 'Baz', name: 'BazName' }];

describe('Tabs', () => {
  beforeEach(() => {
    dimension.mock({
      offsetWidth: 500,
      offsetHeight: 100,
    });
  });

  afterEach(() => {
    dimension.restore();
  });

  it('should display tabs', () => {
    render(
      <Tabs
        tabItems={tabItems}
        current='Bar'
        onSelect={jest.fn()}
        onTabsChange={jest.fn()}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Foo' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Bar' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Bar' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('BazName')).toBeInTheDocument();
  });

  it('should display have draggable panel as default', () => {
    render(
      <Tabs
        tabItems={tabItems}
        current='Bar'
        onSelect={jest.fn()}
        onTabsChange={jest.fn()}
      />,
    );

    expect(screen.getByTestId('draggable-tabpanel')).toBeInTheDocument();
    expect(screen.queryByTestId('static-tabpanel')).not.toBeInTheDocument();
  });

  it('should not be draggable when canDrag is false', () => {
    render(
      <Tabs
        tabItems={tabItems}
        current='Bar'
        onSelect={jest.fn()}
        onTabsChange={jest.fn()}
        canDrag={false}
      />,
    );

    expect(screen.queryByTestId('draggable-tabpanel')).not.toBeInTheDocument();
    expect(screen.getByTestId('static-tabpanel')).toBeInTheDocument();
  });

  it('should select tab', () => {
    const mockOnSelect = jest.fn();

    render(
      <Tabs
        tabItems={tabItems}
        current='Bar'
        onSelect={mockOnSelect}
        onTabsChange={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'BazName' }));

    expect(mockOnSelect).toHaveBeenCalledWith({ id: 'Baz', name: 'BazName' });
  });

  it('should select on small screen', async () => {
    const user = userEvent.setup();

    dimension.restore();
    dimension.mock({
      offsetWidth: 100,
      offsetHeight: 100,
    });
    const mockOnSelect = jest.fn();

    render(
      <Tabs
        tabItems={tabItems}
        current='Bar'
        onSelect={mockOnSelect}
        onTabsChange={jest.fn()}
      />,
    );

    await waitForFloating();

    await act(async () => {
      await user.click(screen.getByTestId('show-popover-btn'));
    });

    expect(screen.getByRole('tab', { name: 'BazName' })).toBeInTheDocument();

    await act(async () => {
      await user.click(screen.getByRole('tab', { name: 'BazName' }));
    });

    expect(mockOnSelect).toHaveBeenCalledWith({ id: 'Baz', name: 'BazName' });
  });

  it('should close tab', async () => {
    const user = userEvent.setup();
    const mockOnSelect = jest.fn();
    const mockOnTabsChange = jest.fn();

    render(
      <Tabs
        tabItems={tabItems}
        current='Baz'
        onSelect={mockOnSelect}
        onTabsChange={mockOnTabsChange}
      />,
    );

    await waitForFloating();

    await act(async () => {
      await user.click(
        within(screen.getByRole('tab', { name: 'Bar' })).getByTestId(
          'close tab',
        ),
      );
    });

    expect(mockOnTabsChange).toHaveBeenNthCalledWith(1, [
      tabItems[0],
      tabItems[2],
    ]);

    expect(mockOnSelect).not.toHaveBeenCalled();

    await act(async () => {
      await user.click(
        within(screen.getByRole('tab', { name: 'BazName' })).getByTestId(
          'close tab',
        ),
      );
    });

    expect(mockOnTabsChange).toHaveBeenNthCalledWith(2, [
      tabItems[0],
      tabItems[1],
    ]);

    expect(mockOnSelect).toHaveBeenCalledWith(tabItems[1]);
  });

  it('should not auto select tab when closing tab', async () => {
    const mockOnSelect = jest.fn();

    render(
      <Tabs
        tabItems={tabItems}
        current='Baz'
        onSelect={mockOnSelect}
        onTabsChange={jest.fn()}
        supressAutoSelection
      />,
    );

    await waitForFloating();

    fireEvent.click(
      within(screen.getByRole('tab', { name: 'BazName' })).getByTestId(
        'close tab',
      ),
    );

    expect(mockOnSelect).toHaveBeenCalledTimes(0);
  });

  it('should close tab on small screen', async () => {
    const user = userEvent.setup();

    dimension.restore();
    dimension.mock({
      offsetWidth: 100,
      offsetHeight: 100,
    });
    const mockOnSelect = jest.fn();
    const mockOnTabsChange = jest.fn();

    render(
      <Tabs
        tabItems={tabItems}
        current='Baz'
        onSelect={mockOnSelect}
        onTabsChange={mockOnTabsChange}
      />,
    );

    await waitForFloating();

    await act(async () => {
      await user.click(screen.getByTestId('show-popover-btn'));
    });

    expect(
      within(screen.getByRole('tab', { name: 'Bar' })).getByTestId('close tab'),
    ).toBeInTheDocument();

    await act(async () => {
      await user.click(
        within(screen.getByRole('tab', { name: 'Bar' })).getByTestId(
          'close tab',
        ),
      );
    });

    expect(mockOnTabsChange).toHaveBeenNthCalledWith(1, [
      tabItems[0],
      tabItems[2],
    ]);

    expect(mockOnSelect).not.toHaveBeenCalled();

    await act(async () => {
      await user.click(
        within(screen.getByRole('tab', { name: 'BazName' })).getByTestId(
          'close tab',
        ),
      );
    });

    expect(mockOnTabsChange).toHaveBeenNthCalledWith(2, [
      tabItems[0],
      tabItems[1],
    ]);

    expect(mockOnSelect).toHaveBeenCalledWith(tabItems[1]);
  });

  it('should trigger rename tab on double click', async () => {
    const mockOnRename = jest.fn();

    render(
      <Tabs
        tabItems={tabItems}
        current='Bar'
        onSelect={jest.fn()}
        onTabsChange={jest.fn()}
        onRename={mockOnRename}
      />,
    );

    fireEvent.dblClick(screen.getByRole('tab', { name: 'BazName' }));

    expect(mockOnRename).toHaveBeenCalledWith(
      { id: 'Baz', name: 'BazName' },
      'BazName',
    );
  });

  it('should not trigger rename tab when prevent rename is true', async () => {
    const mockOnRename = jest.fn();

    render(
      <Tabs
        tabItems={[{ id: 'Baz', name: 'BazName', preventRename: true }]}
        current='Bar'
        onSelect={jest.fn()}
        onTabsChange={jest.fn()}
        onRename={mockOnRename}
      />,
    );
    expect(mockTabComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        onRename: undefined,
        name: 'BazName',
      }),
    );

    fireEvent.dblClick(screen.getByRole('tab', { name: 'BazName' }));

    expect(mockOnRename).not.toHaveBeenCalled();
  });

  it('one tab should not have close button', () => {
    const mockOnSelect = jest.fn();
    const mockOnTabsChange = jest.fn();
    const tabItems = [
      { id: 'Foo', preventClose: true, name: 'FooName' },
      { id: 'Bar', name: 'BarName' },
      { id: 'Baz', name: 'BazName' },
    ];

    render(
      <Tabs
        tabItems={tabItems}
        current='Foo'
        onSelect={mockOnSelect}
        canClose={true}
        onTabsChange={mockOnTabsChange}
      />,
    );

    expect(mockTabComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        onRename: undefined,
        name: 'FooName',
      }),
    );

    expect(
      within(screen.getByRole('tab', { name: 'FooName' })).queryByTestId(
        'close tab',
      ),
    ).not.toBeInTheDocument;
    expect(
      within(screen.getByRole('tab', { name: 'BarName' })).getByTestId(
        'close tab',
      ),
    ).toBeInTheDocument;
    expect(
      within(screen.getByRole('tab', { name: 'BazName' })).getByTestId(
        'close tab',
      ),
    ).toBeInTheDocument;
  });

  it('should display add button if onAdd property is added', () => {
    const handleAdd = jest.fn();

    render(
      <Tabs
        tabItems={tabItems}
        current='Bar'
        onSelect={jest.fn()}
        onTabsChange={jest.fn()}
        addButtonTitle='Add tab'
        onAdd={handleAdd}
      />,
    );

    expect(screen.getByTestId('add-tab')).toBeInTheDocument();
  });
});
