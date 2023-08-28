import classNames from 'classnames';

import { ArrowRelation } from '@relationalai/rai-sdk-javascript/web';
import { ErrorAlert } from '@relationalai/ui';

import { OutputGrid } from '../OutputGrid';
import { getTableData } from '../outputUtils';

type TableRelationProps = {
  relations: ArrowRelation[];
  isNested?: boolean;
};

export default function TableRelation({
  relations,
  isNested = false,
}: TableRelationProps) {
  const { columns, rows, errors } = getTableData(relations);

  const alerts = errors.map(error => (
    <ErrorAlert
      key={error.message}
      error={`Cannot build table: ${error.message}`}
    />
  ));

  const maxRows = 15;
  const rowHeight = 31;
  const layout = rows.length >= maxRows ? 'normal' : 'autoHeight';
  const wrapperStyle =
    layout === 'normal' ? { height: maxRows * rowHeight } : {};

  return (
    <div
      data-testid='table-mime'
      className={classNames(
        'h-full w-full overflow-hidden ag-theme-rai-output',
        isNested && 'nested-grid',
      )}
      style={!isNested ? wrapperStyle : undefined}
    >
      {alerts}
      <OutputGrid
        columnDefs={columns}
        rowData={rows}
        domLayout={!isNested ? layout : undefined}
      ></OutputGrid>
    </div>
  );
}
