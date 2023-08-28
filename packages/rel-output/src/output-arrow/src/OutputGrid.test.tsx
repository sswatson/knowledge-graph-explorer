import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColDef } from 'ag-grid-community';

import { OutputGrid } from './OutputGrid';

describe('OutputGrid', () => {
  const columns: ColDef[] = [
    { headerName: 'header1', field: 'col1' },
    { headerName: 'header2', field: 'col2' },
    {
      headerName: 'header3',
      field: 'col3',
      valueFormatter: params => {
        const data = params.data['col3'] || '';

        return `Formatted ${data}`;
      },
    },
    {
      headerName: 'header4',
      field: 'col4',
      valueGetter: params => {
        const data = params.data['col4'] || 'No Data';

        return data != 'foo4' ? data : 'getterValue';
      },
    },
  ];

  const rows = [
    {
      col1: 'foo1',
      col2: 'foo2',
      col3: 'foo3',
      col4: 'foo4',
    },
    {
      col1: 'bar1',
      col2: 'bar2',
      col3: 'bar3',
    },
  ];

  const queryGridCellByText = (name: string) => {
    return screen.queryByRole('gridcell', { name });
  };

  const getGridCellByText = (name: string) => {
    return screen.getByRole('gridcell', { name });
  };

  const queryHeaderCellByText = (text: string) => {
    return (
      screen
        .queryAllByRole('columnheader')
        .find(ele => within(ele).queryByText(text) != null) ?? null
    );
  };

  it('should display data ', () => {
    render(
      <OutputGrid
        columnDefs={columns}
        rowData={rows}
        showRowNumbers={false}
      ></OutputGrid>,
    );

    const grid = screen.getByRole('treegrid');

    expect(grid).toBeInTheDocument();

    // 4 cols
    expect(grid).toHaveAttribute('aria-colcount', '4');
    expect(screen.queryAllByRole('columnheader')).toHaveLength(4);

    // header + 2 rows => 3 rows
    expect(grid).toHaveAttribute('aria-rowcount', '3');

    // No rowNumbers
    expect(queryHeaderCellByText('#')).not.toBeInTheDocument();

    expect(queryHeaderCellByText('header1')).toBeInTheDocument();
    expect(queryHeaderCellByText('header2')).toBeInTheDocument();
    expect(queryHeaderCellByText('header3')).toBeInTheDocument();
    expect(queryHeaderCellByText('header4')).toBeInTheDocument();

    expect(queryGridCellByText('foo1')).toBeInTheDocument();
    expect(queryGridCellByText('bar1')).toBeInTheDocument();
    expect(queryGridCellByText('foo2')).toBeInTheDocument();
    expect(queryGridCellByText('bar2')).toBeInTheDocument();
    expect(queryGridCellByText('Formatted bar3')).toBeInTheDocument();
    expect(queryGridCellByText('Formatted foo3')).toBeInTheDocument();
    expect(queryGridCellByText('foo4')).not.toBeInTheDocument();
    expect(queryGridCellByText('getterValue')).toBeInTheDocument();
    expect(queryGridCellByText('No Data')).toBeInTheDocument();
  });

  it('should display row numbers', () => {
    render(
      <OutputGrid
        columnDefs={columns}
        rowData={rows}
        showRowNumbers={true}
      ></OutputGrid>,
    );

    const grid = screen.getByRole('treegrid');

    expect(grid).toBeInTheDocument();

    // 4 cols + rowNumbers col
    expect(grid).toHaveAttribute('aria-colcount', '5');
    expect(screen.queryAllByRole('columnheader')).toHaveLength(5);

    // header + 2 rows => 3 rows
    expect(grid).toHaveAttribute('aria-rowcount', '3');

    // rowNumbers col header
    expect(queryHeaderCellByText('#')).toBeInTheDocument();
    expect(queryGridCellByText('1')).toBeInTheDocument();
    expect(queryGridCellByText('2')).toBeInTheDocument();
  });

  it('should copy display value to clipboard', async () => {
    const user = userEvent.setup();

    render(
      <OutputGrid
        columnDefs={columns}
        rowData={rows}
        showRowNumbers={true}
      ></OutputGrid>,
    );

    const copyMock = jest.spyOn(window.navigator.clipboard, 'writeText');

    await act(async () => {
      await user.click(getGridCellByText('foo1'));
      await user.keyboard('{Control>}c{/Control}');
    });
    await waitFor(() => {
      expect(copyMock).toHaveBeenCalledWith('foo1');
    });

    await act(async () => {
      await user.click(getGridCellByText('Formatted foo3'));
      await user.keyboard('{Control>}c{/Control}');
    });
    await waitFor(() => {
      expect(copyMock).toHaveBeenCalledWith('Formatted foo3');
    });

    await act(async () => {
      await user.click(getGridCellByText('getterValue'));
      await user.keyboard('{Control>}c{/Control}');
    });
    await waitFor(() => {
      expect(copyMock).toHaveBeenCalledWith('getterValue');
    });
  });
});
