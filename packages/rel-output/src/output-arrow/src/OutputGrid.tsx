import './css/ag-rai-output.css';
import 'ag-grid-enterprise';

import {
  AgGridEvent,
  ColDef,
  CsvExportParams,
  ExcelExportParams,
  FirstDataRenderedEvent,
  GridApi,
  GridReadyEvent,
  ProcessCellForExportParams,
  ValueFormatterParams,
} from 'ag-grid-community';
import { AgGridReact, AgGridReactProps, AgReactUiProps } from 'ag-grid-react';
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';

export const OutputGrid = forwardRef<
  any,
  (AgGridReactProps | AgReactUiProps) & { showRowNumbers?: boolean }
>((props, ref) => {
  const getContextMenuItems = useCallback(() => {
    return ['autoSizeAll', 'copy', 'copyWithHeaders', 'separator', 'export'];
  }, []);

  const { domLayout, showRowNumbers, columnDefs } = props;
  // For some reason ag-grid does not support updating the domLayout as a prop,
  // you must do it as an api call
  // See: https://www.ag-grid.com/react-data-grid/grid-size/#grid-auto-height
  // https://github.com/ag-grid/ag-grid-react-example/issues/50
  const [gridApi, setGridApi] = useState<GridApi>();

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  // We auto-size here b/c the row header column in the table relation wouldn't
  // be properly sized if we did it in onGridReady. This does cause flashing
  // which isn't great so we should revisit in case they fix it.
  const onFirstDataRendered = useCallback((params: FirstDataRenderedEvent) => {
    params.columnApi.autoSizeAllColumns();
  }, []);

  useEffect(() => {
    if (gridApi) {
      gridApi.setDomLayout(domLayout);
    }
  }, [domLayout, gridApi]);

  if (showRowNumbers && columnDefs) {
    columnDefs.push({
      headerName: '#',
      valueGetter: 'node.rowIndex + 1',
      resizable: true,
      initialWidth: 50,
      suppressAutoSize: false,
      lockPinned: true,
      lockPosition: true,
      pinned: 'left',
      menuTabs: [],
      cellClass: 'row-number-cell',
      headerClass: 'row-number-cell',
      editable: false,
    });
  }

  const onSortChange = useCallback((e: AgGridEvent) => {
    e.api.refreshCells();
  }, []);

  const processCellForExport = (params: ProcessCellForExportParams) => {
    const colDef: ColDef = params.column.getColDef();

    if (colDef.valueFormatter && colDef.valueFormatter instanceof Function) {
      return colDef.valueFormatter({
        ...params,
        data: params.node?.data,
        colDef: colDef,
      } as ValueFormatterParams);
    }

    return params.value;
  };

  const excelExportParams: ExcelExportParams = {
    author: 'Relational AI',
    processCellCallback: processCellForExport,
  };
  const csvExportParams: CsvExportParams = {
    processCellCallback: processCellForExport,
  };

  const popupParent = useMemo(
    () => document.querySelector('body') || undefined,
    [],
  );

  return (
    <AgGridReact
      ref={ref}
      // this exists b/c if a column name has a '.' in it then ag-grid thinks it has nested data
      // https://www.ag-grid.com/javascript-data-grid/grid-properties/#reference-columns-suppressFieldDotNotation
      suppressFieldDotNotation
      // TODO Remove after Ag-Grid patches this bug
      suppressBrowserResizeObserver // https://github.com/ag-grid/ag-grid/issues/6562
      enableRangeSelection
      getContextMenuItems={getContextMenuItems}
      onGridReady={onGridReady}
      onSortChanged={onSortChange}
      onFirstDataRendered={onFirstDataRendered}
      processCellForClipboard={processCellForExport}
      defaultExcelExportParams={excelExportParams}
      defaultCsvExportParams={csvExportParams}
      popupParent={popupParent}
      {...props}
      // updating the prop doesn't work as mentioned above
      // gridApi.setDomLayout doesn't work either if you pass the same value as a prop
      // if we always set it to 'normal' then gridApi.setDomLayout works ¯\_(ツ)_/¯
      domLayout='normal'
    />
  );
});
